import { useState, useCallback } from 'react';
import { databaseService } from '../utils/appwriteClient';

export function useInspection() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInspections = useCallback(async (userId) => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const docs = await databaseService.listInspections(userId);
      
      // Parse JSON strings in inspection documents if needed (Appwrite may return stringified json)
      const parsedDocs = docs.map(doc => {
        let critical = doc.critical_defects;
        let major = doc.major_defects;
        let minor = doc.minor_defects;
        
        try {
          if (typeof critical === 'string') critical = JSON.parse(critical);
          if (typeof major === 'string') major = JSON.parse(major);
          if (typeof minor === 'string') minor = JSON.parse(minor);
        } catch (e) {
          console.error('Failed to parse defect arrays from Appwrite document', e);
        }
        
        return {
          ...doc,
          critical_defects: critical || [],
          major_defects: major || [],
          minor_defects: minor || []
        };
      });

      setInspections(parsedDocs);
      return parsedDocs;
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to retrieve inspections');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveInspectionDraft = async (userId, inspectionData, id = null) => {
    setLoading(true);
    setError(null);
    try {
      const data = {
        ...inspectionData,
        created_by: userId,
        status: 'draft',
        updated_at: new Date().toISOString()
      };
      const savedDoc = await databaseService.saveInspection(data, id);
      return savedDoc;
    } catch (err) {
      setError(err.message || 'Failed to save draft');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const submitInspection = async (userId, inspectionData, id = null) => {
    setLoading(true);
    setError(null);
    try {
      const data = {
        ...inspectionData,
        created_by: userId,
        status: 'submitted', // changes status from draft to submitted
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Perform save
      const savedDoc = await databaseService.saveInspection(data, id);
      return savedDoc;
    } catch (err) {
      setError(err.message || 'Failed to submit inspection');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Local Storage Draft helpers
  const saveLocalDraft = useCallback((formData) => {
    localStorage.setItem('esme_active_draft', JSON.stringify({
      ...formData,
      lastSaved: new Date().toISOString()
    }));
  }, []);

  const getLocalDraft = useCallback(() => {
    const draft = localStorage.getItem('esme_active_draft');
    if (!draft) return null;
    try {
      return JSON.parse(draft);
    } catch (e) {
      return null;
    }
  }, []);

  const clearLocalDraft = useCallback(() => {
    localStorage.removeItem('esme_active_draft');
  }, []);

  return {
    inspections,
    loading,
    error,
    fetchInspections,
    saveInspectionDraft,
    submitInspection,
    saveLocalDraft,
    getLocalDraft,
    clearLocalDraft
  };
}
