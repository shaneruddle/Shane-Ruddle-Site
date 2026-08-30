import React, { useRef, useState } from 'react';
import { Mic, PhoneOff, Send, Sparkles } from 'lucide-react';
import { auth, UserProfile } from '../firebase';

type Message = { role: 'assistant' | 'user'; text: string };

export default function PracOperations({ userProfile: _userProfile }: { userProfile: UserProfile }) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', text: 'I am Shane OS. Ask me about Pattaya Rent a Car.' }]);
  const [live, setLive] = useState(false);
  const peer = useRef<RTCPeerConnection | null>(null);
  const transcriptItems = useRef(new Set<string>());

  const authorisedRequest = async (path: string, init?: RequestInit) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch(path, { ...init, headers: { ...(init?.headers || {}), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Request failed.');
    return body;
  };

  const stop = () => {
    peer.current?.getSenders().forEach((sender) => sender.track?.stop());
    peer.current?.close();
    peer.current = null;
    setLive(false);
  };

  const handleToolCall = async (message: any, channel: RTCDataChannel) => {
    const args = JSON.parse(message.arguments || '{}');
    const path = message.name === 'get_prac_live_data' ? '/api/prac/realtime-tool' : '/api/tasks/from-assistant';
    const output = await authorisedRequest(path, { method: 'POST', body: JSON.stringify(args) });
    if (message.name === 'create_group_task') window.dispatchEvent(new Event('tasks:changed'));
    channel.send(JSON.stringify({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: message.call_id, output: JSON.stringify(output) } }));
    channel.send(JSON.stringify({ type: 'response.create' }));
  };

  const voice = async () => {
    const session = await authorisedRequest('/api/prac/realtime-session', { method: 'POST' });
    if (!session.clientSecret) throw new Error(session.error || 'Voice mode is unavailable.');
    const pc = new RTCPeerConnection();
    peer.current = pc;
    const channel = pc.createDataChannel('oai-events');
    channel.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'conversation.item.input_audio_transcription.completed' && message.transcript && !transcriptItems.current.has(message.item_id)) {
        transcriptItems.current.add(message.item_id); setMessages((items) => [...items, { role: 'user', text: message.transcript }]); return;
      }
      if (message.type === 'response.output_audio_transcript.done' && message.transcript && !transcriptItems.current.has(message.item_id)) {
        transcriptItems.current.add(message.item_id); setMessages((items) => [...items, { role: 'assistant', text: message.transcript }]); return;
      }
      if (message.type !== 'response.function_call_arguments.done' || !['get_prac_live_data', 'create_group_task'].includes(message.name)) return;
      try { await handleToolCall(message, channel); }
      catch { channel.send(JSON.stringify({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: message.call_id, output: JSON.stringify({ error: 'The requested task or data operation failed.' }) } })); channel.send(JSON.stringify({ type: 'response.create' })); }
    };
    const audio = new Audio(); audio.autoplay = true;
    pc.ontrack = (event) => { audio.srcObject = event.streams[0]; };
    (await navigator.mediaDevices.getUserMedia({ audio: true })).getTracks().forEach((track) => pc.addTrack(track));
    const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
    const answer = await fetch('https://api.openai.com/v1/realtime/calls', { method: 'POST', headers: { Authorization: `Bearer ${session.clientSecret}`, 'Content-Type': 'application/sdp' }, body: offer.sdp });
    if (!answer.ok) throw new Error(`Realtime connection failed (${answer.status}).`);
    await pc.setRemoteDescription({ type: 'answer', sdp: await answer.text() });
    setLive(true);
  };

  const send = async () => {
    if (!text.trim()) return;
    const question = text; setText(''); setMessages((items) => [...items, { role: 'user', text: question }]);
    try {
      const body = await authorisedRequest('/api/prac/assistant', { method: 'POST', body: JSON.stringify({ question }) });
      if (body.task) window.dispatchEvent(new Event('tasks:changed'));
      setMessages((items) => [...items, { role: 'assistant', text: body.answer || 'I could not form an answer.' }]);
    } catch (error) { setMessages((items) => [...items, { role: 'assistant', text: error instanceof Error ? error.message : 'Unable to answer right now.' }]); }
  };

  return <section className="mx-auto flex min-h-[72vh] max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-black/10 bg-white"><header className="flex items-center justify-between border-b p-5"><div><p className="text-xs font-bold tracking-widest text-gold">SHANE OS</p><h1 className="font-serif text-2xl">Pattaya Rent a Car</h1></div><button onClick={() => live ? stop() : void voice().catch((error) => setMessages((items) => [...items, { role: 'assistant', text: error.message }]))} className="rounded-xl bg-black p-3 text-white">{live ? <PhoneOff /> : <Mic />}</button></header><div className="flex-1 space-y-4 bg-[#fcfbf8] p-6">{messages.map((message, index) => <div key={index} className={message.role === 'user' ? 'text-right' : ''}><span className={message.role === 'user' ? 'inline-block rounded-2xl bg-black px-4 py-3 text-white' : 'inline-block max-w-[80%] rounded-2xl bg-white px-4 py-3 shadow-sm'}>{message.role === 'assistant' && <Sparkles className="mr-2 inline h-4 w-4 text-gold" />}{message.text}</span></div>)}</div><footer className="flex gap-2 border-t p-4"><input value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && void send()} className="flex-1 rounded-xl border px-4" placeholder="Message Shane OS..."/><button onClick={() => void send()} className="rounded-xl bg-black p-3 text-white"><Send /></button></footer></section>;
}
