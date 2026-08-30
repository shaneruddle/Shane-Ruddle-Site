import React, { useEffect, useState } from 'react';
import { Car, CircleDollarSign, Mic, RefreshCw, Send, UsersRound } from 'lucide-react';
import { auth, UserProfile } from '../firebase';

type FleetResponse = { totals: { fleet: number; available: number; rented: number; maintenance: number; other: number } };
type FinanceResponse = { totals: { income: number; expenses: number; net: number; transactions: number } };
type PayrollResponse = { totals: { payroll: number; employees: number } };

const currentMonth = new Date().toISOString().slice(0, 7);
const formatThb = (amount: number) => new Intl.NumberFormat('en-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount);

export default function PracOperations({ userProfile }: { userProfile: UserProfile }) {
  const [month, setMonth] = useState(currentMonth);
  const [fleet, setFleet] = useState<FleetResponse | null>(null);
  const [finance, setFinance] = useState<FinanceResponse | null>(null);
  const [payroll, setPayroll] = useState<PayrollResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const canViewFinancials = userProfile.roles?.some((role) => role === 'admin' || role === 'accounts') || userProfile.role === 'admin' || userProfile.role === 'accounts';

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Please sign in again to view PRAC operations.');
      const headers = { Authorization: `Bearer ${token}` };
      const requests: Promise<Response>[] = [fetch('/api/prac/fleet', { headers })];
      if (canViewFinancials) {
        requests.push(fetch(`/api/prac/finance/monthly?month=${month}`, { headers }));
        requests.push(fetch(`/api/prac/payroll/summary?month=${month}`, { headers }));
      }
      const responses = await Promise.all(requests);
      const failed = responses.find((response) => !response.ok);
      if (failed) throw new Error((await failed.json().catch(() => ({ error: 'Unable to load PRAC data.' }))).error);
      const [fleetData, financeData, payrollData] = await Promise.all(responses.map((response) => response.json()));
      setFleet(fleetData);
      setFinance(financeData || null);
      setPayroll(payrollData || null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load PRAC data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [month]);

  const ask = async () => {
    if (!question.trim()) return;
    setAsking(true); setAnswer('');
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/prac/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ question }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setAnswer(body.answer);
      window.speechSynthesis?.cancel();
      window.speechSynthesis?.speak(new SpeechSynthesisUtterance(body.answer));
    } catch (caught) { setAnswer(caught instanceof Error ? caught.message : 'Unable to answer that right now.'); }
    finally { setAsking(false); }
  };

  const listen = () => {
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) { setAnswer('Voice input is not supported in this browser. You can still type your question.'); return; }
    const recognition = new Recognition(); recognition.lang = 'en-GB'; recognition.interimResults = false;
    recognition.onresult = (event: any) => setQuestion(event.results[0][0].transcript);
    recognition.start();
  };

  const cards = [
    { label: 'Fleet', value: fleet ? String(fleet.totals.fleet) : '—', detail: fleet ? `${fleet.totals.available} available · ${fleet.totals.rented} rented` : 'Loading fleet', icon: Car },
    ...(canViewFinancials ? [
      { label: 'Monthly Net', value: finance ? formatThb(finance.totals.net) : '—', detail: finance ? `${finance.totals.transactions} transactions` : 'Loading finance', icon: CircleDollarSign },
      { label: 'Payroll', value: payroll ? formatThb(payroll.totals.payroll) : '—', detail: payroll ? `${payroll.totals.employees} employees` : 'Loading payroll', icon: UsersRound },
    ] : []),
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold mb-2">Shane OS · Pattaya Rent a Car</p>
          <h2 className="text-3xl font-serif">Operations <span className="italic text-gold">overview</span></h2>
          <p className="text-sm text-black/45 mt-2">Read-only live data from the PRAC operating system.</p>
        </div>
        <div className="flex items-center gap-2">
          {canViewFinancials && <input aria-label="Month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="rounded-xl border border-black/10 px-3 py-2 text-xs" />}
          <button onClick={() => void load()} disabled={loading} className="p-2.5 rounded-xl border border-black/10 hover:bg-black/5 disabled:opacity-50" title="Refresh PRAC data">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className="glass p-6 rounded-3xl">
            <Icon className="w-5 h-5 text-gold mb-5" />
            <p className="text-[10px] uppercase tracking-widest font-bold text-black/40">{label}</p>
            <p className="text-3xl font-serif mt-2">{value}</p>
            <p className="text-xs text-black/40 mt-2">{detail}</p>
          </div>
        ))}
      </div>
      <div className="rounded-3xl bg-black p-6 text-white">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold mb-2">Voice conversation</p>
        <p className="text-sm text-white/60 mb-4">Ask naturally about the fleet, this month’s finances, or payroll.</p>
        <div className="flex gap-2">
          <input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void ask(); }} placeholder="How many cars are available today?" className="flex-1 rounded-xl px-4 py-3 text-sm text-black" />
          <button onClick={listen} className="rounded-xl bg-white/10 px-4 hover:bg-white/20" title="Speak your question"><Mic className="w-4 h-4" /></button>
          <button onClick={() => void ask()} disabled={asking} className="rounded-xl bg-gold px-4 text-black disabled:opacity-50"><Send className="w-4 h-4" /></button>
        </div>
        {answer && <p className="mt-4 rounded-2xl bg-white/10 p-4 text-sm leading-relaxed">{answer}</p>}
      </div>
      <div className="rounded-3xl border border-black/5 bg-white p-6 text-sm text-black/55 leading-relaxed">
        This view is backed by the PRAC read-only API. Fleet is available to authorised PRAC staff; financial and payroll summaries are restricted to accounts and administrators.
      </div>
    </div>
  );
}
