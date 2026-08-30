import type { Firestore } from 'firebase-admin/firestore';

type PracRecord = Record<string, unknown> & { id: string; sourceCollection: string };

const COLLECTIONS = {
  fleet: ['vehicles', 'fleet', 'cars'],
  finance: ['finance', 'transactions', 'financial_transactions'],
  payroll: ['payroll', 'payroll_runs', 'payroll_summary'],
};

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

export async function getFleetStatus(db: Firestore) {
  const records = await readFirstAvailableCollection(db, configuredCollections('fleet'));
  const vehicles = records.map((record) => {
    const status = firstString(record, ['status', 'availability', 'rentalStatus', 'state']) || 'unknown';
    return {
      id: record.id,
      name: firstString(record, ['name', 'vehicleName', 'model', 'title', 'registration']) || `Vehicle ${record.id}`,
      registration: firstString(record, ['registration', 'plate', 'licensePlate']),
      status,
      category: firstString(record, ['category', 'type', 'vehicleType']),
    };
  });
  const available = vehicles.filter(({ status }) => /available|ready|active/i.test(status)).length;
  const rented = vehicles.filter(({ status }) => /rented|booked|out|hired/i.test(status)).length;
  const maintenance = vehicles.filter(({ status }) => /maintenance|repair|service/i.test(status)).length;

  return {
    sourceCollection: records[0]?.sourceCollection || configuredCollections('fleet')[0],
    generatedAt: new Date().toISOString(),
    totals: { fleet: vehicles.length, available, rented, maintenance, other: vehicles.length - available - rented - maintenance },
    vehicles,
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
