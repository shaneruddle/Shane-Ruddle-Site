import type { Firestore } from 'firebase-admin/firestore';

type PracRecord = Record<string, unknown> & { id: string; sourceCollection: string };

const COLLECTIONS = {
  fleet: ['cars', 'website_cars'],
  finance: ['transactions', 'finance_summaries'],
  payroll: [],
  bookings: ['bookings', 'rentals'],
  customers: ['customers'],
  enquiries: ['enquiries'],
  maintenance: ['vehicle_logs'],
};

const DISCOVERY_COLLECTIONS = ['accounts', 'bookings', 'cars', 'customers', 'enquiries', 'finance_summaries', 'rentals', 'transactions', 'vehicleFinance', 'vehicle_logs'];
const MAPPING_COLLECTIONS = ['accounts', 'bookings', 'cars', 'rentals', 'transactions', 'finance_summaries', 'customers', 'enquiries', 'vehicle_logs'];

function configuredCollections(kind: keyof typeof COLLECTIONS) {
  const envName = `PRAC_${kind.toUpperCase()}_COLLECTIONS`;
  const configured = process.env[envName]
    ?.split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  return configured?.length ? configured : COLLECTIONS[kind];
}

function asDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate() as Date;
  }
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function firstString(record: Record<string, unknown>, fields: string[]) {
  for (const field of fields) {
    const value = record[field];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function firstNumber(record: Record<string, unknown>, fields: string[]) {
  for (const field of fields) {
    const value = record[field];
    const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(/,/g, '')) : NaN;
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

// Fleet questions are phrased naturally (for example, "Fortuners"), while the
// source records normally use the singular make/model name ("Fortuner").
function searchableVehicleText(value: string) {
  return value.toLowerCase().replace(/\b([a-z0-9]+)s\b/g, '$1').replace(/[^a-z0-9]+/g, ' ').trim();
}

async function readFirstAvailableCollection(db: Firestore, names: string[], limit = 500): Promise<PracRecord[]> {
  let lastError: Error | null = null;

  for (const name of names) {
    try {
      const snapshot = await db.collection(name).limit(limit).get();
      if (!snapshot.empty) {
        return snapshot.docs.map((document) => ({
          id: document.id,
          sourceCollection: name,
          ...document.data(),
        }));
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  if (lastError) throw lastError;
  return [];
}

async function readMappedCollections(db: Firestore, names: string[], limit = 500): Promise<PracRecord[]> {
  const snapshots = await Promise.all(names.map(async (name) => {
    try { const snapshot = await db.collection(name).limit(limit).get(); return snapshot.docs.map((document) => ({ id: document.id, sourceCollection: name, ...document.data() } as PracRecord)); }
    catch { return [] as PracRecord[]; }
  }));
  return snapshots.flat();
}

function recordMonth(record: PracRecord) {
  const dateValue = ['date', 'month', 'paymentDate', 'createdAt', 'timestamp']
    .map((field) => record[field])
    .map(asDate)
    .find(Boolean);
  return dateValue ? dateValue.toISOString().slice(0, 7) : null;
}

function assertMonth(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error('Month must use YYYY-MM format.');
  }
}

function bangkokDayRange() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  const year = Number(values.year); const month = Number(values.month); const day = Number(values.day);
  const start = new Date(Date.UTC(year, month - 1, day, -7));
  return { date: `${values.year}-${values.month}-${values.day}`, start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

function bangkokMonthRange(month?: string) {
  const today = bangkokDayRange().date;
  const selected = month || today.slice(0, 7);
  assertMonth(selected);
  const [year, monthNumber] = selected.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1, -7));
  return { month: selected, start, end: new Date(Date.UTC(year, monthNumber, 1, -7)) };
}

function classifyVehicleStatus(status: string) {
  const normalized = status.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

  // Classification is deliberately exclusive. The previous substring matching could
  // count "not available" as available and "out of service" as rented.
  if (/maintenance|repair|service|workshop|out of service|off road/.test(normalized)) return 'maintenance';
  if (/^not available$|unavailable|inactive|retired|sold/.test(normalized)) return 'other';
  if (/rented|on rent|hired|booked|checked out|on hire/.test(normalized)) return 'rented';
  if (/^available$|^ready$|available now|ready to rent/.test(normalized)) return 'available';
  return 'other';
}

function vehicleOperationalStatus(record: PracRecord) {
  const namedStatus = firstString(record, ['status', 'availability', 'rentalStatus', 'state', 'carStatus', 'vehicleStatus', 'currentStatus', 'availabilityStatus']);
  if (namedStatus) return namedStatus;
  if (record.isAvailable === true || record.available === true) return 'available';
  if (record.isAvailable === false || record.available === false) return 'not available';
  if (record.isRented === true || record.rented === true) return 'rented';
  if (record.inMaintenance === true || record.underMaintenance === true) return 'maintenance';
  return 'unknown';
}

export async function getFleetStatus(db: Firestore) {
  const records = await readFirstAvailableCollection(db, configuredCollections('fleet'));
  const vehicles = records.map((record) => {
    const status = vehicleOperationalStatus(record);
    const make = firstString(record, ['make', 'brand', 'manufacturer', 'carMake', 'vehicleMake', 'carBrand']);
    const model = firstString(record, ['model', 'vehicleModel', 'carModel', 'modelName']);
    return {
      id: record.id,
      name: [make, model].filter(Boolean).join(' ') || firstString(record, ['name', 'vehicleName', 'carName', 'title', 'registration', 'plate', 'licensePlate']) || `Vehicle ${record.id}`,
      registration: firstString(record, ['registration', 'plate', 'licensePlate', 'license', 'registrationNumber']),
      status,
      category: firstString(record, ['category', 'type', 'vehicleType']),
    };
  });
  const classifiedVehicles = vehicles.map((vehicle) => ({ ...vehicle, bucket: classifyVehicleStatus(vehicle.status) }));
  const available = classifiedVehicles.filter(({ bucket }) => bucket === 'available').length;
  const rented = classifiedVehicles.filter(({ bucket }) => bucket === 'rented').length;
  const maintenance = classifiedVehicles.filter(({ bucket }) => bucket === 'maintenance').length;
  const statusBreakdown = vehicles.reduce<Record<string, number>>((counts, vehicle) => {
    const status = vehicle.status || 'unknown';
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});

  return {
    sourceCollection: records[0]?.sourceCollection || configuredCollections('fleet')[0],
    generatedAt: new Date().toISOString(),
    totals: { fleet: vehicles.length, available, rented, maintenance, other: vehicles.length - available - rented - maintenance },
    statusIsReliable: available + rented + maintenance > 0,
    statusBreakdown,
    vehicles,
  };
}

export async function findVehicles(db: Firestore, search: string) {
  const fleet = await getFleetStatus(db);
  const needle = searchableVehicleText(search);
  return { query: search, matches: fleet.vehicles.filter((vehicle) => !needle || searchableVehicleText([vehicle.name, vehicle.registration, vehicle.category, vehicle.status].filter(Boolean).join(' ')).includes(needle)) };
}

export async function getBookingSummary(db: Firestore) {
  const records = await readMappedCollections(db, configuredCollections('bookings'));
  const now = new Date();
  const active = records.filter((record) => /active|confirmed|ongoing|rented/i.test(firstString(record, ['status', 'bookingStatus', 'state']) || ''));
  const upcoming = records.filter((record) => {
    const date = asDate(record.startDate || record.pickupDate || record.fromDate);
    return date && date >= now && /pending|confirmed|booked/i.test(firstString(record, ['status', 'bookingStatus', 'state']) || '');
  });
  return { sourceCollections: [...new Set(records.map((record) => record.sourceCollection))], totals: { records: records.length, active: active.length, upcoming: upcoming.length } };
}

export async function getBookingsReceivedToday(db: Firestore) {
  const { date, start, end } = bangkokDayRange();
  const snapshot = await db.collection('bookings').where('createdAt', '>=', start).where('createdAt', '<', end).get();
  const statuses = snapshot.docs.reduce<Record<string, number>>((counts, doc) => {
    const status = firstString(doc.data(), ['status', 'paymentStatus']) || 'unknown';
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
  return { sourceCollection: 'bookings', date, totals: { received: snapshot.size }, statusBreakdown: statuses, definition: 'Bookings with createdAt during the current Bangkok calendar day.' };
}

function bookingScheduleEntry(record: Record<string, unknown>) {
  return {
    bookingId: typeof record.id === 'string' ? record.id : undefined,
    customer: firstString(record, ['customerName', 'customer', 'name']),
    vehicle: firstString(record, ['vehicleName', 'carName', 'car', 'vehicle', 'requestedCarType']),
    status: firstString(record, ['status', 'paymentStatus']) || 'unknown',
  };
}

export async function getTodayBookingSchedule(db: Firestore) {
  const { date, start, end } = bangkokDayRange();
  const [pickups, returns] = await Promise.all([
    db.collection('bookings').where('startDate', '>=', start).where('startDate', '<', end).get(),
    db.collection('bookings').where('endDate', '>=', start).where('endDate', '<', end).get(),
  ]);
  return {
    sourceCollection: 'bookings',
    date,
    definition: 'Scheduled pickups use bookings.startDate; scheduled returns use bookings.endDate for the current Bangkok calendar day.',
    totals: { pickups: pickups.size, returns: returns.size },
    pickups: pickups.docs.map((doc) => bookingScheduleEntry({ id: doc.id, ...doc.data() })),
    returns: returns.docs.map((doc) => bookingScheduleEntry({ id: doc.id, ...doc.data() })),
  };
}

export async function getCurrentAccountBalances(db: Firestore) {
  const snapshot = await db.collection('accounts').limit(100).get();
  const accounts = snapshot.docs.map((doc) => {
    const record = doc.data();
    const type = firstString(record, ['type', 'accountType', 'name', 'accountName']) || 'Unnamed account';
    return { id: doc.id, type, balance: firstNumber(record, ['balance']) };
  });
  const cashAccounts = accounts.filter((account) => /cash/i.test(account.type));
  return {
    sourceCollection: 'accounts',
    definition: 'Current balance from accounts.balance. Cash total includes only account records whose type identifies them as cash.',
    cashBalance: cashAccounts.length ? cashAccounts.reduce((sum, account) => sum + account.balance, 0) : null,
    cashAccounts,
    accounts,
  };
}

export async function getMonthlyTransactionSummary(db: Firestore, requestedMonth = '') {
  const { month, start, end } = bangkokMonthRange(requestedMonth || undefined);
  const snapshot = await db.collection('transactions').where('date', '>=', start).where('date', '<', end).get();
  const by = (key: 'type' | 'category') => {
    const totals = new Map<string, { records: number; amount: number }>();
    snapshot.docs.forEach((doc) => {
      const record = doc.data();
      const label = firstString(record, [key]) || 'Unclassified';
      const current = totals.get(label) || { records: 0, amount: 0 };
      current.records += 1; current.amount += firstNumber(record, ['amount']); totals.set(label, current);
    });
    return [...totals.entries()].map(([label, value]) => ({ label, ...value })).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  };
  const records = snapshot.docs.map((doc) => doc.data());
  const classify = (record: Record<string, unknown>) => `${firstString(record, ['type']) || ''} ${firstString(record, ['category']) || ''}`.toLowerCase();
  const income = records.filter((record) => /income|revenue|sale|rental income/.test(classify(record))).reduce((sum, record) => sum + firstNumber(record, ['amount']), 0);
  const expenses = records.filter((record) => /expense|cost|refund|salary|maintenance/.test(classify(record))).reduce((sum, record) => sum + firstNumber(record, ['amount']), 0);
  const classified = records.filter((record) => /income|revenue|sale|rental income|expense|cost|refund|salary|maintenance/.test(classify(record))).length;
  const summaries = await db.collection('finance_summaries').limit(100).get();
  const latest = summaries.docs.map((doc) => ({ id: doc.id, ...doc.data() } as PracRecord)).sort((a, b) => (asDate(b.lastUpdated)?.getTime() || 0) - (asDate(a.lastUpdated)?.getTime() || 0))[0];
  return {
    sourceCollection: 'transactions', month,
    definition: 'Transactions dated in the selected Bangkok calendar month. Income and expense totals include only records with recognisable type/category labels; unclassified records are reported separately.',
    totals: { records: records.length, income, expenses, net: income - expenses, classifiedRecords: classified, unclassifiedRecords: records.length - classified },
    byType: by('type'), byCategory: by('category'),
    latestFinanceSummary: latest ? { sourceCollection: 'finance_summaries', lastUpdated: asDate(latest.lastUpdated)?.toISOString() || null, totalIncome: firstNumber(latest, ['totalIncome']), totalExpense: firstNumber(latest, ['totalExpense']) } : null,
  };
}

export async function getCustomerAndMaintenanceSummary(db: Firestore) {
  const [customers, enquiries, logs] = await Promise.all([
    readMappedCollections(db, configuredCollections('customers')),
    readMappedCollections(db, configuredCollections('enquiries')),
    readMappedCollections(db, configuredCollections('maintenance')),
  ]);
  const enquiryStatus = enquiries.reduce<Record<string, number>>((totals, record) => { const status = firstString(record, ['status', 'state', 'enquiryStatus', 'stage']) || 'unknown'; totals[status] = (totals[status] || 0) + 1; return totals; }, {});
  const maintenanceStatus = logs.reduce<Record<string, number>>((totals, record) => { const status = firstString(record, ['status', 'state', 'type', 'logType']) || 'unknown'; totals[status] = (totals[status] || 0) + 1; return totals; }, {});
  return {
    sources: { customers: 'customers', enquiries: 'enquiries', maintenance: 'vehicle_logs' },
    totals: { customers: customers.length, enquiries: enquiries.length, vehicleLogs: logs.length },
    enquiryStatus,
    maintenanceStatus,
    recentEnquiries: enquiries.slice(0, 20).map((record) => ({ id: record.id, customer: firstString(record, ['customerName', 'name', 'customer']), status: firstString(record, ['status', 'state', 'enquiryStatus', 'stage']) || 'unknown', vehicle: firstString(record, ['vehicleName', 'carName', 'requestedCarType', 'vehicleType']), createdAt: asDate(record.createdAt || record.date || record.timestamp)?.toISOString() || null })),
    recentVehicleLogs: logs.slice(0, 20).map((record) => ({ id: record.id, vehicle: firstString(record, ['vehicleName', 'carName', 'vehicle', 'registration', 'plate']), status: firstString(record, ['status', 'state', 'type', 'logType']) || 'unknown', date: asDate(record.date || record.createdAt || record.logDate)?.toISOString() || null, notes: firstString(record, ['notes', 'description', 'details', 'title']) })),
  };
}

export async function inspectPracSchema(db: Firestore) {
  const names = [...configuredCollections('fleet'), ...configuredCollections('bookings'), ...configuredCollections('finance')];
  const collections = await Promise.all(names.map(async (name) => {
    try {
      const snapshot = await db.collection(name).limit(3).get();
      const fields = [...new Set(snapshot.docs.flatMap((doc) => Object.keys(doc.data())))].sort();
      return { name, documentsSampled: snapshot.size, fields };
    } catch { return { name, documentsSampled: 0, fields: [] as string[] }; }
  }));
  return { collections: collections.filter((collection) => collection.documentsSampled > 0) };
}

async function verifyFleetRelationships(db: Firestore) {
  const [carsSnapshot, bookingsSnapshot, rentalsSnapshot] = await Promise.all([
    db.collection('cars').get(),
    db.collection('bookings').limit(500).get(),
    db.collection('rentals').limit(500).get(),
  ]);
  const carIds = new Set(carsSnapshot.docs.map((document) => document.id));
  const bookings = new Map(bookingsSnapshot.docs.map((document) => [document.id, document.data()]));
  const rentals = rentalsSnapshot.docs.map((document) => ({ id: document.id, ...document.data() } as PracRecord));
  const joinedCars = rentals.filter((rental) => typeof rental.carId === 'string' && carIds.has(rental.carId));
  const joinedBookings = joinedCars.filter((rental) => typeof rental.bookingId === 'string' && bookings.has(rental.bookingId));
  const sameInstant = (left: unknown, right: unknown) => {
    const a = asDate(left); const b = asDate(right);
    return Boolean(a && b && a.getTime() === b.getTime());
  };
  const statusBreakdown = rentals.reduce<Record<string, number>>((counts, rental) => {
    const status = firstString(rental, ['status']) || 'unknown';
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
  const activeFlags = carsSnapshot.docs.reduce<Record<string, number>>((counts, document) => {
    const value = document.data().isActive;
    const label = typeof value === 'boolean' ? String(value) : 'missing';
    counts[label] = (counts[label] || 0) + 1;
    return counts;
  }, {});
  const modelExamples = carsSnapshot.docs.slice(0, 12).map((document) => {
    const car = document.data();
    return { id: document.id, make: firstString(car, ['make']), model: firstString(car, ['model']), name: firstString(car, ['name']), isActive: car.isActive === true };
  });

  return {
    cars: { records: carsSnapshot.size, isActive: activeFlags, modelExamples },
    joins: {
      rentalsWithKnownCarId: { matched: joinedCars.length, total: rentals.length },
      rentalsWithKnownBookingId: { matched: joinedBookings.length, total: joinedCars.length },
    },
    rentalStatuses: statusBreakdown,
    dateSemantics: {
      dateOutMatchesBookingStart: joinedBookings.filter((rental) => sameInstant(rental.dateOut, bookings.get(String(rental.bookingId))?.startDate)).length,
      dateInMatchesBookingEnd: joinedBookings.filter((rental) => sameInstant(rental.dateIn, bookings.get(String(rental.bookingId))?.endDate)).length,
      compared: joinedBookings.length,
    },
  };
}

export async function auditPracDataMapping(db: Firestore) {
  const collections = await Promise.all(MAPPING_COLLECTIONS.map(async (name) => {
    try {
      const snapshot = await db.collection(name).limit(250).get();
      const fieldStats = new Map<string, { present: number; types: Set<string> }>();
      snapshot.docs.forEach((doc) => Object.entries(doc.data()).forEach(([field, value]) => {
        const stat = fieldStats.get(field) || { present: 0, types: new Set<string>() };
        stat.present += 1;
        stat.types.add(value instanceof Date || (value && typeof value === 'object' && 'toDate' in value) ? 'date' : Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value);
        fieldStats.set(field, stat);
      }));
      const fields = [...fieldStats.entries()].map(([name, stat]) => ({ name, present: stat.present, types: [...stat.types].sort() })).sort((a, b) => a.name.localeCompare(b.name));
      const exampleFields = fields.filter((field) => /car|vehicle|registration|plate|booking|rental|status|state|date|start|end|pickup|dropoff|available|rented|maintenance|balance|amount|type|category/i.test(field.name)).map((field) => field.name);
      const examples = snapshot.docs.slice(0, 5).map((doc) => {
        const data = doc.data();
        return { id: doc.id, values: Object.fromEntries(exampleFields.slice(0, 24).flatMap((field) => {
          const value = data[field];
          if (value === undefined) return [];
          if (typeof value === 'string') return [[field, value.slice(0, 100)]];
          if (typeof value === 'number' || typeof value === 'boolean' || value === null) return [[field, value]];
          if (value && typeof value === 'object' && 'toDate' in value && typeof (value as any).toDate === 'function') return [[field, (value as any).toDate().toISOString()]];
          return [[field, Array.isArray(value) ? `[${value.length} items]` : '[object]']];
        })) };
      });
      return {
        name,
        recordsSampled: snapshot.size,
        fields,
        candidateDateFields: fields.filter((field) => /date|time|created|updated|pickup|dropoff|start|end/i.test(field.name)).map((field) => field.name),
        candidateMoneyFields: fields.filter((field) => /cash|bank|balance|amount|total|income|expense|revenue|price|cost|paid/i.test(field.name)).map((field) => field.name),
        candidateStatusFields: fields.filter((field) => /status|state|type|category/i.test(field.name)).map((field) => field.name),
        candidateRelationFields: fields.filter((field) => /car|vehicle|registration|plate|booking|rental|customer/i.test(field.name)).map((field) => field.name),
        examples,
      };
    } catch { return null; }
  }));
  const fleetRelationshipVerification = await verifyFleetRelationships(db).catch((error) => ({ error: error instanceof Error ? error.message : 'Unknown verification failure.' }));
  return { generatedAt: new Date().toISOString(), collections: collections.filter(Boolean), fleetRelationshipVerification };
}

export async function discoverPracData(db: Firestore) {
  const collections = await Promise.all(DISCOVERY_COLLECTIONS.map(async (name) => {
    try {
      const snapshot = await db.collection(name).limit(25).get();
      const samples = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const fields = [...new Set(samples.flatMap((sample) => Object.keys(sample)))].sort();
      const balanceFields = fields.filter((field) => /balance|cash|available|bank|total/i.test(field));
      return { name, documentsSampled: snapshot.size, fields, balanceFields, samples };
    } catch { return null; }
  }));
  return collections.filter(Boolean);
}

function compactValue(value: unknown, depth = 0): unknown {
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return ((value as { toDate: () => Date }).toDate()).toISOString();
  }
  if (typeof value === 'string') return value.slice(0, 240);
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) return depth ? `[${value.length} items]` : value.slice(0, 5).map((item) => compactValue(item, depth + 1));
  if (value && typeof value === 'object') {
    if (depth) return '[object]';
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(0, 15).map(([key, item]) => [key, compactValue(item, depth + 1)]));
  }
  return String(value);
}

export async function getRealtimePracData(db: Firestore, topic: 'fleet' | 'bookings' | 'finance' | 'operations', query = '') {
  if (topic === 'fleet') {
    const fleet = await getFleetStatus(db);
    return { source: fleet.sourceCollection, generatedAt: fleet.generatedAt, totals: fleet.totals, statusBreakdown: fleet.statusBreakdown, vehicles: fleet.vehicles.slice(0, 50) };
  }
  if (topic === 'bookings') return { summary: await getBookingSummary(db), receivedToday: await getBookingsReceivedToday(db), todaySchedule: await getTodayBookingSchedule(db) };
  if (topic === 'operations') return getCustomerAndMaintenanceSummary(db);

  const keyword = /cash|bank|balance|account/i.test(query) ? /cash|bank|balance|account/i : /amount|total|income|expense|revenue|balance|cash|bank/i;
  const discovery = await discoverPracData(db);
  return {
    generatedAt: new Date().toISOString(),
    query,
    currentAccounts: await getCurrentAccountBalances(db),
    currentMonthSummary: await getMonthlyTransactionSummary(db),
    note: 'These are matching fields and recent record values from authorised finance/account collections. State the field and collection used; do not combine values unless the records explicitly represent a total.',
    collections: discovery
      .filter((collection: any) => ['accounts', 'transactions', 'finance_summaries'].includes(collection.name))
      .map((collection: any) => ({
        name: collection.name,
        matchingFields: collection.fields.filter((field: string) => keyword.test(field)),
        records: collection.samples.slice(0, 8).map((sample: Record<string, unknown>) => {
          const values = Object.fromEntries(Object.entries(sample).filter(([key]) => key === 'id' || keyword.test(key)).map(([key, value]) => [key, compactValue(value)]));
          return Object.keys(values).length > 1 ? values : { id: sample.id, sample: compactValue(sample) };
        }),
      })),
  };
}

export async function getMonthlyFinances(db: Firestore, month: string) {
  assertMonth(month);
  const records = (await readFirstAvailableCollection(db, configuredCollections('finance')))
    .filter((record) => recordMonth(record) === month);
  const transactions = records.map((record) => {
    const type = firstString(record, ['type', 'transactionType', 'category']) || 'unknown';
    return {
      id: record.id,
      date: recordMonth(record),
      type,
      description: firstString(record, ['description', 'name', 'memo', 'title']) || 'Untitled transaction',
      amount: firstNumber(record, ['amount', 'total', 'value']),
    };
  });
  const income = transactions.filter((item) => /income|revenue|credit/i.test(item.type)).reduce((sum, item) => sum + item.amount, 0);
  const expenses = transactions.filter((item) => /expense|cost|debit/i.test(item.type)).reduce((sum, item) => sum + item.amount, 0);

  return {
    sourceCollection: records[0]?.sourceCollection || configuredCollections('finance')[0],
    month,
    totals: { income, expenses, net: income - expenses, transactions: transactions.length },
    transactions,
  };
}

export async function getPayrollSummary(db: Firestore, month: string) {
  assertMonth(month);
  const records = (await readFirstAvailableCollection(db, configuredCollections('payroll')))
    .filter((record) => recordMonth(record) === month);
  const entries = records.map((record) => ({
    id: record.id,
    employee: firstString(record, ['employeeName', 'employee', 'name']) || 'Unassigned employee',
    amount: firstNumber(record, ['netPay', 'amount', 'total', 'salary']),
  }));

  return {
    sourceCollection: records[0]?.sourceCollection || configuredCollections('payroll')[0],
    month,
    totals: { payroll: entries.reduce((sum, item) => sum + item.amount, 0), employees: entries.length },
    entries,
  };
}

export const pracCapabilities = {
  company: 'Pattaya Rent a Car',
  readOnly: true,
  endpoints: [
    '/api/prac/fleet',
    '/api/prac/finance/monthly?month=YYYY-MM',
    '/api/prac/payroll/summary?month=YYYY-MM',
  ],
};
