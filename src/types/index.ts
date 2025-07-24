export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent';
  class?: string; // For teachers - which class they teach
  avatarUrl?: string; // New: URL for user's profile picture
  createdAt: string; // This will be from Supabase's created_at
  isActive: boolean; // This will be from Supabase's is_active
  nip?: string; // New: NIP for teachers/admins
  studentInfo?: { // New: For parent role, info about their child
    id: string;
    name: string;
    class: string;
    studentId: string; // NISN
  };
}

export interface Student {
  id: string;
  name: string;
  class: string;
  studentId: string; // NISN
  parentId: string | null; // Changed to allow null
  balance: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  studentId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  description: string;
  performedBy: string;
  performedByRole: 'admin' | 'teacher';
  date: string;
  balance: number;
}

export interface SavingsGoal {
  id: string;
  studentId?: string; // Optional for student-level goals (will be removed)
  classId?: string;   // For class-level goals
  type: 'student' | 'class'; // To distinguish goal types
  goalName: string;
  goalAmount: number;
  currentSavedAmount: number;
  targetDate: string; // YYYY-MM-DD
  status: 'on-track' | 'behind' | 'completed';
  dayOfWeek?: string; // New: Day of the week for recurring savings
}

export interface AuthContextType {
  user: User | null;
  login: (credential: string, password: string, role: 'admin' | 'teacher' | 'parent') => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  updateUser: (updatedUserData: Partial<User>) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
}