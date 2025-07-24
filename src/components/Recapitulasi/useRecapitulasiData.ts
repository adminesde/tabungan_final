import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/Auth/AuthContext';
import { useStudents } from '../../contexts/StudentsContext';
import { useTransactions } from '../../contexts/TransactionsContext';
import { supabase } from '../../integrations/supabase/client';
import { User, Student } from '../../types';

interface StudentSummary extends Student {
  totalDeposits: number;
  totalWithdrawals: number;
}

interface UseRecapitulasiDataResult {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedClass: string;
  setSelectedClass: (cls: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  totalDeposits: number;
  totalWithdrawals: number;
  netAmount: number;
  studentSummary: StudentSummary[];
  
  classes: string[];
  allUsers: User[];
  isLoading: boolean;
  includeClassColumn: boolean;
}

export function useRecapitulasiData(): UseRecapitulasiDataResult {
  const { user } = useAuth();
  const { students: allStudents } = useStudents();
  const { transactions: allTransactions } = useTransactions();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error("Error fetching users for recapitulation:", error);
      } else {
        const fetchedUsers: User[] = data.map(profile => ({
          id: profile.id,
          name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
          email: profile.email,
          role: profile.role as 'admin' | 'teacher' | 'parent',
          class: profile.class || undefined,
          createdAt: profile.created_at,
          isActive: profile.is_active,
        }));
        setAllUsers(fetchedUsers);
      }
      setIsLoading(false);
    };
    fetchInitialData();
  }, []);

  const getFilteredData = useCallback(() => {
    let studentsInScope = allStudents;
    let transactionsInScope = allTransactions;

    if (user?.role === 'teacher' && user.class) {
      studentsInScope = studentsInScope.filter(s => s.class === user.class);
      const classStudentIds = studentsInScope.map(s => s.id);
      transactionsInScope = transactionsInScope.filter(t => classStudentIds.includes(t.studentId));
    }

    if (selectedClass) {
      studentsInScope = studentsInScope.filter(s => s.class === selectedClass);
      const classStudentIds = studentsInScope.map(s => s.id);
      transactionsInScope = transactionsInScope.filter(t => classStudentIds.includes(t.studentId));
    }

    if (selectedDate) {
      transactionsInScope = transactionsInScope.filter(t =>
        t.date.startsWith(selectedDate)
      );
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      studentsInScope = studentsInScope.filter(s => s.name.toLowerCase().includes(searchLower));
      const searchedStudentIds = studentsInScope.map(s => s.id);
      transactionsInScope = transactionsInScope.filter(t => searchedStudentIds.includes(t.studentId));
    }

    return { students: studentsInScope, transactions: transactionsInScope };
  }, [allStudents, allTransactions, user, selectedClass, selectedDate, searchTerm]);

  const { students, transactions } = getFilteredData();

  const totalDeposits = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  const netAmount = totalDeposits - totalWithdrawals;

  const getStudentSummary = useCallback(() => {
    return students.map(student => {
      const studentTransactions = transactions.filter(t => t.studentId === student.id);
      const deposits = studentTransactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);
      const withdrawals = studentTransactions
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        ...student,
        totalDeposits: deposits,
        totalWithdrawals: withdrawals,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [students, transactions]);

  const studentSummary = getStudentSummary();

  const classes = [...new Set(allStudents.map(s => s.class))].sort();

  const includeClassColumn = !selectedClass && !(user?.role === 'teacher' && user.class);

  return {
    selectedDate,
    setSelectedDate,
    selectedClass,
    setSelectedClass,
    searchTerm,
    setSearchTerm,
    totalDeposits,
    totalWithdrawals,
    netAmount,
    studentSummary,
    classes,
    allUsers,
    isLoading,
    includeClassColumn,
  };
}