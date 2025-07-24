import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/Auth/AuthContext';
import { useStudents } from '../contexts/StudentsContext';
import { useTransactions } from '../contexts/TransactionsContext';
import { useSavingsGoals } from '../contexts/SavingsGoalsContext';
import StatsCard from '../components/Dashboard/StatsCard';
import TransactionList from '../components/Transactions/TransactionList';
import { DollarSign, TrendingUp, TrendingDown, Target, Clock, GraduationCap, Users, RefreshCw } from 'lucide-react';
import { SavingsGoal, User as SupabaseUser } from '../types';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';

export default function ParentDashboard() {
  const { user } = useAuth();
  const { students: allStudents, fetchStudents } = useStudents();
  const { transactions: allTransactions, fetchTransactions } = useTransactions();
  const { savingsGoals, fetchSavingsGoals } = useSavingsGoals();
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState<SupabaseUser[]>([]);

  useEffect(() => {
    fetchStudents();
    fetchTransactions();
    fetchSavingsGoals();
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error("Error fetching users for parent dashboard:", error);
      } else {
        const fetchedUsers: SupabaseUser[] = data.map(profile => ({
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
    };
    fetchUsers();
  }, [fetchStudents, fetchTransactions, fetchSavingsGoals]);

  if (!user || user.role !== 'parent') return null;

  // RLS on Supabase ensures only children's data is fetched for parents.
  // No need for client-side filtering here.
  const childrenStudents = allStudents; 
  const childrenTransactions = allTransactions;

  const totalBalance = childrenStudents.reduce((sum, student) => sum + student.balance, 0);
  
  const totalDeposits = childrenTransactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalWithdrawals = childrenTransactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const translateDayOfWeek = (day: string) => {
    switch (day) {
      case 'Monday': return 'Senin';
      case 'Tuesday': return 'Selasa';
      case 'Wednesday': return 'Rabu';
      case 'Thursday': return 'Kamis';
      case 'Friday': return 'Jumat';
      case 'Saturday': return 'Sabtu';
      case 'Sunday': return 'Minggu';
      default: return day;
    }
  };

  const getRecentTransactions = () => {
    return childrenTransactions.slice(0, 3);
  };

  const getFilteredAndCalculatedGoals = () => {
    const childrenClasses = [...new Set(childrenStudents.map(s => s.class))];
    
    return savingsGoals
      .filter(goal => goal.type === 'class' && goal.classId && childrenClasses.includes(goal.classId))
      .map(goal => {
        const studentsInClass = allStudents.filter(s => s.class === goal.classId);
        const currentSaved = studentsInClass.reduce((sum, s) => sum + s.balance, 0);
        let status: 'on-track' | 'behind' | 'completed' = 'on-track';
        if (currentSaved >= goal.goalAmount) {
          status = 'completed';
        } else if (currentSaved < goal.goalAmount * 0.8 && currentSaved < goal.goalAmount) {
          status = 'behind';
        } else {
          status = 'on-track';
        }

        // Find the teacher for this class
        const teacher = allUsers.find(u => u.role === 'teacher' && u.class === goal.classId);
        const teacherName = teacher ? teacher.name : 'Tidak Diketahui';

        return { ...goal, currentSavedAmount: currentSaved, status, teacherName };
      });
  };

  const parentClassGoals = getFilteredAndCalculatedGoals();

  return (
    <div className="space-y-6">
      <div className="bg-background rounded-xl shadow-md border border-theme-border-light p-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard Orang Tua</h1>
        <p className="text-muted-foreground">Pantau tabungan anak-anak Anda</p>
      </div>

      {/* New Section: Data Anak (moved here) */}
      <div className="bg-background rounded-xl shadow-md border border-theme-border-light p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Data Anak
        </h2>
        <div className="space-y-3">
          {childrenStudents
            .sort((a, b) => b.balance - a.balance)
            .map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-foreground">{student.name}</p>
                  <p className="text-sm text-muted-foreground">NISN: {student.studentId} • Kelas {student.class}</p>
                  <p className="text-xs text-muted-foreground">Orang Tua: {user.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-accent-green">
                    {formatCurrency(student.balance)}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Total Tabungan Anak"
          value={formatCurrency(totalBalance)}
          icon={DollarSign}
          color="green"
        />
        
        <StatsCard
          title="Total Setoran"
          value={formatCurrency(totalDeposits)}
          icon={TrendingUp}
          color="blue"
        />
        
        <StatsCard
          title="Total Penarikan"
          value={formatCurrency(totalWithdrawals)}
          icon={TrendingDown}
          color="orange"
        />
      </div>

      <div className="bg-background rounded-xl shadow-md border border-theme-border-light p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Transaksi Terbaru
          </h2>
          {childrenTransactions.length > 3 && (
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => navigate('/transactions')}
              className="text-accent-blue hover:underline p-0 h-auto"
            >
              Lihat Semua
            </Button>
          )}
        </div>
        <TransactionList 
          transactions={getRecentTransactions()}
          students={allStudents}
          showStudentInfo={false}
        />
      </div>

      {/* Existing Jadwal Menabung Kelas Anak */}
      <div className="bg-background rounded-xl shadow-md border border-theme-border-light p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Jadwal Menabung Kelas Anak
          </h2>
          <Button 
            onClick={fetchSavingsGoals}
            className="flex items-center space-x-2"
            variant="outline"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
        {parentClassGoals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Belum ada jadwal menabung kelas untuk anak Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parentClassGoals.map((goal) => ( // Added .map here
              <div key={goal.id} className="bg-card rounded-xl shadow-sm border border-theme-border-light p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-icon-blue-bg rounded-lg">
                      <Target className="w-5 h-5 text-accent-blue" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Tabungan Kelas</h3>
                      <p className="text-sm text-muted-foreground flex items-center space-x-1">
                        <GraduationCap className="w-4 h-4" />
                        <span>Kelas {goal.classId}</span>
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center space-x-1 mt-1">
                        <Users className="w-3 h-3" />
                        <span>Guru: {goal.teacherName}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-foreground">
                  {goal.dayOfWeek && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>Hari Rutin:</span>
                      </div>
                      <span className="font-semibold">{translateDayOfWeek(goal.dayOfWeek)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}