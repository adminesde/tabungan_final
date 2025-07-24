import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SavingsGoal } from '../types';
import { supabase } from '../integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';
import { useAuth } from './Auth/AuthContext';

interface SavingsGoalsContextType {
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (newGoal: Omit<SavingsGoal, 'id' | 'status' | 'currentSavedAmount' | 'studentId' | 'type'> & { classId: string; goalName: string; goalAmount: number; targetDate: string; dayOfWeek: string }) => Promise<boolean>;
  updateSavingsGoal: (updatedGoal: SavingsGoal) => Promise<boolean>;
  deleteSavingsGoal: (goalId: string) => Promise<boolean>;
  fetchSavingsGoals: () => Promise<void>;
}

const SavingsGoalsContext = createContext<SavingsGoalsContextType | undefined>(undefined);

export function SavingsGoalsProvider({ children }: { children: ReactNode }) {
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const { user } = useAuth();

  const fetchSavingsGoals = useCallback(async () => {
    if (!user) {
      setSavingsGoals([]);
      return;
    }
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('type', 'class');

    if (error) {
      console.error("Error fetching savings goals:", error);
      showError("Gagal memuat tujuan tabungan.");
    } else {
      const fetchedGoals: SavingsGoal[] = data.map(g => ({
        id: g.id,
        classId: g.class_id,
        type: g.type,
        goalName: g.goal_name,
        goalAmount: g.goal_amount,
        currentSavedAmount: 0,
        targetDate: g.target_date,
        status: 'on-track',
        dayOfWeek: g.day_of_week,
      }));
      setSavingsGoals(fetchedGoals);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchSavingsGoals();
    }
    
    const channel = supabase
      .channel('savings_goals_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'savings_goals' }, () => {
        fetchSavingsGoals();
      })
      .subscribe();

    return () => {
      // Corrected: removeChannel expects the channel object itself, not its topic string
      supabase.removeChannel(channel);
    };
  }, [fetchSavingsGoals, user]);

  const addSavingsGoal = async (
    newGoalData: Omit<SavingsGoal, 'id' | 'status' | 'currentSavedAmount' | 'studentId' | 'type'> & { classId: string; goalName: string; goalAmount: number; targetDate: string; dayOfWeek: string }
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('savings_goals')
      .insert({
        class_id: newGoalData.classId,
        type: 'class',
        goal_name: newGoalData.goalName,
        goal_amount: newGoalData.goalAmount,
        target_date: newGoalData.targetDate,
        day_of_week: newGoalData.dayOfWeek,
      });

    if (error) {
      console.error("Error adding savings goal:", error);
      showError("Gagal menambahkan tujuan tabungan.");
      return false;
    } else {
      showSuccess("Tujuan tabungan berhasil ditambahkan.");
      return true;
    }
  };

  const updateSavingsGoal = async (updatedGoal: SavingsGoal): Promise<boolean> => {
    const { error } = await supabase
      .from('savings_goals')
      .update({
        goal_name: updatedGoal.goalName,
        goal_amount: updatedGoal.goalAmount,
        target_date: updatedGoal.targetDate,
        day_of_week: updatedGoal.dayOfWeek,
      })
      .eq('id', updatedGoal.id);

    if (error) {
      console.error("Error updating savings goal:", error);
      showError("Gagal memperbarui tujuan tabungan.");
      return false;
    } else {
      showSuccess("Tujuan tabungan berhasil diperbarui.");
      return true;
    }
  };

  const deleteSavingsGoal = async (goalId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      console.error("Error deleting savings goal:", error);
      showError("Gagal menghapus tujuan tabungan.");
      return false;
    } else {
      showSuccess("Tujuan tabungan berhasil dihapus.");
      return true;
    }
  };

  return (
    <SavingsGoalsContext.Provider value={{ savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, fetchSavingsGoals }}>
      {children}
    </SavingsGoalsContext.Provider>
  );
}

export function useSavingsGoals() {
  const context = useContext(SavingsGoalsContext);
  if (context === undefined) {
    throw new Error('useSavingsGoals must be used within a SavingsGoalsProvider');
  }
  return context;
}