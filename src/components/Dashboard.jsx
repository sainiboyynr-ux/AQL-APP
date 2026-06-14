import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useInspection } from '../hooks/useInspection';
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Search, 
  ExternalLink,
  ChevronRight,
  User,
  LogOut,
  Calendar,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';

export default function Dashboard({ onStartNew, onResumeInspection, onViewDetails }) {
  const { user, logout } = useAuth();
  const { 
    inspections, 
    loading, 
    fetchInspections, 
    getLocalDraft 
  } = useInspection();

  const [searchQuery, setSearchQuery] = useState('');
  const [localDraft, setLocalDraft] = useState(null);

  useEffect(() => {
    if (user) {
      fetchInspections(user.$id);
    }
    setLocalDraft(getLocalDraft());
  }, [user, fetchInspections, getLocalDraft]);

  // Handle Log Out
  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await logout();
    }
  };

  // Filtered inspections list based on search (by Product Name or Batch No)
  const filteredInspections = useMemo(() => {
    if (!inspections) return [];
    return inspections.filter(item => 
      item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batch_no.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [inspections, searchQuery]);

  // Statistics calculations
  const stats = useMemo(() => {
    const list = inspections || [];
    const total = list.length;
    const submitted = list.filter(i => i.status === 'submitted');
    const accepted = submitted.filter(i => i.overall_decision === 'ACCEPT' || i.overall_decision === 'accept').length;
    const hold = submitted.filter(i => i.overall_decision === 'HOLD' || i.overall_decision === 'hold').length;
    const rejected = submitted.filter(i => i.overall_decision === 'REJECT' || i.overall_decision === 'reject').length;
    const drafts = list.filter(i => i.status === 'draft').length;

    return {
      total,
      drafts,
      accepted,
      hold,
      rejected,
      acceptedPct: total > 0 ? Math.round((accepted / total) * 100) : 0,
      holdPct: total > 0 ? Math.round((hold / total) * 100) : 0,
      rejectedPct: total > 0 ? Math.round((rejected / total) * 100) : 0,
    };
  }, [inspections]);

  // Helper to format date
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="max-w-md mx-auto w-full p-4 pb-24 flex flex-col min-h-screen">
      
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm mb-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white leading-tight font-display">
                {user?.full_name || 'QA Executive'}
              </h2>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider mt-0.5">
                {user?.role === 'qa_manager' ? 'QA Manager' : 'QA Executive'} • {user?.department || 'Quality Assurance'}
              </span>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={handleLogout}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {/* Accept KPI */}
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-3 rounded-2xl text-center shadow-xs">
          <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-800 dark:text-emerald-400 block">
            Approved
          </span>
          <span className="text-xl font-bold font-display text-emerald-600 dark:text-emerald-300 block mt-1">
            {stats.accepted}
          </span>
          <span className="text-[9px] text-emerald-500 block opacity-80 mt-0.5">
            {stats.acceptedPct}% of total
          </span>
        </div>

        {/* Hold KPI */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-3 rounded-2xl text-center shadow-xs">
          <span className="text-[9px] uppercase tracking-wider font-semibold text-amber-800 dark:text-amber-400 block">
            On Hold
          </span>
          <span className="text-xl font-bold font-display text-amber-600 dark:text-amber-300 block mt-1">
            {stats.hold}
          </span>
          <span className="text-[9px] text-amber-500 block opacity-80 mt-0.5">
            {stats.holdPct}% of total
          </span>
        </div>

        {/* Reject KPI */}
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 p-3 rounded-2xl text-center shadow-xs">
          <span className="text-[9px] uppercase tracking-wider font-semibold text-rose-800 dark:text-rose-400 block">
            Rejected
          </span>
          <span className="text-xl font-bold font-display text-rose-600 dark:text-rose-300 block mt-1">
            {stats.rejected}
          </span>
          <span className="text-[9px] text-rose-500 block opacity-80 mt-0.5">
            {stats.rejectedPct}% of total
          </span>
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        onClick={onStartNew}
        className="w-full h-14 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-brand-500/25 transition-all text-sm mb-5 cursor-pointer"
      >
        <Plus className="w-5 h-5" />
        <span>+ New AQL Inspection</span>
      </button>

      {/* Resume Unfinished Local Draft Alert */}
      {localDraft && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-4 rounded-2xl mb-5 flex items-start gap-3 shadow-sm">
          <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300">
              Unsubmitted Inspection Draft
            </h4>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5 leading-relaxed">
              Product: <strong>{localDraft.product_name || 'Unnamed'}</strong> ({localDraft.batch_no || 'No Batch'})
              <br />
              Last auto-saved: {new Date(localDraft.lastSaved).toLocaleTimeString()}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onResumeInspection(localDraft)}
                className="px-3 h-8 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <span>Resume Draft</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Header Section */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold font-display text-slate-800 dark:text-slate-200">
            Inspection Log
          </h3>
          <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full font-mono">
            {filteredInspections.length} logs
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by Product Name or Batch No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-xs bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 dark:text-slate-200 shadow-2xs placeholder:text-slate-400"
          />
        </div>

        {/* History List */}
        {loading ? (
          <div className="flex-1 flex flex-col justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            <span className="text-xs text-slate-400 mt-2 font-medium">Loading inspection database...</span>
          </div>
        ) : filteredInspections.length === 0 ? (
          <div className="flex-1 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-600 bg-white/30 dark:bg-transparent">
            <FileText className="w-10 h-10 mb-2 opacity-50" />
            <span className="text-xs font-semibold">No Inspections Found</span>
            <p className="text-[10px] mt-1 leading-normal max-w-xs">
              {searchQuery ? 'Adjust your search filters' : 'Start your first Acceptance Quality Limit (AQL) inspection by clicking the button above.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInspections.map((item) => {
              const totalCrit = item.critical_defects?.reduce((sum, d) => sum + (Number(d.count) || 0), 0) || 0;
              const decision = item.overall_decision?.toUpperCase() || 'HOLD';
              
              const badgeColors = {
                ACCEPT: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
                HOLD: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
                REJECT: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30'
              }[decision] || 'bg-slate-50 text-slate-700 border-slate-200';

              const isDraft = item.status === 'draft';

              return (
                <div
                  key={item.$id}
                  onClick={() => isDraft ? onResumeInspection(item) : onViewDetails(item)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.98] transition-all cursor-pointer select-none"
                >
                  <div className="space-y-1.5 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate max-w-[160px] leading-tight">
                        {item.product_name}
                      </span>
                      {isDraft && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 uppercase tracking-wider scale-90 border border-slate-200 dark:border-slate-700">
                          Draft
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      <span className="font-mono bg-slate-50 dark:bg-slate-850 px-1 py-0.5 rounded text-slate-600 dark:text-slate-300">
                        {item.batch_no}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(item.submitted_at || item.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isDraft ? (
                      <div className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border uppercase tracking-wider font-display ${badgeColors}`}>
                        {decision}
                      </div>
                    ) : (
                      <div className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 text-slate-500 bg-slate-50 flex items-center gap-1 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>Resume</span>
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
