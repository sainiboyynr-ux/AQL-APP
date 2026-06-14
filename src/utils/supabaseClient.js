import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const IS_MOCK =
  !SUPABASE_URL ||
  !SUPABASE_ANON_KEY ||
  SUPABASE_URL.includes('your_') ||
  SUPABASE_ANON_KEY.includes('your_') ||
  SUPABASE_URL.trim() === '' ||
  SUPABASE_ANON_KEY.trim() === '';

let supabase = null;

if (!IS_MOCK) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (error) {
    console.error('Failed to initialize Supabase client. Falling back to local storage mode.', error);
  }
}

// Helper for local storage
const getLocalData = (key, defaultVal = []) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultVal;
};

const setLocalData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Mock Auth Database Setup
if (IS_MOCK) {
  const mockUsers = getLocalData('esme_mock_users');
  if (mockUsers.length === 0) {
    setLocalData('esme_mock_users', [
      {
        id: 'user_1',
        $id: 'user_1',
        employee_id: 'EMP001',
        full_name: 'Amit Sharma',
        role: 'qa_executive',
        department: 'Finished Goods QA'
      },
      {
        id: 'user_2',
        $id: 'user_2',
        employee_id: 'EMP002',
        full_name: 'Priyanka Patel',
        role: 'qa_manager',
        department: 'Quality Control'
      }
    ]);
  }
}

export const authService = {
  login: async (employeeId, password) => {
    if (IS_MOCK) {
      const users = getLocalData('esme_mock_users');
      const user = users.find(u => u.employee_id.toUpperCase() === employeeId.trim().toUpperCase());
      if (!user) {
        throw new Error('Employee ID not found. Use EMP001 or EMP002 for demo.');
      }
      setLocalData('esme_current_session', user);
      return user;
    } else {
      // Map EMP001 -> emp001@esme.com
      const email = `${employeeId.trim().toLowerCase()}@esme.com`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      // Fetch user profile
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileErr || !profile) {
        console.warn('Could not fetch custom user profile, returning auth metadata instead.', profileErr);
        return {
          id: data.user.id,
          $id: data.user.id,
          employee_id: employeeId.toUpperCase(),
          full_name: data.user.user_metadata?.full_name || employeeId,
          role: data.user.user_metadata?.role || 'qa_executive',
          department: data.user.user_metadata?.department || 'QA'
        };
      }

      return {
        ...profile,
        $id: profile.id
      };
    }
  },

  getCurrentUser: async () => {
    if (IS_MOCK) {
      const session = getLocalData('esme_current_session', null);
      if (!session) throw new Error('No active mock session');
      return session;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No active user session');

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        const empId = user.email.split('@')[0].toUpperCase();
        return {
          id: user.id,
          $id: user.id,
          employee_id: empId,
          full_name: user.user_metadata?.full_name || empId,
          role: user.user_metadata?.role || 'qa_executive',
          department: user.user_metadata?.department || 'QA'
        };
      }

      return {
        ...profile,
        $id: profile.id
      };
    }
  },

  logout: async () => {
    if (IS_MOCK) {
      localStorage.removeItem('esme_current_session');
      return true;
    } else {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
      return true;
    }
  }
};

export const databaseService = {
  listInspections: async (userId) => {
    if (IS_MOCK) {
      const inspections = getLocalData('esme_inspections', []);
      return inspections.filter(i => i.created_by === userId);
    } else {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      
      // Inject $id for UI compatibility
      return data.map(item => ({
        ...item,
        $id: item.id
      }));
    }
  },

  getInspection: async (id) => {
    if (IS_MOCK) {
      const inspections = getLocalData('esme_inspections', []);
      const inspection = inspections.find(i => i.id === id);
      if (!inspection) throw new Error('Inspection not found');
      return inspection;
    } else {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      return {
        ...data,
        $id: data.id
      };
    }
  },

  saveInspection: async (inspectionData, id = null) => {
    // Map $id back to id internally if provided
    const cleanData = { ...inspectionData };
    delete cleanData.$id;
    delete cleanData.id;

    if (IS_MOCK) {
      const inspections = getLocalData('esme_inspections', []);
      if (id) {
        const index = inspections.findIndex(i => i.id === id);
        if (index === -1) throw new Error('Inspection not found');
        if (inspections[index].status === 'submitted') {
          throw new Error('Inspection cannot be edited after submission');
        }

        const updated = {
          ...inspections[index],
          ...cleanData,
          updated_at: new Date().toISOString()
        };
        inspections[index] = updated;
        setLocalData('esme_inspections', inspections);
        return {
          ...updated,
          $id: updated.id
        };
      } else {
        const generatedId = 'insp_' + Math.random().toString(36).substr(2, 9);
        const newDoc = {
          id: generatedId,
          $id: generatedId,
          ...cleanData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        inspections.push(newDoc);
        setLocalData('esme_inspections', inspections);
        return newDoc;
      }
    } else {
      if (id) {
        // Fetch to verify draft status
        const { data: existing, error: fetchErr } = await supabase
          .from('inspections')
          .select('status')
          .eq('id', id)
          .single();

        if (fetchErr) throw new Error(fetchErr.message);
        if (existing.status === 'submitted') {
          throw new Error('Inspection cannot be edited after submission');
        }

        const { data, error } = await supabase
          .from('inspections')
          .update({
            ...cleanData,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return {
          ...data,
          $id: data.id
        };
      } else {
        const { data, error } = await supabase
          .from('inspections')
          .insert([cleanData])
          .select()
          .single();

        if (error) throw new Error(error.message);
        return {
          ...data,
          $id: data.id
        };
      }
    }
  }
};
