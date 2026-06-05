import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image-more';
import { db, auth, storage, handleFirestoreError, OperationType, UserProfile, Discount, UsageLog, DBCompany, BlogPost, FinanceTransaction, SiteImage } from '../firebase';
import { initializeApp, getApp } from 'firebase/app';
import { collection, onSnapshot, query, where, doc, setDoc, updateDoc, deleteDoc, addDoc, serverTimestamp, getDoc, orderBy, limit, getFirestore, getDocs } from 'firebase/firestore';
import { ref, uploadString, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Users, User, History, Edit2, CheckCircle, Loader2, ArrowLeft, Sparkles, Database, Upload, Download, LogOut, Trash2, AlertCircle, Settings, Plus, X, FileText, FileDown, ShieldCheck, DollarSign, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ArrowLeftRight, Search, ArrowDownLeft, ArrowUpRight, ChevronDown, ChevronUp, Copy, ExternalLink, Image as ImageIcon, Wrench, Layers, Shield, Info, Briefcase, Globe, RefreshCw } from 'lucide-react';
import { migrateData } from '../services/migrationService';
import { getBusinessInfo, saveBusinessInfo } from '../services/businessService';
import { BusinessInfo } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';
import PropertyExtractorPro from './PropertyExtractorPro';

interface DashboardProps {
  userProfile: UserProfile;
  onBack: () => void;
  onImpersonate?: (profile: UserProfile) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-TH', { 
    style: 'currency', 
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const convertToWebP = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(img.src);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert to WebP: Blob is null'));
          }
        }, 'image/webp', 0.8);
      } catch (err) {
        URL.revokeObjectURL(img.src);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image for conversion'));
    };
    img.src = URL.createObjectURL(file);
  });
};

const ReportDocument = React.forwardRef<HTMLDivElement, any>(({ 
  selectedIndividualAgent, 
  reportYearFilter, 
  financeSubTab, 
  uniqueEmployees, 
  getIndividualAgentReport,
  getCompanyInfo,
  formatCurrency,
  isPreview = false
}, ref) => {
  if (!selectedIndividualAgent) {
    return (
      <div ref={ref} className="bg-white p-12 min-h-[297mm] w-full max-w-[210mm] mx-auto font-sans text-black flex flex-col items-center justify-center text-black/20 space-y-4">
        <FileText className="w-20 h-20" />
        <p className="text-xl font-serif italic">Please select an employee to generate report</p>
      </div>
    );
  }

  const emp = uniqueEmployees.find(e => {
    const fullName = `${e.firstName} ${e.lastName}`.toLowerCase().trim();
    const displayName = (e.name || `${e.firstName} ${e.lastName}`).toLowerCase().trim();
    const target = selectedIndividualAgent.toLowerCase().trim();
    return displayName === target || fullName === target || (e.nickname && e.nickname.toLowerCase().trim() === target);
  });
  const companyInfo = getCompanyInfo(emp?.company || (financeSubTab.startsWith('ABPC') ? 'Alan Bolton Property Consultants' : 'East Coast Real Estate'), emp?.companyId);
  const allTimeReport = getIndividualAgentReport(selectedIndividualAgent, 'all');
  const totalIncome = allTimeReport.reduce((acc, curr) => acc + curr.income, 0);
  
  const getStats = (monthsCount: number) => {
    const slice = allTimeReport.slice(0, monthsCount);
    const total = slice.reduce((acc, curr) => acc + curr.income, 0);
    const avg = slice.length > 0 ? total / slice.length : 0;
    return { total, avg };
  };
  
  const stats3m = getStats(3);
  const stats6m = getStats(6);
  const stats12m = getStats(12);
  
  const yearlyTotals = allTimeReport.reduce((acc: {[key: string]: number}, curr) => {
    const year = curr.month.substring(0, 4);
    acc[year] = (acc[year] || 0) + curr.income;
    return acc;
  }, {});

  return (
    <div ref={ref} className={`bg-white p-10 font-sans text-black ${isPreview ? 'shadow-2xl' : 'rounded-none shadow-none'} min-h-[297mm] w-full max-w-[210mm] mx-auto`}>
      <div className="space-y-8">
        {/* Branded Header */}
        <div className="flex justify-between items-start border-b-2 border-black/5 pb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 flex items-center justify-center overflow-hidden bg-white">
              {companyInfo.logo ? (
                <img src={companyInfo.logo} alt="Company Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className={`w-full h-full ${companyInfo.color} flex items-center justify-center text-white font-bold text-xl`}>
                  {companyInfo.shorthand}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold tracking-tight">
                {companyInfo.name.includes('Alan Bolton') ? 'Alan Bolton' : 'East Coast'}
              </h2>
              <p className="text-[10px] text-black/40 uppercase tracking-[0.2em] font-bold">
                {companyInfo.name.includes('Alan Bolton') ? 'Property Consultants' : 'Real Estate'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-serif italic text-black/80">Monthly Report</h1>
            <div className="mt-2 space-y-1">
              <p className="text-[9px] text-black/40 uppercase tracking-widest font-bold">Generated On</p>
              <p className="text-xs font-medium">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              {reportYearFilter !== 'all' && (
                <p className="text-[10px] font-bold text-gold bg-gold/5 px-2 py-0.5 rounded inline-block mt-1">YEAR: {reportYearFilter}</p>
              )}
            </div>
          </div>
        </div>

        {/* Employee Details Section */}
        <div className="grid grid-cols-[120px_1fr] gap-8 items-start">
          <div className="space-y-3">
            <div className="aspect-square rounded-xl bg-black/5 border border-black/5 overflow-hidden flex items-center justify-center relative group">
              {emp?.profileImage ? (
                <img src={emp.profileImage} alt={selectedIndividualAgent} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-10 h-10 text-black/20" />
              )}
            </div>
            <div className="text-center">
              <p className="text-[9px] text-black/40 uppercase tracking-widest font-bold mb-0.5">Employee ID</p>
              <p className="text-xs font-mono font-bold">{emp?.employeeId || 'EMP-000'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-6">
            <div className="space-y-0.5">
              <p className="text-[9px] text-black/40 uppercase tracking-widest font-bold">Full Name</p>
              <p className="text-sm font-serif font-medium">{emp?.firstName} {emp?.lastName}</p>
              {emp?.nickname && <p className="text-[10px] text-gold italic">"{emp.nickname}"</p>}
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-black/40 uppercase tracking-widest font-bold">Position</p>
              <p className="text-sm font-medium">{emp?.position || 'Sales Agent'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-black/40 uppercase tracking-widest font-bold">Email Address</p>
              <p className="text-[11px] border-b border-black/5 pb-0.5">{emp?.email}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-black/40 uppercase tracking-widest font-bold">Contact Number</p>
              <p className="text-[11px] border-b border-black/5 pb-0.5">{emp?.mobile || 'N/A'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-black/40 uppercase tracking-widest font-bold">Employed Since</p>
              <p className="text-[11px]">{emp?.employedFrom ? new Date(emp.employedFrom).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-black/40 uppercase tracking-widest font-bold">Preferred Language</p>
              <p className="text-[11px]">{emp?.preferredLanguage || 'English'}</p>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="space-y-8">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-black text-white p-4 rounded-xl shadow-lg shadow-black/10">
              <p className="text-[8px] text-white/40 uppercase tracking-widest font-bold mb-1">Total All-Time</p>
              <p className="text-lg font-bold font-mono whitespace-nowrap">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-white border border-black/5 p-4 rounded-xl">
              <p className="text-[8px] text-black/40 uppercase tracking-widest font-bold mb-1">3 Month Avg</p>
              <p className="text-base font-bold font-mono whitespace-nowrap">{formatCurrency(stats3m.avg)}</p>
              <p className="text-[8px] text-black/30 mt-0.5 italic">Total: {formatCurrency(stats3m.total)}</p>
            </div>
            <div className="bg-white border border-black/5 p-4 rounded-xl">
              <p className="text-[8px] text-black/40 uppercase tracking-widest font-bold mb-1">6 Month Avg</p>
              <p className="text-base font-bold font-mono whitespace-nowrap">{formatCurrency(stats6m.avg)}</p>
              <p className="text-[8px] text-black/30 mt-0.5 italic">Total: {formatCurrency(stats6m.total)}</p>
            </div>
            <div className="bg-white border border-black/5 p-4 rounded-xl">
              <p className="text-[8px] text-black/40 uppercase tracking-widest font-bold mb-1">12 Month Avg</p>
              <p className="text-base font-bold font-mono whitespace-nowrap">{formatCurrency(stats12m.avg)}</p>
              <p className="text-[8px] text-black/30 mt-0.5 italic">Total: {formatCurrency(stats12m.total)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/30 border-b border-black/5 pb-1.5">Yearly Performance</h3>
            <div className="grid grid-cols-6 gap-2">
              {Object.entries(yearlyTotals).sort((a, b) => b[0].localeCompare(a[0])).map(([year, total]) => (
                <div key={year} className="bg-black/[0.02] p-2 rounded-lg border border-black/5">
                  <p className="text-[8px] font-bold text-gold mb-0.5">{year}</p>
                  <p className="text-[10px] font-bold font-mono whitespace-nowrap">{formatCurrency(total)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/30 border-b border-black/5 pb-1.5">Monthly Breakdown</h3>
            <div className="overflow-hidden rounded-xl border border-black/5">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="px-3 py-2 text-[8px] uppercase tracking-widest font-bold">Month / Year</th>
                    <th className="px-3 py-2 text-[8px] uppercase tracking-widest font-bold text-right">Total Income</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {getIndividualAgentReport(selectedIndividualAgent, reportYearFilter).map((item, idx) => (
                    <tr key={item.month} className={idx % 2 === 0 ? 'bg-white' : 'bg-black/[0.01]'}>
                      <td className="px-3 py-1.5 text-[10px] font-medium">
                        {new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-3 py-1.5 text-[10px] font-bold text-right font-mono">
                        {formatCurrency(item.income)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-12 border-t border-black/5 flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[8px] text-black/30 uppercase tracking-widest font-bold">Confidential Report</p>
            <p className="text-[10px] text-black/40">© {new Date().getFullYear()} {financeSubTab.startsWith('ABPC') ? 'Alan Bolton Property Consultants' : 'East Coast Real Estate'}</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-black/30 uppercase tracking-widest font-bold mb-2">Authorized Signature</p>
            <div className="w-48 h-px bg-black/20 ml-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function Dashboard({ userProfile, onBack, onImpersonate }: DashboardProps) {
  const hasRole = (role: string) => userProfile.roles?.includes(role as any) || (userProfile as any).role === role;
  const isImpersonating = auth.currentUser && userProfile.uid !== auth.currentUser.uid;

  const [activeTab, setActiveTab] = useState<'employees' | 'logs' | 'companies' | 'profile' | 'blog' | 'finance' | 'settings' | 'tools'>(
    hasRole('admin') ? 'employees' : 
    hasRole('accounts') ? 'finance' : 'profile'
  );
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [companies, setCompanies] = useState<DBCompany[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>([]);
  const [siteImages, setSiteImages] = useState<SiteImage[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [personalProfile, setPersonalProfile] = useState<Partial<UserProfile>>(userProfile);
  const [loading, setLoading] = useState(true);
  const [pattayaLogs, setPattayaLogs] = useState<UsageLog[]>([]);
  const [cajunLogs, setCajunLogs] = useState<UsageLog[]>([]);
  const [pattayaError, setPattayaError] = useState<string | null>(null);
  const [cajunError, setCajunError] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<'ALL' | 'SHANE' | 'RENT A CAR' | 'CAJUN'>('ALL');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPersonalProfile, setSavingPersonalProfile] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Finance states
  const [financeSubTab, setFinanceSubTab] = useState<'ABPC' | 'ECRE' | 'ABPC Agents' | 'ECRE Agents' | 'ABPC Reports' | 'ECRE Reports'>(
    userProfile.company === 'East Coast Real Estate' ? 'ECRE' : 'ABPC'
  );
  const [selectedIndividualAgent, setSelectedIndividualAgent] = useState<string>('');
  const [reportYearFilter, setReportYearFilter] = useState<string>('all');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [isFinanceExpanded, setIsFinanceExpanded] = useState(hasRole('accounts') && !hasRole('admin'));
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const [confirmDeleteTransaction, setConfirmDeleteTransaction] = useState<FinanceTransaction | null>(null);
  const [financeMonthFilter, setFinanceMonthFilter] = useState<string>('all');
  const [financeYearFilter, setFinanceYearFilter] = useState<string>('all');
  const [financeAgentFilter, setFinanceAgentFilter] = useState<string>('all');
  const [financeAccountFilter, setFinanceAccountFilter] = useState<string>('trading');
  const [financeTypeFilter, setFinanceTypeFilter] = useState<string>('all');
  const [financeSearchTerm, setFinanceSearchTerm] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);

  // Reset filters when sub-tab changes
  useEffect(() => {
    setFinanceAgentFilter('all');
    setFinanceMonthFilter('all');
    setFinanceYearFilter('all');
    setFinanceSearchTerm('');
    setSelectedIndividualAgent('');
  }, [financeSubTab]);

  const [newTransaction, setNewTransaction] = useState<Partial<FinanceTransaction> & { fromAccount?: 'trading' | 'savings', toAccount?: 'trading' | 'savings' }>({
    type: 'income',
    dealType: 'new',
    account: 'trading',
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    agent: '-'
  });

  // Search and Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'last-active'>('newest');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Form states
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<UserProfile | null>(null);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Partial<DBCompany> | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [empSeedStatus, setEmpSeedStatus] = useState<'idle' | 'confirming' | 'success' | 'error'>('idle');
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [isSeedingDiscounts, setIsSeedingDiscounts] = useState(false);
  const [discSeedStatus, setDiscSeedStatus] = useState<'idle' | 'confirming' | 'success' | 'error'>('idle');
  const [isSeedingCompanies, setIsSeedingCompanies] = useState(false);
  const [compSeedStatus, setCompSeedStatus] = useState<'idle' | 'confirming' | 'success' | 'error'>('idle');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showABPCMapping, setShowABPCMapping] = useState(false);
  const [pendingABPCData, setPendingABPCData] = useState<any[]>([]);
  const [uniqueABPCAgents, setUniqueABPCAgents] = useState<string[]>([]);
  const [agentMapping, setAgentMapping] = useState<Record<string, string>>({});
  const [isImportingABPC, setIsImportingABPC] = useState(false);

  const [showEditBlog, setShowEditBlog] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Partial<BlogPost> | null>(null);
  const [isSavingBlog, setIsSavingBlog] = useState(false);
  const [isStandardizing, setIsStandardizing] = useState(false);

  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: 'employee' | 'company', name: string } | null>(null);

  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'privacy'>('general');
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);
  const [toolsSubTab, setToolsSubTab] = useState<'extractor-pro' | 'general'>('extractor-pro');

  // Export Preview states
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [exportPreviewData, setExportPreviewData] = useState<any[]>([]);
  const [exportPreviewTitle, setExportPreviewTitle] = useState('');
  const [exportPreviewFileName, setExportPreviewFileName] = useState('');
  const [isExportingFromPreview, setIsExportingFromPreview] = useState(false);
  const [isCompanyDistributionExpanded, setIsCompanyDistributionExpanded] = useState(false);

  // PDF Preview states
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState('');
  const previewReportRef = useRef<HTMLDivElement>(null);

  const COMPANY_DATA: Record<string, { logo: string, shorthand: string, color: string }> = {
    "Cajun Life Cafe": { logo: "https://picsum.photos/seed/cajun/100/100", shorthand: "CLC", color: "bg-orange-500" },
    "Hemingways Lakeside": { logo: "https://picsum.photos/seed/lake/100/100", shorthand: "HL", color: "bg-blue-500" },
    "Hemingways Jomtien": { logo: "https://picsum.photos/seed/jomtien/100/100", shorthand: "HJ", color: "bg-teal-500" },
    "Hemingways Pattaya": { logo: "https://picsum.photos/seed/pattaya/100/100", shorthand: "HP", color: "bg-cyan-500" },
    "Pattaya Rent a Car": { logo: "https://picsum.photos/seed/car/100/100", shorthand: "PRC", color: "bg-red-500" },
    "Alan Bolton Property Consultants": { logo: "https://picsum.photos/seed/property/100/100", shorthand: "AB", color: "bg-indigo-500" },
    "East Coast Real Estate": { logo: "https://picsum.photos/seed/east/100/100", shorthand: "EC", color: "bg-emerald-500" }
  };

  const getLogoSrc = (logo: string | undefined) => {
    if (!logo) return "https://picsum.photos/seed/generic/100/100";
    const trimmed = logo.trim();
    if (trimmed.startsWith('data:')) return trimmed.replace(/\s/g, '');
    if (trimmed.startsWith('http')) return trimmed;
    return `/${trimmed}`;
  };

  const getUrlHref = (url: string | undefined) => {
    if (!url) return undefined;
    const trimmed = url.trim();
    if (trimmed === '' || trimmed === '#') return undefined;
    if (trimmed.startsWith('http')) return trimmed;
    return `https://${trimmed}`;
  };

  const getCompanyInfo = (companyName: string, companyId?: string) => {
    if (companyId) {
      const company = companies.find(c => c.id === companyId);
      if (company) {
        return { 
          name: company.name,
          logo: getLogoSrc(company.logo), 
          shorthand: company.name.split(' ').map(w => w[0]).join('').toUpperCase(), 
          color: "bg-white" 
        };
      }
    }
    const company = companies.find(c => c.name === companyName);
    if (company) {
      return { 
        name: company.name,
        logo: getLogoSrc(company.logo), 
        shorthand: company.name.split(' ').map(w => w[0]).join('').toUpperCase(), 
        color: "bg-white" 
      };
    }
    const info = COMPANY_DATA[companyName];
    if (info) {
      return { ...info, name: companyName, logo: getLogoSrc(info.logo) };
    }
    return { name: companyName, logo: "https://picsum.photos/seed/generic/100/100", shorthand: "??", color: "bg-gray-400" };
  };

  const initialEmployees = [
    { firstName: "Shane", lastName: "Ruddle", email: "shaneruddle@gmail.com", roles: ["admin", "accounts", "manager"], uid: "1738205631116x904859022843725700" },
    { firstName: "Phinthip", lastName: "Suphaphon", email: "suphaphon8484@gmail.com", roles: ["employee"], company: "Pattaya Rent a Car", position: "Manager", mobile: "088-445-1577", uid: "1738212581168x222718087382245860" },
    { firstName: "Irina", lastName: "Breslavtseva", email: "irina.breslavtseva1987@gmail.com", roles: ["employee"], company: "Alan Bolton Property Consultants", position: "Sales Agent", mobile: "086-754-5850", uid: "1738213561205x839566948050539300" },
    { firstName: "Robert", lastName: "Cameron", email: "ractdi@me.com", roles: ["manager", "accounts"], company: "Hemingways Jomtien", position: "Manager", mobile: "083-792-2379", uid: "1738214615807x539816467958273800" },
    { firstName: "Gavin", lastName: "Perfect", email: "gav.perfect@gmail.com", roles: ["employee"], company: "Hemingways Jomtien", position: "Partner", mobile: "081-761-3238", uid: "1738215293020x963636533625276200" },
    { firstName: "Chris", lastName: "Brett", email: "nirun1109@gmail.com", roles: ["employee"], company: "Hemingways Jomtien", position: "Partner", mobile: "06", uid: "1738240744070x213581431522885440" },
    { firstName: "Linda", lastName: "Perfect", email: "lindaperfect@uwclub.net", roles: ["employee"], company: "Hemingways Jomtien", mobile: "0", uid: "1738246339747x980521358119640300" },
    { firstName: "Waraporn", lastName: "Perfect", email: "george.dao1991@gmail.com", roles: ["employee"], company: "Hemingways Jomtien", mobile: "8", uid: "1738291651405x322553869001737800" },
    { firstName: "Shane", lastName: "Ruddle", email: "info@cajunlifecafe.com", roles: ["admin"], company: "Cajun Life Cafe", position: "Partner", uid: "1738300537896x320007663338649000" },
    { firstName: "Paola", lastName: "Pastacaldi", email: "paoolam@live.fr", roles: ["employee"], company: "Cajun Life Cafe", position: "Manager", mobile: "098", uid: "1738302108130x423377338011485100" },
    { firstName: "Lewis", lastName: "Perfect", email: "perfectlewisashton@gmail.com", roles: ["employee"], company: "Hemingways Jomtien", mobile: "007", uid: "1738490718350x851705520968406400" },
    { firstName: "Chutikarn", lastName: "Phetcharoen", email: "jusfirstchutikarn@gmail.com", roles: ["employee"], company: "Alan Bolton Property Consultants", mobile: "009", uid: "1743649995469x635691858452828200" },
    { firstName: "Shane", lastName: "Puddle", email: "info@pattayarentacar.com", roles: ["employee"], company: "Pattaya Rent a Car", mobile: "0830776928", uid: "1754096406865x512038928260660800" },
    { firstName: "Noel", lastName: "Magold", nickname: "Noel", email: "noel.magold@gmail.com", roles: ["employee"], company: "East Coast Real Estate", position: "Management", mobile: "0950247546", uid: "1754730171383x441187517623218050" },
    { firstName: "Aiden Scott", lastName: "Gray", nickname: "Aiden", email: "aidenscottgray@gmail.com", roles: ["employee"], company: "East Coast Real Estate", position: "Real Estate Agent", mobile: "0923879169", uid: "1756263259346x562607146057934900" },
    { firstName: "Jo", lastName: "Barbosa", email: "jobarbosa5555@gmail.com", roles: ["employee"], company: "Alan Bolton Property Consultants", position: "Real Estate Agent", mobile: "0613903936", uid: "1756263281490x915847737785749200" },
    { firstName: "Arnon", lastName: "Surison", nickname: "Cap", email: "arnonsurison@gmail.com", roles: ["employee"], company: "East Coast Real Estate", position: "Real Estate Agent", mobile: "0979247477", uid: "1756263288531x762119080127496000" },
    { firstName: "Lee", lastName: "Knights", email: "knightslee983@gmail.com", roles: ["employee"], company: "Alan Bolton Property Consultants", position: "Senior Sales Agent", mobile: "+66 096287916", uid: "1756263332719x951012836427739500" },
    { firstName: "Management", lastName: "Pot", nickname: "MP", email: "managementpot@gmail.com", roles: ["employee"], company: "East Coast Real Estate", position: "Management", uid: "1756263332719x951012836427739501" },
    { firstName: "Panida", lastName: "Tongwinya", email: "panida220131@gmail.com", roles: ["employee"], company: "Alan Bolton Property Consultants", position: "Real Estate Agent", mobile: "0942241929", uid: "1756263336304x625006180080648100" },
    { firstName: "Sajiga", lastName: "Suwan", email: "beau_jung@msn.com", roles: ["employee"], company: "Alan Bolton Property Consultants", position: "Real Estate Agent", mobile: "0983297886", uid: "1756263366590x959412417623900300" },
    { firstName: "Oranoot", lastName: "Totong", nickname: "Pang", email: "par_ok11@hotmail.com", roles: ["employee"], company: "East Coast Real Estate", position: "Management team", mobile: "0924554498", uid: "1756263594664x877842564163702300" },
    { firstName: "Alex", lastName: "Stein", email: "alexstein530@gmail.com", roles: ["employee"], company: "Alan Bolton Property Consultants", position: "Manager", mobile: "0614701505", uid: "1756263672131x259238773781960350" },
    { firstName: "Supich", lastName: "Limpkul", email: "supich0632049020@gmail.com", roles: ["employee"], company: "East Coast Real Estate", mobile: "0632049020", uid: "1756264011757x839849911564250000" },
    { firstName: "Aunt", lastName: "Srisawat", nickname: "Aunt", email: "auntamp1502@gmail.com", roles: ["employee"], company: "East Coast Real Estate", position: "Real Estate Agent", mobile: "0918892331", uid: "1756264032695x733195673910481700" },
    { firstName: "Kanokporn", lastName: "Piromsuksakul", email: "kanokporn.1999@gmail.com", roles: ["employee"], company: "East Coast Real Estate", position: "Real Estate Agent", mobile: "0994540194", uid: "1756264410126x242009150200741980" },
    { firstName: "Vee", lastName: "Samdangfai", email: "vthailander322@gmail.com", roles: ["employee"], company: "Alan Bolton Property Consultants", position: "Real Estate Agent", mobile: "0897531783", uid: "1756268451972x807974387457137600" },
    { firstName: "Amornrat", lastName: "Khongpennit", email: "annbtk789@gmail.com", roles: ["employee"], company: "Alan Bolton Property Consultants", position: "Office Manager", mobile: "0646232956", uid: "1756268572517x514449734029142300" },
    { firstName: "Frederic", lastName: "von Keller Szepesi", email: "fredericvonkeller@gmail.com", roles: ["employee"], company: "Hemingways Lakeside", position: "Fred", mobile: "+66645401483", uid: "1756271584315x737558423889835600" },
    { firstName: "Nalee", lastName: "Munsters", email: "nalisa1985@hotmail.com", roles: ["employee"], company: "Hemingways Jomtien", position: "Manager", mobile: "0821641500", uid: "1756286355453x589421305831364600" },
    { firstName: "Siriprapha", lastName: "Misim", email: "jinxingyea@gmail.com", roles: ["employee"], company: "Hemingways Jomtien", mobile: "0800299529", uid: "1756286368553x991741457464602600" },
    { firstName: "Napaporn", lastName: "Puntee", email: "napapornpuntee@gmail.com", roles: ["employee"], company: "Hemingways Jomtien", mobile: "0888707099", uid: "1756288122521x180957553812111100" },
    { firstName: "Jonathon", lastName: "Levy", email: "jonathonedwardlxvy@gmail.com", roles: ["employee"], company: "Pattaya Rent a Car", mobile: "0615656942", uid: "1756288283985x444297866225356500" },
    { firstName: "Nangnoi", lastName: "Thamniyom", email: "pattaya53761@gmail.com", roles: ["employee"], company: "Hemingways Jomtien", position: "Head Cashier", mobile: "0950620222", uid: "1756288314545x362582933400462460" },
    { firstName: "Patsarapron", lastName: "Frongsieng", email: "a0ypatsarapron@gmaill.com", roles: ["employee"], company: "Hemingways Jomtien", mobile: "0923214689", uid: "1756288810602x771229014759674400" },
    { firstName: "Warisara", lastName: "Phiongoen", email: "numaoywrisara1995@gmail.com", roles: ["employee"], company: "Hemingways Jomtien", mobile: "0922911525", uid: "1756288931681x839066566400483700" },
    { firstName: "Sorasak", lastName: "Wongsaket", email: "sorasuk77@gmail.com", roles: ["employee"], company: "Hemingways Jomtien", mobile: "0843766074", uid: "1756289848887x313850991691934340" },
    { firstName: "Thanyalak", lastName: "Aran", email: "tanyalak1991@hotmail.com", roles: ["employee"], company: "Hemingways Jomtien", mobile: "0984048514", uid: "1756292057951x859281302957366700" },
    { firstName: "Jamroonsri", lastName: "Yangnoi", email: "jamroonsri17@gmail.com", roles: ["employee"], company: "Hemingways Jomtien", mobile: "0879079969", uid: "1756298435434x820512233706869100" },
    { firstName: "Warida", lastName: "Pasawanang", email: "warida1809@gmail.com", roles: ["employee"], company: "Hemingways Lakeside", mobile: "0943593966", uid: "1756308453195x534339594871870800" },
    { firstName: "Ms.Tawan", lastName: "Majaroen", email: "tawanmajaroen42@gmail.com", roles: ["employee"], company: "Hemingways Lakeside", position: "Manager", mobile: "0934725347", uid: "1756339660536x785526488596316300" },
    { firstName: "Rob", lastName: "Tomlin", email: "robptomlin@gmail.com", roles: ["employee"], company: "Hemingways Jomtien", position: "Partner", mobile: "+61434171483", uid: "1756340176674x285218234087396560" },
    { firstName: "Ms.Kanjana", lastName: "inchamnan", email: "namtanaajj91@gmail.com", roles: ["employee"], company: "Hemingways Lakeside", position: "Helper", mobile: "0944587063", uid: "1756347060950x733895328116686800" },
    { firstName: "Ms.Ployphailin", lastName: "Thimaping", email: "namfon.luma@gmail.com", roles: ["employee"], company: "Hemingways Lakeside", mobile: "0969093907", uid: "1756349232145x298334947592502800" },
    { firstName: "Somchay", lastName: "Saipan", email: "somchay.it@gmail.com", roles: ["employee"], company: "Hemingways Jomtien", mobile: "0983107366", uid: "1756363241916x646254621671369000" },
    { firstName: "Thanawat", lastName: "Srijanngam", email: "luciokung@hotmail.com", roles: ["employee"], company: "Hemingways Jomtien", mobile: "0917101093", uid: "1756363287953x662873641002042000" },
    { firstName: "Leon", lastName: "Weightman", email: "weightman17@googlemail.com", roles: ["employee"], company: "Hemingways Pattaya", position: "Partner", mobile: "07931961800", uid: "1756364559073x521162911720893800" },
    { firstName: "Sangthong", lastName: "Nongnut", email: "khun.ying32@gmail.com", roles: ["employee"], company: "Hemingways Jomtien", mobile: "0926687817", uid: "1756452778234x285483836816500930" },
    { firstName: "Thepharak", lastName: "Somboon", email: "thepharaksomboon@gmail.com", roles: ["employee"], company: "Pattaya Rent a Car", mobile: "0861450121", uid: "1756788660413x445722180121408830" },
    { firstName: "Patsorn", lastName: "Phonrachom", email: "eanarak8888@gmail.com", roles: ["employee"], mobile: "0927645776", uid: "1756797352676x904919519560570100" },
    { firstName: "sommai", lastName: "keawchan", email: "somaii0510@gmail.com", roles: ["employee"], company: "Hemingways Jomtien", position: "Supervisor", mobile: "098t813571", uid: "1756797467530x249119940572800420" },
    { firstName: "Khanittha", lastName: "Soranet", email: "skywatersoranet@gmail.com", roles: ["employee"], company: "Hemingways Pattaya", mobile: "0983969629", uid: "1756828586616x513005560142739700" },
    { firstName: "Nigel", lastName: "Flanagan", email: "nigelflap@msn.com", roles: ["employee"], mobile: "0811165146", uid: "1756883960619x675842814246387100" },
    { firstName: "Akanittha", lastName: "Suriyawong", email: "akanittha1990@gmail.com", roles: ["employee"], company: "Cajun Life Cafe", position: "service", mobile: "+66935799611", uid: "1756904185743x244983017544803780" },
    { firstName: "Scott", lastName: "Smith", nickname: "Scott", email: "scottsmithcall89@gmail.com", roles: ["employee"], company: "East Coast Real Estate", mobile: "0610737568", uid: "1762229321453x250879529230273020" },
    { firstName: "Sho", lastName: "", nickname: "Sho", email: "sho@noemail.com", roles: ["employee"], company: "East Coast Real Estate", position: "Real Estate Agent", mobile: "-", uid: "1762229321453x250879529230273021" },
    { firstName: "Rattiya", lastName: "Suedej", email: "rattiyasuedej@gmail.com", roles: ["employee"], position: "Not an employee", mobile: "0984721683", uid: "1763547261844x102058649974796640" },
    { firstName: "Porntip", lastName: "Van Vliet", email: "tipvlie999@gmail.com", roles: ["employee"], company: "Alan Bolton Property Consultants", position: "Real Estate Professional", mobile: "0890127205", uid: "1764741492760x819100824946806800" },
    { firstName: "Annipa", lastName: "Phasawat", nickname: "Anni", email: "roselovelyno1@gmail.com", roles: ["employee"], company: "East Coast Real Estate", position: "Real Estate Agent", mobile: "0845674066", uid: "1765533220686x121275735073274720" },
    { firstName: "Sangthong", lastName: "Nongnut", email: "khunying32@gmail.com", roles: ["employee"], position: "Not an employee", mobile: "092-668-7817", uid: "1765537326758x574896350378373300" },
    { firstName: "Chonlatee", lastName: "Seema", email: "iam.chonlatee@gmail.com", roles: ["admin"], company: "Cajun Life Cafe", mobile: "0808032832", uid: "1767753686962x907925546658813800" },
    { firstName: "Ms.Suphatson", lastName: "Promjan", email: "-@gmail.com", roles: ["employee"], company: "Cajun Life Cafe", position: "Ass. Manager", mobile: "-", uid: "1769235201148x300813861270191600" },
    { firstName: "Ms.Rungnapa", lastName: "Aritit", email: "--@gmail.com", roles: ["employee"], company: "Cajun Life Cafe", position: "service", mobile: "-", uid: "1769244928700x243422525857856160" },
    { firstName: "Ms.Wannakon", lastName: "Kirisee", email: "---@gmail.com", roles: ["employee"], company: "Cajun Life Cafe", position: "Service", mobile: "-", uid: "1769245573895x530969906960634600" },
    { firstName: "Mr.Jetsada", lastName: "Muaddee", email: "----@gmail.com", roles: ["employee"], company: "Cajun Life Cafe", position: "Service", mobile: "-", uid: "1769245807475x378018135647546500" },
    { firstName: "Ms.Pharpilai", lastName: "Meeoatman", email: "-----@gmail.com", roles: ["employee"], company: "Cajun Life Cafe", position: "Service", mobile: "-", uid: "1769246155454x752079501919451000" },
    { firstName: "Ms.Oranong", lastName: "Sullivan", email: "------@gmail.com", roles: ["employee"], company: "Cajun Life Cafe", position: "Service", mobile: "-", uid: "1769246348566x369676230000030300" },
    { firstName: "Worawut", lastName: "Meeklin", email: "-------@gmail.com", roles: ["employee"], company: "Cajun Life Cafe", position: "Driver", mobile: "-", uid: "1769246449384x303996918730429000" },
    { firstName: "Ms.Janthima", lastName: "Butthong", email: "--------@gmail.com", roles: ["employee"], company: "Cajun Life Cafe", position: "Head Bar", mobile: "-", uid: "1769247047016x828735216147769900" },
    { firstName: "Ms.Jantana", lastName: "Sukdoung", email: "---------@gmail.com", roles: ["employee"], company: "Cajun Life Cafe", position: "Bartender", mobile: "-", uid: "1769247195505x734866205018978700" },
    { firstName: "Kronwikar", lastName: "Kraeduangngam", email: "-1@gmail.com", roles: ["employee"], company: "Cajun Life Cafe", position: "Bartender", mobile: "-", uid: "1769247341608x995342744987759500" },
    { firstName: "Chonlatee", lastName: "Seema", email: "--1@gmail.com", roles: ["employee"], company: "Cajun Life Cafe", position: "Head chef", mobile: "-", uid: "1769247487156x458257946035409700" },
    { firstName: "Naing Naing Aung", lastName: "", email: "-01@gmail.com", roles: ["employee"], company: "Cajun Life Cafe", position: "Cook", mobile: "-", uid: "1769247668590x453878942930850750" },
    { firstName: "Mr.Nattakorn", lastName: "Raiphimai", email: "-02@gmil.com", roles: ["employee"], company: "Cajun Life Cafe", position: "Cook", mobile: "-", uid: "1769247954287x592895641660265300" },
    { firstName: "Ms.Thidarat", lastName: "Hirankerd", email: "-03@gmail.com", roles: ["employee"], company: "Cajun Life Cafe", position: "Helper", mobile: "-", uid: "1769248165139x279291823594765020" },
    { firstName: "Jaruwan", lastName: "Sikanin", email: "-04@gmail.com", roles: ["employee"], company: "Cajun Life Cafe", position: "Helper", mobile: "-", uid: "1769248286850x599412748517665300" },
    { firstName: "Ms.Bang- On", lastName: "Honfghachat", email: "-05@gmail.com", roles: ["employee"], company: "Cajun Life Cafe", position: "helper", mobile: "-", uid: "1769248432325x706873459867654500" },
    { firstName: "Talay (Part time)", lastName: "", email: "-07@gmail.com", roles: ["employee"], company: "Cajun Life Cafe", position: "Cook", mobile: "-", uid: "1769248554558x452137438511340160" },
    { firstName: "Aye (Part Time)", lastName: "", email: "-08@gmail.com", roles: ["employee"], company: "Cajun Life Cafe", position: "Helper", mobile: "-", uid: "1769248650932x815833989269641000" },
    { firstName: "Ms.Thidarat", lastName: "kaisang", email: "-010@gmail.com", roles: ["employee"], company: "Cajun Life Cafe", position: "Cashier", mobile: "-", uid: "1769250319556x645002604944655500" },
    { firstName: "Mr.Trairat", lastName: "Mungkung", email: "01@gmail.com", roles: ["employee"], company: "Hemingways Lakeside", position: "Eurpean Chef", mobile: "-", uid: "1769312422852x637976922578144000" },
    { firstName: "Mr.Chiraphat", lastName: "Mitsaeng", email: "03@gmail.com", roles: ["employee"], company: "Hemingways Lakeside", position: "Helper", mobile: "-", uid: "1769312624036x766143065385680300" },
    { firstName: "Ms.Nantiya", lastName: "Smith", email: "04@gmail.com", roles: ["employee"], company: "Hemingways Lakeside", position: "Maid", mobile: "-", uid: "1769312770593x854157154955296600" },
    { firstName: "Ms.Sunita", lastName: "Ketthong", email: "05@gmail.com", roles: ["employee"], company: "Hemingways Lakeside", position: "Cashier", mobile: "-", uid: "1769313033978x456741043882770800" },
    { firstName: "Nuthida", lastName: "Jobsri", email: "06@gmail.com", roles: ["employee"], company: "Hemingways Lakeside", position: "Service", mobile: "-", uid: "1769313164118x309104604041160900" },
    { firstName: "Ms.Piyanun", lastName: "Seewiset", email: "07@gmail.com", roles: ["employee"], company: "Hemingways Lakeside", position: "Service", mobile: "-", uid: "1769313282142x555791353065313600" },
    { firstName: "Ms.Jindawan", lastName: "Ni-arvorn (Part Time)", email: "08@gmail.com", roles: ["employee"], company: "Hemingways Lakeside", position: "Helper Part Time", mobile: "-", uid: "1769313428072x133156497742650030" },
    { firstName: "Ms.Orathai", lastName: "Jittasiri", email: "09@gmail.com", roles: ["employee"], company: "Hemingways Lakeside", position: "Thai Chef", mobile: "-", uid: "1769313537807x214847755714327800" },
    { firstName: "Jenny", lastName: "Noppawan", email: "jenny.noppawan@gmail.com", roles: ["employee"], company: "Alan Bolton Property Consultants", position: "Real Estate Agent", mobile: "+66643388899", uid: "1769841277064x131046324935928160" },
    { firstName: "Supatsorn", lastName: "Promjan", email: "supatsorn5608@gmail.com", roles: ["employee"], position: "Mina", mobile: "0969180648", uid: "1769929352111x424941184445595260" },
    { firstName: "Chonlatee", lastName: "Seema", email: "ccchonlatee@gmail.com", roles: ["employee"], company: "Cajun Life Cafe", mobile: "0808032832", uid: "1772870306288x750398126506102200" }
  ];

  const initialCompanies = [
    { id: "1738205845983x133278946946635600", name: "Hemingways Lakeside", website: "https://www.hemingwayslakeside.com", logo: "https://6022e9b060237f7418814624aea7f151.cdn.bubble.io/f1738212898520x975271367815164900/Hemingways%20Lakeside%20Logo.png", description: "Pattaya's premier lakeside dining experience." },
    { id: "1738205872133x974561263972349600", name: "Hemingways Jomtien", website: "https://www.hemingwaysjomtien.com", logo: "https://6022e9b060237f7418814624aea7f151.cdn.bubble.io/f1738212884463x913848644166320500/Hemingways_Logo_Jomtien.png", description: "Beachfront dining and drinks in Jomtien." },
    { id: "1738205896138x392922605002832260", name: "Hemingways Pattaya", website: "https://www.hemingwayspattaya.com", logo: "https://6022e9b060237f7418814624aea7f151.cdn.bubble.io/f1738212870086x950453333007466100/Hemingways_Logo_Pattaya.png", description: "The classic Hemingways experience in central Pattaya." },
    { id: "1738205917380x500848660954293900", name: "Cajun Life Cafe", website: "https://www.cajunlifecafe.com", logo: "https://6022e9b060237f7418814624aea7f151.cdn.bubble.io/f1738213128930x606471510321622700/IMG_8895.jpeg", description: "Authentic Cajun flavors in the heart of Thailand." },
    { id: "1738205961941x778371290817771100", name: "Pattaya Rent a Car", website: "https://www.pattayarentacar.com", logo: "https://6022e9b060237f7418814624aea7f151.cdn.bubble.io/f1738212991154x209166829233646600/PRAC-Logo-2.png", description: "Reliable car rental services in Pattaya." },
    { id: "1743650798995x890056624649797600", name: "Alan Bolton Property Consultants", website: "https://www.pattaya-property.net", logo: "https://6022e9b060237f7418814624aea7f151.cdn.bubble.io/f1743650655076x516386056352589040/IMG_7020.jpeg", description: "Expert real estate advice and property management." },
    { id: "1754730951328x835361149003133100", name: "East Coast Real Estate", website: "https://www.thaiproperty.com", logo: "https://6022e9b060237f7418814624aea7f151.cdn.bubble.io/f1754730947495x779512689180206200/LOGO-Square%202016%203.5x3.jpg", description: "Leading real estate agency on the Eastern Seaboard." }
  ];

  const initialDiscounts = [
    { name: "Free F & B Cajun Life", restaurantId: "Cajun Life Cafe", percentage: 100, id: "1738206063593x538668695501224960" },
    { name: "30% Discount Cajun Life Cafe", restaurantId: "Cajun Life Cafe", percentage: 30, id: "1738210744788x416384304719806800" },
    { name: "50% Discount Cajun Life Cafe", restaurantId: "Cajun Life Cafe", percentage: 50, id: "1738210795835x644427956726645500" },
    { name: "Free F & B Hemingways Lakeside", restaurantId: "Hemingways Lakeside", percentage: 100, id: "1738210821382x320887693735932400" },
    { name: "Free F & B Hemingways Jomtien", restaurantId: "Hemingways Jomtien", percentage: 100, id: "1738210858117x543270289803819300" },
    { name: "30% Discount Hemingways Jomtien", restaurantId: "Hemingways Jomtien", percentage: 30, id: "1738210887845x867350189793486700" },
    { name: "30% Discount Hemingways Lakeside", restaurantId: "Hemingways Lakeside", percentage: 30, id: "1738210924316x118819076155189710" },
    { name: "30% Discount Hemingways Pattaya", restaurantId: "Hemingways Pattaya", percentage: 30, id: "1738210947854x640414287193534100" },
    { name: "10% Discount From Website Price", restaurantId: "Pattaya Rent a Car", percentage: 10, id: "1738210973293x920962507673391400" },
    { name: "5% Discount From Website Price", restaurantId: "Pattaya Rent a Car", percentage: 5, id: "1738210996676x583106575539503200" },
    { name: "10% Discount Cajun Life Cafe", restaurantId: "Cajun Life Cafe", percentage: 10, id: "1738211022127x378149214695672640" },
    { name: "10% Discount Hemingways Lakeside", restaurantId: "Hemingways Lakeside", percentage: 10, id: "1738211050837x845528297216272800" },
    { name: "20% Discount Hemingways Lakeside", restaurantId: "Hemingways Lakeside", percentage: 20, id: "1738211082740x204350974544571970" },
    { name: "20% Discount Hemingways Pattaya", restaurantId: "Hemingways Pattaya", percentage: 20, id: "1738211118158x724340589269782900" },
    { name: "Free Vehicle When Available", restaurantId: "Pattaya Rent a Car", percentage: 100, id: "1738212315244x377403431312962370" },
    { name: "20% Discount Cajun Life Cafe", restaurantId: "Cajun Life Cafe", percentage: 20, id: "1738213306881x522738045396156300" },
    { name: "20% Discount From Website Price", restaurantId: "Pattaya Rent a Car", percentage: 20, id: "1738216059581x255847715996071940" },
    { name: "20% Discount Hemingways Jomtien", restaurantId: "Hemingways Jomtien", percentage: 20, id: "1738217260587x187019259097684480" }
  ];

  const handleSeedDiscounts = async () => {
    if (discSeedStatus === 'idle') {
      setDiscSeedStatus('confirming');
      setTimeout(() => setDiscSeedStatus('idle'), 3000);
      return;
    }
    
    setIsSeedingDiscounts(true);
    try {
      for (const disc of initialDiscounts) {
        await setDoc(doc(db, 'discounts', disc.id), {
          ...disc,
          active: true,
          createdAt: serverTimestamp()
        });
      }
      setDiscSeedStatus('success');
      setTimeout(() => setDiscSeedStatus('idle'), 3000);
    } catch (err) {
      setDiscSeedStatus('error');
      handleFirestoreError(err, OperationType.CREATE, 'discounts/seed');
    } finally {
      setIsSeedingDiscounts(false);
    }
  };

  const handleSeedCompanies = async () => {
    if (compSeedStatus === 'idle') {
      setCompSeedStatus('confirming');
      setTimeout(() => setCompSeedStatus('idle'), 3000);
      return;
    }
    
    setIsSeedingCompanies(true);
    try {
      for (const comp of initialCompanies) {
        await setDoc(doc(db, 'companies', comp.id), {
          ...comp,
          createdAt: serverTimestamp()
        });
      }
      setCompSeedStatus('success');
      setTimeout(() => setCompSeedStatus('idle'), 3000);
    } catch (err) {
      setCompSeedStatus('error');
      handleFirestoreError(err, OperationType.CREATE, 'companies/seed');
    } finally {
      setIsSeedingCompanies(false);
    }
  };

  const handleSeedEmployees = async () => {
    if (empSeedStatus === 'idle') {
      setEmpSeedStatus('confirming');
      setTimeout(() => setEmpSeedStatus('idle'), 3000);
      return;
    }
    
    setIsSeeding(true);
    try {
      for (const emp of initialEmployees) {
        const exists = employees.some(existing => existing.email.toLowerCase() === emp.email.toLowerCase());
        
        if (!exists) {
          // Find matching companyId
          const matchingCompany = initialCompanies.find(c => c.name.trim() === (emp.company || '').trim());
          
          // Assign discounts based on company
          const companyDiscounts = initialDiscounts
            .filter(d => d.restaurantId === emp.company)
            .map(d => d.id);
          
          // Generate a simple discount code if not present
          const discountCode = emp.firstName.substring(0, 3).toUpperCase() + Math.floor(100 + Math.random() * 900);
          
          await setDoc(doc(db, 'users', emp.uid), {
            ...emp,
            name: `${emp.firstName} ${emp.lastName}`.trim(),
            discountCode,
            companyId: matchingCompany?.id || '',
            discountIds: companyDiscounts,
            createdAt: serverTimestamp()
          });
        }
      }
      setEmpSeedStatus('success');
      setTimeout(() => setEmpSeedStatus('idle'), 3000);
    } catch (err) {
      setEmpSeedStatus('error');
      handleFirestoreError(err, OperationType.CREATE, 'users/seed');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      const results = await migrateData();
      console.log("Migration results:", results);
      setMigrationStatus('success');
      setTimeout(() => setMigrationStatus('idle'), 5000);
    } catch (err) {
      setMigrationStatus('error');
      console.error("Migration failed:", err);
    } finally {
      setIsMigrating(false);
    }
  };

  useEffect(() => {
    if (!hasRole('admin') && !hasRole('accounts') && !hasRole('manager') && auth.currentUser?.email !== 'shaneruddle@gmail.com') return;

    const usersCollection = collection(db, 'users');
    let usersQuery;

    if (hasRole('admin')) {
      usersQuery = usersCollection;
    } else if (hasRole('accounts') || hasRole('manager')) {
      // Filter by companyId or company name for both accounts and managers
      if (userProfile.companyId) {
        usersQuery = query(usersCollection, where('companyId', '==', userProfile.companyId));
      } else if (userProfile.company) {
        usersQuery = query(usersCollection, where('company', '==', userProfile.company));
      } else {
        // Fallback to just themselves if no company info
        usersQuery = query(usersCollection, where('uid', '==', userProfile.uid));
      }
    } else {
      // Fallback for other roles
      usersQuery = query(usersCollection, where('uid', '==', userProfile.uid));
    }

    const fetchData = async () => {
      try {
        // Use getDocs instead of onSnapshot for heavy lists to save quota
        const employeesSnap = await getDocs(usersQuery);
        setEmployees(employeesSnap.docs.map(doc => ({ ...doc.data() as any } as UserProfile)));

        const discountsSnap = await getDocs(collection(db, 'discounts'));
        setDiscounts(discountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Discount)));

        const logsSnap = await getDocs(query(collection(db, 'usage_logs'), orderBy('timestamp', 'desc'), limit(100)));
        setLogs(logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any, source: 'SHANE' } as UsageLog)));

        const companiesSnap = await getDocs(collection(db, 'companies'));
        setCompanies(companiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as any)));

        const blogSnap = await getDocs(query(collection(db, 'blog'), orderBy('createdAt', 'desc')));
        setBlogPosts(blogSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as BlogPost)));
      } catch (err: any) {
        if (err.message?.includes('Quota limit exceeded')) {
          console.warn("Firestore quota hit in Dashboard");
          toast.error("Daily limit reached. Dashboard data may be incomplete.");
        } else {
          handleFirestoreError(err, OperationType.LIST, 'dashboard_init');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Still keep some critical real-time listeners but with safe defaults
    const unsubEmployees = onSnapshot(usersQuery, (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile)));
    }, (err) => console.warn("Employees stream stopped:", err.message));

    const unsubLogs = onSnapshot(query(collection(db, 'usage_logs'), orderBy('timestamp', 'desc'), limit(50)), (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), source: 'SHANE' } as UsageLog)));
    }, (err) => console.warn("Logs stream stopped:", err.message));

    // Remote Logs Setup
    let unsubPattaya: (() => void) | undefined;
    let unsubCajun: (() => void) | undefined;
    
    const setupRemote = (config: any, appId: string, dbId: string, sourceLabel: string, setLogsFn: (logs: UsageLog[]) => void, setErrorFn: (err: string | null) => void) => {
      try {
        let app;
        try { app = getApp(appId); } catch { app = initializeApp(config, appId); }
        const rDb = getFirestore(app, dbId);
        
        // Try multiple common log collection names, prioritizing system_logs for Cajun
        const collectionNames = ['system_logs', 'usage_logs', 'logs', 'activity', 'history', 'audit_trail'];
        
        const tryNext = (index: number) => {
          if (index >= collectionNames.length) {
            setErrorFn(null); // Just show 0 if nothing found
            return;
          }
          
          const colName = collectionNames[index];
          const q = query(collection(rDb, colName), orderBy('timestamp', 'desc'), limit(100));
          
          onSnapshot(q, (snap) => {
            if (snap.empty) {
              tryNext(index + 1);
            } else {
              setLogsFn(snap.docs.map(doc => ({ id: doc.id, ...doc.data(), source: sourceLabel } as UsageLog)));
              setErrorFn(null);
            }
          }, (err) => {
            console.warn(`Remote logs (${appId}) ${colName} failed:`, err.message);
            if (err.message.includes('permission')) {
              setErrorFn('Access Denied');
            } else {
              tryNext(index + 1);
            }
          });
        };

        tryNext(0);
      } catch (err) {
        console.error(`Failed to init remote (${appId}):`, err);
        setErrorFn('Init Failed');
        return undefined;
      }
    };

    unsubPattaya = setupRemote({
      apiKey: "AIzaSyBwNBORxwnyg-X-PGULAYL2tnv9qvckp2I",
      authDomain: "pattaya-rent-a-car-rebuild.firebaseapp.com",
      projectId: "pattaya-rent-a-car-rebuild",
      storageBucket: "pattaya-rent-a-car-rebuild.firebasestorage.app",
      messagingSenderId: "700448424476",
      appId: "1:700448424476:web:5ddf038c6bd46b7b4615d9"
    }, "pattaya-logs", "(default)", "RENT A CAR", setPattayaLogs, setPattayaError);

    unsubCajun = setupRemote({
      apiKey: "AIzaSyCvrKHre4sQUVnrk0eKFgQcNoexLS_WZps",
      authDomain: "cajun-life-cafe.firebaseapp.com",
      projectId: "cajun-life-cafe",
      storageBucket: "cajun-life-cafe.firebasestorage.app",
      messagingSenderId: "1006330230181",
      appId: "1:1006330230181:web:bb9fa1db36a7ef61bd244c"
    }, "cajun-logs", "ai-studio-88dfc183-b7e7-45b8-b831-62b1a7bbdb29", "CAJUN", setCajunLogs, setCajunError);

    const unsubSiteImages = onSnapshot(collection(db, 'site_images'), (snapshot) => {
      const images = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          uploadedAt: data.uploadedAt || { toDate: () => new Date() }
        } as SiteImage;
      });
      const sortedImages = [...images].sort((a, b) => {
        const dateA = a.uploadedAt?.toDate?.() || new Date(0);
        const dateB = b.uploadedAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      setSiteImages(sortedImages);
    }, (err) => console.warn("Site images stream stopped:", err.message));

    return () => {
      unsubEmployees();
      unsubLogs();
      if (unsubPattaya) unsubPattaya();
      if (unsubCajun) unsubCajun();
      unsubSiteImages();
    };
  }, [userProfile]);

  // Separate useEffect for finance transactions to allow larger limits or section-specific queries if needed
  // For now just keeping it simple but with a higher limit and better error handling
  useEffect(() => {
    if (!userProfile?.uid) return;

    const section = financeSubTab.startsWith('ABPC') ? 'ABPC' : 'ECRE';
    // We fetch a larger limit to ensure we get historical data, but scoped to the section
    const q = query(
      collection(db, 'finance'),
      where('section', '==', section),
      orderBy('date', 'desc'),
      limit(10000)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setFinanceTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceTransaction)));
    }, (err) => {
      console.warn("Finance stream error:", err.message);
      if (err.message?.includes('Missing or insufficient permissions')) {
        toast.error("You don't have permission to view these finance records");
      }
    });

    return () => unsub();
  }, [userProfile?.uid, financeSubTab.startsWith('ABPC')]);

  useEffect(() => {
    const hasRole = (role: string) => userProfile.roles?.includes(role as any) || (userProfile as any).role === role;
    if (hasRole('accounts') && !hasRole('admin')) {
      if (userProfile.company?.includes('Alan Bolton')) {
        setFinanceSubTab('ABPC');
      } else if (userProfile.company?.includes('East Coast')) {
        setFinanceSubTab('ECRE');
      }
    }
  }, [userProfile]);


  const handleStandardizeRoles = async () => {
    if (!window.confirm('This will set ALL users (except shaneruddle@gmail.com) to the "employee" role. Are you sure?')) return;
    
    setIsStandardizing(true);
    try {
      let updatedCount = 0;
      for (const user of employees) {
        if (user.email !== 'shaneruddle@gmail.com' && (!user.roles || !user.roles.includes('employee'))) {
          await updateDoc(doc(db, 'users', user.uid), {
            roles: ['employee'],
            updatedAt: serverTimestamp()
          });
          updatedCount++;
        }
      }
      toast.success(`Standardized ${updatedCount} user roles to "employee"`);
    } catch (err) {
      toast.error('Failed to standardize roles');
      handleFirestoreError(err, OperationType.UPDATE, 'users/standardize');
    } finally {
      setIsStandardizing(false);
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.description || !newTransaction.amount || !newTransaction.agent) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (newTransaction.isTransfer && (!newTransaction.fromAccount || !newTransaction.toAccount)) {
      toast.error('Please select both from and to accounts for transfer');
      return;
    }

    if (newTransaction.isTransfer && newTransaction.fromAccount === newTransaction.toAccount) {
      toast.error('Source and destination accounts must be different');
      return;
    }

    setIsSavingTransaction(true);
    try {
      // Helper to remove undefined fields
      const sanitize = (obj: any) => {
        const result = { ...obj };
        Object.keys(result).forEach(key => {
          if (result[key] === undefined) {
            delete result[key];
          }
        });
        return result;
      };

      if (editingTransaction) {
        // Sanitize data for update
        const updateData = sanitize({ ...newTransaction });
        delete (updateData as any).fromAccount;
        delete (updateData as any).toAccount;

        await updateDoc(doc(db, 'finance', editingTransaction.id), {
          ...updateData,
          updatedAt: serverTimestamp()
        });

        // Log usage
        await addDoc(collection(db, 'usage_logs'), {
          userId: auth.currentUser?.uid,
          userName: userProfile.name || 'Unknown',
          userEmail: auth.currentUser?.email || 'Unknown',
          userCompany: userProfile.company || 'Unknown',
          type: 'finance_update',
          details: `Updated transaction: ${newTransaction.description} (${newTransaction.amount} THB)`,
          timestamp: serverTimestamp()
        });

        if (editingTransaction.transferGroupId) {
          // Find the other transaction in the group
          const otherTx = financeTransactions.find(t => t.transferGroupId === editingTransaction.transferGroupId && t.id !== editingTransaction.id);
          if (otherTx) {
            await updateDoc(doc(db, 'finance', otherTx.id), {
              date: newTransaction.date,
              description: newTransaction.description,
              amount: newTransaction.amount,
              agent: newTransaction.agent,
              dealType: newTransaction.dealType,
              updatedAt: serverTimestamp()
            });
          }
        }
        toast.success('Transaction updated successfully');
      } else {
        if (newTransaction.isTransfer) {
          const transferGroupId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // 1. Expense from source account
          const sourceTx = sanitize({
            ...newTransaction,
            type: 'expense' as const,
            account: newTransaction.fromAccount!,
            section: financeSubTab.startsWith('ABPC') ? 'ABPC' : 'ECRE',
            transferGroupId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: auth.currentUser?.uid
          });
          delete (sourceTx as any).fromAccount;
          delete (sourceTx as any).toAccount;

          // 2. Income to destination account
          const destTx = sanitize({
            ...newTransaction,
            type: 'income' as const,
            account: newTransaction.toAccount!,
            section: financeSubTab.startsWith('ABPC') ? 'ABPC' : 'ECRE',
            transferGroupId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: auth.currentUser?.uid
          });
          delete (destTx as any).fromAccount;
          delete (destTx as any).toAccount;

          await addDoc(collection(db, 'finance'), sourceTx);
          await addDoc(collection(db, 'finance'), destTx);

          // Log usage
          await addDoc(collection(db, 'usage_logs'), {
            userId: auth.currentUser?.uid,
            userName: userProfile.name || 'Unknown',
            userEmail: auth.currentUser?.email || 'Unknown',
            userCompany: userProfile.company || 'Unknown',
            type: 'finance_create',
            details: `Created transfer: ${newTransaction.description} (${newTransaction.amount} THB) from ${newTransaction.fromAccount} to ${newTransaction.toAccount}`,
            timestamp: serverTimestamp()
          });

          toast.success('Transfer recorded successfully');
        } else {
          const transactionData = sanitize({
            ...newTransaction,
            section: financeSubTab.startsWith('ABPC') ? 'ABPC' : 'ECRE',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: auth.currentUser?.uid
          });
          delete (transactionData as any).fromAccount;
          delete (transactionData as any).toAccount;

          await addDoc(collection(db, 'finance'), transactionData);

          // Log usage
          await addDoc(collection(db, 'usage_logs'), {
            userId: auth.currentUser?.uid,
            userName: userProfile.name || 'Unknown',
            userEmail: auth.currentUser?.email || 'Unknown',
            userCompany: userProfile.company || 'Unknown',
            type: 'finance_create',
            details: `Created transaction: ${newTransaction.description} (${newTransaction.amount} THB)`,
            timestamp: serverTimestamp()
          });

          toast.success('Transaction saved successfully');
        }
      }
      
      setShowAddTransaction(false);
      setEditingTransaction(null);
      setNewTransaction({
        type: 'income',
        dealType: 'new',
        account: 'trading',
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        agent: '-'
      });
    } catch (err) {
      toast.error(`Failed to ${editingTransaction ? 'update' : 'save'} transaction`);
      handleFirestoreError(err, editingTransaction ? OperationType.UPDATE : OperationType.CREATE, editingTransaction ? `finance/${editingTransaction.id}` : 'finance');
    } finally {
      setIsSavingTransaction(false);
    }
  };

  const handleEditTransaction = (transaction: FinanceTransaction) => {
    setEditingTransaction(transaction);
    const isTransfer = !!transaction.transferGroupId;
    let fromAccount = transaction.account;
    let toAccount = transaction.account;

    if (isTransfer) {
      const otherTx = financeTransactions.find(t => t.transferGroupId === transaction.transferGroupId && t.id !== transaction.id);
      if (otherTx) {
        fromAccount = transaction.type === 'expense' ? transaction.account : otherTx.account;
        toAccount = transaction.type === 'income' ? transaction.account : otherTx.account;
      }
    }

    setNewTransaction({
      type: transaction.type,
      dealType: transaction.dealType,
      account: transaction.account || 'trading',
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      agent: transaction.agent,
      leadFrom: transaction.leadFrom || '',
      isTransfer,
      fromAccount: fromAccount as any,
      toAccount: toAccount as any
    });
    setShowAddTransaction(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const transaction = financeTransactions.find(t => t.id === id);
      await deleteDoc(doc(db, 'finance', id));

      // Log usage
      await addDoc(collection(db, 'usage_logs'), {
        userId: auth.currentUser?.uid,
        userName: userProfile.name || 'Unknown',
        userEmail: auth.currentUser?.email || 'Unknown',
        userCompany: userProfile.company || 'Unknown',
        type: 'finance_delete',
        details: `Deleted transaction: ${transaction?.description} (${transaction?.amount} THB)`,
        timestamp: serverTimestamp()
      });
      
      if (transaction?.transferGroupId) {
        const otherTx = financeTransactions.find(t => t.transferGroupId === transaction.transferGroupId && t.id !== id);
        if (otherTx) {
          await deleteDoc(doc(db, 'finance', otherTx.id));
          toast.success('Transfer deleted (both entries)');
        } else {
          toast.success('Transaction deleted');
        }
      } else {
        toast.success('Transaction deleted');
      }
      setConfirmDeleteTransaction(null);
    } catch (err) {
      toast.error('Failed to delete transaction');
      handleFirestoreError(err, OperationType.DELETE, `finance/${id}`);
    }
  };

  const handleExportFinance = () => {
    if (filteredFinanceTransactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const exportData = filteredFinanceTransactions.map(t => ({
      Date: t.date,
      Description: t.description,
      Agent: getAgentDisplayName(t.agent),
      Account: t.account.charAt(0).toUpperCase() + t.account.slice(1),
      Type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
      'Deal Type': t.dealType,
      Amount: t.amount,
      Currency: 'THB',
      Section: t.section
    }));

    setExportPreviewData(exportData);
    setExportPreviewTitle(`Finance Export: ${financeSubTab}`);
    setExportPreviewFileName(`Finance_Export_${financeSubTab}_${new Date().toISOString().split('T')[0]}.csv`);
    setShowExportPreview(true);
  };

  const executeExportCSV = (data: any[], fileName: string) => {
    setIsExportingFromPreview(true);
    try {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${data.length} items successfully`);
      setShowExportPreview(false);
    } catch (err) {
      toast.error("Export failed");
      console.error(err);
    } finally {
      setIsExportingFromPreview(false);
    }
  };

  const handleEditEmployee = (employee: UserProfile | null) => {
    if (employee) {
      setEditingEmployee(employee);
    } else {
      const isManagerOnly = userProfile.roles?.includes('manager') && !userProfile.roles?.includes('admin');
      setEditingEmployee({
        uid: `temp_${Date.now()}`,
        firstName: '',
        lastName: '',
        email: '',
        roles: ['employee'],
        active: true,
        company: isManagerOnly ? userProfile.company : '',
        companyId: isManagerOnly ? userProfile.companyId : '',
        discountIds: [],
        discountCode: `SR-EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        position: '',
        mobile: ''
      });
    }
    setShowEditEmployee(true);
  };

  const toggleEmployeeDiscount = (discountId: string) => {
    if (!editingEmployee) return;
    const currentDiscounts = editingEmployee.discountIds || [];
    const newDiscounts = currentDiscounts.includes(discountId)
      ? currentDiscounts.filter(id => id !== discountId)
      : [...currentDiscounts, discountId];
    setEditingEmployee({ ...editingEmployee, discountIds: newDiscounts });
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    
    const isNew = editingEmployee.uid.startsWith('temp_');
    const finalUid = isNew ? Date.now().toString() + 'x' + Math.floor(Math.random() * 1000000000000000000).toString() : editingEmployee.uid;

    try {
      // Check for duplicate email if it's a new employee or email changed
      if (editingEmployee.email) {
        const q = query(collection(db, "users"), where("email", "==", editingEmployee.email.toLowerCase().trim()));
        const querySnap = await getDocs(q);
        
        // Find a duplicate that isn't the one we are currently editing
        const duplicate = querySnap.docs.find(d => d.id !== editingEmployee.uid);
        
        if (duplicate) {
          const dupData = duplicate.data() as UserProfile;
          const isRealUser = !duplicate.id.includes('x'); 
          const isTargetRealUser = !editingEmployee.uid.includes('x');
          
          // If we're editing a real user and found a duplicate seeded account for the SAME person,
          // we should prioritize the real user and allow the save.
          if (isTargetRealUser && !isRealUser && (dupData.name === editingEmployee.name || dupData.email === editingEmployee.email)) {
            console.log("Allowing save over matching seeded record.");
          } else {
            toast.error(`Email already in use by ${dupData.name || 'another account'} (${isRealUser ? 'Registered Account' : 'Seeded Account'}). Please contact support to merge these entries.`);
            return;
          }
        }
      }

      if (isNew) {
        await setDoc(doc(db, 'users', finalUid), {
          ...editingEmployee,
          uid: finalUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success('Employee added successfully');
      } else {
        await updateDoc(doc(db, 'users', editingEmployee.uid), {
          ...editingEmployee,
          updatedAt: serverTimestamp()
        });

        // Log employee update
        await addDoc(collection(db, 'usage_logs'), {
          userId: auth.currentUser?.uid,
          userName: userProfile.name || 'Unknown',
          userEmail: auth.currentUser?.email || 'Unknown',
          userCompany: userProfile.company || 'Unknown',
          type: 'employee_update',
          details: `Updated employee profile: ${editingEmployee.name || editingEmployee.email} (${editingEmployee.uid})`,
          timestamp: serverTimestamp()
        });

        toast.success('Employee updated successfully');
      }
      setShowEditEmployee(false);
      setEditingEmployee(null);
    } catch (err) {
      toast.error(`Failed to ${isNew ? 'add' : 'update'} employee`);
      handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, `users/${finalUid}`);
    }
  };

  const handleEditCompany = (company: DBCompany | null) => {
    setEditingCompany(company || { name: '', website: '', logo: '', description: '' });
    setShowEditCompany(true);
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany || !editingCompany.name) return;
    
    // Ensure logo is cleaned up if it's a data URI
    const cleanLogo = editingCompany.logo?.trim();
    const finalLogo = cleanLogo?.startsWith('data:') ? cleanLogo.replace(/\s/g, '') : cleanLogo;

    try {
      if (editingCompany.id) {
        await updateDoc(doc(db, 'companies', editingCompany.id), {
          ...editingCompany,
          logo: finalLogo,
          updatedAt: serverTimestamp()
        });
        toast.success('Company updated successfully');
      } else {
        const newId = Date.now().toString();
        await setDoc(doc(db, 'companies', newId), {
          ...editingCompany,
          logo: finalLogo,
          id: newId,
          createdAt: serverTimestamp()
        });
        toast.success('Company added successfully');
      }
      
      // Clear the business info cache to reflect changes immediately
      localStorage.removeItem("shane_ruddle_business_info_v3");
      
      setShowEditCompany(false);
      setEditingCompany(null);
    } catch (err) {
      handleFirestoreError(err, editingCompany.id ? OperationType.UPDATE : OperationType.CREATE, 'companies');
    }
  };

  const handleDeleteCompany = async (id: string, name: string) => {
    setConfirmDelete({ id, type: 'company', name });
  };

  const executeDeleteCompany = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'companies', id));
      toast.success('Company deleted successfully');
      setConfirmDelete(null);
    } catch (err) {
      toast.error('Failed to delete company');
      handleFirestoreError(err, OperationType.DELETE, `companies/${id}`);
    }
  };

  useEffect(() => {
    if (!savingPersonalProfile) {
      setPersonalProfile(userProfile);
    }
  }, [userProfile, savingPersonalProfile]);

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const info = await getBusinessInfo();
        setBusinessInfo(info);
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, "settings/business_info");
      }
    };
    fetchBusinessInfo();
  }, []);

  const handlePersonalPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error("Image size must be less than 1MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPersonalProfile(prev => ({ ...prev, profileImage: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdatePersonalProfile = async () => {
    if (!auth.currentUser) return;
    setSavingPersonalProfile(true);
    try {
      console.log("Updating personal profile. Current state:", personalProfile);
      const updateData = {
        name: personalProfile.name || '',
        firstName: personalProfile.firstName || '',
        lastName: personalProfile.lastName || '',
        mobile: personalProfile.mobile || '',
        profileImage: personalProfile.profileImage || '',
        updatedAt: serverTimestamp()
      };
      
      console.log("Sending update to Firestore:", updateData);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), updateData);
      
      console.log("Firestore update successful. Logging usage...");
      // Log profile update
      await addDoc(collection(db, 'usage_logs'), {
        userId: auth.currentUser.uid,
        userName: userProfile.name || 'Unknown',
        userEmail: auth.currentUser.email || 'Unknown',
        userCompany: userProfile.company || 'Unknown',
        type: 'profile_update',
        details: `User updated their personal profile (Mobile: ${personalProfile.mobile || 'N/A'})`,
        timestamp: serverTimestamp()
      });

      toast.success("Personal profile updated successfully");
    } catch (err) {
      console.error("Error updating personal profile:", err);
      toast.error("Failed to update personal profile");
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    } finally {
      setSavingPersonalProfile(false);
    }
  };

  const handleABPCUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCSV(true);
    const toastId = toast.loading('Parsing ABPC data...');

    Papa.parse(file, {
      complete: async (results) => {
        try {
          // Skip header and empty rows (first 2 rows)
          const dataRows = results.data.slice(2) as string[][];
          const agents = new Set<string>();
          
          dataRows.forEach(row => {
            const agent = row[4]?.trim();
            if (agent && agent !== '-' && agent !== 'System') {
              agents.add(agent);
            }
          });

          const initialMapping: { [key: string]: string } = {};
          agents.forEach(agentName => {
            const matchedUser = employees.find(u => {
              if (u.company !== 'Alan Bolton Property Consultants') return false;
              const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
              return fullName === agentName.toLowerCase() || 
                     (u.firstName && u.firstName.toLowerCase() === agentName.toLowerCase()) ||
                     (u.lastName && u.lastName.toLowerCase() === agentName.toLowerCase());
            });
            if (matchedUser) {
              initialMapping[agentName] = matchedUser.uid;
            }
          });

          setPendingABPCData(dataRows);
          setUniqueABPCAgents(Array.from(agents).sort());
          setAgentMapping(initialMapping);
          setShowABPCMapping(true);
          toast.dismiss(toastId);
        } catch (err) {
          toast.error('Failed to parse ABPC data');
          console.error(err);
        } finally {
          setIsUploadingCSV(false);
          if (e.target) e.target.value = '';
        }
      }
    });
  };

  const executeABPCImport = async () => {
    setIsImportingABPC(true);
    const toastId = toast.loading('Importing ABPC data...');
    let importedCount = 0;
    let errorCount = 0;

    try {
      for (const row of pendingABPCData) {
        if (!row[1] || !row[2]) continue;

        const dateStr = row[1].trim();
        const description = row[2].trim();
        const dealTypeRaw = row[3]?.trim().toLowerCase();
        const rawAgent = row[4]?.trim() || 'System';
        const expenseRaw = row[5]?.trim().replace(/,/g, '').replace(/"/g, '');
        const incomeRaw = row[6]?.trim().replace(/,/g, '').replace(/"/g, '');

        const expense = parseFloat(expenseRaw) || 0;
        const income = parseFloat(incomeRaw) || 0;

        if (expense === 0 && income === 0) continue;

        const type = income > 0 ? 'income' : 'expense';
        const amount = income > 0 ? income : expense;
        const dealType = dealTypeRaw?.includes('new') ? 'new' : 'renewal';

        // Map the agent
        const mappedUserId = agentMapping[rawAgent];
        let agentName = rawAgent;
        let agentId = null;

        if (mappedUserId === 'no-agent') {
          agentName = '-';
          agentId = null;
        } else if (mappedUserId) {
          const mappedUser = employees.find(u => u.uid === mappedUserId);
          if (mappedUser) {
            agentName = `${mappedUser.firstName} ${mappedUser.lastName}`;
            agentId = mappedUserId;
          }
        }

        let formattedDate = dateStr;
        const dateParts = dateStr.split('/');
        if (dateParts.length === 3) {
          const day = dateParts[0].padStart(2, '0');
          const month = dateParts[1].padStart(2, '0');
          const year = dateParts[2];
          formattedDate = `${year}-${month}-${day}`;
        }

        try {
          await addDoc(collection(db, 'finance'), {
            section: 'ABPC',
            type,
            account: 'trading',
            date: formattedDate,
            description,
            amount,
            agent: agentName,
            agentId: mappedUserId || null,
            dealType,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: auth.currentUser?.uid
          });
          importedCount++;
        } catch (err) {
          errorCount++;
        }
      }

      toast.success(`Import complete: ${importedCount} entries imported, ${errorCount} errors`, { id: toastId });
      setShowABPCMapping(false);
      setPendingABPCData([]);
      setUniqueABPCAgents([]);
      setAgentMapping({});
    } catch (err) {
      toast.error('Import failed', { id: toastId });
    } finally {
      setIsImportingABPC(false);
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCSV(true);
    const toastId = toast.loading('Parsing CSV data...');

    Papa.parse(file, {
      complete: async (results) => {
        try {
          // Skip header and empty rows (first 2 rows)
          const dataRows = results.data.slice(2) as string[][];
          let importedCount = 0;
          let errorCount = 0;

          for (const row of dataRows) {
            // Basic validation: must have at least date and description
            if (!row[1] || !row[2]) continue;

            const dateStr = row[1].trim();
            const description = row[2].trim();
            const dealTypeRaw = row[3]?.trim().toLowerCase();
            const agent = row[4]?.trim() || 'System';
            const expenseRaw = row[5]?.trim().replace(/,/g, '').replace(/"/g, '');
            const incomeRaw = row[6]?.trim().replace(/,/g, '').replace(/"/g, '');

            const expense = parseFloat(expenseRaw) || 0;
            const income = parseFloat(incomeRaw) || 0;

            if (expense === 0 && income === 0) continue;

            const type = income > 0 ? 'income' : 'expense';
            const amount = income > 0 ? income : expense;
            const dealType = dealTypeRaw?.includes('new') ? 'new' : 'renewal';

            // Convert date from D/M/YYYY to YYYY-MM-DD for consistency if possible
            let formattedDate = dateStr;
            const dateParts = dateStr.split('/');
            if (dateParts.length === 3) {
              const day = dateParts[0].padStart(2, '0');
              const month = dateParts[1].padStart(2, '0');
              const year = dateParts[2];
              formattedDate = `${year}-${month}-${day}`;
            }

            try {
              await addDoc(collection(db, 'finance'), {
                section: (financeSubTab as string).startsWith('ABPC') ? 'ABPC' : 'ECRE',
                type,
                account: 'trading',
                date: formattedDate,
                description,
                amount,
                agent,
                dealType,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: auth.currentUser?.uid
              });
              importedCount++;
            } catch (err) {
              console.error('Error importing row:', row, err);
              errorCount++;
            }
          }

          toast.success(`Import complete: ${importedCount} entries added`, { id: toastId });
          if (errorCount > 0) {
            toast.error(`${errorCount} entries failed to import`);
          }
        } catch (err) {
          console.error('CSV Import failed:', err);
          toast.error('Failed to process CSV file', { id: toastId });
        } finally {
          setIsUploadingCSV(false);
          if (e.target) e.target.value = '';
        }
      },
      error: (err) => {
        console.error('Papa Parse error:', err);
        toast.error('Error reading CSV file', { id: toastId });
        setIsUploadingCSV(false);
      }
    });
  };

  const handleUpdateBusinessInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessInfo) return;

    setSavingProfile(true);
    try {
      await saveBusinessInfo(businessInfo);
      toast.success("Profile updated successfully");
    } catch (e) {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlog) return;

    setIsSavingBlog(true);
    try {
      const blogData = {
        title: editingBlog.title,
        metaDescription: editingBlog.metaDescription || '',
        keywords: editingBlog.keywords || '',
        body: editingBlog.body,
        category: editingBlog.category,
        imageUrl: editingBlog.imageUrl || '',
        published: editingBlog.published || false,
        updatedAt: serverTimestamp(),
        authorId: auth.currentUser?.uid,
        authorName: userProfile.name || `${userProfile.firstName} ${userProfile.lastName}`
      };

      if (editingBlog.id) {
        await updateDoc(doc(db, 'blog', editingBlog.id), blogData);
        toast.success('Blog post updated');
      } else {
        await addDoc(collection(db, 'blog'), {
          ...blogData,
          createdAt: serverTimestamp()
        });
        toast.success('Blog post created');
      }
      setShowEditBlog(false);
      setEditingBlog(null);
    } catch (err) {
      toast.error('Failed to save blog post');
      handleFirestoreError(err, editingBlog.id ? OperationType.UPDATE : OperationType.CREATE, 'blog');
    } finally {
      setIsSavingBlog(false);
    }
  };

  const handleOwnerPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessInfo) return;

    if (file.size > 1024 * 1024) {
      toast.error("Image size must be less than 1MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const updatedPhotos = [...(businessInfo.ownerPhotos || []), base64String];
      setBusinessInfo({ ...businessInfo, ownerPhotos: updatedPhotos });
    };
    reader.readAsDataURL(file);
  };

  const removeOwnerPhoto = (index: number) => {
    if (!businessInfo || !businessInfo.ownerPhotos) return;
    const updatedPhotos = businessInfo.ownerPhotos.filter((_, i) => i !== index);
    setBusinessInfo({ ...businessInfo, ownerPhotos: updatedPhotos });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      toast.error('Logo file size must be less than 500KB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (editingCompany) {
        const result = reader.result as string;
        // Clean up the base64 string immediately
        const cleanResult = result.replace(/\s/g, '');
        setEditingCompany({ ...editingCompany, logo: cleanResult });
        toast.success('Logo uploaded successfully');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBlogImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingBlog) return;

    if (file.size > 1024 * 1024) {
      toast.error('Image size must be less than 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setEditingBlog({ ...editingBlog, imageUrl: base64String });
      toast.success('Blog image uploaded');
    };
    reader.readAsDataURL(file);
  };

  const handleSiteImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    console.log("Starting upload for file:", file.name, "size:", file.size);

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    setIsUploadingImage(true);
    const toastId = toast.loading("Processing image...");

    try {
      let uploadData: Blob | File = file;
      let fileName = file.name;
      let fileType = file.type;

      try {
        console.log("Attempting WebP conversion...");
        const webpBlob = await convertToWebP(file);
        uploadData = webpBlob;
        const lastDotIndex = file.name.lastIndexOf('.');
        const baseName = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
        fileName = `${baseName}.webp`;
        fileType = 'image/webp';
        console.log("WebP conversion successful:", fileName);
      } catch (convErr) {
        console.warn("WebP conversion failed, falling back to original:", convErr);
      }

      const storagePath = `site_images/${Date.now()}_${fileName}`;
      const storageRef = ref(storage, storagePath);
      
      console.log("Uploading to storage path:", storagePath);
      toast.loading("Uploading to storage...", { id: toastId });

      // Use Data URL for upload - often more reliable in sandboxed environments
      const reader = new FileReader();
      const dataUrlPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(uploadData);
      });
      
      const dataUrl = await dataUrlPromise;
      console.log("Data URL generated, starting uploadString...");
      
      await uploadString(storageRef, dataUrl, 'data_url');
      console.log("Upload successful");

      console.log("Getting download URL...");
      const downloadURL = await getDownloadURL(storageRef);
      console.log("Download URL obtained:", downloadURL);

      toast.loading("Saving to database...", { id: toastId });
      await addDoc(collection(db, 'site_images'), {
        name: fileName,
        url: downloadURL,
        storagePath: storagePath,
        uploadedBy: auth.currentUser.uid,
        uploadedAt: serverTimestamp(),
        size: uploadData.size,
        type: fileType
      });
      console.log("Firestore document added");

      toast.success("Image uploaded successfully", { id: toastId });
    } catch (err) {
      console.error("Upload process failed:", err);
      toast.error("Failed to upload image. Please check your connection and try again.", { id: toastId });
      handleFirestoreError(err, OperationType.CREATE, 'site_images');
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDeleteSiteImage = async (image: SiteImage) => {
    if (!window.confirm(`Are you sure you want to delete "${image.name}"?`)) return;

    const toastId = toast.loading("Deleting image...");
    try {
      const storageRef = ref(storage, image.storagePath);
      await deleteObject(storageRef);
      await deleteDoc(doc(db, 'site_images', image.id));
      toast.success("Image deleted successfully", { id: toastId });
    } catch (err) {
      toast.error("Failed to delete image", { id: toastId });
      handleFirestoreError(err, OperationType.DELETE, `site_images/${image.id}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("URL copied to clipboard");
  };

  const uniqueEmployees: UserProfile[] = Array.from(
    employees.reduce((acc: Map<string, UserProfile>, emp: UserProfile) => {
      // Key can be email or mobile
      const key = (emp.email || emp.mobile || emp.uid).toLowerCase();
      const existing = acc.get(key);
      
      // Seeded check: UIDs from initial batch usually have 'x' or 'temp_'
      const isSeeded = emp.uid.includes('x') || emp.uid.startsWith('temp_');
      const existingIsSeeded = existing ? (existing.uid.includes('x') || existing.uid.startsWith('temp_')) : false;

      // Logic: 
      // 1. If not in map, add it.
      // 2. If new one is REAL and existing is SEEDED, overwrite.
      // 3. Otherwise, keep existing (or pick one with more data).
      if (!existing || (!isSeeded && existingIsSeeded)) {
        acc.set(key, emp);
      } else if (existing && isSeeded === existingIsSeeded) {
        // Both same type, pick one with more fields populated
        const getFieldCount = (u: UserProfile) => Object.values(u).filter(v => v !== undefined && v !== '').length;
        if (getFieldCount(emp) > getFieldCount(existing)) {
          acc.set(key, emp);
        }
      }
      return acc;
    }, new Map<string, UserProfile>()).values()
  );

  const financeAgents = Array.from(new Set(financeTransactions.filter(t => {
    if (t.agent?.toLowerCase() === 'system') return false;
    
    // Filter based on the current view (ABPC or ECRE)
    const currentViewSection = financeSubTab.startsWith('ABPC') ? 'ABPC' : 'ECRE';
    if (t.section !== currentViewSection) return false;

    if (userProfile.roles?.includes('admin')) return true;
    if (userProfile.company === 'Alan Bolton Property Consultants') return t.section === 'ABPC';
    if (userProfile.company === 'East Coast Real Estate') return t.section === 'ECRE';
    return false;
  }).map(t => {
    // Normalize "Cap" to "Arnon Surison" and "MP" to "Management Pot"
    if (t.agent === 'Cap') return 'Arnon Surison';
    if (t.agent === 'MP') return 'Management Pot';
    if (t.agent === 'Pang') return 'Oranoot Totong';
    if (t.agent === 'Aiden') return 'Aiden Scott Gray';
    if (t.agent === 'Scott') return 'Scott Smith';
    if (t.agent === 'Anni') return 'Annipa Phasawat';
    if (t.agent === 'Noel') return 'Noel Magold';
    if (t.agent === 'Aunt') return 'Aunt Srisawat';
    if (t.agent === 'Sho') return 'Sho';
    return t.agent;
  }))).sort();

  const getAgentDisplayName = (agentName: string) => {
    if (agentName?.toLowerCase() === 'system') return '-';
    
    // Find employee by name (full name or nickname)
    const agentUser = uniqueEmployees.find(u => {
      const fullName = `${u.firstName} ${u.lastName}`.trim();
      return fullName === agentName || u.nickname === agentName || u.name === agentName;
    });

    if (agentUser) {
      const fullName = `${agentUser.firstName} ${agentUser.lastName}`.trim() || agentUser.name || agentName;
      return agentUser.nickname ? `${fullName} (${agentUser.nickname})` : fullName;
    }
    
    return agentName;
  };

  const financeYears = Array.from(new Set(financeTransactions.filter(t => {
    if (userProfile.roles?.includes('admin')) return true;
    if (userProfile.company === 'Alan Bolton Property Consultants') return t.section === 'ABPC';
    if (userProfile.company === 'East Coast Real Estate') return t.section === 'ECRE';
    return false;
  }).map(t => t.date.substring(0, 4)))).sort().reverse();

  const financeMonths = Array.from(new Set(financeTransactions.filter(t => {
    const matchesSection = hasRole('admin') || 
      (userProfile.company === 'Alan Bolton Property Consultants' && t.section === 'ABPC') ||
      (userProfile.company === 'East Coast Real Estate' && t.section === 'ECRE');
    if (!matchesSection) return false;
    return financeYearFilter === 'all' || t.date.startsWith(financeYearFilter);
  }).map(t => t.date.substring(0, 7)))).sort().reverse();

  const getAgentPerformance = (months: number, section: 'ABPC' | 'ECRE') => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const periodEnd = new Date(startOfCurrentMonth.getTime() - 1);
    const periodStart = new Date(currentYear, currentMonth - months, 1);
    
    const startDateStr = periodStart.toISOString().split('T')[0];
    const endDateStr = periodEnd.toISOString().split('T')[0];
    
    const periodTransactions = financeTransactions.filter(t => {
      const isCorrectSection = t.section === section;

      return isCorrectSection &&
        t.agent?.toLowerCase() !== 'system' &&
        t.agent !== '-' &&
        t.agent !== '' &&
        t.type === 'income' && 
        t.date >= startDateStr && 
        t.date <= endDateStr;
    });
    
    const agentIncome: Record<string, number> = {};
    periodTransactions.forEach(t => {
      let normalizedAgent = t.agent;
      if (t.agent === 'Cap') normalizedAgent = 'Arnon Surison';
      if (t.agent === 'MP') normalizedAgent = 'Management Pot';
      if (t.agent === 'Pang') normalizedAgent = 'Oranoot Totong';
      if (t.agent === 'Aiden') normalizedAgent = 'Aiden Scott Gray';
      if (t.agent === 'Scott') normalizedAgent = 'Scott Smith';
      if (t.agent === 'Anni') normalizedAgent = 'Annipa Phasawat';
      if (t.agent === 'Noel') normalizedAgent = 'Noel Magold';
      if (t.agent === 'Aunt') normalizedAgent = 'Aunt Srisawat';
      if (t.agent === 'Sho') normalizedAgent = 'Sho';
      agentIncome[normalizedAgent] = (agentIncome[normalizedAgent] || 0) + t.amount;
    });
    
    const performance = Object.entries(agentIncome)
      .map(([agent, total]) => {
        // Find employee by name (full name or nickname)
        const agentUser = uniqueEmployees.find(u => {
          const fullName = `${u.firstName} ${u.lastName}`.trim();
          return fullName === agent || u.nickname === agent || u.name === agent;
        });
        
        return {
          agent,
          nickname: agentUser?.nickname,
          total,
          average: total / months,
          isActive: !agentUser || agentUser.active !== false
        };
      })
      .filter(p => p.isActive)
      .sort((a, b) => b.average - a.average);
    
    return { performance, startDateStr, endDateStr };
  };

  const performance3mABPC = getAgentPerformance(3, 'ABPC');
  const performance6mABPC = getAgentPerformance(6, 'ABPC');
  const performance3mECRE = getAgentPerformance(3, 'ECRE');
  const performance6mECRE = getAgentPerformance(6, 'ECRE');

  const getIndividualAgentReport = (agentName: string, yearFilter: string = 'all') => {
    if (!agentName) return [];
    
    const now = new Date();
    const months = [];
    const startDate = new Date(2022, 11, 1); // December 2022
    
    let currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
    while (currentDate >= startDate) {
      const monthStr = currentDate.toISOString().split('T')[0].substring(0, 7);
      if (yearFilter === 'all' || monthStr.startsWith(yearFilter)) {
        months.push(monthStr);
      }
      currentDate.setMonth(currentDate.getMonth() - 1);
    }
    
    return months.map(month => {
      const transactions = financeTransactions.filter(t => {
        let normalizedAgent = t.agent;
        if (t.agent === 'Cap') normalizedAgent = 'Arnon Surison';
        if (t.agent === 'MP') normalizedAgent = 'Management Pot';
        if (t.agent === 'Pang') normalizedAgent = 'Oranoot Totong';
        if (t.agent === 'Aiden') normalizedAgent = 'Aiden Scott Gray';
        if (t.agent === 'Scott') normalizedAgent = 'Scott Smith';
        if (t.agent === 'Anni') normalizedAgent = 'Annipa Phasawat';
        if (t.agent === 'Noel') normalizedAgent = 'Noel Magold';
        if (t.agent === 'Aunt') normalizedAgent = 'Aunt Srisawat';
        if (t.agent === 'Sho') normalizedAgent = 'Sho';
        
        return normalizedAgent === agentName && t.date.startsWith(month);
      });

      const income = transactions
        .filter(t => t.type === 'income' && !t.transferGroupId)
        .reduce((acc, t) => acc + t.amount, 0);
      
      const expenses = transactions
        .filter(t => t.type === 'expense' && !t.transferGroupId)
        .reduce((acc, t) => acc + t.amount, 0);

      const transfersIn = transactions
        .filter(t => !!t.transferGroupId && t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

      const transfersOut = transactions
        .filter(t => !!t.transferGroupId && t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);
      
      return { month, income, expenses, transfersIn, transfersOut };
    });
  };

  const downloadPDF = async () => {
    if (!selectedIndividualAgent) {
      toast.error("Please select an agent first");
      return;
    }
    setPdfFileName(`Report_${selectedIndividualAgent}_${reportYearFilter}_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowPdfPreview(true);
  };

  const executeDownloadPDF = async () => {
    if (!previewReportRef.current) return;
    
    const toastId = toast.loading('Generating PDF...');
    try {
      // Use dom-to-image-more which handles modern CSS (oklch, oklab, backdrop-filter) much better than html2canvas
      const dataUrl = await domtoimage.toPng(previewReportRef.current, {
        quality: 1.0,
        bgcolor: '#ffffff',
        width: previewReportRef.current.offsetWidth,
        height: previewReportRef.current.offsetHeight,
        style: {
          'border-radius': '0',
          'box-shadow': 'none',
          'margin': '0'
        }
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(pdfFileName);
      toast.success('PDF downloaded successfully', { id: toastId });
      setShowPdfPreview(false);
    } catch (error) {
      console.error('PDF save error:', error);
      toast.error('Failed to save PDF', { id: toastId });
    }
  };

  const filteredFinanceTransactions = financeTransactions.filter(t => {
    const isCorrectSection = userProfile.roles?.includes('admin') || 
      (userProfile.company === 'Alan Bolton Property Consultants' && t.section === 'ABPC') ||
      (userProfile.company === 'East Coast Real Estate' && t.section === 'ECRE');

    if (!isCorrectSection) return false;

    const matchesSection = financeSubTab.startsWith('ABPC') ? t.section === 'ABPC' : t.section === 'ECRE';
    const matchesAgent = financeAgentFilter === 'all' || 
                        t.agent === financeAgentFilter || 
                        (financeAgentFilter === 'Arnon Surison' && t.agent === 'Cap') ||
                        (financeAgentFilter === 'Management Pot' && t.agent === 'MP') ||
                        (financeAgentFilter === 'Oranoot Totong' && t.agent === 'Pang') ||
                        (financeAgentFilter === 'Aiden Scott Gray' && t.agent === 'Aiden') ||
                        (financeAgentFilter === 'Scott Smith' && t.agent === 'Scott') ||
                        (financeAgentFilter === 'Annipa Phasawat' && t.agent === 'Anni') ||
                        (financeAgentFilter === 'Noel Magold' && t.agent === 'Noel') ||
                        (financeAgentFilter === 'Aunt Srisawat' && t.agent === 'Aunt') ||
                        (financeAgentFilter === 'Sho' && t.agent === 'Sho');
    const matchesYear = financeYearFilter === 'all' || t.date.startsWith(financeYearFilter);
    const matchesMonth = financeMonthFilter === 'all' || t.date.startsWith(financeMonthFilter);
    const matchesAccount = (t.account || 'trading') === financeAccountFilter;
    const matchesType = financeTypeFilter === 'all' ? true : 
                       (financeTypeFilter === 'transfer' ? !!t.transferGroupId : 
                       (financeTypeFilter === t.type && !t.transferGroupId));
    const matchesSearch = !financeSearchTerm || t.description.toLowerCase().includes(financeSearchTerm.toLowerCase());
    return matchesSection && matchesAgent && matchesYear && matchesMonth && matchesAccount && matchesType && matchesSearch;
  });

  const filteredEmployees = uniqueEmployees
    .filter(emp => {
      // If manager, only show employees from their company
      const isRestrictedUser = (hasRole('manager') || hasRole('accounts')) && !hasRole('admin');
      if (isRestrictedUser) {
        const matchesCompany = emp.companyId === userProfile.companyId || emp.company === userProfile.company;
        if (!matchesCompany) return false;
      }

      const searchItems = [
        emp.name,
        emp.firstName,
        emp.lastName,
        emp.nickname,
        emp.email,
        emp.mobile,
        emp.company,
        emp.position
      ].filter(Boolean).map(s => String(s).toLowerCase());
      
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchItems.some(item => item.includes(searchTermLower));
      const matchesStatus = statusFilter === 'all' ? true : 
                          statusFilter === 'active' ? emp.active !== false : emp.active === false;
      const matchesRole = roleFilter === 'all' || (emp.roles || []).includes(roleFilter as any);
      const matchesCompany = companyFilter === 'all' || (companyFilter === 'Unassigned' ? !emp.company : emp.company === companyFilter);
      
      return matchesSearch && matchesStatus && matchesRole && matchesCompany;
    })
    .sort((a, b) => {
      const getTime = (val: any) => {
        if (!val) return 0;
        if (typeof val.toMillis === 'function') return val.toMillis();
        if (val.seconds) return val.seconds * 1000;
        if (val instanceof Date) return val.getTime();
        if (typeof val === 'string') return new Date(val).getTime();
        return 0;
      };
      if (sortOrder === 'last-active') {
        const activeA = getTime(a.updatedAt) || getTime(a.lastLoginAt) || getTime(a.createdAt);
        const activeB = getTime(b.updatedAt) || getTime(b.lastLoginAt) || getTime(b.createdAt);
        return activeB - activeA;
      }
      const timeA = getTime(a.createdAt) || getTime(a.employedFrom);
      const timeB = getTime(b.createdAt) || getTime(b.employedFrom);
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

  const isWhitelistedCompany = !!(userProfile.company?.trim());

  const isAbpcOrEcre = userProfile.company === 'Alan Bolton Property Consultants' || userProfile.company === 'East Coast Real Estate';
  const canAccessTools = hasRole('admin') || hasRole('manager') || hasRole('accounts') || isAbpcOrEcre;

  if (!hasRole('admin') && !hasRole('accounts') && !hasRole('manager') && auth.currentUser?.email !== 'shaneruddle@gmail.com' && !isWhitelistedCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <h2 className="text-2xl font-serif mb-4">Access Denied</h2>
          <p className="text-black/60 mb-8">You do not have administrative or accounting privileges.</p>
          <button onClick={onBack} className="text-gold font-bold uppercase tracking-widest text-xs">Back to Portfolio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarCollapsed ? 80 : 288,
          padding: isSidebarCollapsed ? '24px 12px' : '32px'
        }}
        className={cn(
          "hidden md:flex bg-white border-r border-black/5 flex-col h-screen sticky z-50 relative overflow-visible transition-all duration-500",
          isImpersonating ? "top-[38px]" : "top-0"
        )}
      >
        {/* Collapse Button on Edge */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-24 w-6 h-6 bg-white border border-black/5 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all z-[60] text-black/40 hover:text-black hover:scale-110"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        <div className={`mb-12 transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 invisible h-0 mb-0' : 'opacity-100 visible'}`}>
          <button onClick={onBack} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-black/40 hover:text-gold transition-colors mb-8 whitespace-nowrap">
            <ArrowLeft className="w-4 h-4" /> Back to Portfolio
          </button>
          <h1 className="text-3xl font-serif leading-tight whitespace-nowrap">Admin <br /><span className="italic">Dashboard</span></h1>
          <p className="text-[10px] uppercase tracking-widest font-bold text-black/20 mt-4 whitespace-nowrap">Management Suite</p>
        </div>

        <div className={`mb-8 flex justify-center transition-all duration-300 ${isSidebarCollapsed ? 'opacity-100 visible' : 'opacity-0 invisible h-0 mb-0'}`}>
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold font-serif text-xl">A</div>
        </div>

        <nav className="flex flex-col gap-2 flex-grow overflow-y-auto pr-2 custom-scrollbar overflow-x-hidden">
          {(hasRole('admin') || hasRole('manager') || hasRole('accounts')) && (
            <button 
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all relative group ${activeTab === 'employees' ? 'bg-gold text-white shadow-lg shadow-gold/20' : 'text-black/40 hover:bg-black/5 hover:text-black'}`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className={`transition-all duration-300 whitespace-nowrap ${isSidebarCollapsed ? 'opacity-0 translate-x-4 absolute' : 'opacity-100 translate-x-0'}`}>Staff Management</span>
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-black text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                  Staff Management
                </div>
              )}
            </button>
          )}
          {userProfile.roles?.includes('admin') && (
            <>
              <button 
                onClick={() => setActiveTab('companies')}
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all relative group ${activeTab === 'companies' ? 'bg-gold text-white shadow-lg shadow-gold/20' : 'text-black/40 hover:bg-black/5 hover:text-black'}`}
              >
                <Database className="w-4 h-4 shrink-0" />
                <span className={`transition-all duration-300 whitespace-nowrap ${isSidebarCollapsed ? 'opacity-0 translate-x-4 absolute' : 'opacity-100 translate-x-0'}`}>Companies</span>
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-black text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                    Companies
                  </div>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('blog')}
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all relative group ${activeTab === 'blog' ? 'bg-gold text-white shadow-lg shadow-gold/20' : 'text-black/40 hover:bg-black/5 hover:text-black'}`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className={`transition-all duration-300 whitespace-nowrap ${isSidebarCollapsed ? 'opacity-0 translate-x-4 absolute' : 'opacity-100 translate-x-0'}`}>Blog</span>
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-black text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                    Blog
                  </div>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('logs')}
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all relative group ${activeTab === 'logs' ? 'bg-gold text-white shadow-lg shadow-gold/20' : 'text-black/40 hover:bg-black/5 hover:text-black'}`}
              >
                <History className="w-4 h-4 shrink-0" />
                <span className={`transition-all duration-300 whitespace-nowrap ${isSidebarCollapsed ? 'opacity-0 translate-x-4 absolute' : 'opacity-100 translate-x-0'}`}>System Logs</span>
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-black text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                    System Logs
                  </div>
                )}
              </button>
            </>
          )}
          {(hasRole('admin') || hasRole('accounts')) && (
            <div className="flex flex-col">
              <button 
                onClick={() => {
                  if (activeTab === 'finance') {
                    setIsFinanceExpanded(!isFinanceExpanded);
                  } else {
                    setActiveTab('finance');
                    setIsFinanceExpanded(true);
                  }
                }}
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all relative group ${activeTab === 'finance' ? 'bg-gold text-white shadow-lg shadow-gold/20' : 'text-black/40 hover:bg-black/5 hover:text-black'}`}
              >
                <DollarSign className="w-4 h-4 shrink-0" />
                <span className={`transition-all duration-300 whitespace-nowrap flex-grow text-left ${isSidebarCollapsed ? 'opacity-0 translate-x-4 absolute' : 'opacity-100 translate-x-0'}`}>Finance</span>
                {!isSidebarCollapsed && (
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isFinanceExpanded ? 'rotate-180' : ''}`} />
                )}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-black text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                    Finance
                  </div>
                )}
              </button>
              
              {!isSidebarCollapsed && isFinanceExpanded && (
                <div className="ml-11 flex flex-col gap-1 mt-1 mb-4">
                  {(hasRole('admin') || userProfile.company === 'Alan Bolton Property Consultants') && (
                    <>
                      <button 
                        onClick={() => {
                          setFinanceSubTab('ABPC');
                        }}
                        className={`text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${financeSubTab === 'ABPC' ? 'text-gold bg-gold/5' : 'text-black/30 hover:text-black/60 hover:bg-black/2'}`}
                      >
                        ABPC
                      </button>
                      <button 
                        onClick={() => {
                          setFinanceSubTab('ABPC Agents');
                        }}
                        className={`text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${financeSubTab === 'ABPC Agents' ? 'text-gold bg-gold/5' : 'text-black/30 hover:text-black/60 hover:bg-black/2'}`}
                      >
                        ABPC Agents
                      </button>
                      <button 
                        onClick={() => {
                          setFinanceSubTab('ABPC Reports');
                        }}
                        className={`text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${financeSubTab === 'ABPC Reports' ? 'text-gold bg-gold/5' : 'text-black/30 hover:text-black/60 hover:bg-black/2'}`}
                      >
                        ABPC Reports
                      </button>
                    </>
                  )}
                  {(hasRole('admin') || userProfile.company === 'East Coast Real Estate') && (
                    <>
                      <button 
                        onClick={() => {
                          setFinanceSubTab('ECRE');
                        }}
                        className={`text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${financeSubTab === 'ECRE' ? 'text-gold bg-gold/5' : 'text-black/30 hover:text-black/60 hover:bg-black/2'}`}
                      >
                        ECRE
                      </button>
                      <button 
                        onClick={() => {
                          setFinanceSubTab('ECRE Agents');
                        }}
                        className={`text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${financeSubTab === 'ECRE Agents' ? 'text-gold bg-gold/5' : 'text-black/30 hover:text-black/60 hover:bg-black/2'}`}
                      >
                        ECRE Agents
                      </button>
                      <button 
                        onClick={() => {
                          setFinanceSubTab('ECRE Reports');
                        }}
                        className={`text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${financeSubTab === 'ECRE Reports' ? 'text-gold bg-gold/5' : 'text-black/30 hover:text-black/60 hover:bg-black/2'}`}
                      >
                        ECRE Reports
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          {canAccessTools && (
            <div className="flex flex-col">
              <button 
                onClick={() => {
                  if (activeTab === 'tools') {
                    setIsToolsExpanded(!isToolsExpanded);
                  } else {
                    setActiveTab('tools');
                    setIsToolsExpanded(true);
                  }
                }}
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all relative group ${activeTab === 'tools' ? (isToolsExpanded && !isSidebarCollapsed ? 'bg-gold/10 text-gold' : 'bg-gold text-white shadow-lg shadow-gold/20') : 'text-black/40 hover:bg-black/5 hover:text-black'}`}
              >
                <Wrench className="w-4 h-4 shrink-0" />
                <span className={`transition-all duration-300 whitespace-nowrap flex-grow text-left ${isSidebarCollapsed ? 'opacity-0 translate-x-4 absolute' : 'opacity-100 translate-x-0'}`}>Tools</span>
                {!isSidebarCollapsed && (
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isToolsExpanded ? 'rotate-180' : ''}`} />
                )}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-black text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                    Tools
                  </div>
                )}
              </button>
              
              {!isSidebarCollapsed && isToolsExpanded && (
                <div className="ml-11 flex flex-col gap-1 mt-1 mb-4">
                  <button 
                    onClick={() => {
                      setToolsSubTab('extractor-pro');
                    }}
                    className={`text-left px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${toolsSubTab === 'extractor-pro' ? 'bg-gold text-white shadow-md shadow-gold/20 translate-x-1' : 'text-black/30 hover:text-black/60 hover:bg-black/2'}`}
                  >
                    Extractor Pro
                  </button>
                </div>
              )}
            </div>
          )}
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all relative group ${activeTab === 'profile' ? 'bg-gold text-white shadow-lg shadow-gold/20' : 'text-black/40 hover:bg-black/5 hover:text-black'}`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span className={`transition-all duration-300 whitespace-nowrap ${isSidebarCollapsed ? 'opacity-0 translate-x-4 absolute' : 'opacity-100 translate-x-0'}`}>My Profile</span>
            {isSidebarCollapsed && (
              <div className="absolute left-full ml-4 px-3 py-2 bg-black text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                My Profile
              </div>
            )}
          </button>
          {userProfile.roles?.includes('admin') && (
            <div className="flex flex-col">
              <button 
                onClick={() => {
                  if (activeTab === 'settings') {
                    setIsSettingsExpanded(!isSettingsExpanded);
                  } else {
                    setActiveTab('settings');
                    setIsSettingsExpanded(true);
                  }
                }}
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all relative group ${activeTab === 'settings' ? 'bg-gold text-white shadow-lg shadow-gold/20' : 'text-black/40 hover:bg-black/5 hover:text-black'}`}
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span className={`transition-all duration-300 whitespace-nowrap flex-grow text-left ${isSidebarCollapsed ? 'opacity-0 translate-x-4 absolute' : 'opacity-100 translate-x-0'}`}>Site Settings</span>
                {!isSidebarCollapsed && (
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isSettingsExpanded ? 'rotate-180' : ''}`} />
                )}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-black text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                    Site Settings
                  </div>
                )}
              </button>
              
              {!isSidebarCollapsed && isSettingsExpanded && (
                <div className="ml-11 flex flex-col gap-1 mt-1 mb-4">
                  <button 
                    onClick={() => setSettingsSubTab('general')}
                    className={`text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${settingsSubTab === 'general' ? 'text-gold bg-gold/5' : 'text-black/30 hover:text-black/60 hover:bg-black/2'}`}
                  >
                    General
                  </button>
                  <button 
                    onClick={() => setSettingsSubTab('privacy')}
                    className={`text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${settingsSubTab === 'privacy' ? 'text-gold bg-gold/5' : 'text-black/30 hover:text-black/60 hover:bg-black/2'}`}
                  >
                    Privacy Settings
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="mt-auto pt-8 border-t border-black/5 flex flex-col gap-2">
          <button 
            onClick={() => auth.signOut()}
            className="flex items-center gap-3 px-4 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all w-full relative group"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className={`transition-all duration-300 whitespace-nowrap ${isSidebarCollapsed ? 'opacity-0 translate-x-4 absolute' : 'opacity-100 translate-x-0'}`}>Sign Out</span>
            {isSidebarCollapsed && (
              <div className="absolute left-full ml-4 px-3 py-2 bg-red-500 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                Sign Out
              </div>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Header (Visible only on small screens) */}
      <div className={cn(
        "md:hidden bg-white border-b border-black/5 p-4 flex items-center justify-between sticky z-50 transition-all duration-500",
        isImpersonating ? "top-[38px]" : "top-0"
      )}>
        <h1 className="text-xl font-serif italic text-gold">Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={onBack} className="p-2 text-black/40 hover:text-gold transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button onClick={() => auth.signOut()} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation (Bottom Bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 p-2 flex justify-around items-center z-50">
        {(hasRole('admin') || hasRole('manager') || hasRole('accounts')) && (
          <button onClick={() => setActiveTab('employees')} className={`p-3 rounded-xl transition-all ${activeTab === 'employees' ? 'bg-gold text-white' : 'text-black/40'}`}>
            <Users className="w-5 h-5" />
          </button>
        )}
        {userProfile.roles?.includes('admin') && (
          <>
            <button onClick={() => setActiveTab('logs')} className={`p-3 rounded-xl transition-all ${activeTab === 'logs' ? 'bg-gold text-white' : 'text-black/40'}`}>
              <History className="w-5 h-5" />
            </button>
            <button onClick={() => setActiveTab('blog')} className={`p-3 rounded-xl transition-all ${activeTab === 'blog' ? 'bg-gold text-white' : 'text-black/40'}`}>
              <FileText className="w-5 h-5" />
            </button>
          </>
        )}
        {(hasRole('admin') || hasRole('accounts')) && (
          <button onClick={() => setActiveTab('finance')} className={`p-3 rounded-xl transition-all ${activeTab === 'finance' ? 'bg-gold text-white' : 'text-black/40'}`}>
            <DollarSign className="w-5 h-5" />
          </button>
        )}
        {hasRole('admin') && (
          <button onClick={() => setActiveTab('tools')} className={`p-3 rounded-xl transition-all ${activeTab === 'tools' ? 'bg-gold text-white' : 'text-black/40'}`}>
            <Wrench className="w-5 h-5" />
          </button>
        )}
        <button onClick={() => setActiveTab('profile')} className={`p-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-gold text-white' : 'text-black/40'}`}>
          <User className="w-5 h-5" />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-8 md:p-16 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
            {activeTab === 'employees' && (
              <motion.div 
                key="employees"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* Stats Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
                  <div className="glass p-6 rounded-3xl flex flex-col justify-center">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-black/40 mb-1">Total Staff</div>
                    <div className="text-4xl font-serif text-gold">{employees.length}</div>
                  </div>
                  <div className="lg:col-span-3 glass p-8 rounded-[2.5rem]">
                    <button 
                      onClick={() => setIsCompanyDistributionExpanded(!isCompanyDistributionExpanded)}
                      className="w-full flex items-center justify-between group"
                    >
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <div className="text-[10px] uppercase tracking-[0.4em] font-bold text-gold">Company Distribution</div>
                          {isCompanyDistributionExpanded ? <ChevronUp className="w-3 h-3 text-gold" /> : <ChevronDown className="w-3 h-3 text-gold" />}
                        </div>
                        <div className="text-black/40 text-xs font-light">Staff allocation across your portfolio</div>
                      </div>
                      <div className="text-2xl font-serif text-black/20">{companies.length} <span className="text-xs uppercase tracking-widest font-sans font-bold ml-1">Companies</span></div>
                    </button>

                    <AnimatePresence>
                      {isCompanyDistributionExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-6 pt-8">
                            {Object.entries(
                              employees.reduce((acc: Record<string, { count: number, id?: string }>, emp) => {
                                const company = emp.company || 'Unassigned';
                                acc[company] = { 
                                  count: (acc[company]?.count || 0) + 1,
                                  id: emp.companyId
                                };
                                return acc;
                              }, {} as Record<string, { count: number, id?: string }>)
                            ).sort((a: [string, any], b: [string, any]) => b[1].count - a[1].count).map(([company, data]: [string, any]) => {
                              const info = getCompanyInfo(company, data.id);
                              const percentage = (data.count / employees.length) * 100;
                              return (
                                <div key={company} className="group">
                                  <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${info.color === 'bg-white' ? 'bg-gold' : info.color}`} />
                                      <span className="text-sm font-medium text-black group-hover:text-gold transition-colors">{company}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <span className="text-[10px] text-black/40 font-mono font-bold">{data.count} {data.count === 1 ? 'Person' : 'People'}</span>
                                      <span className="text-[10px] text-gold font-bold w-8 text-right">{Math.round(percentage)}%</span>
                                    </div>
                                  </div>
                                  <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      whileInView={{ width: `${percentage}%` }}
                                      viewport={{ once: true }}
                                      transition={{ duration: 1.2, ease: "circOut" }}
                                      className={`h-full rounded-full ${info.color === 'bg-white' ? 'bg-gold' : info.color} shadow-sm`}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <h3 className="text-xl font-serif">Staff Directory</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-black/20" />
                      <input 
                        type="text"
                        placeholder="Search staff..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-black/5 border-none rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-gold/20 outline-none w-full md:w-64"
                      />
                    </div>
                    <select 
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                      className="bg-black/5 border-none rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-gold/20 outline-none"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                    <select 
                      value={companyFilter}
                      onChange={(e) => setCompanyFilter(e.target.value)}
                      className="bg-black/5 border-none rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-gold/20 outline-none"
                    >
                      <option value="all">All Companies</option>
                      <option value="Unassigned">Unassigned</option>
                      {Object.keys(COMPANY_DATA).map(company => (
                        <option key={company} value={company}>{company}</option>
                      ))}
                      {companies.filter(c => !COMPANY_DATA[c.name]).map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>

                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="bg-black/5 border-none rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-gold/20 outline-none"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>

                    <select 
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="bg-black/5 border-none rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-gold/20 outline-none"
                    >
                      <option value="all">All Roles</option>
                      {['admin', 'manager', 'accounts', 'employee', 'agent', 'cashier', 'housekeeping'].map(role => (
                        <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    {(hasRole('admin') || hasRole('manager') || hasRole('accounts')) && (
                      <button 
                        onClick={() => handleEditEmployee(null)}
                        className="bg-gold text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gold/90 transition-all shadow-lg shadow-gold/20 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add Person
                      </button>
                    )}
                  </div>
                </div>

                <div className="glass rounded-3xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-bottom border-black/5 bg-black/2">
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Staff Member</th>
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Status</th>
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Company</th>
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Role</th>
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Position</th>
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40 text-center">Discounts</th>
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Code</th>
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((emp) => (
                        <tr 
                          key={emp.uid} 
                          className="border-bottom border-black/5 hover:bg-black/2 transition-colors group/row"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {emp.profileImage ? (
                                <img src={emp.profileImage} alt={emp.name} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold font-bold text-[10px]">
                                  {emp.firstName?.[0]}{emp.lastName?.[0]}
                                </div>
                              )}
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {emp.name || 'Unnamed'}
                                  {emp.active === false && (
                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[8px] font-bold uppercase rounded tracking-tighter">Inactive</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-black/40">{emp.email || emp.mobile}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              emp.active !== false ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                            )}>
                              <div className={cn("w-1.5 h-1.5 rounded-full", emp.active !== false ? "bg-green-500" : "bg-red-500")} />
                              {emp.active !== false ? 'Active' : 'Inactive'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {emp.company ? (
                                <>
                                  <div className={`w-6 h-6 rounded-lg ${getCompanyInfo(emp.company, emp.companyId).color} flex items-center justify-center ${getCompanyInfo(emp.company, emp.companyId).color === 'bg-white' ? 'text-black' : 'text-white'} font-bold text-[8px] shadow-sm shrink-0 overflow-hidden`}>
                                    {getCompanyInfo(emp.company, emp.companyId).logo && getCompanyInfo(emp.company, emp.companyId).logo !== "https://picsum.photos/seed/generic/100/100" ? (
                                      <img src={getCompanyInfo(emp.company, emp.companyId).logo} alt={emp.company} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : getCompanyInfo(emp.company, emp.companyId).shorthand}
                                  </div>
                                  <span className="text-xs text-black/60 truncate max-w-[120px]">{emp.company}</span>
                                </>
                              ) : (
                                <span className="text-xs text-black/20 italic">Unassigned</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {(emp.roles || []).map(role => (
                                <span key={role} className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                                  role === 'admin' ? 'bg-red-100 text-red-600' :
                                  role === 'manager' ? 'bg-blue-100 text-blue-600' :
                                  role === 'accounts' ? 'bg-green-100 text-green-600' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {role}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[10px] text-black/60 uppercase font-bold tracking-widest">{emp.position || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap justify-center gap-1 max-w-[120px] mx-auto">
                              {(emp.discountIds || []).length > 0 ? (
                                emp.discountIds?.map(id => {
                                  const d = discounts.find(disc => disc.id === id);
                                  if (!d) return null;
                                  const info = getCompanyInfo(d.restaurantId);
                                  return (
                                    <div 
                                      key={id} 
                                      className={`w-5 h-5 rounded-md ${info.color} ${info.color === 'bg-white' ? 'text-black' : 'text-white'} flex items-center justify-center text-[8px] font-bold shadow-sm`}
                                      title={d.name}
                                    >
                                      {info.shorthand}
                                    </div>
                                  );
                                })
                              ) : (
                                <span className="text-[10px] text-black/20 italic">None</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-gold font-bold">{emp.discountCode || 'N/A'}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {onImpersonate && userProfile.roles?.includes('admin') && emp.uid !== auth.currentUser?.uid && (
                                <button 
                                  onClick={() => onImpersonate(emp)}
                                  className="p-2 bg-black/5 hover:bg-gold hover:text-white rounded-lg transition-all"
                                  title="Run As User (Preview Mode)"
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                </button>
                              )}
                              <button 
                                onClick={() => handleEditEmployee(emp)}
                                className="p-2 bg-black/5 hover:bg-gold hover:text-white rounded-lg transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredEmployees.length === 0 && (
                    <div className="py-12 text-center text-black/40 text-sm italic">No employees found matching your search.</div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'companies' && (
              <motion.div 
                key="companies"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                  <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-serif">Company Management</h3>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleEditCompany(null)}
                      className="bg-gold text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gold-dark transition-all"
                    >
                      Add Company
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {companies.map((company) => {
                    const companyEmployees = employees.filter(e => e.companyId === company.id || e.company === company.name);
                    return (
                      <motion.div 
                        key={company.id}
                        layout
                        className="glass p-6 rounded-3xl flex flex-col group"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-black/5 flex items-center justify-center overflow-hidden">
                            {company.logo ? (
                              <img src={getLogoSrc(company.logo)} alt={company.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <Database className="w-6 h-6 text-black/20" />
                            )}
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-serif text-lg">{company.name}</h4>
                            {company.website && (
                              <a href={getUrlHref(company.website)} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gold hover:underline uppercase tracking-widest font-bold">
                                {company.website.replace(/^https?:\/\//, '')}
                              </a>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-black/60 font-light mb-6 line-clamp-2">
                          {company.description || 'No description provided.'}
                        </p>
                        
                        <div className="mb-6">
                          <div className="text-[10px] uppercase tracking-widest font-bold text-black/40 mb-2">Employees ({companyEmployees.length})</div>
                          <div className="flex -space-x-2 overflow-hidden">
                            {companyEmployees.slice(0, 5).map((emp) => (
                              <div key={emp.uid} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gold/10 flex items-center justify-center text-[8px] font-bold text-gold overflow-hidden">
                                {emp.profileImage ? (
                                  <img src={emp.profileImage} alt={emp.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <span>{emp.firstName?.[0]}{emp.lastName?.[0]}</span>
                                )}
                              </div>
                            ))}
                            {companyEmployees.length > 5 && (
                              <div className="flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-white bg-black/5 text-[8px] font-bold text-black/40">
                                +{companyEmployees.length - 5}
                              </div>
                            )}
                            {companyEmployees.length === 0 && (
                              <span className="text-[10px] text-black/20 italic">No employees assigned</span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 mt-auto">
                          <button 
                            onClick={() => handleEditCompany(company)}
                            className="flex-1 bg-black/5 text-black py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black/10 transition-all flex items-center justify-center gap-2"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteCompany(company.id, company.name)}
                            className="px-3 bg-red-50 text-red-500 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                {companies.length === 0 && (
                  <div className="py-24 text-center">
                    <Database className="w-12 h-12 text-black/5 mx-auto mb-4" />
                    <p className="text-black/40 italic">No companies added yet. Click "Add Company" to get started.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'logs' && (
              <motion.div 
                key="logs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-serif">System <span className="italic">Activity Logs</span></h3>
                    <p className="text-black/40 text-xs">Monitoring security and usage events in real-time</p>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative group">
                      <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none transition-transform group-hover:translate-y-[-40%]" />
                      <select 
                        value={logFilter}
                        onChange={(e) => setLogFilter(e.target.value as any)}
                        className="appearance-none bg-black/5 hover:bg-black/10 border-none rounded-xl pl-4 pr-9 py-2 text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-gold/20 outline-none w-full md:w-48 transition-all cursor-pointer"
                      >
                        <option value="ALL">All Sources ({[...logs, ...pattayaLogs, ...cajunLogs].length})</option>
                        <option value="SHANE">Shane ({logs.length})</option>
                        <option value="RENT A CAR">Rent A Car ({pattayaError || pattayaLogs.length})</option>
                        <option value="CAJUN">Cajun ({cajunError || cajunLogs.length})</option>
                      </select>
                    </div>
                    <div className="relative flex-grow md:flex-grow-0">
                      <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-black/20" />
                      <input 
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-black/5 border-none rounded-xl pl-8 pr-4 py-2 text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-gold/20 outline-none w-full md:w-48"
                      />
                    </div>

                  </div>
                </div>

                <div className="glass rounded-[2.5rem] overflow-hidden">
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-bottom border-black/5 bg-black/2 text-left">
                          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Source</th>
                          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Date & Time</th>
                          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Employee</th>
                          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Event Type</th>
                          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {[...logs, ...pattayaLogs, ...cajunLogs]
                          .filter(log => {
                            const matchesSearch = `${log.userName} ${log.userEmail} ${log.type} ${log.discountName} ${log.details} ${log.source}`.toLowerCase().includes(searchTerm.toLowerCase());
                            const matchesFilter = logFilter === 'ALL' || log.source === logFilter;
                            return matchesSearch && matchesFilter;
                          })
                          .sort((a, b) => {
                            const getTime = (val: any) => {
                              if (!val) return 0;
                              if (typeof val.toMillis === 'function') return val.toMillis();
                              if (val.seconds) return val.seconds * 1000;
                              if (val instanceof Date) return val.getTime();
                              if (typeof val === 'string') return new Date(val).getTime();
                              return 0;
                            };
                            const timeA = getTime(a.timestamp);
                            const timeB = getTime(b.timestamp);
                            return timeB - timeA;
                          })
                          .map((log) => (
                          <tr key={log.id} className="border-bottom border-black/5 hover:bg-black/2 transition-colors group">
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest ${log.source === 'SHANE' ? 'text-gold' : log.source === 'RENT A CAR' ? 'text-blue-500' : 'text-purple-500'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${log.source === 'SHANE' ? 'bg-gold' : log.source === 'RENT A CAR' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                                {log.source}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs font-mono whitespace-nowrap">
                              {(() => {
                                const time = log.timestamp;
                                if (!time) return 'Pending...';
                                let date;
                                if ((time as any).seconds) date = new Date((time as any).seconds * 1000);
                                else if (typeof (time as any).toMillis === 'function') date = new Date((time as any).toMillis());
                                else date = new Date(time as any);
                                
                                return isNaN(date.getTime()) ? 'Pending...' : date.toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                });
                              })()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium">
                                {log.userName || (log.userEmail ? log.userEmail.split('@')[0] : 'Unknown')}
                              </div>
                              <div className="text-[10px] text-black/40">{log.userEmail}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                (log.type || (log as any).action) === 'login' || (log.type || (log as any).action)?.includes('Login') ? 'bg-blue-50 text-blue-600' : 
                                (log.type || (log as any).action) === 'signup' || (log.type || (log as any).action)?.includes('Created') ? 'bg-green-50 text-green-600' :
                                (log.type || (log as any).action)?.includes('finance') ? 'bg-purple-50 text-purple-600' :
                                (log.type || (log as any).action)?.includes('Update') || (log.type || (log as any).action)?.includes('update') ? 'bg-amber-50 text-amber-600' :
                                'bg-gold/10 text-gold'
                              }`}>
                                {(log.type || (log as any).action || 'activity').replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs">
                              {log.type === 'login' ? (
                                <span className="text-black/60 italic">User logged in to the application</span>
                              ) : log.type === 'signup' ? (
                                <span className="text-black/60">{log.details || 'New user registered'}</span>
                              ) : log.type?.startsWith('finance_') ? (
                                <span className="text-black/60">{log.details}</span>
                              ) : log.type?.includes('_update') ? (
                                <span className="text-black/60">{log.details}</span>
                              ) : (
                                <div>
                                  <div className="font-medium text-gold">{log.discountName}</div>
                                  <div className="text-[10px] text-black/40 uppercase tracking-widest">{log.restaurantId}</div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                        {[...logs, ...pattayaLogs, ...cajunLogs].length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-24 text-center text-black/40 italic text-sm">
                              No logs found for any source.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile List View */}
                  <div className="md:hidden divide-y divide-black/5 bg-white">
                    {[...logs, ...pattayaLogs, ...cajunLogs]
                      .filter(log => {
                        const matchesSearch = `${log.userName} ${log.userEmail} ${log.type} ${log.discountName} ${log.details} ${log.source}`.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesFilter = logFilter === 'ALL' || log.source === logFilter;
                        return matchesSearch && matchesFilter;
                      })
                      .sort((a, b) => {
                        const getTime = (val: any) => {
                          if (!val) return 0;
                          if (typeof val.toMillis === 'function') return val.toMillis();
                          if (val.seconds) return val.seconds * 1000;
                          if (val instanceof Date) return val.getTime();
                          if (typeof val === 'string') return new Date(val).getTime();
                          return 0;
                        };
                        const timeA = getTime(a.timestamp);
                        const timeB = getTime(b.timestamp);
                        return timeB - timeA;
                      })
                      .map((log) => (
                        <div key={log.id} className="p-4 bg-white hover:bg-black/2 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className={`inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest ${log.source === 'SHANE' ? 'text-gold' : log.source === 'RENT A CAR' ? 'text-blue-500' : 'text-purple-500'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${log.source === 'SHANE' ? 'bg-gold' : log.source === 'RENT A CAR' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                              {log.source}
                            </span>
                            <span className="text-[10px] font-mono text-black/40">
                              {(() => {
                                const time = log.timestamp;
                                if (!time) return '';
                                let date;
                                if ((time as any).seconds) date = new Date((time as any).seconds * 1000);
                                else if (typeof (time as any).toMillis === 'function') date = new Date((time as any).toMillis());
                                else date = new Date(time as any);
                                
                                return isNaN(date.getTime()) ? '' : date.toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                });
                              })()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-xs font-bold text-black/80">
                              {log.userName || (log.userEmail ? log.userEmail.split('@')[0] : 'Unknown')}
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                                (log.type || (log as any).action) === 'login' || (log.type || (log as any).action)?.includes('Login') ? 'bg-blue-50 text-blue-600' : 
                                (log.type || (log as any).action) === 'signup' || (log.type || (log as any).action)?.includes('Created') ? 'bg-green-50 text-green-600' :
                                (log.type || (log as any).action)?.includes('finance') ? 'bg-purple-50 text-purple-600' :
                                (log.type || (log as any).action)?.includes('Update') || (log.type || (log as any).action)?.includes('update') ? 'bg-amber-50 text-amber-600' :
                                'bg-gold/10 text-gold'
                              }`}>
                                {(log.type || (log as any).action || 'activity').replace('_', ' ').split(' ')[0]}
                            </span>
                          </div>
                          <div className="mt-1 text-[10px] text-black/40 truncate">
                            {log.details || (log.discountName ? `${log.discountName} @ ${log.restaurantId}` : 'Application activity')}
                          </div>
                        </div>
                      ))}
                      {[...logs, ...pattayaLogs, ...cajunLogs].length === 0 && (
                        <div className="py-12 text-center text-black/40 italic text-xs">
                          No logs found.
                        </div>
                      )}
                  </div>
                </div>

              </motion.div>
            )}

            {activeTab === 'finance' && (hasRole('admin') || hasRole('accounts')) && (
              <motion.div 
                key="finance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                  <div>
                    <h3 className="text-2xl font-serif">Finance Management</h3>
                  </div>

                  {/* Mobile Finance Sub-tabs */}
                  <div className="md:hidden flex bg-black/5 p-1 rounded-xl mb-6 overflow-x-auto no-scrollbar">
                    {(hasRole('admin') || userProfile.company === 'Alan Bolton Property Consultants') && (
                      <>
                        <button 
                          onClick={() => {
                            setFinanceSubTab('ABPC');
                          }}
                          className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${financeSubTab === 'ABPC' ? 'bg-white text-gold shadow-sm' : 'text-black/40'}`}
                        >
                          ABPC
                        </button>
                        <button 
                          onClick={() => {
                            setFinanceSubTab('ABPC Agents');
                          }}
                          className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${financeSubTab === 'ABPC Agents' ? 'bg-white text-gold shadow-sm' : 'text-black/40'}`}
                        >
                          ABPC Agents
                        </button>
                        <button 
                          onClick={() => {
                            setFinanceSubTab('ABPC Reports');
                          }}
                          className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${financeSubTab === 'ABPC Reports' ? 'bg-white text-gold shadow-sm' : 'text-black/40'}`}
                        >
                          ABPC Reports
                        </button>
                      </>
                    )}
                    {(hasRole('admin') || userProfile.company === 'East Coast Real Estate') && (
                      <>
                        <button 
                          onClick={() => {
                            setFinanceSubTab('ECRE');
                          }}
                          className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${financeSubTab === 'ECRE' ? 'bg-white text-gold shadow-sm' : 'text-black/40'}`}
                        >
                          ECRE
                        </button>
                        <button 
                          onClick={() => {
                            setFinanceSubTab('ECRE Agents');
                          }}
                          className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${financeSubTab === 'ECRE Agents' ? 'bg-white text-gold shadow-sm' : 'text-black/40'}`}
                        >
                          ECRE Agents
                        </button>
                        <button 
                          onClick={() => {
                            setFinanceSubTab('ECRE Reports');
                          }}
                          className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${financeSubTab === 'ECRE Reports' ? 'bg-white text-gold shadow-sm' : 'text-black/40'}`}
                        >
                          ECRE Reports
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                  </div>
                </div>

                {(financeSubTab === 'ABPC Agents' || financeSubTab === 'ECRE Agents') ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* 3-Month Performance */}
                      <div className="glass p-8 rounded-[2.5rem]">
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <h4 className="text-lg font-serif">3-Month Performance</h4>
                            <p className="text-[10px] text-black/40 uppercase tracking-widest">
                              {new Date(financeSubTab === 'ABPC Agents' ? performance3mABPC.startDateStr : performance3mECRE.startDateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {new Date(financeSubTab === 'ABPC Agents' ? performance3mABPC.endDateStr : performance3mECRE.endDateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="bg-gold/10 text-gold px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            Avg Income / Month
                          </div>
                        </div>
                        <div className="space-y-4">
                          {(financeSubTab === 'ABPC Agents' ? performance3mABPC.performance : performance3mECRE.performance).map((p, idx) => (
                            <div key={p.agent} className="flex items-center justify-between p-4 bg-black/2 rounded-2xl border border-black/5">
                              <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-xs">
                                  {idx + 1}
                                </div>
                                <div>
                                  <div className="text-sm font-medium">
                                    {p.agent} {p.nickname && p.nickname !== p.agent && `(${p.nickname})`}
                                  </div>
                                  <div className="text-[10px] text-black/40 uppercase tracking-widest">Total: {formatCurrency(p.total)}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-gold">
                                  {formatCurrency(p.average)}
                                </div>
                              </div>
                            </div>
                          ))}
                          {(financeSubTab === 'ABPC Agents' ? performance3mABPC.performance : performance3mECRE.performance).length === 0 && (
                            <div className="py-12 text-center text-black/40 italic text-sm">No data for this period.</div>
                          )}
                        </div>
                      </div>

                      {/* 6-Month Performance */}
                      <div className="glass p-8 rounded-[2.5rem]">
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <h4 className="text-lg font-serif">6-Month Performance</h4>
                            <p className="text-[10px] text-black/40 uppercase tracking-widest">
                              {new Date(financeSubTab === 'ABPC Agents' ? performance6mABPC.startDateStr : performance6mECRE.startDateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {new Date(financeSubTab === 'ABPC Agents' ? performance6mABPC.endDateStr : performance6mECRE.endDateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="bg-gold/10 text-gold px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            Avg Income / Month
                          </div>
                        </div>
                        <div className="space-y-4">
                          {(financeSubTab === 'ABPC Agents' ? performance6mABPC.performance : performance6mECRE.performance).map((p, idx) => (
                            <div key={p.agent} className="flex items-center justify-between p-4 bg-black/2 rounded-2xl border border-black/5">
                              <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-xs">
                                  {idx + 1}
                                </div>
                                <div>
                                  <div className="text-sm font-medium">
                                    {p.agent} {p.nickname && p.nickname !== p.agent && `(${p.nickname})`}
                                  </div>
                                  <div className="text-[10px] text-black/40 uppercase tracking-widest">Total: {formatCurrency(p.total)}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-gold">
                                  {formatCurrency(p.average)}
                                </div>
                              </div>
                            </div>
                          ))}
                          {(financeSubTab === 'ABPC Agents' ? performance6mABPC.performance : performance6mECRE.performance).length === 0 && (
                            <div className="py-12 text-center text-black/40 italic text-sm">No data for this period.</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Individual Agent Monthly Income Report */}
                    <div className="glass p-8 rounded-[2.5rem]">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div className="w-[700px]">
                          <h4 className="text-lg font-serif">Individual Agent <span className="italic">Monthly Income</span></h4>
                        </div>
                        <select 
                          value={selectedIndividualAgent}
                          onChange={(e) => setSelectedIndividualAgent(e.target.value)}
                          className="bg-black/5 border-none rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-gold/20 outline-none min-w-[200px]"
                        >
                          <option value="">Select Agent...</option>
                          {financeAgents.filter(agent => {
                            const section = financeSubTab === 'ABPC Agents' ? 'ABPC' : 'ECRE';
                            return financeTransactions.some(t => {
                              let normalizedAgent = t.agent;
                              if (t.agent === 'Cap') normalizedAgent = 'Arnon Surison';
                              if (t.agent === 'MP') normalizedAgent = 'Management Pot';
                              if (t.agent === 'Pang') normalizedAgent = 'Oranoot Totong';
                              if (t.agent === 'Aiden') normalizedAgent = 'Aiden Scott Gray';
                              if (t.agent === 'Scott') normalizedAgent = 'Scott Smith';
                              if (t.agent === 'Anni') normalizedAgent = 'Annipa Phasawat';
                              if (t.agent === 'Noel') normalizedAgent = 'Noel Magold';
                              if (t.agent === 'Aunt') normalizedAgent = 'Aunt Srisawat';
                              if (t.agent === 'Sho') normalizedAgent = 'Sho';
                              return normalizedAgent === agent && t.section === section;
                            });
                          }).map(agent => (
                            <option key={agent} value={agent}>{getAgentDisplayName(agent)}</option>
                          ))}
                        </select>
                      </div>

                      {selectedIndividualAgent ? (
                        <div className="overflow-x-auto [transform:rotateX(180deg)]">
                          <table className="w-full text-left border-collapse [transform:rotateX(180deg)]">
                            <thead>
                              <tr className="border-bottom border-black/5 bg-black/2">
                                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Month</th>
                                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40 text-right">Income</th>
                                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40 text-right">Expenses</th>
                                {!financeSubTab.startsWith('ABPC') && (
                                  <>
                                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40 text-right">Transfers In</th>
                                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40 text-right">Transfers Out</th>
                                  </>
                                )}
                                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40 text-right">Net</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getIndividualAgentReport(selectedIndividualAgent).map((item) => (
                                <tr key={item.month} className="border-bottom border-black/5 hover:bg-black/2 transition-colors">
                                  <td className="px-6 py-4 text-sm font-medium">
                                    {new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                  </td>
                                  <td className="px-6 py-4 text-sm font-bold text-right text-green-600">
                                    {formatCurrency(item.income)}
                                  </td>
                                  <td className="px-6 py-4 text-sm font-bold text-right text-red-600">
                                    {formatCurrency(item.expenses)}
                                  </td>
                                  {!financeSubTab.startsWith('ABPC') && (
                                    <>
                                      <td className="px-6 py-4 text-sm font-bold text-right text-blue-600">
                                        {formatCurrency(item.transfersIn)}
                                      </td>
                                      <td className="px-6 py-4 text-sm font-bold text-right text-indigo-600">
                                        {formatCurrency(item.transfersOut)}
                                      </td>
                                    </>
                                  )}
                                  <td className={`px-6 py-4 text-sm font-bold text-right ${
                                    (item.income + (financeSubTab.startsWith('ABPC') ? 0 : item.transfersIn) - item.expenses - (financeSubTab.startsWith('ABPC') ? 0 : item.transfersOut)) >= 0 ? 'text-gold' : 'text-red-500'
                                  }`}>
                                    {formatCurrency(
                                      item.income + (financeSubTab.startsWith('ABPC') ? 0 : item.transfersIn) - item.expenses - (financeSubTab.startsWith('ABPC') ? 0 : item.transfersOut)
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="py-12 text-center text-black/40 italic text-sm border-2 border-dashed border-black/5 rounded-3xl">
                          Please select an agent to view their monthly report.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (financeSubTab === 'ABPC Reports' || financeSubTab === 'ECRE Reports') ? (
                  <div className="space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 print:hidden">
                      <div>
                        <h4 className="text-lg font-serif">Employee <span className="italic">Monthly Report</span></h4>
                        <p className="text-[10px] text-black/40 uppercase tracking-widest mt-1">
                          Comprehensive performance and details report
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <select 
                          value={reportYearFilter}
                          onChange={(e) => setReportYearFilter(e.target.value)}
                          className="bg-black/5 border-none rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-gold/20 outline-none"
                        >
                          <option value="all">All Years</option>
                          {financeYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        <select 
                          value={selectedIndividualAgent}
                          onChange={(e) => setSelectedIndividualAgent(e.target.value)}
                          className="bg-black/5 border-none rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-gold/20 outline-none min-w-[250px]"
                        >
                          <option value="">Select Employee...</option>
                          {uniqueEmployees
                            .filter(emp => {
                              const targetCompany = financeSubTab.startsWith('ABPC') ? 'Alan Bolton Property Consultants' : 'East Coast Real Estate';
                              return emp.company === targetCompany && emp.active !== false;
                            })
                            .map(emp => {
                              const fullName = `${emp.firstName} ${emp.lastName}`.trim();
                              const displayName = emp.name || fullName;
                              return (
                                <option key={emp.uid} value={displayName}>
                                  {displayName} {emp.nickname ? `(${emp.nickname})` : ''}
                                </option>
                              );
                            })
                          }
                        </select>
                      </div>
                    </div>

                    <ReportDocument 
                      ref={reportRef}
                      selectedIndividualAgent={selectedIndividualAgent}
                      reportYearFilter={reportYearFilter}
                      financeSubTab={financeSubTab}
                      uniqueEmployees={uniqueEmployees}
                      getIndividualAgentReport={getIndividualAgentReport}
                      getCompanyInfo={getCompanyInfo}
                      formatCurrency={formatCurrency}
                    />

                    <div className="flex justify-end gap-3 print:hidden">
                      <button 
                        onClick={downloadPDF}
                        className="bg-black/5 text-black px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black/10 transition-all flex items-center gap-2 border border-black/5"
                      >
                        <FileDown className="w-4 h-4" /> Download PDF
                      </button>
                      <button 
                        onClick={() => {
                          const report = getIndividualAgentReport(selectedIndividualAgent, reportYearFilter);
                          const exportData = report.map(item => ({
                            Month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                            Income: item.income
                          }));

                          setExportPreviewData(exportData);
                          setExportPreviewTitle(`Report: ${selectedIndividualAgent} (${reportYearFilter})`);
                          setExportPreviewFileName(`Report_${selectedIndividualAgent}_${reportYearFilter}_${new Date().toISOString().split('T')[0]}.csv`);
                          setShowExportPreview(true);
                        }}
                        className="bg-black text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black/90 transition-all flex items-center gap-2 shadow-lg shadow-black/20"
                      >
                        <Download className="w-4 h-4" /> Export CSV
                      </button>
                    </div>
                  </div>
                ) : financeSubTab === 'ABPC' ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Filters Panel */}
                      <div className="lg:col-span-1 glass p-6 rounded-3xl space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-black/40 mb-2">Filters</h4>
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-black/20" />
                            <input 
                              type="text"
                              placeholder="Search descriptions..."
                              value={financeSearchTerm}
                              onChange={(e) => setFinanceSearchTerm(e.target.value)}
                              className="w-full bg-black/5 border-none rounded-xl pl-8 pr-4 py-2.5 text-[9px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-gold/20 outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <select 
                              value={financeYearFilter}
                              onChange={(e) => {
                                setFinanceYearFilter(e.target.value);
                                setFinanceMonthFilter('all');
                              }}
                              className="w-full bg-black/5 border-none rounded-xl px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-gold/20 outline-none"
                            >
                              <option value="all">All Years</option>
                              {financeYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                            <select 
                              value={financeMonthFilter}
                              onChange={(e) => setFinanceMonthFilter(e.target.value)}
                              className="w-full bg-black/5 border-none rounded-xl px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-gold/20 outline-none"
                            >
                              <option value="all">All Months</option>
                              {financeMonths.map(month => (
                                <option key={month} value={month}>{new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</option>
                              ))}
                            </select>
                          </div>
                          <select 
                            value={financeAgentFilter}
                            onChange={(e) => setFinanceAgentFilter(e.target.value)}
                            className="w-full bg-black/5 border-none rounded-xl px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-gold/20 outline-none"
                          >
                            <option value="all">All Agents</option>
                            {financeAgents.map(agent => (
                              <option key={agent} value={agent}>{getAgentDisplayName(agent)}</option>
                            ))}
                          </select>
                          <div className="grid grid-cols-2 gap-2">
                            <select 
                              value={financeAccountFilter}
                              onChange={(e) => setFinanceAccountFilter(e.target.value)}
                              className="w-full bg-black/5 border-none rounded-xl px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-gold/20 outline-none"
                            >
                              <option value="trading">Trading</option>
                              {!financeSubTab.startsWith('ABPC') && <option value="savings">Savings</option>}
                            </select>
                            <select 
                              value={financeTypeFilter}
                              onChange={(e) => setFinanceTypeFilter(e.target.value)}
                              className="w-full bg-black/5 border-none rounded-xl px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-gold/20 outline-none"
                            >
                              <option value="all">All Types</option>
                              <option value="income">Income</option>
                              <option value="expense">Expense</option>
                              {!financeSubTab.startsWith('ABPC') && <option value="transfer">Transfer</option>}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Summary Panel */}
                      <div className="lg:col-span-2 glass p-6 rounded-3xl">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h4 className="text-lg font-serif text-black">Financial Summary</h4>
                            <p className="text-[9px] text-black/40 uppercase tracking-widest mt-0.5">{financeSubTab}</p>
                          </div>
                          <div className="px-3 py-1 bg-black/5 rounded-lg border border-black/5">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-black/40">
                              {financeMonthFilter === 'all' ? 'All Time' : new Date(financeMonthFilter + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {/* Income */}
                          <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl border border-green-100/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white shadow-sm">
                                <TrendingUp className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Income</span>
                            </div>
                            <span className="text-sm font-serif text-green-700">
                              {formatCurrency(
                                filteredFinanceTransactions.filter(t => t.type === 'income' && !t.transferGroupId).reduce((acc, t) => acc + (Number(t.amount) || 0), 0)
                              )}
                            </span>
                          </div>

                          {/* Expenses */}
                          <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white shadow-sm">
                                <TrendingDown className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Expenses</span>
                            </div>
                            <span className="text-sm font-serif text-red-700">
                              {formatCurrency(
                                filteredFinanceTransactions.filter(t => t.type === 'expense' && !t.transferGroupId).reduce((acc, t) => acc + (Number(t.amount) || 0), 0)
                              )}
                            </span>
                          </div>

                          {/* Transfers In */}
                          <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-sm">
                                <ArrowDownLeft className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Transfers In</span>
                            </div>
                            <span className="text-sm font-serif text-blue-700">
                              {formatCurrency(
                                filteredFinanceTransactions.filter(t => !!t.transferGroupId && t.type === 'income').reduce((acc, t) => acc + (Number(t.amount) || 0), 0)
                              )}
                            </span>
                          </div>

                          {/* Transfers Out */}
                          <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-sm">
                                <ArrowUpRight className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Transfers Out</span>
                            </div>
                            <span className="text-sm font-serif text-indigo-700">
                              {formatCurrency(
                                filteredFinanceTransactions.filter(t => !!t.transferGroupId && t.type === 'expense').reduce((acc, t) => acc + (Number(t.amount) || 0), 0)
                              )}
                            </span>
                          </div>

                          {/* Net Balance */}
                          <div className="flex items-center justify-between p-3 bg-black/5 rounded-xl border border-black/10">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white shadow-sm">
                                <DollarSign className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold text-black/60 uppercase tracking-wider">Net Balance</span>
                            </div>
                            <span className={`text-sm font-serif ${
                              filteredFinanceTransactions.reduce((acc, t) => acc + (t.type === 'income' ? (Number(t.amount) || 0) : -(Number(t.amount) || 0)), 0) >= 0 
                              ? 'text-gold' : 'text-red-500'
                            }`}>
                              {formatCurrency(
                                filteredFinanceTransactions.reduce((acc, t) => acc + (t.type === 'income' ? (Number(t.amount) || 0) : -(Number(t.amount) || 0)), 0)
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full space-y-8">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={handleExportFinance}
                          className="bg-black/5 text-black px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black/10 transition-all flex items-center gap-2 border border-black/5"
                        >
                          <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <button 
                          onClick={() => {
                            setEditingTransaction(null);
                            setNewTransaction({
                              type: 'income',
                              dealType: 'new',
                              leadFrom: '',
                              agent: '-',
                              date: new Date().toISOString().split('T')[0]
                            });
                            setShowAddTransaction(true);
                          }}
                          className="bg-gold text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gold/90 transition-all flex items-center gap-2 shadow-lg shadow-gold/20"
                        >
                          <Plus className="w-4 h-4" /> Add Transaction
                        </button>
                      </div>

                      <div className="glass rounded-[2.5rem] overflow-x-auto [transform:rotateX(180deg)]">
                        <table className="w-full text-left border-collapse min-w-[800px] [transform:rotateX(180deg)]">
                          <thead>
                            <tr className="border-bottom border-black/5 bg-black/2">
                              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Date</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Description</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Deal</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Lead From</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Agent</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40 text-right">Amount</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredFinanceTransactions.map((t) => (
                              <tr key={t.id} className="border-bottom border-black/5 hover:bg-black/2 transition-colors group">
                                <td className="px-6 py-4 text-xs font-mono">{t.date}</td>
                                <td className="px-6 py-4">
                                  <div className="text-sm font-medium">{t.description}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className={cn(
                                    "inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest",
                                    t.dealType === 'new' ? "bg-gold/10 text-gold" : 
                                    t.dealType === 'renewal' ? "bg-blue-50 text-blue-600" : "text-black/40"
                                  )}>
                                    {t.dealType === '-' ? '-' : t.dealType}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-[10px] font-bold uppercase tracking-widest text-black/40">
                                    {t.leadFrom || '-'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-xs">
                                  {getAgentDisplayName(t.agent)}
                                </td>
                                <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-1 transition-opacity">
                                    <button 
                                      onClick={() => handleEditTransaction(t)}
                                      className="p-2 text-black/10 hover:text-gold transition-colors"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => setConfirmDeleteTransaction(t)}
                                      className="p-2 text-black/10 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {filteredFinanceTransactions.length === 0 && (
                              <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-black/40 italic text-sm">
                                  No transactions found matching your filters.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Filters Panel */}
                      <div className="lg:col-span-1 glass p-6 rounded-3xl space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-black/40 mb-2">Filters</h4>
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-black/20" />
                            <input 
                              type="text"
                              placeholder="Search descriptions..."
                              value={financeSearchTerm}
                              onChange={(e) => setFinanceSearchTerm(e.target.value)}
                              className="w-full bg-black/5 border-none rounded-xl pl-8 pr-4 py-2.5 text-[9px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-gold/20 outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <select 
                              value={financeYearFilter}
                              onChange={(e) => {
                                setFinanceYearFilter(e.target.value);
                                setFinanceMonthFilter('all');
                              }}
                              className="w-full bg-black/5 border-none rounded-xl px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-gold/20 outline-none"
                            >
                              <option value="all">All Years</option>
                              {financeYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                            <select 
                              value={financeMonthFilter}
                              onChange={(e) => setFinanceMonthFilter(e.target.value)}
                              className="w-full bg-black/5 border-none rounded-xl px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-gold/20 outline-none"
                            >
                              <option value="all">All Months</option>
                              {financeMonths.map(month => (
                                <option key={month} value={month}>{new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</option>
                              ))}
                            </select>
                          </div>
                          <select 
                            value={financeAgentFilter}
                            onChange={(e) => setFinanceAgentFilter(e.target.value)}
                            className="w-full bg-black/5 border-none rounded-xl px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-gold/20 outline-none"
                          >
                            <option value="all">All Agents</option>
                            {financeAgents.map(agent => (
                              <option key={agent} value={agent}>{getAgentDisplayName(agent)}</option>
                            ))}
                          </select>
                          <div className="grid grid-cols-2 gap-2">
                            <select 
                              value={financeAccountFilter}
                              onChange={(e) => setFinanceAccountFilter(e.target.value)}
                              className="w-full bg-black/5 border-none rounded-xl px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-gold/20 outline-none"
                            >
                              <option value="trading">Trading</option>
                              {!financeSubTab.startsWith('ABPC') && <option value="savings">Savings</option>}
                            </select>
                            <select 
                              value={financeTypeFilter}
                              onChange={(e) => setFinanceTypeFilter(e.target.value)}
                              className="w-full bg-black/5 border-none rounded-xl px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-gold/20 outline-none"
                            >
                              <option value="all">All Types</option>
                              <option value="income">Income</option>
                              <option value="expense">Expense</option>
                              {!financeSubTab.startsWith('ABPC') && <option value="transfer">Transfer</option>}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Summary Panel */}
                      <div className="lg:col-span-2 glass p-6 rounded-3xl">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h4 className="text-lg font-serif text-black">Financial Summary</h4>
                            <p className="text-[9px] text-black/40 uppercase tracking-widest mt-0.5">{financeSubTab}</p>
                          </div>
                          <div className="px-3 py-1 bg-black/5 rounded-lg border border-black/5">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-black/40">
                              {financeMonthFilter === 'all' ? 'All Time' : new Date(financeMonthFilter + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {/* Income */}
                          <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl border border-green-100/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white shadow-sm">
                                <TrendingUp className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Income</span>
                            </div>
                            <span className="text-sm font-serif text-green-700">
                              {formatCurrency(
                                filteredFinanceTransactions.filter(t => t.type === 'income' && !t.transferGroupId).reduce((acc, t) => acc + (Number(t.amount) || 0), 0)
                              )}
                            </span>
                          </div>

                          {/* Expenses */}
                          <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white shadow-sm">
                                <TrendingDown className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Expenses</span>
                            </div>
                            <span className="text-sm font-serif text-red-700">
                              {formatCurrency(
                                filteredFinanceTransactions.filter(t => t.type === 'expense' && !t.transferGroupId).reduce((acc, t) => acc + (Number(t.amount) || 0), 0)
                              )}
                            </span>
                          </div>

                          {/* Transfers In */}
                          <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-sm">
                                <ArrowDownLeft className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Transfers In</span>
                            </div>
                            <span className="text-sm font-serif text-blue-700">
                              {formatCurrency(
                                filteredFinanceTransactions.filter(t => !!t.transferGroupId && t.type === 'income').reduce((acc, t) => acc + (Number(t.amount) || 0), 0)
                              )}
                            </span>
                          </div>

                          {/* Transfers Out */}
                          <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-sm">
                                <ArrowUpRight className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Transfers Out</span>
                            </div>
                            <span className="text-sm font-serif text-indigo-700">
                              {formatCurrency(
                                filteredFinanceTransactions.filter(t => !!t.transferGroupId && t.type === 'expense').reduce((acc, t) => acc + (Number(t.amount) || 0), 0)
                              )}
                            </span>
                          </div>

                          {/* Net Balance */}
                          <div className="flex items-center justify-between p-3 bg-black/5 rounded-xl border border-black/10">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white shadow-sm">
                                <DollarSign className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold text-black/60 uppercase tracking-wider">Net Balance</span>
                            </div>
                            <span className={`text-sm font-serif ${
                              filteredFinanceTransactions.reduce((acc, t) => acc + (t.type === 'income' ? (Number(t.amount) || 0) : -(Number(t.amount) || 0)), 0) >= 0 
                              ? 'text-gold' : 'text-red-500'
                            }`}>
                              {formatCurrency(
                                filteredFinanceTransactions.reduce((acc, t) => acc + (t.type === 'income' ? (Number(t.amount) || 0) : -(Number(t.amount) || 0)), 0)
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full space-y-8">
                      <div className="flex justify-end gap-3">                        {!financeSubTab.startsWith('ABPC') && (
                          <button 
                            onClick={() => {
                              setEditingTransaction(null);
                              setNewTransaction({
                                type: 'expense',
                                isTransfer: true,
                                fromAccount: 'trading',
                                toAccount: 'savings',
                                dealType: 'new',
                                leadFrom: '',
                                agent: '-',
                                date: new Date().toISOString().split('T')[0]
                              });
                              setShowAddTransaction(true);
                            }}
                            className="bg-black text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black/90 transition-all flex items-center gap-2 shadow-lg shadow-black/20"
                          >
                            <ArrowLeftRight className="w-4 h-4" /> Transfer Funds
                          </button>
                        )}
                        <button 
                          onClick={handleExportFinance}
                          className="bg-black/5 text-black px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black/10 transition-all flex items-center gap-2 border border-black/5"
                        >
                          <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <button 
                          onClick={() => {
                            setEditingTransaction(null);
                            setNewTransaction({
                              type: 'income',
                              dealType: 'new',
                              leadFrom: '',
                              agent: '-',
                              date: new Date().toISOString().split('T')[0]
                            });
                            setShowAddTransaction(true);
                          }}
                          className="bg-gold text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gold/90 transition-all flex items-center gap-2 shadow-lg shadow-gold/20"
                        >
                          <Plus className="w-4 h-4" /> Add Transaction
                        </button>
                      </div>

                      <div className="glass rounded-[2.5rem] overflow-x-auto [transform:rotateX(180deg)]">
                        <table className="w-full text-left border-collapse min-w-[800px] [transform:rotateX(180deg)]">
                          <thead>
                            <tr className="border-bottom border-black/5 bg-black/2">
                              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Date</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Description</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Deal</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Lead From</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40">Agent</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40 text-right">Amount</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-black/40"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredFinanceTransactions.map((t) => (
                              <tr key={t.id} className="border-bottom border-black/5 hover:bg-black/2 transition-colors group">
                                <td className="px-6 py-4 text-xs font-mono">{t.date}</td>
                                <td className="px-6 py-4">
                                  <div className="text-sm font-medium">{t.description}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className={cn(
                                    "inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest",
                                    t.dealType === 'new' ? "bg-gold/10 text-gold" : 
                                    t.dealType === 'renewal' ? "bg-blue-50 text-blue-600" : "text-black/40"
                                  )}>
                                    {t.dealType === '-' ? '-' : t.dealType}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-[10px] font-bold uppercase tracking-widest text-black/40">
                                    {t.leadFrom || '-'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-xs">
                                  {getAgentDisplayName(t.agent)}
                                </td>
                                <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-1 transition-opacity">
                                    <button 
                                      onClick={() => handleEditTransaction(t)}
                                      className="p-2 text-black/10 hover:text-gold transition-colors"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => setConfirmDeleteTransaction(t)}
                                      className="p-2 text-black/10 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {filteredFinanceTransactions.length === 0 && (
                              <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-black/40 italic text-sm">
                                  No transactions found matching your filters.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto space-y-12"
              >
                {/* Personal Profile Section */}
                <div className="glass rounded-[40px] p-10">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h3 className="text-2xl font-serif">Personal <span className="italic">Profile</span></h3>
                      <p className="text-black/40 text-sm">Manage your account details and contact information</p>
                    </div>
                    <button 
                      onClick={handleUpdatePersonalProfile}
                      disabled={savingPersonalProfile}
                      className="bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-gold transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {savingPersonalProfile ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Save Profile
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-3">First Name</label>
                          <input 
                            type="text" 
                            value={personalProfile.firstName || ''}
                            onChange={e => setPersonalProfile({...personalProfile, firstName: e.target.value})}
                            className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-3">Last Name</label>
                          <input 
                            type="text" 
                            value={personalProfile.lastName || ''}
                            onChange={e => setPersonalProfile({...personalProfile, lastName: e.target.value})}
                            className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-3">Display Name</label>
                        <input 
                          type="text" 
                          value={personalProfile.name || ''}
                          onChange={e => setPersonalProfile({...personalProfile, name: e.target.value})}
                          className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-3">Mobile Number</label>
                        <input 
                          type="tel" 
                          value={personalProfile.mobile || ''}
                          onChange={e => setPersonalProfile({...personalProfile, mobile: e.target.value})}
                          className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                          placeholder="e.g. 088-445-1577"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-6 self-start w-full text-left">Profile Image</label>
                      <div className="relative group">
                        <div className="w-48 h-48 rounded-[2.5rem] overflow-hidden bg-black/5 border-2 border-dashed border-black/10 flex items-center justify-center">
                          {personalProfile.profileImage ? (
                            <img src={personalProfile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-12 h-12 text-black/10" />
                          )}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-[2.5rem]">
                          <Upload className="w-6 h-6 text-white" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handlePersonalPhotoUpload}
                          />
                        </label>
                      </div>
                      <p className="mt-4 text-[10px] text-black/30 italic">Click to upload a new profile photo. Max 1MB.</p>
                    </div>
                  </div>
                </div>

                {/* Public Profile Section removed from here, moved to settings tab */}
              </motion.div>
            )}

            {activeTab === 'settings' && hasRole('admin') && businessInfo && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto"
              >
                {settingsSubTab === 'general' && (
                  <>
                    <div className="glass rounded-[40px] p-10">
                      <div className="flex items-center justify-between mb-10">
                        <div>
                          <h3 className="text-2xl font-serif">Public <span className="italic">Portfolio Profile</span></h3>
                          <p className="text-black/40 text-sm">Manage the global brand and site content for the portfolio</p>
                        </div>
                        <button 
                          onClick={handleUpdateBusinessInfo}
                          disabled={savingProfile}
                          className="bg-gold text-white px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-gold-dark transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {savingProfile ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                          Save Changes
                        </button>
                      </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-3">Full Name</label>
                        <input 
                          type="text" 
                          value={businessInfo.name || ''}
                          onChange={e => setBusinessInfo({...businessInfo, name: e.target.value})}
                          className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-3">Tagline</label>
                        <input 
                          type="text" 
                          value={businessInfo.tagline || ''}
                          onChange={e => setBusinessInfo({...businessInfo, tagline: e.target.value})}
                          className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-3">About / Bio</label>
                        <textarea 
                          rows={6}
                          value={businessInfo.about || ''}
                          onChange={e => setBusinessInfo({...businessInfo, about: e.target.value})}
                          className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-3">Login Notification Email</label>
                        <input 
                          type="email" 
                          placeholder="your-email@example.com"
                          value={businessInfo.notificationEmail || ''}
                          onChange={e => setBusinessInfo({...businessInfo, notificationEmail: e.target.value})}
                          className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                        />
                        <p className="mt-2 text-[10px] text-black/30 italic">Enter an email address to receive alerts when someone signs in.</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-6">Personal Photos</label>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {businessInfo.ownerPhotos?.map((photo, idx) => (
                          <div key={idx} className="relative aspect-[3/4] rounded-2xl overflow-hidden group">
                            <img src={photo} alt={`Owner ${idx}`} className="w-full h-full object-cover" />
                            <button 
                              onClick={() => removeOwnerPhoto(idx)}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <label className="aspect-[3/4] rounded-2xl border-2 border-dashed border-black/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gold/40 hover:bg-gold/5 transition-all">
                          <Plus className="w-6 h-6 text-black/20" />
                          <span className="text-[10px] uppercase tracking-widest font-bold text-black/40">Add Photo</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleOwnerPhotoUpload}
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-black/30 italic">Upload high-quality portrait photos. Max 1MB each.</p>
                    </div>
                  </div>
                </div>

                {/* Image Management Section */}
                <div className="glass rounded-[40px] p-10 mt-12">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h3 className="text-2xl font-serif">Image <span className="italic">Management</span></h3>
                      <p className="text-black/40 text-sm">Upload and manage logos or other assets for the site</p>
                    </div>
                    <label className={`bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-gold transition-all flex items-center gap-2 cursor-pointer ${isUploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                      {isUploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      Upload Image
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleSiteImageUpload}
                        disabled={isUploadingImage}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {siteImages.map((image) => (
                      <div key={image.id} className="bg-black/2 rounded-[2rem] p-4 group relative border border-black/5 hover:border-gold/20 transition-all">
                        <div className="aspect-video rounded-2xl overflow-hidden bg-white mb-4 flex items-center justify-center">
                          <img src={image.url} alt={image.name} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold truncate pr-12">{image.name}</p>
                          <p className="text-[10px] text-black/40 font-mono">
                            {(image.size ? (image.size / 1024).toFixed(1) : 0)} KB
                          </p>
                        </div>
                        
                        <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => copyToClipboard(image.url)}
                            className="p-2 bg-white/90 backdrop-blur-sm text-black rounded-xl shadow-sm hover:bg-gold hover:text-white transition-all"
                            title="Copy URL"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <a 
                            href={image.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 bg-white/90 backdrop-blur-sm text-black rounded-xl shadow-sm hover:bg-black hover:text-white transition-all"
                            title="Open Original"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button 
                            onClick={() => handleDeleteSiteImage(image)}
                            className="p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-xl shadow-sm hover:bg-red-500 hover:text-white transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {siteImages.length === 0 && !isUploadingImage && (
                      <div className="col-span-full py-12 text-center border-2 border-dashed border-black/5 rounded-[2.5rem]">
                        <ImageIcon className="w-12 h-12 text-black/5 mx-auto mb-4" />
                        <p className="text-black/40 italic text-sm">No images uploaded yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {settingsSubTab === 'privacy' && (
              <div className="glass rounded-[40px] p-10">
                <div className="mb-10">
                  <h3 className="text-2xl font-serif">Privacy <span className="italic">& Visibility Settings</span></h3>
                  <p className="text-black/40 text-sm">Detailed overview of data visibility and permissions for each user role</p>
                </div>

                <div className="space-y-6">
                  <div className="bg-black/2 rounded-3xl p-6 border border-black/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <Shield className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold uppercase tracking-widest">Admin Role</h4>
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs text-black/60">
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gold shrink-0" />
                        Full access to all staff profiles and sensitive data
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gold shrink-0" />
                        Complete financial oversight across all companies (ABPC & ECRE)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gold shrink-0" />
                        Manage site content, blog posts, and global settings
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gold shrink-0" />
                        Access to advanced admin tools and property extraction
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gold shrink-0" />
                        Ability to seed, export, and delete system data
                      </li>
                    </ul>
                  </div>

                  <div className="bg-black/2 rounded-3xl p-6 border border-black/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold uppercase tracking-widest">Accounts Role</h4>
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs text-black/60">
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gold shrink-0" />
                        Access to all financial transactions and reports
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gold shrink-0" />
                        View staff directory (restricted to assigned company)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gold shrink-0" />
                        Create and edit financial entries for marketing tracking
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gold shrink-0" />
                        Manage their own profile and view company performance
                      </li>
                    </ul>
                  </div>

                  <div className="bg-black/2 rounded-3xl p-6 border border-black/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold uppercase tracking-widest">Manager Role</h4>
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs text-black/60">
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gold shrink-0" />
                        Full management of staff within their assigned company
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gold shrink-0" />
                        View financial performance metrics for their department
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gold shrink-0" />
                        Access to company-specific blog topics or internal tools
                      </li>
                    </ul>
                  </div>

                  <div className="bg-black/2 rounded-3xl p-6 border border-black/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                        <User className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold uppercase tracking-widest">Employee Role (Default)</h4>
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs text-black/60">
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gold shrink-0" />
                        Manage personal landing page and profile information
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gold shrink-0" />
                        View assigned discount codes and benefits
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gold shrink-0" />
                        NO access to the administration dashboard or financial data
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gold shrink-0" />
                        Personalized portfolio view for client demonstrations
                      </li>
                    </ul>
                  </div>

                  <div className="pt-8 mt-8 border-t border-black/5">
                    <div className="flex items-center gap-2 text-gold mb-3">
                      <Info className="w-4 h-4" />
                      <span className="text-[10px] uppercase font-bold tracking-widest">About Data Privacy</span>
                    </div>
                    <p className="text-[10px] text-black/40 leading-relaxed max-w-2xl italic">
                      This portfolio enforces strict server-side security rules via Firestore. Even if a user attempts to manually navigate to an unauthorized section, the underlying database will reject any requests that do not match their assigned role. PII (Personally Identifiable Information) is further restricted to prevent unauthorized data scraping.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

            {activeTab === 'blog' && (
              <motion.div 
                key="blog"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-serif">Blog Management</h3>
                  <button 
                    onClick={() => {
                      setEditingBlog({
                        title: '',
                        metaDescription: '',
                        keywords: '',
                        body: '',
                        category: 'My Advice',
                        published: false
                      });
                      setShowEditBlog(true);
                    }}
                    className="bg-gold text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gold-dark transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Post
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {blogPosts.map((post) => (
                    <div key={post.id} className="glass p-6 rounded-3xl flex items-center justify-between group">
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                            {post.category}
                          </span>
                          {!post.published && (
                            <span className="text-[10px] bg-black/5 text-black/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                              Draft
                            </span>
                          )}
                        </div>
                        <h4 className="font-serif text-lg">{post.title}</h4>
                        <p className="text-sm text-black/40 line-clamp-1">{post.metaDescription || 'No description'}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingBlog(post);
                            setShowEditBlog(true);
                          }}
                          className="p-2 bg-black/5 text-black rounded-lg hover:bg-black/10 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this post?')) {
                              try {
                                await deleteDoc(doc(db, 'blog', post.id));
                                toast.success('Post deleted');
                              } catch (err) {
                                handleFirestoreError(err, OperationType.DELETE, `blog/${post.id}`);
                              }
                            }
                          }}
                          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {blogPosts.length === 0 && (
                    <div className="py-24 text-center">
                      <FileText className="w-12 h-12 text-black/5 mx-auto mb-4" />
                      <p className="text-black/40 italic">No blog posts yet. Click "Add Post" to get started.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'tools' && canAccessTools && (
              <motion.div 
                key="tools"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-gold/10 rounded-2xl">
                    <Wrench className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif tracking-tight">Admin <span className="italic text-gold">Tools</span></h2>
                    <p className="text-xs text-black/40 uppercase tracking-widest font-bold">
                      {toolsSubTab === 'extractor-pro' ? 'Property Extractor Pro' : 'Productivity & Extraction Utilities'}
                    </p>
                  </div>
                </div>

                {toolsSubTab === 'extractor-pro' && (
                  <PropertyExtractorPro userProfile={userProfile} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </main>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showAddTransaction && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowAddTransaction(false);
                setEditingTransaction(null);
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white p-8 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-serif">{editingTransaction ? 'Edit' : 'Add'} <span className="italic">Transaction</span></h3>
                  <p className="text-black/40 text-xs">{editingTransaction ? 'Update existing' : 'Record a new'} financial entry for {financeSubTab}</p>
                </div>
                <button 
                  onClick={() => {
                    setShowAddTransaction(false);
                    setEditingTransaction(null);
                  }} 
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTransaction} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-black/40 ml-4">Lead From</label>
                    <select 
                      value={newTransaction.leadFrom || ''}
                      onChange={(e) => setNewTransaction({ ...newTransaction, leadFrom: e.target.value })}
                      className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                    >
                      <option value="">Select Source</option>
                      {['LINE', 'Facebook Page', 'Proppit', 'BahtSold', 'Referral', 'Instagram', 'Email', 'Website', 'Walkin', 'Co Broke Deal', 'Meta Ad', 'Facebook Marketplace', 'Personal Facebook Profile', 'Call In', 'Whatsapp'].map(source => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-black/40 ml-4">Deal Type</label>
                    <select 
                      value={newTransaction.dealType || 'new'}
                      onChange={(e) => setNewTransaction({ ...newTransaction, dealType: e.target.value as any })}
                      className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                    >
                      <option value="new">New Deal</option>
                      <option value="renewal">Renewal</option>
                      <option value="-">-</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-black/40 ml-4">Type</label>
                    <select 
                      value={newTransaction.isTransfer ? 'transfer' : (newTransaction.type || 'income')}
                      onChange={(e) => {
                        if (e.target.value === 'transfer') {
                          setNewTransaction({ 
                            ...newTransaction, 
                            isTransfer: true, 
                            type: 'expense',
                            fromAccount: (newTransaction as any).fromAccount || 'trading',
                            toAccount: (newTransaction as any).toAccount || 'savings'
                          });
                        } else {
                          setNewTransaction({ 
                            ...newTransaction, 
                            isTransfer: false, 
                            type: e.target.value as any 
                          });
                        }
                      }}
                      className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                      {!financeSubTab.startsWith('ABPC') && <option value="transfer">Transfer</option>}
                    </select>
                  </div>
                  {!newTransaction.isTransfer ? (
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-black/40 ml-4">Account</label>
                      <select 
                        value={newTransaction.account || 'trading'}
                        onChange={(e) => setNewTransaction({ ...newTransaction, account: e.target.value as any })}
                        className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                      >
                        <option value="trading">Trading</option>
                        {!financeSubTab.startsWith('ABPC') && <option value="savings">Savings</option>}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-black/40 ml-4">From Account</label>
                      <select 
                        value={(newTransaction as any).fromAccount || 'trading'}
                        onChange={(e) => setNewTransaction({ ...newTransaction, fromAccount: e.target.value as any })}
                        className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                      >
                        <option value="trading">Trading</option>
                        <option value="savings">Savings</option>
                      </select>
                    </div>
                  )}
                </div>

                {newTransaction.isTransfer && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-black/40 ml-4">To Account</label>
                    <select 
                      value={(newTransaction as any).toAccount || 'savings'}
                      onChange={(e) => setNewTransaction({ ...newTransaction, toAccount: e.target.value as any })}
                      className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                    >
                      <option value="trading">Trading</option>
                      <option value="savings">Savings</option>
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-black/40 ml-4">Date</label>
                  <input 
                    type="date"
                    value={newTransaction.date || ''}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-black/40 ml-4">Description</label>
                  <input 
                    type="text"
                    placeholder="e.g. Monthly Rent Payment"
                    value={newTransaction.description || ''}
                    onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                    className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-black/40 ml-4">Amount (THB)</label>
                    <input 
                      type="number"
                      placeholder="0.00"
                      value={newTransaction.amount || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setNewTransaction({ ...newTransaction, amount: isNaN(val) ? 0 : val });
                      }}
                      className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-black/40 ml-4">Agent</label>
                    <select 
                      value={newTransaction.agent || ''}
                      onChange={(e) => setNewTransaction({ ...newTransaction, agent: e.target.value })}
                      className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                      required
                    >
                      <option value="-">-</option>
                      {employees
                        .filter(emp => {
                          const targetKeyword = financeSubTab.startsWith('ABPC') ? 'Alan Bolton' : 'East Coast';
                          return emp.company?.includes(targetKeyword) && emp.active !== false;
                        })
                        .map((emp) => {
                          const displayName = emp.name || `${emp.firstName} ${emp.lastName}`;
                          return (
                            <option key={emp.uid} value={displayName}>
                              {displayName}{emp.nickname ? ` (${emp.nickname})` : ''}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSavingTransaction}
                  className="w-full bg-gold text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gold/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/20 disabled:opacity-50"
                >
                  {isSavingTransaction ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {editingTransaction ? 'Update' : 'Save'} Transaction
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Employee Modal */}
      <AnimatePresence>
        {showEditEmployee && editingEmployee && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditEmployee(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] p-10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-serif mb-6">{editingEmployee.uid.startsWith('temp_') ? 'Add' : 'Edit'} Staff <span className="italic">Profile</span></h3>
              <form onSubmit={handleUpdateEmployee} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-2">First Name</label>
                    <input 
                      type="text" 
                      value={editingEmployee.firstName || ''}
                      onChange={e => setEditingEmployee({...editingEmployee, firstName: e.target.value, name: `${e.target.value} ${editingEmployee.lastName || ''}`.trim()})}
                      className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-2">Last Name</label>
                    <input 
                      type="text" 
                      value={editingEmployee.lastName || ''}
                      onChange={e => setEditingEmployee({...editingEmployee, lastName: e.target.value, name: `${editingEmployee.firstName || ''} ${e.target.value}`.trim()})}
                      className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-2">Nickname</label>
                    <input 
                      type="text" 
                      value={editingEmployee.nickname || ''}
                      onChange={e => setEditingEmployee({...editingEmployee, nickname: e.target.value})}
                      className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={editingEmployee.email || ''}
                      onChange={e => setEditingEmployee({...editingEmployee, email: e.target.value})}
                      className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                      required
                      disabled={!editingEmployee.uid.startsWith('temp_')}
                    />
                    {!editingEmployee.uid.startsWith('temp_') && (
                      <p className="mt-1 text-[8px] text-black/20 italic">Email cannot be changed once the account is created.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-2">Company</label>
                    <select 
                      value={editingEmployee.companyId || ''}
                      onChange={e => {
                        const selectedCompany = companies.find(c => c.id === e.target.value);
                        setEditingEmployee({
                          ...editingEmployee, 
                          companyId: e.target.value,
                          company: selectedCompany ? selectedCompany.name : ''
                        });
                      }}
                      className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold/20 outline-none disabled:opacity-50"
                      disabled={hasRole('manager') && !hasRole('admin')}
                    >
                      <option value="">Select Company</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {hasRole('manager') && !hasRole('admin') && (
                      <p className="mt-1 text-[8px] text-black/20 italic">Managers can only manage employees within their own company.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-2">Position</label>
                    <input 
                      type="text" 
                      value={editingEmployee.position || ''}
                      onChange={e => setEditingEmployee({...editingEmployee, position: e.target.value})}
                      className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-2">Mobile</label>
                    <input 
                      type="text" 
                      value={editingEmployee.mobile || ''}
                      onChange={e => setEditingEmployee({...editingEmployee, mobile: e.target.value})}
                      className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-2">Roles</label>
                    <div className="flex flex-wrap gap-2 p-3 bg-black/5 rounded-2xl">
                      {['employee', 'manager', 'accounts', 'admin'].map(role => {
                        const isSelected = (editingEmployee.roles || []).includes(role as any);
                        const isAdminOnly = role === 'admin' || role === 'accounts';
                        const isRestrictedUser = (hasRole('manager') || hasRole('accounts')) && !hasRole('admin');
                        const isDisabled = isRestrictedUser && isAdminOnly;

                        return (
                          <label key={role} className={cn(
                            "flex items-center gap-2 cursor-pointer group",
                            isDisabled && "opacity-50 cursor-not-allowed"
                          )}>
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              disabled={isDisabled}
                              onChange={(e) => {
                                const currentRoles = editingEmployee.roles || [];
                                const newRoles = e.target.checked 
                                  ? [...currentRoles, role as any]
                                  : currentRoles.filter(r => r !== role);
                                setEditingEmployee({...editingEmployee, roles: newRoles});
                              }}
                              className="w-4 h-4 rounded border-black/10 text-gold focus:ring-gold/20"
                            />
                            <span className="text-xs font-bold text-black/60 group-hover:text-black transition-colors capitalize">
                              {role}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-2">Account Status</label>
                    <button
                      type="button"
                      onClick={() => setEditingEmployee({ ...editingEmployee, active: !editingEmployee.active })}
                      className={cn(
                        "w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 border-2",
                        editingEmployee.active !== false 
                          ? "bg-green-50 border-green-100 text-green-700" 
                          : "bg-red-50 border-red-100 text-red-700"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full animate-pulse",
                          editingEmployee.active !== false ? "bg-green-500" : "bg-red-500"
                        )} />
                        <span className="text-xs font-bold uppercase tracking-widest">
                          {editingEmployee.active !== false ? 'Active Account' : 'Inactive Account'}
                        </span>
                      </div>
                      <div className={cn(
                        "w-10 h-5 rounded-full relative transition-colors duration-300",
                        editingEmployee.active !== false ? "bg-green-500" : "bg-red-300"
                      )}>
                        <div className={cn(
                          "absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300",
                          editingEmployee.active !== false ? "right-1" : "left-1"
                        )} />
                      </div>
                    </button>
                    <p className="mt-2 text-[10px] text-black/40 italic px-4">
                      {editingEmployee.active !== false 
                        ? "User can log in and access their profile." 
                        : "User will be blocked from logging in."}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-4">Assigned Discounts</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2 bg-black/2 rounded-2xl">
                    {discounts.map(discount => (
                      <button
                        key={discount.id}
                        type="button"
                        onClick={() => toggleEmployeeDiscount(discount.id)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                          (editingEmployee.discountIds || []).includes(discount.id)
                            ? 'bg-gold text-black'
                            : 'bg-black/5 text-black/40 hover:bg-black/10'
                        }`}
                      >
                        <div className="text-left">
                          <div>{discount.name}</div>
                          <div className="text-[10px] opacity-60 uppercase">{discount.restaurantId}</div>
                        </div>
                        {(editingEmployee.discountIds || []).includes(discount.id) && <CheckCircle className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowEditEmployee(false)}
                    className="flex-1 bg-black/5 text-black py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-gold text-black py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gold-dark transition-all"
                  >
                    {editingEmployee.uid.startsWith('temp_') ? 'Create Account' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Transaction Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteTransaction && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteTransaction(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-serif mb-2">Confirm Deletion</h3>
              <p className="text-black/40 text-sm mb-8">
                Are you sure you want to delete this transaction for <span className="font-bold text-black">{confirmDeleteTransaction.description}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmDeleteTransaction(null)}
                  className="flex-1 bg-black/5 text-black py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteTransaction(confirmDeleteTransaction.id)}
                  className="flex-1 bg-red-500 text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDelete(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-serif mb-2">Confirm Deletion</h3>
              <p className="text-black/40 text-sm mb-8">
                Are you sure you want to delete <span className="font-bold text-black">{confirmDelete.name}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 bg-black/5 text-black py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (confirmDelete.type === 'company') {
                      executeDeleteCompany(confirmDelete.id);
                    }
                  }}
                  className="flex-1 bg-red-500 text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Company Modal */}
      <AnimatePresence>
        {showEditCompany && editingCompany && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditCompany(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[40px] p-10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-serif mb-6">{editingCompany.id ? 'Edit' : 'Add'} Company <span className="italic">Details</span></h3>
              <form onSubmit={handleUpdateCompany} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-2">Company Name</label>
                    <input 
                      type="text" 
                      required
                      value={editingCompany.name || ''}
                      onChange={e => setEditingCompany({...editingCompany, name: e.target.value})}
                      className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                      placeholder="e.g. Pattaya Rent a Car"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-2">Website URL</label>
                    <input 
                      type="url" 
                      value={editingCompany.website || ''}
                      onChange={e => setEditingCompany({...editingCompany, website: e.target.value})}
                      className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                      placeholder="https://www.example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-2">Company Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-black/5 flex items-center justify-center overflow-hidden shrink-0 border-2 border-dashed border-black/10">
                        {editingCompany.logo ? (
                          <img src={getLogoSrc(editingCompany.logo)} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <Upload className="w-6 h-6 text-black/20" />
                        )}
                      </div>
                      <div className="flex-grow">
                        <label className="inline-block bg-black/5 hover:bg-black/10 text-black px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-all">
                          {editingCompany.logo ? 'Change Logo' : 'Upload Logo'}
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                        {editingCompany.logo && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCompany({ ...editingCompany, logo: '' });
                              toast.info('Logo removed');
                            }}
                            className="ml-2 inline-block bg-red-50 hover:bg-red-100 text-red-500 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-all"
                          >
                            Remove
                          </button>
                        )}
                        <p className="text-[9px] text-black/30 mt-2 uppercase tracking-wider font-medium">Max size: 500KB. Recommended: Square PNG/SVG.</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-2">Description</label>
                    <textarea 
                      value={editingCompany.description || ''}
                      onChange={e => setEditingCompany({...editingCompany, description: e.target.value})}
                      rows={4}
                      className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold/20 outline-none resize-none"
                      placeholder="Briefly describe the company..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowEditCompany(false)}
                    className="flex-1 bg-black/5 text-black py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-gold text-black py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gold-dark transition-all"
                  >
                    {editingCompany.id ? 'Save Changes' : 'Add Company'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Blog Modal */}
      <AnimatePresence>
        {showEditBlog && editingBlog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditBlog(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-[40px] p-10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-serif mb-6">{editingBlog.id ? 'Edit' : 'Add'} Blog <span className="italic">Post</span></h3>
              <form onSubmit={handleSaveBlog} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-2">Title</label>
                      <input 
                        type="text" 
                        required
                        value={editingBlog.title || ''}
                        onChange={e => setEditingBlog({...editingBlog, title: e.target.value})}
                        className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                        placeholder="Post Title"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-2">Category</label>
                      <select 
                        required
                        value={editingBlog.category || 'My Advice'}
                        onChange={e => setEditingBlog({...editingBlog, category: e.target.value as any})}
                        className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold/20 outline-none appearance-none"
                      >
                        <option value="My Advice">My Advice</option>
                        <option value="Property">Property</option>
                        <option value="Car Rental">Car Rental</option>
                        <option value="Pattaya News">Pattaya News</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-2">Featured Image</label>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-2xl bg-black/5 flex items-center justify-center overflow-hidden shrink-0 border-2 border-dashed border-black/10">
                          {editingBlog.imageUrl ? (
                            <img src={editingBlog.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Upload className="w-6 h-6 text-black/20" />
                          )}
                        </div>
                        <div className="flex-grow">
                          <label className="inline-block bg-black/5 hover:bg-black/10 text-black px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-all">
                            {editingBlog.imageUrl ? 'Change Image' : 'Upload Image'}
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleBlogImageUpload}
                              className="hidden"
                            />
                          </label>
                          {editingBlog.imageUrl && (
                            <button
                              type="button"
                              onClick={() => setEditingBlog({ ...editingBlog, imageUrl: '' })}
                              className="ml-2 inline-block bg-red-50 hover:bg-red-100 text-red-500 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-all"
                            >
                              Remove
                            </button>
                          )}
                          <p className="text-[9px] text-black/30 mt-2 uppercase tracking-wider font-medium">Max size: 1MB. Recommended: 16:9 ratio.</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-2">Meta Description</label>
                      <textarea 
                        value={editingBlog.metaDescription || ''}
                        onChange={e => setEditingBlog({...editingBlog, metaDescription: e.target.value})}
                        rows={3}
                        className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold/20 outline-none resize-none"
                        placeholder="SEO Meta Description"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-2">Keywords</label>
                      <input 
                        type="text" 
                        value={editingBlog.keywords || ''}
                        onChange={e => setEditingBlog({...editingBlog, keywords: e.target.value})}
                        className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                        placeholder="SEO Keywords (comma separated)"
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <button 
                        type="button"
                        onClick={() => setEditingBlog({...editingBlog, published: !editingBlog.published})}
                        className={`w-12 h-6 rounded-full transition-all relative ${editingBlog.published ? 'bg-gold' : 'bg-black/10'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingBlog.published ? 'left-7' : 'left-1'}`} />
                      </button>
                      <span className="text-xs font-bold uppercase tracking-widest text-black/60">Published</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-2">Body Content (Markdown)</label>
                      <textarea 
                        required
                        value={editingBlog.body || ''}
                        onChange={e => setEditingBlog({...editingBlog, body: e.target.value})}
                        rows={15}
                        className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-gold/20 outline-none resize-none"
                        placeholder="Write your post content here..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowEditBlog(false)}
                    className="flex-1 bg-black/5 text-black py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSavingBlog}
                    className="flex-1 bg-gold text-black py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gold-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSavingBlog ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {editingBlog.id ? 'Save Changes' : 'Add Post'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
            )}
          </AnimatePresence>

          {/* Export Preview Modal */}
          <AnimatePresence>
            {showExportPreview && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[2.5rem] p-10 w-full max-w-5xl shadow-2xl max-h-[90vh] flex flex-col"
                >
                  <div className="flex justify-between items-center mb-8 shrink-0">
                    <div>
                      <h3 className="text-2xl font-serif">Export <span className="italic">Preview</span></h3>
                      <p className="text-black/40 text-xs">{exportPreviewTitle}</p>
                    </div>
                    <button onClick={() => setShowExportPreview(false)} className="p-2 hover:bg-black/5 rounded-full">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-grow overflow-auto mb-8 border border-black/5 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="border-b border-black/5">
                          {exportPreviewData.length > 0 && Object.keys(exportPreviewData[0]).map(key => (
                            <th key={key} className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-black/40">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {exportPreviewData.map((row, idx) => (
                          <tr key={idx} className="border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                            {Object.values(row).map((val: any, i) => (
                              <td key={i} className="px-6 py-4 text-xs">
                                {typeof val === 'number' && !isNaN(val) ? (
                                  val.toLocaleString()
                                ) : (
                                  String(val)
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-4 shrink-0">
                    <button 
                      onClick={() => setShowExportPreview(false)}
                      className="flex-1 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest border border-black/5 hover:bg-black/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => executeExportCSV(exportPreviewData, exportPreviewFileName)}
                      disabled={isExportingFromPreview}
                      className="flex-1 bg-black text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-black/20"
                    >
                      {isExportingFromPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Download CSV
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* PDF Preview Modal */}
          <AnimatePresence>
            {showPdfPreview && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[2.5rem] p-10 w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col"
                >
                  <div className="flex justify-between items-center mb-8 shrink-0">
                    <div>
                      <h3 className="text-2xl font-serif">PDF <span className="italic">Preview</span></h3>
                      <p className="text-black/40 text-xs">{pdfFileName}</p>
                    </div>
                    <button onClick={() => setShowPdfPreview(false)} className="p-2 hover:bg-black/5 rounded-full">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-grow overflow-auto mb-8 border border-black/5 rounded-2xl bg-black/5 p-8 flex justify-center">
                    <div className="origin-top scale-[0.6] sm:scale-[0.8] md:scale-100 h-fit">
                      <ReportDocument 
                        ref={previewReportRef}
                        selectedIndividualAgent={selectedIndividualAgent}
                        reportYearFilter={reportYearFilter}
                        financeSubTab={financeSubTab}
                        uniqueEmployees={uniqueEmployees}
                        getIndividualAgentReport={getIndividualAgentReport}
                        getCompanyInfo={getCompanyInfo}
                        formatCurrency={formatCurrency}
                        isPreview={true}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 shrink-0">
                    <button 
                      onClick={() => setShowPdfPreview(false)}
                      className="flex-1 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest border border-black/5 hover:bg-black/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={executeDownloadPDF}
                      className="flex-1 bg-black text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20"
                    >
                      <FileDown className="w-4 h-4" />
                      Download PDF
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ABPC Mapping Modal */}
          <AnimatePresence>
            {showABPCMapping && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-2xl font-serif">Map ABPC Agents</h3>
                      <p className="text-black/40 text-xs">Link CSV agent names to system users</p>
                    </div>
                    <button onClick={() => setShowABPCMapping(false)} className="p-2 hover:bg-black/5 rounded-full">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6 mb-10">
                    {uniqueABPCAgents.map(agent => (
                      <div key={agent} className="flex items-center gap-4 p-4 bg-black/5 rounded-2xl">
                        <div className="flex-1">
                          <div className="text-[10px] text-black/40 uppercase tracking-widest font-bold mb-1">CSV Agent Name</div>
                          <div className="text-sm font-medium">{agent}</div>
                        </div>
                        <div className="flex-1">
                          <div className="text-[10px] text-black/40 uppercase tracking-widest font-bold mb-1 flex items-center gap-2">
                            Map to System User
                            {agentMapping[agent] && (
                              <span className="text-[8px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">Matched</span>
                            )}
                          </div>
                          <select 
                            value={agentMapping[agent] || ''}
                            onChange={(e) => setAgentMapping(prev => ({ ...prev, [agent]: e.target.value }))}
                            className="w-full bg-white border-none rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-gold/20 outline-none"
                          >
                            <option value="">Select User...</option>
                            <option value="no-agent">No Agent (Unassigned)</option>
                            {employees
                              .filter(u => u.company === 'Alan Bolton Property Consultants')
                              .sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''))
                              .map(user => (
                                <option key={user.uid} value={user.uid}>
                                  {user.firstName} {user.lastName}
                                </option>
                              ))
                            }
                          </select>
                        </div>
                      </div>
                    ))}
                    {uniqueABPCAgents.length === 0 && (
                      <div className="text-center py-12 text-black/40 italic">
                        No agents found in the CSV data.
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowABPCMapping(false)}
                      className="flex-1 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest border border-black/5 hover:bg-black/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={executeABPCImport}
                      disabled={isImportingABPC || uniqueABPCAgents.length === 0}
                      className="flex-1 bg-gold text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gold/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isImportingABPC ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Confirm & Import
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      );
    }
