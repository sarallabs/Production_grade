import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage, StorageKeys } from '@/utils/storage';

export type PersonaType = 'beginner' | 'intermediate' | 'advanced';

export interface StudentProfile {
  id: string;
  name: string;
  rollNumber: string;
  university: string;
  program: string;
  semester: string;
}

interface AuthContextType {
  user: StudentProfile | null;
  persona: PersonaType;
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  questionnaireCompleted: boolean;
  isLoading: boolean;
  login: (username: string, rollNumber?: string) => Promise<void>;
  loginAsDemoStudent: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<StudentProfile>) => Promise<void>;
  updatePersona: (newPersona: PersonaType) => Promise<void>;
  completeQuestionnaire: (assignedPersona: PersonaType) => Promise<void>;
}

const DEFAULT_PROFILE: StudentProfile = {
  id: 'angrau_demo_student',
  name: 'Aditya (Student)',
  rollNumber: 'AG-2023-131',
  university: 'Acharya N.G. Ranga Agricultural University (ANGRAU)',
  program: 'B.Sc (Hons) Agriculture',
  semester: 'Semester 3 (Year 2)',
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  persona: 'beginner',
  isAuthenticated: false,
  onboardingCompleted: false,
  questionnaireCompleted: false,
  isLoading: true,
  login: async () => {},
  loginAsDemoStudent: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  updatePersona: async () => {},
  completeQuestionnaire: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StudentProfile | null>(null);
  const [persona, setPersona] = useState<PersonaType>('beginner');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const [token, savedProfile, savedPersona, questionnaireDone] = await Promise.all([
        storage.getItem<string>(StorageKeys.AUTH_TOKEN),
        storage.getItem<StudentProfile>(StorageKeys.USER_PROFILE),
        storage.getItem<PersonaType>(StorageKeys.STUDENT_PERSONA),
        storage.getItem<boolean>(StorageKeys.QUESTIONNAIRE_DONE),
      ]);

      if (token && savedProfile) {
        setUser(savedProfile);
        setIsAuthenticated(true);
        setOnboardingCompleted(Boolean(savedProfile.university));
      }
      if (savedPersona) {
        setPersona(savedPersona);
      }
      if (questionnaireDone) {
        setQuestionnaireCompleted(true);
      }
    } catch (e) {
      console.error('Error loading session from storage', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, rollNumber: string = 'AG-2024-001') => {
    const profile: StudentProfile = {
      id: `std_${Date.now()}`,
      name: username || 'ANGRAU Student',
      rollNumber,
      university: 'Acharya N.G. Ranga Agricultural University (ANGRAU)',
      program: 'B.Sc (Hons) Agriculture',
      semester: 'Semester 3',
    };
    await storage.setItem(StorageKeys.AUTH_TOKEN, 'active_session_token');
    await storage.setItem(StorageKeys.USER_PROFILE, profile);
    setUser(profile);
    setIsAuthenticated(true);
  };

  const loginAsDemoStudent = async () => {
    await storage.setItem(StorageKeys.AUTH_TOKEN, 'active_session_token');
    await storage.setItem(StorageKeys.USER_PROFILE, DEFAULT_PROFILE);
    await storage.setItem(StorageKeys.STUDENT_PERSONA, 'intermediate');
    await storage.setItem(StorageKeys.QUESTIONNAIRE_DONE, true);
    setUser(DEFAULT_PROFILE);
    setPersona('intermediate');
    setIsAuthenticated(true);
    setOnboardingCompleted(true);
    setQuestionnaireCompleted(true);
  };

  const updateProfile = async (updates: Partial<StudentProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    await storage.setItem(StorageKeys.USER_PROFILE, updated);
    setUser(updated);
    setOnboardingCompleted(true);
  };

  const updatePersona = async (newPersona: PersonaType) => {
    await storage.setItem(StorageKeys.STUDENT_PERSONA, newPersona);
    setPersona(newPersona);
  };

  const completeQuestionnaire = async (assignedPersona: PersonaType) => {
    await storage.setItem(StorageKeys.QUESTIONNAIRE_DONE, true);
    await storage.setItem(StorageKeys.STUDENT_PERSONA, assignedPersona);
    setPersona(assignedPersona);
    setQuestionnaireCompleted(true);
  };

  const logout = async () => {
    await storage.clear();
    setUser(null);
    setIsAuthenticated(false);
    setOnboardingCompleted(false);
    setQuestionnaireCompleted(false);
    setPersona('beginner');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        persona,
        isAuthenticated,
        onboardingCompleted,
        questionnaireCompleted,
        isLoading,
        login,
        loginAsDemoStudent,
        logout,
        updateProfile,
        updatePersona,
        completeQuestionnaire,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
