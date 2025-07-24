import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Transaction } from '../types';
import { useStudents } from './StudentsContext';
import { supabase } from '../integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';
import { useAuth } from './Auth/AuthContext';

interface TransactionsContextType {
  transactions: Transaction[];
  addTransaction: (newTransaction: Omit<Transaction, 'id' | 'date' | 'performedBy' | 'performedByRole' | 'balance'>, performedBy: string, performedByRole: 'admin' | 'teacher') => Promise<boolean>;
  resetTransactions: () => Promise<boolean>;
  fetchTransactions: () => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { students } = useStudents();
  const { user, isLoading: isAuthLoading } = useAuth();

  const fetchTransactions = useCallback(async () => {
    if (isAuthLoading) {
      console.log("TransactionsContext: Auth still loading, deferring fetchTransactions.");
      return;
    }
    if (!user) {
      console.log("TransactionsContext: No user logged in, clearing transactions.");
      setTransactions([]);
      return;
    }
    console.log("TransactionsContext: Fetching transactions for user:", user.id, "role:", user.role, "studentInfo:", user.studentInfo);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error("TransactionsContext: Error fetching transactions:", error);
      showError("Gagal memuat data transaksi.");
    } else {
      const fetchedTransactions: Transaction[] = data.map(t => ({
        id: t.id,
        studentId: t.student_id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        performedBy: t.performed_by,
        performedByRole: t.performed_by_role,
        date: t.date,
        balance: t.balance,
      }));
      setTransactions(fetchedTransactions);
    }
  }, [user, isAuthLoading]);

  useEffect(() => {
    if (!isAuthLoading && user) {
      fetchTransactions();
    }
    
    const channel = supabase
      .channel('transactions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, payload => {
        console.log("TransactionsContext: Realtime change detected, re-fetching transactions.");
        console.log("TransactionsContext: Realtime payload received:", payload);
        fetchTransactions();
      })
      .subscribe();

    return () => {
      console.log("TransactionsContext: Unsubscribing from realtime listener.");
      supabase.removeChannel(channel.topic); // Corrected
    };
  }, [fetchTransactions, user, students, isAuthLoading]);

  const addTransaction = async (
    newTransactionData: Omit<Transaction, 'id' | 'date' | 'performedBy' | 'performedByRole' | 'balance'>,
    performedBy: string,
    performedByRole: 'admin' | 'teacher'
  ): Promise<boolean> => {
    const student = students.find(s => s.id === newTransactionData.studentId);
    if (!student) {
      console.error("Student not found for transaction:", newTransactionData.studentId);
      showError("Siswa tidak ditemukan untuk transaksi ini.");
      return false;
    }

    let newBalance = student.balance;
    if (newTransactionData.type === 'deposit') {
      newBalance += newTransactionData.amount;
    } else {
      newBalance -= newTransactionData.amount;
    }

    const { error: transactionError } = await supabase // Removed transactionData as it's unused
      .from('transactions')
      .insert({
        student_id: newTransactionData.studentId,
        type: newTransactionData.type,
        amount: newTransactionData.amount,
        description: newTransactionData.description,
        performed_by: performedBy,
        performed_by_role: performedByRole,
        date: new Date().toISOString(),
        balance: newBalance,
      })
      .select()
      .single();

    if (transactionError) {
      console.error("Error adding transaction:", transactionError);
      showError("Gagal menambahkan transaksi.");
      return false;
    }

    const { error: studentUpdateError } = await supabase
      .from('students')
      .update({ balance: newBalance })
      .eq('id', student.id);

    if (studentUpdateError) {
      console.error("Error updating student balance:", studentUpdateError);
      showError("Transaksi berhasil, tetapi gagal memperbarui saldo siswa.");
      return false;
    }

    showSuccess("Transaksi berhasil disimpan!");
    return true;
  };

  const resetTransactions = async (): Promise<boolean> => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus semua riwayat transaksi? Tindakan ini tidak dapat dibatalkan.')) {
      return false;
    }
    const { error } = await supabase
      .from('transactions')
      .delete()
      .not('id', 'is.null');

    if (error) {
      console.error("Error resetting transactions:", error);
      showError("Gagal mereset riwayat transaksi.");
      return false;
    } else {
      showSuccess("Riwayat transaksi berhasil direset.");
      const { error: studentResetError } = await supabase
        .from('students')
        .update({ balance: 0 })
        .not('id', 'is.null');

      if (studentResetError) {
        console.error("Error resetting student balances:", studentResetError);
        showError("Riwayat transaksi direset, tetapi gagal mereset saldo siswa.");
        return false;
      }
      return true;
    }
  };

  return (
    <TransactionsContext.Provider value={{ transactions, addTransaction, resetTransactions, fetchTransactions }}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
}