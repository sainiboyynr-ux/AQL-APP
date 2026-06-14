import { Client, Account, Databases, ID, Query } from 'appwrite';

const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'default';
const USER_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || 'users';
const INSPECTION_COLLECTION_ID = import.meta.env.VITE_APPWRITE_INSPECTIONS_COLLECTION_ID || 'inspections';

// Check if Appwrite parameters are configured and not placeholders
export const IS_MOCK = 
  !ENDPOINT || 
  !PROJECT_ID || 
  ENDPOINT.includes('your_') || 
  PROJECT_ID.includes('your_') ||
  ENDPOINT.trim() === '' ||
  PROJECT_ID.trim() === '';

let client = null;
let account = null;
let databases = null;

if (!IS_MOCK) {
  try {
    client = new Client();
    client.setEndpoint(ENDPOINT).setProject(PROJECT_ID);
    account = new Account(client);
    databases = new Databases(client);
  } catch (error) {
    console.error('Failed to initialize Appwrite client. Falling back to local storage mode.', error);
  }
}

// Ensure mock storage collections exist
const getLocalData = (key, defaultVal = []) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultVal;
};

const setLocalData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Mock authentication database (for demo credentials)
if (IS_MOCK) {
  const mockUsers = getLocalData('esme_mock_users');
  if (mockUsers.length === 0) {
    setLocalData('esme_mock_users', [
      {
        $id: 'user_1',
        employee_id: 'EMP001',
        full_name: 'Amit Sharma',
        role: 'qa_executive',
        department: 'Finished Goods QA'
      },
      {
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
      // Allow any password in mock mode, match employee ID
      const users = getLocalData('esme_mock_users');
      const user = users.find(u => u.employee_id.toUpperCase() === employeeId.trim().toUpperCase());
      
      if (!user) {
        throw new Error('Employee ID not found. Use EMP001 or EMP002 for demo.');
      }
      
      // Store current mock session
      setLocalData('esme_current_session', user);
      return user;
    } else {
      // Appwrite expects email format: employee_id@esme.com
      const email = `${employeeId.trim().toLowerCase()}@esme.com`;
      await account.createEmailPasswordSession(email, password);
      const userDoc = await account.get();
      
      // Fetch user profile details from the custom users collection
      try {
        const profile = await databases.listDocuments(
          DATABASE_ID,
          USER_COLLECTION_ID,
          [Query.equal('employee_id', employeeId.trim())]
        );
        if (profile.documents.length > 0) {
          return {
            $id: userDoc.$id,
            employee_id: employeeId,
            full_name: profile.documents[0].full_name,
            role: profile.documents[0].role,
            department: profile.documents[0].department
          };
        }
      } catch (err) {
        console.warn('Could not fetch custom user profile, returning auth account only.', err);
      }
      
      return {
        $id: userDoc.$id,
        employee_id: employeeId,
        full_name: userDoc.name || employeeId,
        role: 'qa_executive', // Default fallback
        department: 'QA'
      };
    }
  },

  getCurrentUser: async () => {
    if (IS_MOCK) {
      const session = getLocalData('esme_current_session', null);
      if (!session) throw new Error('No active mock session');
      return session;
    } else {
      const userDoc = await account.get();
      // Look up profile details
      try {
        const empId = userDoc.email.split('@')[0].toUpperCase();
        const profile = await databases.listDocuments(
          DATABASE_ID,
          USER_COLLECTION_ID,
          [Query.equal('employee_id', empId)]
        );
        if (profile.documents.length > 0) {
          return {
            $id: userDoc.$id,
            employee_id: empId,
            full_name: profile.documents[0].full_name,
            role: profile.documents[0].role,
            department: profile.documents[0].department
          };
        }
        return {
          $id: userDoc.$id,
          employee_id: empId,
          full_name: userDoc.name || empId,
          role: 'qa_executive',
          department: 'QA'
        };
      } catch (err) {
        return {
          $id: userDoc.$id,
          employee_id: userDoc.email.split('@')[0].toUpperCase(),
          full_name: userDoc.name,
          role: 'qa_executive',
          department: 'QA'
        };
      }
    }
  },

  logout: async () => {
    if (IS_MOCK) {
      localStorage.removeItem('esme_current_session');
      return true;
    } else {
      await account.deleteSession('current');
      return true;
    }
  }
};

export const databaseService = {
  listInspections: async (userId) => {
    if (IS_MOCK) {
      const inspections = getLocalData('esme_inspections', []);
      // Filter by user who created it
      return inspections.filter(i => i.created_by === userId);
    } else {
      const response = await databases.listDocuments(
        DATABASE_ID,
        INSPECTION_COLLECTION_ID,
        [
          Query.equal('created_by', userId),
          Query.orderDesc('created_at')
        ]
      );
      return response.documents;
    }
  },

  getInspection: async (id) => {
    if (IS_MOCK) {
      const inspections = getLocalData('esme_inspections', []);
      const inspection = inspections.find(i => i.$id === id);
      if (!inspection) throw new Error('Inspection not found');
      return inspection;
    } else {
      return await databases.getDocument(
        DATABASE_ID,
        INSPECTION_COLLECTION_ID,
        id
      );
    }
  },

  saveInspection: async (inspectionData, id = null) => {
    if (IS_MOCK) {
      const inspections = getLocalData('esme_inspections', []);
      if (id) {
        // Update
        const index = inspections.findIndex(i => i.$id === id);
        if (index === -1) throw new Error('Inspection not found');
        
        // Safety check: Cannot edit submitted
        if (inspections[index].status === 'submitted') {
          throw new Error('Inspection cannot be edited after submission');
        }

        const updated = {
          ...inspections[index],
          ...inspectionData,
          updated_at: new Date().toISOString()
        };
        inspections[index] = updated;
        setLocalData('esme_inspections', inspections);
        return updated;
      } else {
        // Create new
        const newDoc = {
          $id: 'insp_' + Math.random().toString(36).substr(2, 9),
          ...inspectionData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        inspections.push(newDoc);
        setLocalData('esme_inspections', inspections);
        return newDoc;
      }
    } else {
      if (id) {
        // Check if already submitted (fetch first)
        const existing = await databases.getDocument(DATABASE_ID, INSPECTION_COLLECTION_ID, id);
        if (existing.status === 'submitted') {
          throw new Error('Inspection cannot be edited after submission');
        }
        
        return await databases.updateDocument(
          DATABASE_ID,
          INSPECTION_COLLECTION_ID,
          id,
          {
            ...inspectionData,
            // JSON arrays need to be stringified if Appwrite schema uses strings,
            // or kept as JSON arrays if Appwrite supports them.
            // We stringify to support standard database schemas seamlessly
            critical_defects: typeof inspectionData.critical_defects === 'object' ? JSON.stringify(inspectionData.critical_defects) : inspectionData.critical_defects,
            major_defects: typeof inspectionData.major_defects === 'object' ? JSON.stringify(inspectionData.major_defects) : inspectionData.major_defects,
            minor_defects: typeof inspectionData.minor_defects === 'object' ? JSON.stringify(inspectionData.minor_defects) : inspectionData.minor_defects,
          }
        );
      } else {
        return await databases.createDocument(
          DATABASE_ID,
          INSPECTION_COLLECTION_ID,
          ID.unique(),
          {
            ...inspectionData,
            created_at: new Date().toISOString(),
            critical_defects: typeof inspectionData.critical_defects === 'object' ? JSON.stringify(inspectionData.critical_defects) : inspectionData.critical_defects,
            major_defects: typeof inspectionData.major_defects === 'object' ? JSON.stringify(inspectionData.major_defects) : inspectionData.major_defects,
            minor_defects: typeof inspectionData.minor_defects === 'object' ? JSON.stringify(inspectionData.minor_defects) : inspectionData.minor_defects,
          }
        );
      }
    }
  }
};
export { DATABASE_ID, USER_COLLECTION_ID, INSPECTION_COLLECTION_ID };
