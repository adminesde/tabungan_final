import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/Auth/AuthContext';
import { useStudents } from '../contexts/StudentsContext';
import { useTransactions } from '../contexts/TransactionsContext';
import StatsCard from '../components/Dashboard/StatsCard';
import TransactionList from '../components/Transactions/TransactionList';
import { Users, DollarSign, TrendingUp, TrendingDown, GraduationCap, UserCheck, RefreshCw } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { User } from '../types';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { students: allStudents, fetchStudents } = useStudents();
  const { transactions: allTransactions, fetchTransactions } = useTransactions();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error("Error fetching users for dashboard:", error);
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
    };
    fetchUsers();
  }, []);

  if (!user || user.role !== 'admin') return null;

  const totalStudents = allStudents.length;
  const totalBalance = allStudents.reduce((sum, student) => sum + student.balance, 0);
  const totalDeposits = allTransactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = allTransactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getRecentTransactions = () => {
    return allTransactions.slice(0, 3);
  };

  const getClassSummary = () => {
    const allPossibleClasses = ['1', '2', '3', '4', '5', '6'];

    return allPossibleClasses.map(cls => {
      const classStudents = allStudents.filter(s => s.class === cls);
      const classBalance = classStudents.reduce((sum, s) => sum + s.balance, 0);
      return {
        class: cls,
        studentCount: classStudents.length,
        totalBalance: classBalance,
      };
    });
  };

  const handleRefreshClassSummary = () => {
    fetchStudents();
    fetchTransactions();
  };

  return (
    <div className="space-y-6">
      <div className="bg-background rounded-xl shadow-md border border-theme-border-light p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Ringkasan aktivitas tabungan siswa</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Guru</p>
              <p className="text-lg font-semibold text-accent-green">{allUsers.filter(u => u.role === 'teacher').length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Orang Tua</p>
              <p className="text-lg font-semibold text-accent-blue">{allUsers.filter(u => u.role === 'parent').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Siswa"
          value={totalStudents.toString()}
          icon={Users}
          color="blue"
        />
        
        <StatsCard
          title="Total Saldo"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-background rounded-xl shadow-md border border-theme-border-light p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Transaksi Terbaru
            </h2>
            {allTransactions.length > 3 && (
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
            showStudentInfo={true}
          />
        </div>

        <div className="bg-background rounded-xl shadow-md border border-theme-border-light p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Ringkasan per Kelas
            </h2>
            <Button 
              onClick={handleRefreshClassSummary}
              className="flex items-center space-x-2"
              variant="outline"
              title="Refresh Data Kelas"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
          <div className="space-y-3">
            {getClassSummary().map((classData) => (
              <div key={classData.class} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-icon-green-bg rounded-full flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-accent-green" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Kelas {classData.class}</p>
                    <p className="text-sm text-muted-foreground">{classData.studentCount} siswa</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-accent-green">
                    {formatCurrency(classData.totalBalance)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}