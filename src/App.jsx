import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import InspectionForm from './components/InspectionForm';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Calendar,
  Layers,
  Search,
  ChevronRight,
  Database
} from 'lucide-react';
import { useInspection } from './hooks/useInspection';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { inspections, fetchInspections, loading: inspLoading } = useInspection();

  // Navigation states: 'dashboard' | 'new_inspection' | 'history'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Form active state: null (not editing) | 'new' | Object (inspection data to view/edit)
  const [activeInspection, setActiveInspection] = useState(null);

  // Toast notification state
  const [toast, setToast] = useState({ message: '', type: null });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: null });
    }, 3500);
  };

  // Sync log on login
  useEffect(() => {
    if (user) {
      fetchInspections(user.$id);
    }
  }, [user, fetchInspections]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center">
        <span className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></span>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-3 uppercase tracking-wider font-display">
          Authenticating QA Portal...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Handle actions from Dashboard
  const handleStartNew = () => {
    setActiveInspection('new');
  };

  const handleResumeInspection = (draftData) => {
    setActiveInspection(draftData);
  };

  const handleViewDetails = (inspectionData) => {
    setActiveInspection(inspectionData);
  };

  const handleCloseForm = () => {
    setActiveInspection(null);
    fetchInspections(user.$id); // Refresh list
  };

  // Helper for formatting date
  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col relative pb-20">
      
      {/* Toast Banner Overlay */}
      {toast.message && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-80 max-w-[90vw] animate-slideDown">
          <div className="p-3.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl flex items-center gap-3">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
            
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-normal">
              {toast.message}
            </p>
          </div>
        </div>
      )}

      {/* Main View Area */}
      {activeInspection ? (
        <InspectionForm
          initialData={activeInspection === 'new' ? null : activeInspection}
          onClose={handleCloseForm}
          showToast={showToast}
        />
      ) : (
        <div className="flex-1">
          {activeTab === 'dashboard' && (
            <Dashboard
              onStartNew={handleStartNew}
              onResumeInspection={handleResumeInspection}
              onViewDetails={handleViewDetails}
            />
          )}

          {activeTab === 'new_inspection' && (
            <div className="p-4 max-w-md mx-auto">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center shadow-sm py-12">
                <PlusCircle className="w-12 h-12 text-brand-500 mx-auto mb-3" />
                <h2 className="text-base font-bold font-display text-slate-800 dark:text-white">
                  Create AQL Inspection
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-normal">
                  Start a new finished goods inspection log. Standard AQL limits will be dynamically calculated for compliance.
                </p>
                <button
                  onClick={handleStartNew}
                  className="mt-6 px-6 h-11 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs shadow-md shadow-brand-500/20 cursor-pointer"
                >
                  Start New Session
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="p-4 max-w-md mx-auto space-y-4">
              <div>
                <h2 className="text-lg font-bold font-display">Submitted Inspections</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Archived finished goods inspection reports (Read-only)</p>
              </div>

              {inspLoading ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <span className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></span>
                  <span className="text-xs text-slate-400 mt-2">Loading logs...</span>
                </div>
              ) : inspections.filter(i => i.status === 'submitted').length === 0 ? (
                <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-400 dark:text-slate-600 bg-white/30">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <span className="text-xs font-semibold">No Submitted Logs</span>
                  <p className="text-[10px] mt-1">Submit your first inspection report to see it archived here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inspections
                    .filter(i => i.status === 'submitted')
                    .map(item => {
                      const decision = item.overall_decision?.toUpperCase() || 'HOLD';
                      const badgeColors = {
                        ACCEPT: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
                        HOLD: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
                        REJECT: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30'
                      }[decision];

                      return (
                        <div
                          key={item.$id}
                          onClick={() => handleViewDetails(item)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.98] transition-all cursor-pointer"
                        >
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate max-w-[170px]">
                              {item.product_name}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                              <span className="font-mono bg-slate-50 dark:bg-slate-850 px-1 py-0.5 rounded font-medium">
                                {item.batch_no}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {formatDate(item.submitted_at)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border uppercase tracking-wider font-display ${badgeColors}`}>
                              {decision}
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Fixed Bottom Navigation Bar (Hidden when actively editing/viewing inspection) */}
      {!activeInspection && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-2 pb-safe-bottom shadow-lg">
          <div className="max-w-md mx-auto grid grid-cols-3 gap-1 px-4">
            
            {/* Dashboard Tab */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center gap-1 py-1 text-slate-400 active:scale-95 transition-all cursor-pointer ${activeTab === 'dashboard' ? 'text-brand-500 dark:text-brand-400 font-bold' : ''}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">Dashboard</span>
            </button>

            {/* New Inspection Tab */}
            <button
              onClick={() => setActiveTab('new_inspection')}
              className={`flex flex-col items-center gap-1 py-1 text-slate-400 active:scale-95 transition-all cursor-pointer ${activeTab === 'new_inspection' ? 'text-brand-500 dark:text-brand-400 font-bold' : ''}`}
            >
              <PlusCircle className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">New AQL</span>
            </button>

            {/* History Tab */}
            <button
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center gap-1 py-1 text-slate-400 active:scale-95 transition-all cursor-pointer ${activeTab === 'history' ? 'text-brand-500 dark:text-brand-400 font-bold' : ''}`}
            >
              <History className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">History</span>
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
