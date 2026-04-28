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
  XCircle,
  Tag,
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
  userName?: string;
  userCompany?: string;
  agent?: string;
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
  const [activeTab, setActiveTab] = useState<'extractor' | 'audit-trail'>('extractor');
  const [manualUrl, setManualUrl] = useState('');
  const [isAddingManual, setIsAddingManual] = useState(false);
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
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

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

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Act as an expert property consultant and luxury real estate marketing copywriter. Generate a property description using the EXACT structure and emojis below.

      STRUCTURE TO FOLLOW (MANDATORY):
      🏙️ [Property Title] | [Project Name]

      💰 Sale: [Selling Price] THB
      💵 Rent: [Rental Price] THB / Month
      📍 Location: [Location]
      🏢 Project: [Project Name]
      📐 Size: [Size]
      🌍 Ownership: [Ownership]

      ✨ Unit Details
      🛏️ [Bedrooms/Studio Layout]
      🛁 [Bathrooms]
      🛋️ [Living Space Details]
      🍽️ [Kitchen/Dining Details]

      Why You’ll Love It
      [Short, compelling bullet points with emojis highlighting features like location, facilities, and investment value.]

      📩 Available for sale or rent – Contact us today
      📌 Ref: ${userProfile?.displayName || userProfile?.email?.split('@')[0] || 'Consultant'} | ${ref}

      Guidelines:
      1. FORMATTING: Use <p> tags for each line. Ensure there is a blank line (empty <p>&nbsp;</p>) between the main sections (Header, Price/Info, Unit Details, Why You'll Love It, and Footer).
      2. If "Selling Price" or "Rental Price" is missing, omit that specific line.
      3. For "Unit Details", expand on the beds/baths/living space with descriptive terms (e.g. "Spacious Studio Layout", "Modern Bathroom").
      4. For "Why You'll Love It", generate 4-5 bullet points starting with relevant emojis (e.g. 🏊, 🛍️, 🏖️, 🚶, 💼).
      5. Tone: Professional, high-end, and inviting.

      Source Material:
      - Title: "${title}"
      - Raw Description: ${meta.customDescription || description}
      - Location: ${meta.location || 'Pattaya'}
      - Project Name: ${meta.devName || title}
      - Beds/Baths: ${meta.beds || '-'}/${meta.baths || '-'}
      - Living Space: ${meta.livingSize || meta.size || '-'}
      - Ownership: ${meta.ownership || '-'}
      - Selling Price: ${meta.sellingPrice || meta.price || 'N/A'}
      - Rental Price: ${meta.rentalPrice || 'N/A'}
      - Floor: ${meta.floor || '-'}
      - Furniture: ${meta.furniture || '-'}
      - Custom Description: ${meta.customDescription || '-'}`;

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

  const copyContent = () => {
    if (!generatedCopy) return;
    
    // Create a temporary element to parse HTML and get text
    const temp = document.createElement('div');
    temp.innerHTML = generatedCopy;
    
    // Replace <p> with newline, <li> with bullet + newline
    let formattedText = generatedCopy
      .replace(/<\/p>/g, '\n\n')
      .replace(/<li>/g, '• ')
      .replace(/<\/li>/g, '\n')
      .replace(/<[^>]*>/g, ''); // Remove all other tags
    
    // Trim extra newlines
    formattedText = formattedText.trim();
    
    navigator.clipboard.writeText(formattedText);
    toast.success("Text copied for Facebook!");
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
        collection(db, 'extractions')
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
      }, (err) => {
        addLog(`AUDIT_TRAIL_ERROR: ${err.message}`, 'error');
        console.error('Audit Trail Error:', err);
      });
  
      return () => unsubscribe();
    }, [userProfile?.uid]);

  const handleManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl) return;

    setIsAddingManual(true);
    addLog(`MANUAL_ENTRY_INIT: Recording intent for ${manualUrl}`);

    try {
      let refNumber = `MANUAL-${Math.floor(Math.random() * 10000)}`;
      let displayTitle = 'Manual Entry (Pending Processing)';
      let devName = '';
      
      // Attempt to extract reference and title from URL
      try {
        const urlObj = new URL(manualUrl);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        
        // Find the best string for a title (not just numbers)
        let namePart = '';
        for (let i = pathParts.length - 1; i >= 0; i--) {
          const part = pathParts[i];
          if (/[a-zA-Z]/.test(part)) {
            namePart = part;
            break;
          }
        }

        if (namePart) {
          // Try to get a title from the slug
          displayTitle = namePart.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          // Reference extraction (check the last part specifically first)
          const lastPart = pathParts[pathParts.length - 1];
          const refPattern = /^[A-Z]{1,4}[- ]?[0-9]{3,}$/i;
          if (refPattern.test(lastPart)) {
            refNumber = lastPart.toUpperCase();
          } else {
            const refParam = urlObj.searchParams.get('ref') || urlObj.searchParams.get('id');
            if (refParam && refParam.length > 3) {
              refNumber = refParam.toUpperCase();
            }
          }
        }
      } catch (e) {}
      
      await addDoc(collection(db, 'extractions'), {
        userId: userProfile.uid,
        userEmail: userProfile.email,
        userName: userProfile.displayName || userProfile.email?.split('@')[0] || 'User',
        userCompany: userProfile.company || 'Alan Bolton Property Consultants',
        url: manualUrl,
        refNumber,
        title: displayTitle,
        timestamp: serverTimestamp(),
        bubbleStatus: 'Manually Added',
        isManual: true,
        metadata: {
          devName: devName || ''
        }
      });

      setManualUrl('');
      addLog(`AUDIT_TRAIL_LOCKED: URL recorded successfully [${refNumber}]`, 'success');
      toast.success('URL added to Audit Trail');
    } catch (err: any) {
      addLog(`AUDIT_TRAIL_FAILURE: ${err.message}`, 'error');
      toast.error('Failed to add manual entry');
    } finally {
      setIsAddingManual(false);
    }
  };

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
        userName: userProfile.displayName || userProfile.email?.split('@')[0] || 'User',
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
      setShowSidebarMobile(false);

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
    if (!window.confirm("Are you sure you want to purge all previous Audit Trail entries? This cannot be undone.")) return;
    
    addLog('AUDIT_TRAIL_PURGE: Initiating sequence...', 'error');
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

    if (isMobile) {
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
    setGeneratedCopy('');
    setSelectedImages(new Set());
    addLog('BUFFER_CLEARED: Working memory reset');
  };

  return (
    <div className="flex flex-col h-screen bg-[#F9F8F6] text-[#1A1A1A] font-sans selection:bg-[#C5A059]/30 overflow-hidden">
      {/* Header Bar */}
      <header className="flex items-center justify-between px-4 lg:px-6 h-16 bg-white border-b border-[#E5E1DA] shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="flex items-center gap-1.5 lg:gap-2 text-[#C5A059]">
            <Cpu className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="text-[10px] lg:text-sm font-serif font-bold tracking-widest uppercase truncate max-w-[80px] lg:max-w-none">Extractor Pro</span>
          </div>
          <div className="h-4 w-px bg-[#E5E1DA] mx-1 lg:mx-2 hidden sm:block" />
          <nav className="flex gap-1">
            <button 
              onClick={() => setActiveTab('extractor')}
              className={`flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-2 rounded-full text-[9px] lg:text-[10px] font-bold tracking-widest transition-all ${activeTab === 'extractor' ? 'bg-[#C5A059] text-white shadow-lg' : 'text-[#888] hover:text-[#1A1A1A]'}`}
            >
              <Database className="w-3 lg:w-3.5 h-3 lg:h-3.5" />
              <span className="hidden xs:inline">EXTRACTOR</span>
              <span className="xs:hidden">EXT</span>
            </button>
            <button 
              onClick={() => setActiveTab('audit-trail')}
              className={`flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-2 rounded-full text-[9px] lg:text-[10px] font-bold tracking-widest transition-all ${activeTab === 'audit-trail' ? 'bg-[#C5A059] text-white shadow-lg' : 'text-[#888] hover:text-[#1A1A1A]'}`}
            >
              <History className="w-3 lg:w-3.5 h-3 lg:h-3.5" />
              <span className="hidden xs:inline">AUDIT TRAIL</span>
              <span className="xs:hidden">AUDIT</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2 lg:px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[8px] lg:text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 px-4 lg:px-6 py-4 bg-white border-b border-[#E5E1DA] flex-shrink-0">
        {isMobile && activeTab === 'extractor' && (
          <div className="flex p-1 bg-[#F9F8F6] border border-[#E5E1DA] rounded-full mb-1">
            <button 
              onClick={() => setShowSidebarMobile(false)}
              className={`flex-1 py-2 px-6 rounded-full text-[10px] font-bold tracking-widest transition-all ${!showSidebarMobile ? 'bg-[#C5A059] text-white shadow-md' : 'text-[#888]'}`}
            >
              GALLERY
            </button>
            <button 
              onClick={() => setShowSidebarMobile(true)}
              className={`flex-1 py-2 px-6 rounded-full text-[10px] font-bold tracking-widest transition-all ${showSidebarMobile ? 'bg-[#C5A059] text-white shadow-md' : 'text-[#888]'}`}
            >
              CONTROLS
            </button>
          </div>
        )}

        {!isMobile && (
          <button 
            onClick={handleSelectFolder}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 border rounded-full text-[10px] font-bold transition-all ${folderPath !== 'PLEASE_SELECT_FOLDER_FIRST' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-[#E5E1DA] text-[#888] hover:border-[#C5A059]'}`}
          >
            <FolderOpen className="w-4 h-4" />
            <span className="truncate max-w-[150px]">{folderPath === 'PLEASE_SELECT_FOLDER_FIRST' ? 'MOUNT DRIVE' : folderPath}</span>
          </button>
        )}
        
        {isMobile && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg mb-1 lg:mb-0">
            <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] text-blue-700 font-medium leading-tight">
              iPhone Users: Long-press images to "Save to Photos"
            </span>
          </div>
        )}
        
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

        <div className="flex gap-2">
          <button 
            onClick={() => handleExtract()}
            disabled={isExtracting || !url}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 lg:px-8 py-3 bg-[#C5A059] hover:bg-[#B38F48] disabled:opacity-50 text-white text-[11px] font-bold rounded-full shadow-lg transition-all uppercase tracking-widest"
          >
            {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            <span className="hidden sm:inline">PROCESS ASSETS</span>
            <span className="sm:hidden">PROCESS</span>
          </button>

          <button 
            onClick={clearSession}
            className="flex items-center justify-center gap-2 px-5 py-3 border border-[#E5E1DA] rounded-full text-[10px] font-bold text-[#AAA] hover:text-[#1A1A1A] hover:bg-white transition-all uppercase tracking-widest"
          >
            RESET
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside className={`${activeTab === 'extractor' ? (isMobile ? (showSidebarMobile ? 'flex' : 'hidden') : 'flex') : 'hidden'} lg:flex w-full lg:w-[360px] border-r border-[#E5E1DA] bg-white flex-col overflow-y-auto lg:overflow-hidden`}>
          <div className="p-4 lg:p-6 space-y-8 flex-1 lg:overflow-y-auto hidden-scrollbar">
            {/* Stats */}
            <section>
              <div className="flex items-center gap-2 text-[10px] lg:text-[10px] font-bold text-[#BBB] uppercase tracking-[0.2em] mb-4">
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
                    { label: 'SELL PRICE', value: extractedData?.metadata?.sellingPrice || '-' },
                    { label: 'RENT PRICE', value: extractedData?.metadata?.rentalPrice || '-' },
                    { label: 'PROJECT', value: extractedData?.metadata?.devName || '-' },
                    { label: 'FLOOR', value: extractedData?.metadata?.floor || '-' },
                    { label: 'FURNISHED', value: extractedData?.metadata?.furniture || '-' },
                    { label: 'KEYS', value: extractedData?.metadata?.keys || '-' },
                    { label: 'AGENT', value: extractedData?.metadata?.agent || '-' },
                    { label: 'REF', value: extractedData?.metadata?.refNumber || '-' },
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

                {extractedData?.metadata?.customDescription && (
                  <div className="mt-4 pt-4 border-t border-[#E5E1DA]">
                    <span className="text-[8px] text-[#BBB] font-bold uppercase tracking-wider">Custom Description</span>
                    <p className="text-[9px] text-[#888] leading-relaxed mt-1 italic line-clamp-4">
                      {extractedData.metadata.customDescription}
                    </p>
                  </div>
                )}

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

              <div className="flex gap-2 items-center mb-4">
                <button 
                  onClick={() => extractedData && generateCopy(extractedData)}
                  disabled={isGenerating || !extractedData}
                  className="flex-1 py-3 border border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-white disabled:opacity-30 text-[10px] font-bold rounded-full flex items-center justify-center gap-2 transition-all tracking-widest shadow-sm"
                >
                  {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                  GENERATE
                </button>
                <button 
                  onClick={copyContent}
                  disabled={!generatedCopy}
                  className="px-6 py-3 bg-[#F9F8F6] border border-[#E5E1DA] text-[#888] hover:text-[#C5A059] hover:border-[#C5A059] disabled:opacity-30 text-[10px] font-bold rounded-full flex items-center justify-center gap-2 transition-all tracking-widest"
                  title="Copy Text"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              
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

              {!isMobile && (
                <button 
                  onClick={() => handleSaveImages()}
                  disabled={isSaving || !dirHandle}
                  className="w-full mt-4 py-4 bg-black hover:bg-[#C5A059] disabled:opacity-30 text-white text-[11px] font-bold rounded-full flex items-center justify-center gap-2 transition-all shadow-xl"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  FLUSH TO LOCAL DRIVE
                </button>
              )}
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
                className={`${isMobile && showSidebarMobile ? 'hidden' : 'flex'} flex-1 flex flex-col overflow-hidden`}
              >
                {!extractedData ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm border border-[#E5E1DA]">
                      <ImageIcon className="w-8 h-8 text-[#E5E1DA]" />
                    </div>
                    <span className="text-[11px] font-bold tracking-[0.4em] uppercase text-[#BBB]">Awaiting_Input_Stream</span>
                    <span className="text-[10px] text-[#CCC] mt-2 font-serif italic text-center mb-6">Shane Ruddle Asset Management System</span>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 p-4 lg:p-8 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-8">
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
                              src={img.startsWith('data:') ? img : `/api/proxy-image?url=${encodeURIComponent(img)}`}
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
                            {isMobile && (
                             <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const urlToFetch = img.startsWith('data:') ? img : `/api/proxy-image?url=${encodeURIComponent(img)}`;
                                  const response = await fetch(urlToFetch);
                                  const blob = await response.blob();
                                  const file = new File([blob], `asset_${i+1}.jpg`, { type: 'image/jpeg' });
                                  
                                  if (navigator.share && navigator.canShare({ files: [file] })) {
                                    await navigator.share({
                                      files: [file],
                                      title: `Asset ${i+1}`
                                    });
                                  } else {
                                    window.open(img, '_blank');
                                  }
                                } catch (err) {
                                  window.open(img, '_blank');
                                }
                              }}
                              className="absolute bottom-3 right-3 p-2 bg-white/90 rounded-full shadow-lg border border-[#E5E1DA] text-[#C5A059] z-20"
                             >
                               <Download className="w-4 h-4" />
                             </button>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="px-4 lg:px-8 py-4 bg-white border-t border-[#E5E1DA] flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-[#C5A059]" />
                        <span className="text-[9px] lg:text-[10px] text-[#AAA] font-bold uppercase tracking-widest leading-tight text-center sm:text-left">
                          Proprietary Asset Extraction Engine v2.6 // Secure Connection Active
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-[#BBB] whitespace-nowrap">
                        {selectedImages.size} / {extractedData.images?.length} SELECTED
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="view-audit-trail"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 p-4 lg:p-8 overflow-y-auto custom-scrollbar"
              >
                <div className="flex items-center justify-between mb-6 lg:mb-8">
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-[#C5A059]" />
                    <h3 className="text-[10px] lg:text-[12px] font-bold text-[#1A1A1A] uppercase tracking-[0.4em]">Audit Trail</h3>
                  </div>
                </div>

                {/* Manual Entry Form */}
                <div className="mb-8 lg:mb-12">
                  <div className="p-5 lg:p-6 bg-white border border-[#E5E1DA] rounded-2xl lg:rounded-3xl shadow-sm">
                    <h4 className="text-[9px] lg:text-[10px] font-bold text-[#BBB] uppercase tracking-[0.2em] mb-4">Manual Log Entry</h4>
                    <form onSubmit={handleManualEntry} className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 px-5 py-2.5 bg-[#F9F8F6] border border-[#E5E1DA] rounded-full focus-within:border-[#C5A059] focus-within:bg-white transition-all">
                        <Globe className="w-4 h-4 text-[#AAA]" />
                        <input 
                          type="url"
                          value={manualUrl}
                          onChange={(e) => setManualUrl(e.target.value)}
                          placeholder="Enter URL to record..."
                          className="flex-1 bg-transparent text-[#1A1A1A] text-[12px] outline-none"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={isAddingManual || !manualUrl}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-black hover:bg-[#C5A059] disabled:opacity-50 text-white text-[10px] font-bold rounded-full transition-all uppercase tracking-widest shadow-lg"
                      >
                        {isAddingManual ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        RECORD URL
                      </button>
                    </form>
                    <p className="mt-3 text-[8px] lg:text-[9px] text-[#BBB] italic px-4 leading-tight">
                      * This records the intent in the audit trail before processing begins.
                    </p>
                  </div>
                </div>

                {/* Activity List */}
                <div>
                  <h4 className="text-[10px] font-bold text-[#BBB] uppercase tracking-[0.2em] mb-6 px-4">Activity Log</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {history.map((item) => (
                      <AuditTrailRow key={item.id} item={item} />
                    ))}
                    {history.length === 0 && (
                      <div className="h-[400px] flex flex-col items-center justify-center">
                        <History className="w-12 h-12 text-[#E5E1DA] mb-4" />
                        <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#CCC]">Log_Buffer_Empty</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Footer Status Bar */}
      <footer className="h-8 lg:h-10 bg-white border-t border-[#E5E1DA] flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.2 h-1.2 lg:w-1.5 lg:h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[8px] lg:text-[9px] text-[#AAA] font-bold tracking-widest uppercase">Online</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[8px] lg:text-[9px] text-[#BBB] font-bold uppercase tracking-widest">
            Profile: <span className={selectedImages.size > 0 ? "text-[#C5A059]" : ""}>{selectedImages.size > 0 ? `${selectedImages.size} OBJ` : "READY"}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-[8px] lg:text-[9px] text-[#BBB] font-bold uppercase tracking-widest truncate max-w-[150px] lg:max-w-none">
          {isExtracting ? 'DECODING_STREAM' : 'IDLE_WAIT'}
        </div>
      </footer>
    </div>
  );
};

const AuditTrailRow = ({ item }: { item: Extraction }) => {
  return (
    <div className="flex flex-col p-4 lg:p-6 bg-white border border-[#E5E1DA] rounded-2xl lg:rounded-3xl hover:border-[#C5A059] transition-all group shadow-sm hover:shadow-xl relative overflow-hidden">
      {(item as any).isManual && (
        <div className="absolute top-0 right-0 px-3 lg:px-4 py-0.5 lg:py-1 bg-[#C5A059] text-white text-[7px] lg:text-[8px] font-bold uppercase tracking-widest rounded-bl-xl shadow-sm">
          Manual
        </div>
      )}
      
      <div className="flex items-center justify-between gap-3 lg:gap-4 mb-4 lg:mb-6">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#F9F8F6] border border-[#E5E1DA] flex items-center justify-center flex-shrink-0 text-[#C5A059]">
            <Database className="w-4 h-4 lg:w-5 lg:h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] lg:text-[14px] font-bold text-[#1A1A1A] line-clamp-1">
              {item.title}
              {item.metadata?.devName && (
                <span className="text-[#C5A059] ml-1"> - {item.metadata.devName}</span>
              )}
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] lg:text-[10px] text-[#C5A059] font-bold uppercase tracking-wider truncate">
                  {item.agent || 'Unknown Agent'}
                </span>
                <span className="text-[8px] text-[#BBB] font-medium">•</span>
                <span className="text-[8px] text-[#BBB] font-medium italic">
                  Recorded by {item.userName || 'System'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-2 lg:p-2.5 rounded-full bg-[#F9F8F6] border border-[#E5E1DA] text-[#BBB] hover:text-[#C5A059] hover:border-[#C5A059] transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 pt-4 lg:pt-6 border-t border-[#F9F8F6]">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] lg:text-[9px] text-[#BBB] font-bold uppercase tracking-widest">Property ID</span>
          <span className="text-[10px] lg:text-[11px] text-[#1A1A1A] font-bold uppercase">{item.refNumber || '-'}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[8px] lg:text-[9px] text-[#BBB] font-bold uppercase tracking-widest">Sale Type</span>
          <span className="text-[10px] lg:text-[11px] text-[#C5A059] font-bold uppercase">{item.saleType || 'N/A'}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[8px] lg:text-[9px] text-[#BBB] font-bold uppercase tracking-widest">Agent</span>
          <span className="text-[10px] lg:text-[11px] text-[#1A1A1A] font-bold uppercase truncate">{item.agent || 'N/A'}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[8px] lg:text-[9px] text-[#BBB] font-bold uppercase tracking-widest">Timestamp</span>
          <span className="text-[10px] lg:text-[11px] text-[#1A1A1A] font-bold">
            {item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'PENDING'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PropertyExtractorPro;

