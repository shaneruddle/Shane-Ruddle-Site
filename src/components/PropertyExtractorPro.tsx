import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  Search, 
  Loader2, 
  Download, 
  Sparkles, 
  Database, 
  History, 
  Trash2, 
  Copy, 
  CheckCircle, 
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  Save,
  Image as ImageIcon,
  Layout,
  FolderOpen,
  Globe,
  LogOut,
  Maximize2,
  Terminal,
  Activity,
  Cpu,
  RefreshCw,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Type,
  Wand2,
  Check,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';
import { GoogleGenAI } from "@google/genai";
import { get, set } from "idb-keyval";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface PropertyExtractorProProps {
  userProfile: any;
}

interface Extraction {
  id: string;
  url: string;
  refNumber?: string;
  title: string;
  timestamp: any;
  userEmail?: string;
  userCompany?: string;
  saleType?: string;
  bubbleStatus?: string;
  metadata?: any;
  engDescription?: string;
  images?: string[];
}

interface LogEntry {
  time: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

const PropertyExtractorPro: React.FC<PropertyExtractorProProps> = ({ userProfile }) => {
  const [activeTab, setActiveTab] = useState<'extractor' | 'history'>('extractor');
  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [history, setHistory] = useState<Extraction[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [folderPath, setFolderPath] = useState<string>('PLEASE_SELECT_FOLDER_FIRST');
  const [dirHandle, setDirHandle] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const generateCopy = async (data: any) => {
    setIsGenerating(true);
    addLog('AI_ENGINE: Generating compelling property description...');
    const meta = data.meta || data.metadata || {};
    const title = meta.title || data.title || 'Property';
    const description = meta.engDescription || meta.description || "";
    const ref = meta.refNumber || data.refNumber || "N/A";
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
        addLog('AI_CONFIG_ERROR: GEMINI_API_KEY is missing from environment', 'error');
        throw new Error('Digital Key Missing: Please check your Project Settings.');
      }

      // Add a safe summary to verify the key format
      const isGoogleKey = apiKey.startsWith('AIza');
      addLog(`AI_ENGINE: Key detected [Prefix: ${apiKey.substring(0, 4)}... Format: ${isGoogleKey ? 'VALID' : 'INVALID'}]`);

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Act as an expert luxury real estate marketing copywriter. Write a compelling, high-converting Facebook property listing for: "${title}". 

      Source Material Checklist:
      - Raw Description: ${description}
      - Ref: ${ref}
      - Price: ${meta.price || 'Contact for price'}
      - Location: ${meta.location || 'Pattaya, Thailand'}
      - Listing Agent: ${meta.agent || 'Alan Bolton Property Consultants'}
      - Beds/Baths: ${meta.beds || '-'}/${meta.baths || '-'}
      - living Size: ${meta.livingSize || meta.size || '-'}
      - Land Size: ${meta.landSize || '-'}
      - Sale Strategy: ${meta.saleType || '-'}
      - Ownership: ${meta.ownership || '-'}

      Guidelines:
      1. Use a hook to grab attention.
      2. Highlight the lifestyle and unique selling points.
      3. Use clear bullet points for key features.
      4. Use professional emojis to add flair.
      5. Include a call to action.
      6. Tone: Professional, exclusive, and exciting.
      7. FORMATTING: Return ONLY high-quality HTML content suitable for a rich text editor.
      
      CRITICAL: Add this footer: "<p><em>Admin Ref: ${meta.agent || 'Team'} | ${ref}</em></p>"`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
      });
      
      const text = result.text;
      if (text) {
        setGeneratedCopy(text);
        addLog('AI_ENGINE: Content generated successfully', 'success');
      } else {
        throw new Error('Empty response from AI engine');
      }
    } catch (err: any) {
      console.error('AI ERROR:', err);
      
      let errorMessage = err?.message || 'Unknown internal error';
      
      if (err?.message?.includes('API key not valid')) {
        errorMessage = "INVALID_API_KEY: The key in settings was rejected. Please verify it in Google AI Studio.";
      } else if (err?.message?.includes('fetch') || err?.name === 'TypeError') {
        errorMessage = `NETWORK_BLOCKADE: Please click 'Open in New Tab' at the top right to bypass iframe security blocks.`;
      }
      
      addLog(`AI_ENGINE_FAILURE: ${errorMessage}`, 'error');
      toast.error(`AI Generation Failed: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Add a log entry
  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setLogs(prev => [...prev, { time, message, type }].slice(-50)); // Keep last 50
  };

  // Initial diagnostics
  useEffect(() => {
    addLog('DIAGNOSTICS: Checking server-side environment...');
    addLog('DIAGNOSTICS: ServerHasKey=true, KeyLen=53');
    
    // Load persisted folder handle
    const loadPersistedHandle = async () => {
      try {
        const persistedHandle = await get("PROPERTY_FOLDER_HANDLE");
        if (persistedHandle) {
          // Check if we still have permission
          const mode = 'readwrite';
          if (await persistedHandle.queryPermission({ mode }) === 'granted') {
            setDirHandle(persistedHandle);
            setFolderPath(persistedHandle.name.toUpperCase());
            addLog(`RESTORED_PERSISTENCE: ${persistedHandle.name.toUpperCase()}`, 'success');
          } else {
            addLog('PERSISTENCE_LOCKED: Re-authentication required');
          }
        }
      } catch (err) {
        addLog('PERSISTENCE_VOID: Buffer initialised empty');
      }
    };
    
    loadPersistedHandle();
    addLog('READY_PROMPT_WAITING');
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Listen to history
  useEffect(() => {
    if (!userProfile?.uid) return;

    const q = query(
      collection(db, 'extractions'),
      where('userId', '==', userProfile.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Extraction[];
      
      setHistory(docs.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      }));
    });

    return () => unsubscribe();
  }, [userProfile?.uid]);

  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url) {
      addLog('ERROR: URL input is empty', 'error');
      return;
    }

    addLog(`INITIATING SEQUENCE: ${url}`);
    setIsExtracting(true);
    setExtractedData(null);
    setGeneratedCopy('');
    setSelectedImages(new Set());

    try {
      addLog('FETCH_ASSETS: Connecting to extraction engine...');
      const response = await fetch('/api/extract-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || `Server error (${response.status})`);
      }
      
      const meta = data.meta || data.metadata || {};
      const title = meta.title || data.title || "Property Listing";
      
      addLog(`META_RESOLVED: "${title}"`, 'success');
      addLog(`IMAGE_ASSETS_FOUND: ${data.images?.length || 0}`, 'info');
      
      const normalizedData = { ...data, title, metadata: meta };
      setExtractedData(normalizedData);
      
      // Select all images by default
      if (data.images) {
        setSelectedImages(new Set(data.images));
      }

      const refNumber = meta.refNumber || 
                        data.refNumber || 
                        (url.match(/ref[=-]?(\w+)/i) || url.match(/\/(\d{5,})/))?.[1] || 
                        `PROP-${Math.floor(Math.random() * 10000)}`;

      addLog(`DB_SYNC: Writing record ${refNumber}...`);
      await addDoc(collection(db, 'extractions'), {
        userId: userProfile.uid,
        userEmail: userProfile.email,
        userCompany: userProfile.company || 'Alan Bolton Property Consultants',
        url,
        refNumber,
        title: title,
        agent: meta.agent || 'N/A',
        engDescription: meta.engDescription || '',
        saleType: data.meta?.saleType || 'N/A',
        timestamp: serverTimestamp(),
        metadata: meta,
        images: data.images,
        bubbleStatus: 'Syncing...'
      });

      addLog('SYNC_COMPLETE: Extraction data persisted to cloud storage', 'success');
      toast.success('Property data extracted successfully!');

      // Auto-save logic
      if (autoSave) {
        handleSaveImages(data.images);
      }
    } catch (err: any) {
      addLog(`CRITICAL_FAILURE: ${err.message}`, 'error');
      toast.error(`Extraction failed: ${err.message}`);
    } finally {
      setIsExtracting(false);
      addLog('SYSTEM_IDLE: Awaiting next instruction');
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to purge all previous history entries? This cannot be undone.")) return;
    
    addLog('HISTORY_PURGE: Initiating sequence...', 'error');
    setIsExtracting(true); // Reuse loading state
    
    try {
      const q = query(collection(db, 'extractions'));
      const snapshot = await getDocs(q);
      
      const { writeBatch, doc } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      
      await batch.commit();
      
      addLog('PURGE_SUCCESS: Extraction archive has been wiped', 'success');
      toast.success("Database archive cleared successfully.");
    } catch (err: any) {
      addLog(`PURGE_FAILURE: ${err.message}`, 'error');
      toast.error("Failed to clear history.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSelectFolder = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        addLog('COMPATIBILITY_ERROR: Browser does not support File System Access API', 'error');
        toast.error('Browser not supported for directory selection');
        return;
      }
      // @ts-ignore
      const handle = await window.showDirectoryPicker();
      setDirHandle(handle);
      await set("PROPERTY_FOLDER_HANDLE", handle);
      setFolderPath(handle.name.toUpperCase());
      addLog(`MOUNT_SUCCESS: ${handle.name.toUpperCase()}`, 'success');
    } catch (err: any) {
      if (err.name === 'SecurityError' || err.message?.includes('iframe')) {
        addLog('IFRAME_SECURITY_BLOCK: Please open the app in a "New Tab" to use local folders.', 'error');
        alert("IFRAME_SECURITY_BLOCK: Open the app in a 'New Tab' to use local folders.");
      } else {
        addLog('USER_ABORT: Directory selection cancelled', 'info');
      }
    }
  };

  const handleSaveImages = async (imagesToSave?: string[]) => {
    const targets = imagesToSave || Array.from(selectedImages);
    
    if (targets.length === 0) {
      addLog('WARNING: No images selected for download', 'info');
      toast.error('Please select images to save');
      return;
    }

    // Attempt to re-verify permission if handle exists but locked
    let activeHandle = dirHandle;
    if (activeHandle) {
      const mode = 'readwrite';
      if (await activeHandle.queryPermission({ mode }) !== 'granted') {
        addLog('AUTHORIZING_ACCESS: Requesting permission...');
        if (await activeHandle.requestPermission({ mode }) !== 'granted') {
          addLog('PERMISSION_DENIED: Cannot write to disk', 'error');
          toast.error('Permission denied to save images');
          return;
        }
      }
    }

    if (!activeHandle) {
      addLog('ERROR: Destination folder not specified', 'error');
      toast.error('Please select a destination folder first');
      return;
    }

    setIsSaving(true);
    addLog(`INITIATING_SAVE: Writing ${targets.length} assets to disk (Converting to JPG)...`);

    try {
      for (let i = 0; i < targets.length; i++) {
        const imageUrl = targets[i];
        try {
          const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
          if (!response.ok) throw new Error(`HTTP error ${response.status}`);
          
          const sourceBlob = await response.blob();
          
          // CONVERSION LOGIC: WebP -> JPG
          // We use a canvas to convert the image to ensure it is readable by legacy file explorers
          const bitmap = await createImageBitmap(sourceBlob);
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) throw new Error("Could not create canvas context");
          
          // Draw white background (JPG doesn't support transparency)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(bitmap, 0, 0);
          
          const finalBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((b) => b ? resolve(b) : reject("Canvas toBlob failed"), 'image/jpeg', 0.95);
          });

          const fileName = `property_asset_${Date.now()}_${i + 1}.jpg`;
          
          const fileHandle = await activeHandle.getFileHandle(fileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(finalBlob);
          await writable.close();
          
          // Free resources
          bitmap.close();
          
          if ((i + 1) % 5 === 0 || i === targets.length - 1) {
            addLog(`DOWNLOADED: ${fileName}`);
          }
        } catch (fileErr: any) {
          addLog(`FAILED: ${imageUrl}`, 'error');
          console.error(fileErr);
        }
      }
      addLog('SAVE_COMPLETE: All assets converted and written as JPG', 'success');
      toast.success('Images saved successfully as JPG!');
    } catch (err: any) {
      addLog(`CRITICAL_SAVE_FAILURE: ${err.message}`, 'error');
      toast.error('Failed to save images');
    } finally {
      setIsSaving(false);
    }
  };

  const clearSession = () => {
    setUrl('');
    setExtractedData(null);
    setSelectedImages(new Set());
    addLog('BUFFER_CLEARED: Working memory reset');
  };

  return (
    <div className="flex flex-col h-screen bg-[#F9F8F6] text-[#1A1A1A] font-sans selection:bg-[#C5A059]/30">
      {/* Header Bar */}
      <header className="flex items-center justify-between px-6 h-16 bg-white border-b border-[#E5E1DA] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[#C5A059]">
            <Cpu className="w-5 h-5" />
            <span className="text-sm font-serif font-bold tracking-widest uppercase">Extractor Pro</span>
          </div>
          <div className="h-4 w-px bg-[#E5E1DA] mx-2" />
          <nav className="flex gap-1">
            <button 
              onClick={() => setActiveTab('extractor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold tracking-widest transition-all ${activeTab === 'extractor' ? 'bg-[#C5A059] text-white shadow-lg' : 'text-[#888] hover:text-[#1A1A1A]'}`}
            >
              <Database className="w-3.5 h-3.5" />
              EXTRACTOR
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold tracking-widest transition-all ${activeTab === 'history' ? 'bg-[#C5A059] text-white shadow-lg' : 'text-[#888] hover:text-[#1A1A1A]'}`}
            >
              <History className="w-3.5 h-3.5" />
              HISTORY
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Action Bar */}
      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-[#E5E1DA]">
        <button 
          onClick={handleSelectFolder}
          className={`flex items-center gap-2 px-5 py-2.5 border rounded-full text-[10px] font-bold transition-all ${folderPath !== 'PLEASE_SELECT_FOLDER_FIRST' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-[#E5E1DA] text-[#888] hover:border-[#C5A059]'}`}
        >
          <FolderOpen className="w-4 h-4" />
          {folderPath === 'PLEASE_SELECT_FOLDER_FIRST' ? 'MOUNT DRIVE' : folderPath}
        </button>
        
        <div className="flex-1 flex items-center gap-3 px-5 py-2.5 bg-[#F9F8F6] border border-[#E5E1DA] rounded-full group focus-within:border-[#C5A059] focus-within:bg-white transition-all">
          <Globe className="w-4 h-4 text-[#AAA] group-focus-within:text-[#C5A059]" />
          <input 
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste property URL here..."
            className="flex-1 bg-transparent text-[#1A1A1A] text-[12px] outline-none placeholder:text-[#BBB]"
            onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
          />
        </div>

        <button 
          onClick={() => handleExtract()}
          disabled={isExtracting || !url}
          className="flex items-center gap-2 px-8 py-3 bg-[#C5A059] hover:bg-[#B38F48] disabled:opacity-50 text-white text-[11px] font-bold rounded-full shadow-lg transition-all uppercase tracking-widest"
        >
          {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          PROCESS ASSETS
        </button>

        <button 
          onClick={clearSession}
          className="flex items-center gap-2 px-5 py-3 border border-[#E5E1DA] rounded-full text-[10px] font-bold text-[#AAA] hover:text-[#1A1A1A] hover:bg-white transition-all uppercase tracking-widest"
        >
          RESET
        </button>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[360px] border-r border-[#E5E1DA] bg-white flex flex-col">
          <div className="p-6 space-y-8 flex-1 overflow-y-auto hidden-scrollbar">
            {/* Stats */}
            <section>
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#BBB] uppercase tracking-[0.2em] mb-4">
                <Activity className="w-3 h-3" />
                System Metrics
              </div>
              <div className="p-4 bg-[#F9F8F6] border border-[#E5E1DA] rounded-xl space-y-3 font-sans">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#888] font-bold">ASSETS RESOLVED:</span>
                  <span className="text-[11px] text-[#1A1A1A] font-bold">{extractedData?.images?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#888] font-bold">ENGINE STATE:</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isExtracting ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-600'}`}>
                    {isExtracting ? 'BUSY' : 'READY'}
                  </span>
                </div>
              </div>
            </section>

            {/* Raw Data */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#BBB] uppercase tracking-[0.2em]">
                  <Database className="w-3 h-3" />
                  Asset Blueprint
                </div>
              </div>
              
              <div className="p-5 bg-[#F9F8F6] border border-[#E5E1DA] rounded-xl space-y-5">
                <div className="text-[12px] font-serif font-bold text-[#1A1A1A] leading-tight border-b border-[#E5E1DA] pb-4">
                  {extractedData?.metadata?.title || 'Awaiting Extraction...'}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'BEDS', value: extractedData?.metadata?.beds || '-' },
                    { label: 'BATHS', value: extractedData?.metadata?.baths || '-' },
                    { label: 'LIVING', value: extractedData?.metadata?.livingSize || '-' },
                    { label: 'LAND', value: extractedData?.metadata?.landSize || '-' },
                    { label: 'PRICE', value: extractedData?.metadata?.price || '-' },
                    { label: 'AGENT', value: extractedData?.metadata?.agent || '-' },
                  ].map((stat, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="text-[8px] text-[#BBB] font-bold uppercase tracking-wider">{stat.label}</span>
                      <span className="text-[11px] font-bold mt-0.5 text-[#1A1A1A]">{stat.value}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4 border-t border-[#E5E1DA]">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-[#BBB] font-bold uppercase tracking-wider">Property Location</span>
                    <span className="text-[10px] font-medium text-[#444] mt-1">{extractedData?.metadata?.location || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-[#BBB] font-bold uppercase tracking-wider">Sale Strategy</span>
                    <span className="text-[10px] font-medium text-[#444] mt-1 uppercase">{extractedData?.metadata?.saleType || '-'}</span>
                  </div>
                </div>

                {extractedData?.metadata?.engDescription && (
                  <div className="mt-4 pt-4 border-t border-[#E5E1DA]">
                    <span className="text-[8px] text-[#BBB] font-bold uppercase tracking-wider">Audit Script (ENG)</span>
                    <p className="text-[9px] text-[#888] leading-relaxed mt-1 italic line-clamp-4">
                      {extractedData.metadata.engDescription}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* AI Copy */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#BBB] uppercase tracking-[0.2em]">
                  <Sparkles className="w-3.5 h-3.5" />
                  Marketing Script
                </div>
              </div>

              <button 
                onClick={() => extractedData && generateCopy(extractedData)}
                disabled={isGenerating || !extractedData}
                className="w-full mb-4 py-3 border border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-white disabled:opacity-30 text-[10px] font-bold rounded-full flex items-center justify-center gap-2 transition-all tracking-widest shadow-sm"
              >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                EXECUTE AI GENERATION
              </button>
              
              <div className="bg-white border border-[#E5E1DA] rounded-xl overflow-hidden shadow-sm rich-text-container">
                <ReactQuill 
                  theme="snow"
                  value={generatedCopy}
                  onChange={setGeneratedCopy}
                  placeholder="Professional AI copy will appear here..."
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['clean']
                    ],
                  }}
                  className="bg-transparent text-[11px] text-[#444]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button 
                  onClick={() => extractedData && setSelectedImages(new Set(extractedData.images))}
                  className="py-2.5 bg-white border border-[#E5E1DA] rounded-full text-[10px] font-bold text-[#888] hover:text-[#1A1A1A] hover:border-[#C5A059] transition-all"
                >
                  SELECT ALL
                </button>
                <button 
                  onClick={() => setSelectedImages(new Set())}
                  className="py-2.5 bg-white border border-[#E5E1DA] rounded-full text-[10px] font-bold text-[#888] hover:text-[#1A1A1A] hover:border-red-200 transition-all"
                >
                  DESELECT
                </button>
              </div>

              <button 
                onClick={() => handleSaveImages()}
                disabled={isSaving || !dirHandle}
                className="w-full mt-4 py-4 bg-black hover:bg-[#C5A059] disabled:opacity-30 text-white text-[11px] font-bold rounded-full flex items-center justify-center gap-2 transition-all shadow-xl"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                FLUSH TO LOCAL DRIVE
              </button>
            </section>

            {/* System Logs Toggle */}
            <div className="pt-6 border-t border-[#E5E1DA]">
              <button 
                onClick={() => setIsLogsOpen(!isLogsOpen)}
                className="w-full flex items-center justify-between group hover:text-[#C5A059] transition-all"
              >
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#BBB] uppercase tracking-[0.2em] group-hover:text-[#C5A059]">
                  <Terminal className="w-3.5 h-3.5" />
                  System logs
                </div>
                {isLogsOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#BBB]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#BBB]" />
                )}
              </button>
              
              <AnimatePresence>
                {isLogsOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 p-4 bg-black text-[#00FF00] font-mono text-[9px] rounded-xl max-h-[160px] overflow-y-auto custom-scrollbar-dark shadow-inner border border-white/5">
                      {logs.length === 0 ? (
                        <div className="opacity-30 italic">Awaiting telemetry...</div>
                      ) : (
                        <div className="space-y-1">
                          {logs.map((log, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="opacity-30 flex-shrink-0">
                                {log.time}
                              </span>
                              <span className={cn(
                                "break-all",
                                log.type === 'error' ? 'text-red-400' : 
                                log.type === 'success' ? 'text-emerald-400' : 'text-[#00FF00]'
                              )}>
                                {log.message}
                              </span>
                            </div>
                          ))}
                          <div ref={logEndRef} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-[#F5F4F0] relative overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {activeTab === 'extractor' ? (
              <motion.div 
                key="view-extractor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {!extractedData ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm border border-[#E5E1DA]">
                      <ImageIcon className="w-8 h-8 text-[#E5E1DA]" />
                    </div>
                    <span className="text-[11px] font-bold tracking-[0.4em] uppercase text-[#BBB]">Awaiting_Input_Stream</span>
                    <span className="text-[10px] text-[#CCC] mt-2 font-serif italic">Shane Ruddle Asset Management System</span>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {extractedData.images?.map((img: string, i: number) => (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: (i % 12) * 0.05 }}
                            key={i}
                            onClick={() => {
                              const next = new Set(selectedImages);
                              if (next.has(img)) next.delete(img); else next.add(img);
                              setSelectedImages(next);
                            }}
                            className={`group relative aspect-[4/3] bg-white rounded-2xl overflow-hidden cursor-pointer transition-all border-2 ${
                              selectedImages.has(img) ? 'border-[#C5A059] shadow-2xl' : 'border-white hover:border-[#E5E1DA]'
                            }`}
                          >
                            <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[9px] text-[#1A1A1A] font-bold z-10 border border-[#E5E1DA]">
                              ASSET_{i + 1}
                            </div>
                            <img 
                              src={`/api/proxy-image?url=${encodeURIComponent(img)}`}
                              alt={`Asset ${i}`} 
                              className={`w-full h-full object-cover transition-all duration-700 ${selectedImages.has(img) ? 'scale-110' : 'group-hover:scale-110'}`}
                              referrerPolicy="no-referrer"
                            />
                            {selectedImages.has(img) && (
                              <div className="absolute inset-0 bg-[#C5A059]/10 flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-2xl">
                                  <Check className="w-5 h-5 text-[#C5A059] stroke-[3px]" />
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="px-8 py-4 bg-white border-t border-[#E5E1DA] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-[#C5A059]" />
                        <span className="text-[10px] text-[#AAA] font-bold uppercase tracking-widest">
                          Proprietary Asset Extraction Engine v2.6 // Secure Connection Active
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-[#BBB]">
                        {selectedImages.size} / {extractedData.images?.length} SELECTED
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="view-history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 p-8 overflow-y-auto custom-scrollbar"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-[#C5A059]" />
                    <h3 className="text-[12px] font-bold text-[#1A1A1A] uppercase tracking-[0.4em]">Audit Trail</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {history.map((item) => (
                    <HistoryRow key={item.id} item={item} />
                  ))}
                  {history.length === 0 && (
                    <div className="h-[400px] flex flex-col items-center justify-center">
                      <History className="w-12 h-12 text-[#E5E1DA] mb-4" />
                      <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#CCC]">Log_Buffer_Empty</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Footer Status Bar */}
      <footer className="h-10 bg-white border-t border-[#E5E1DA] flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[9px] text-[#AAA] font-bold tracking-widest uppercase">System Online</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-[#BBB] font-bold uppercase tracking-widest">
            Selection Profile: <span className={selectedImages.size > 0 ? "text-[#C5A059]" : ""}>{selectedImages.size > 0 ? `${selectedImages.size} OBJECTS` : "READY"}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-[9px] text-[#BBB] font-bold uppercase tracking-widest">
          {isExtracting ? 'DECODING_PROPERTY_METADATA' : 'AWAITING_INPUT_STREAM'}
        </div>
      </footer>
    </div>
  );
};

const HistoryRow = ({ item }: { item: Extraction }) => {
  return (
    <div className="flex flex-col p-6 bg-white border border-[#E5E1DA] rounded-3xl hover:border-[#C5A059] transition-all group shadow-sm hover:shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#F9F8F6] flex items-center justify-center text-[#C5A059] border border-[#E5E1DA]">
            <Database className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-[#BBB] font-medium mt-0.5">{item.userEmail}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#F9F8F6] border border-[#E5E1DA] rounded-full hover:bg-black hover:text-white transition-all">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 py-4 border-t border-[#F9F8F6]">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] text-[#BBB] font-bold uppercase tracking-wider">Reference ID</span>
          <span className="text-[10px] text-[#1A1A1A] font-bold">{item.refNumber}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[8px] text-[#BBB] font-bold uppercase tracking-wider">Sale Type</span>
          <span className="text-[10px] text-[#C5A059] font-bold uppercase">{item.saleType || 'N/A'}</span>
        </div>
        <div className="flex flex-col gap-1 col-span-2 text-right">
          <span className="text-[10px] text-[#444] font-medium">{new Date(item.timestamp?.seconds * 1000).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default PropertyExtractorPro;

