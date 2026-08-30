import React, { useState } from 'react';
import { Mic, Send, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { auth, UserProfile } from '../firebase';

type Message = { role: 'user' | 'assistant'; text: string };
const businesses = ['Pattaya Rent a Car', 'Alan Bolton', 'East Coast', 'Cajun Life'];

export default function PracOperations({ userProfile }: { userProfile: UserProfile }) {
  const [business, setBusiness] = useState(businesses[0]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', text: 'I am Shane OS. Ask me anything about Pattaya Rent a Car, including fleet availability, this month’s finance, or payroll.' }]);
  const [sending, setSending] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const send = async () => {
    const question = message.trim(); if (!question || sending) return;
    setMessage(''); setMessages((items) => [...items, { role: 'user', text: question }]); setSending(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/prac/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ question }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error);
      setMessages((items) => [...items, { role: 'assistant', text: body.answer }]);
      if (audioEnabled) { window.speechSynthesis?.cancel(); window.speechSynthesis?.speak(new SpeechSynthesisUtterance(body.answer)); }
    } catch (error) { setMessages((items) => [...items, { role: 'assistant', text: error instanceof Error ? error.message : 'I could not answer that right now.' }]); }
    finally { setSending(false); }
  };
  const listen = () => { const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if (!Recognition) return; const recognition = new Recognition(); recognition.lang = 'en-GB'; recognition.onresult = (event: any) => setMessage(event.results[0][0].transcript); recognition.start(); };
  return <section className="mx-auto flex min-h-[72vh] max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-2xl shadow-black/5"><header className="flex flex-col gap-4 border-b border-black/5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-gold">Shane OS</p><h1 className="font-serif text-2xl">Business conversation</h1></div><div className="flex gap-2"><button onClick={() => { setAudioEnabled((value) => !value); window.speechSynthesis?.cancel(); }} className="rounded-xl border border-black/10 p-2" title={audioEnabled ? 'Turn spoken replies off' : 'Turn spoken replies on'}>{audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button><select value={business} onChange={(e) => setBusiness(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm">{businesses.map((item) => <option key={item} disabled={item !== businesses[0]}>{item}{item !== businesses[0] ? ' · Coming soon' : ''}</option>)}</select></div></header><div className="flex-1 space-y-5 overflow-y-auto bg-[#fcfbf8] p-6">{messages.map((item, index) => <div key={index} className={`flex gap-3 ${item.role === 'user' ? 'justify-end' : ''}`}>{item.role === 'assistant' && <div className="mt-1 rounded-xl bg-gold/15 p-2"><Sparkles className="h-4 w-4 text-gold" /></div>}<div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${item.role === 'user' ? 'bg-black text-white' : 'bg-white shadow-sm'}`}>{item.text}</div></div>)}{sending && <div className="text-sm text-black/40">Shane OS is checking live data...</div>}</div><footer className="border-t border-black/5 p-4"><div className="flex gap-2 rounded-2xl border border-black/10 bg-white p-2"><button onClick={listen} className="rounded-xl p-3 hover:bg-black/5" title="Speak"><Mic className="h-5 w-5" /></button><input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void send(); }} placeholder={`Message ${business}...`} className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"/><button onClick={() => void send()} disabled={sending} className="rounded-xl bg-black p-3 text-white disabled:opacity-40"><Send className="h-5 w-5" /></button></div></footer></section>;
}
