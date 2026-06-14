import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useInspection } from '../hooks/useInspection';
import { 
  getCalculatedSampleSize, 
  calculateDecision, 
  DEFECT_SECTIONS 
} from '../utils/aqlCalculator';
import { generateAQLReportPDF } from '../utils/pdfGenerator';
import DefectSection from './DefectSection';
import DecisionBadge from './DecisionBadge';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Download, 
  AlertTriangle, 
  CheckCircle,
  FileCheck,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

export default function InspectionForm({ initialData, onClose, showToast }) {
  const { user } = useAuth();
  const { 
    saveInspectionDraft, 
    submitInspection, 
    saveLocalDraft, 
    clearLocalDraft 
  } = useInspection();

  const isViewMode = initialData && initialData.status === 'submitted';
  const inspectionIdRef = useRef(initialData?.$id || null);

  // --- FORM STATES ---
  const [productName, setProductName] = useState(initialData?.product_name || '');
  const [batchNo, setBatchNo] = useState(initialData?.batch_no || '');
  const [batchSize, setBatchSize] = useState(initialData?.batch_size || '');
  const [totalProduction, setTotalProduction] = useState(initialData?.total_production || '');
  const [sku, setSku] = useState(initialData?.sku || '');
  
  // Format dates to YYYY-MM-DD for date inputs
  const formatDateForInput = (isoString) => {
    if (!isoString) return '';
    return isoString.split('T')[0];
  };

  const [mfdDate, setMfdDate] = useState(formatDateForInput(initialData?.mfd_date) || '');
  const [expDate, setExpDate] = useState(formatDateForInput(initialData?.exp_date) || '');

  // Sample Size Override state
  const [isOverridden, setIsOverridden] = useState(!!initialData?.override_reason);
  const [overrideReason, setOverrideReason] = useState(initialData?.override_reason || '');
  const [manualSampleSize, setManualSampleSize] = useState(initialData?.sample_size || '');

  // Defect states (arrays of { id, count, observation })
  const [criticalDefects, setCriticalDefects] = useState(initialData?.critical_defects || []);
  const [majorDefects, setMajorDefects] = useState(initialData?.major_defects || []);
  const [minorDefects, setMinorDefects] = useState(initialData?.minor_defects || []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // --- AUTO CALCULATION LOGIC ---
  const autoSampleSize = useMemo(() => {
    return getCalculatedSampleSize(batchSize);
  }, [batchSize]);

  const activeSampleSize = useMemo(() => {
    if (isOverridden) {
      return Number(manualSampleSize) || autoSampleSize;
    }
    return autoSampleSize;
  }, [isOverridden, manualSampleSize, autoSampleSize]);

  const liveMetrics = useMemo(() => {
    return calculateDecision({
      sampleSize: activeSampleSize,
      criticalDefectsList: criticalDefects,
      majorDefectsList: majorDefects,
      minorDefectsList: minorDefects
    });
  }, [activeSampleSize, criticalDefects, majorDefects, minorDefects]);

  // --- DEFECT UPDATE HANDLERS ---
  const handleDefectChange = (section, id, updatedDefect) => {
    if (isViewMode) return;
    
    const setterMap = {
      critical: setCriticalDefects,
      major: setMajorDefects,
      minor: setMinorDefects
    };
    
    const listMap = {
      critical: criticalDefects,
      major: majorDefects,
      minor: minorDefects
    };

    const currentList = listMap[section];
    const index = currentList.findIndex(d => d.id === id);
    const updatedList = [...currentList];

    if (index > -1) {
      updatedList[index] = updatedDefect;
    } else {
      updatedList.push(updatedDefect);
    }
    
    setterMap[section](updatedList);
  };

  // --- COMPILE INSPECTION OBJECT ---
  const getCompiledData = () => {
    return {
      product_name: productName.trim(),
      batch_no: batchNo.trim(),
      batch_size: Number(batchSize) || 0,
      total_production: Number(totalProduction) || 0,
      sku: sku.trim(),
      mfd_date: mfdDate ? new Date(mfdDate).toISOString() : null,
      exp_date: expDate ? new Date(expDate).toISOString() : null,
      sample_size: activeSampleSize,
      override_reason: isOverridden ? overrideReason.trim() : '',
      
      critical_defects: criticalDefects,
      major_defects: majorDefects,
      minor_defects: minorDefects,
      
      defect_pct_critical: liveMetrics.defectPctCritical,
      defect_pct_major: liveMetrics.defectPctMajor,
      defect_pct_minor: liveMetrics.defectPctMinor,
      overall_decision: liveMetrics.decision
    };
  };

  // --- AUTO-SAVE TIMELOOP (60 SECONDS) ---
  useEffect(() => {
    if (isViewMode) return;

    const interval = setInterval(async () => {
      const compiled = getCompiledData();
      
      // Auto-save to localStorage fallback
      saveLocalDraft(compiled);
      
      // Attempt background save to Appwrite if basic fields are input
      if (productName.trim() && batchNo.trim()) {
        try {
          const doc = await saveInspectionDraft(user.$id, compiled, inspectionIdRef.current);
          if (doc && doc.$id) {
            inspectionIdRef.current = doc.$id;
          }
          showToast('Draft auto-saved successfully.', 'success');
        } catch (e) {
          // Keep local draft, but note API connection issue
          console.warn('Appwrite auto-save offline fallback activated.', e);
          showToast('Draft auto-saved locally (offline).', 'info');
        }
      } else {
        showToast('Form draft cached.', 'info');
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [
    productName, 
    batchNo, 
    batchSize, 
    totalProduction, 
    sku, 
    mfdDate, 
    expDate, 
    activeSampleSize, 
    isOverridden, 
    overrideReason, 
    criticalDefects, 
    majorDefects, 
    minorDefects, 
    isViewMode,
    user
  ]);

  // --- MANUAL SAVE DRAFT ---
  const handleSaveDraft = async () => {
    if (!productName.trim() || !batchNo.trim()) {
      alert('Please fill Product Name and Batch No. to save a draft.');
      return;
    }

    try {
      const compiled = getCompiledData();
      const doc = await saveInspectionDraft(user.$id, compiled, inspectionIdRef.current);
      if (doc && doc.$id) {
        inspectionIdRef.current = doc.$id;
      }
      saveLocalDraft(compiled);
      showToast('Draft saved successfully.', 'success');
      onClose();
    } catch (err) {
      alert('Error saving draft: ' + err.message);
    }
  };

  // --- FORM VALIDATION ---
  const validateForm = () => {
    if (!productName.trim()) return 'Product Name is required.';
    if (!batchNo.trim()) return 'Batch No. is required.';
    if (!batchSize || Number(batchSize) <= 0) return 'Valid Batch Size is required.';
    if (!totalProduction || Number(totalProduction) <= 0) return 'Total Production quantity is required.';
    if (!sku.trim()) return 'SKU code is required.';
    if (!mfdDate) return 'Manufacturing Date is required.';
    if (!expDate) return 'Expiry Date is required.';
    if (isOverridden) {
      if (!manualSampleSize || Number(manualSampleSize) <= 0) {
        return 'Please input a valid manual sample size.';
      }
      if (!overrideReason.trim()) {
        return 'Justification is required for overriding sample size.';
      }
    }
    return null;
  };

  // --- SUBMIT FINAL INSPECTION ---
  const handleSubmitConfirm = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    
    try {
      const compiled = getCompiledData();
      await submitInspection(user.$id, compiled, inspectionIdRef.current);
      clearLocalDraft();
      
      showToast('Inspection submitted successfully!', 'success');
      onClose();
    } catch (err) {
      alert('Submission error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    const errorMsg = validateForm();
    if (errorMsg) {
      alert(errorMsg);
      return;
    }
    setShowConfirmModal(true);
  };

  // --- PDF DOWNLOAD ---
  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      // Reconstruct an inspection details object for printing
      const printObj = {
        ...getCompiledData(),
        $id: inspectionIdRef.current,
        submitted_at: initialData?.submitted_at || new Date().toISOString(),
        created_at: initialData?.created_at || new Date().toISOString()
      };
      await generateAQLReportPDF(printObj, user.full_name);
      showToast('PDF download started.', 'success');
    } catch (e) {
      alert('Failed to generate PDF: ' + e.message);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full p-4 pb-28 flex flex-col min-h-screen">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer h-10 px-2 rounded-xl active:bg-slate-100 dark:active:bg-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <span className="text-xs font-bold font-display uppercase tracking-widest text-slate-400">
          {isViewMode ? 'Inspection View' : 'New AQL SOP Form'}
        </span>
        <div className="w-10"></div> {/* Spacer for symmetry */}
      </div>

      <form onSubmit={handlePreSubmit} className="space-y-5">
        
        {/* CARD 1: Header Parameters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-extrabold font-display uppercase tracking-wider text-brand-500 flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-850">
            <Layers className="w-4 h-4" />
            <span>1. Batch Identifiers</span>
          </h3>

          <div className="space-y-3">
            {/* Product Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Product Name</label>
              <input
                type="text"
                disabled={isViewMode}
                placeholder="e.g. Lavender Hydrating Lotion"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full h-11 px-3 text-xs bg-slate-50 border border-slate-300 dark:bg-slate-850 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 dark:text-slate-200 disabled:opacity-75"
              />
            </div>

            {/* SKU & Batch No */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">SKU Code</label>
                <input
                  type="text"
                  disabled={isViewMode}
                  placeholder="e.g. ESM-LH-250"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full h-11 px-3 text-xs bg-slate-50 border border-slate-300 dark:bg-slate-850 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 dark:text-slate-200 disabled:opacity-75"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Batch No.</label>
                <input
                  type="text"
                  disabled={isViewMode}
                  placeholder="e.g. B260614"
                  value={batchNo}
                  onChange={(e) => setBatchNo(e.target.value)}
                  className="w-full h-11 px-3 text-xs bg-slate-50 border border-slate-300 dark:bg-slate-850 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 dark:text-slate-200 font-mono disabled:opacity-75"
                />
              </div>
            </div>

            {/* Batch Size & Total Production */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Batch Size (Pcs)</label>
                <input
                  type="number"
                  disabled={isViewMode}
                  placeholder="5000"
                  value={batchSize}
                  onChange={(e) => setBatchSize(e.target.value)}
                  className="w-full h-11 px-3 text-xs bg-slate-50 border border-slate-300 dark:bg-slate-850 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 dark:text-slate-200 disabled:opacity-75"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Production</label>
                <input
                  type="number"
                  disabled={isViewMode}
                  placeholder="4950"
                  value={totalProduction}
                  onChange={(e) => setTotalProduction(e.target.value)}
                  className="w-full h-11 px-3 text-xs bg-slate-50 border border-slate-300 dark:bg-slate-850 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 dark:text-slate-200 disabled:opacity-75"
                />
              </div>
            </div>

            {/* Mfd & Exp Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Mfg. Date</label>
                <input
                  type="date"
                  disabled={isViewMode}
                  value={mfdDate}
                  onChange={(e) => setMfdDate(e.target.value)}
                  className="w-full h-11 px-3 text-xs bg-slate-50 border border-slate-300 dark:bg-slate-850 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 dark:text-slate-200 disabled:opacity-75"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Expiry Date</label>
                <input
                  type="date"
                  disabled={isViewMode}
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full h-11 px-3 text-xs bg-slate-50 border border-slate-300 dark:bg-slate-850 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 dark:text-slate-200 disabled:opacity-75"
                />
              </div>
            </div>

          </div>
        </div>

        {/* CARD 2: Sampling Level (ISO Auto-Calculator) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-extrabold font-display uppercase tracking-wider text-brand-500 flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-850">
            <Info className="w-4 h-4" />
            <span>2. Sampling Control (ISO 2859-1 II)</span>
          </h3>

          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                  Calculated Sample Size
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  Based on batch size: <span className="font-bold">{batchSize || 0}</span>
                </span>
              </div>
              <div className="text-3xl font-black font-display text-brand-500">
                {autoSampleSize}
              </div>
            </div>

            {/* Override Controls */}
            {!isViewMode && (
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2.5 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOverridden}
                    onChange={(e) => setIsOverridden(e.target.checked)}
                    className="w-5 h-5 rounded-md border-slate-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Override standard sample size
                  </span>
                </label>

                {isOverridden && (
                  <div className="space-y-3 p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 rounded-2xl animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                        Manual Sample Size
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 50"
                        value={manualSampleSize}
                        onChange={(e) => setManualSampleSize(e.target.value)}
                        className="w-full h-11 px-3 text-xs bg-white border border-amber-300 dark:bg-slate-900 dark:border-amber-900/50 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-slate-800 dark:text-slate-200 font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                        Override Justification Reason
                      </label>
                      <textarea
                        rows="2"
                        placeholder="Describe the operational reason for this override..."
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        className="w-full p-3 text-xs bg-white border border-amber-300 dark:bg-slate-900 dark:border-amber-900/50 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {isViewMode && overrideReason && (
              <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl">
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
                  Sample Size Override Justification:
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-normal">
                  {overrideReason}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CARD 3: Defect Entries (Collapsible) */}
        <div>
          <h3 className="text-xs font-extrabold font-display uppercase tracking-wider text-slate-400 mb-3 ml-1">
            3. Defect Classification Logs
          </h3>

          <DefectSection
            title="Section A — Critical Defects"
            aqlText="AQL 0%"
            defects={DEFECT_SECTIONS.critical}
            defectList={criticalDefects}
            onDefectChange={(id, value) => handleDefectChange('critical', id, value)}
            colorTheme="red"
          />

          <DefectSection
            title="Section B — Major Defects"
            aqlText="AQL 1.0%"
            defects={DEFECT_SECTIONS.major}
            defectList={majorDefects}
            onDefectChange={(id, value) => handleDefectChange('major', id, value)}
            colorTheme="orange"
          />

          <DefectSection
            title="Section C — Minor Defects"
            aqlText="AQL 4.0%"
            defects={DEFECT_SECTIONS.minor}
            defectList={minorDefects}
            onDefectChange={(id, value) => handleDefectChange('minor', id, value)}
            colorTheme="blue"
          />
        </div>

        {/* Live Metrics / Decision Card */}
        {activeSampleSize > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold font-display uppercase tracking-wider text-slate-400 mb-3 ml-1">
              4. AQL Evaluation Summary
            </h3>
            <DecisionBadge metrics={liveMetrics} />
          </div>
        )}

        {/* Action Bottom Layout / Submissions */}
        <div className="pt-4 space-y-3">
          
          {/* If inspection is SUBMITTED (Read only) */}
          {isViewMode && (
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="w-full h-14 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-brand-500/25 transition-all text-sm cursor-pointer disabled:opacity-50"
            >
              {isDownloadingPdf ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Generating PDF report...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Download Format F-02 PDF</span>
                </>
              )}
            </button>
          )}

          {/* If inspection is in DRAFT/CREATE mode */}
          {!isViewMode && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="h-14 bg-white border border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold rounded-2xl flex items-center justify-center gap-2 text-sm shadow-xs cursor-pointer select-none"
              >
                <Save className="w-4 h-4" />
                <span>Save Draft</span>
              </button>

              <button
                type="submit"
                className="h-14 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-brand-500/20 cursor-pointer select-none"
              >
                <Send className="w-4 h-4" />
                <span>Submit Report</span>
              </button>
            </div>
          )}
        </div>

      </form>

      {/* CONFIRMATION MODAL DIALOG */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl animate-scaleUp">
            
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h4 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Confirm Submission
            </h4>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Are you sure you want to submit this finished goods inspection? 
              <br />
              <strong className="text-rose-500 dark:text-rose-400">
                This record cannot be edited or modified after submission.
              </strong>
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="h-11 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center cursor-pointer select-none"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleSubmitConfirm}
                disabled={isSubmitting}
                className="h-11 bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 font-bold rounded-xl text-xs flex items-center justify-center cursor-pointer select-none"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
