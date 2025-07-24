import React, { useState, useEffect } from 'react';
import { Transaction, Student } from '../../types';
import { ArrowUpCircle, ArrowDownCircle, Calendar, User, Download, ArrowLeft, ArrowRight } from 'lucide-react';
import { useStudents } from '../../contexts/StudentsContext';
import { useAuth } from '../../contexts/Auth/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { User as SupabaseUser } from '../../types';
import { Button } from '../ui/button';
import { useIsMobile } from '../../hooks/useIsMobile';
import { generateTransactionPDF } from '../../utils/pdfGenerator'; // Import the new utility

interface TransactionListProps {
  transactions: Transaction[];
  students?: Student[];
  showStudentInfo?: boolean;
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function TransactionList({ 
  transactions, 
  showStudentInfo = true,
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange
}: TransactionListProps) {
  const { students } = useStudents();
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<SupabaseUser[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error("Error fetching users for transaction list:", error);
      } else {
        const fetchedUsers: SupabaseUser[] = data.map(profile => ({
          id: profile.id,
          name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
          email: profile.email,
          role: profile.role?.toLowerCase() as 'admin' | 'teacher' | 'parent',
          class: profile.class || undefined,
          createdAt: profile.created_at,
          isActive: profile.is_active,
        }));
        setAllUsers(fetchedUsers);
      }
    };
    fetchUsers();
  }, []);

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.name} (${student.class})` : 'Siswa tidak ditemukan';
  };

  const getPerformedByName = (performedByEmail: string) => {
    const performer = allUsers.find(u => u.email === performedByEmail);
    return performer ? performer.name : performedByEmail;
  };

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
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleGeneratePDF = (transaction: Transaction) => {
    generateTransactionPDF(transaction, students, allUsers, isMobile);
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <ArrowUpCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Belum ada transaksi</h3>
        <p className="text-muted-foreground">Transaksi akan muncul di sini setelah dibuat</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-full space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow min-w-[600px] md:min-w-0"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'deposit' 
                      ? 'bg-icon-green-bg'
                      : 'bg-icon-red-bg'
                  }`}>
                    {transaction.type === 'deposit' ? (
                      <ArrowUpCircle className="w-5 h-5 text-accent-green" />
                    ) : (
                      <ArrowDownCircle className="w-5 h-5 text-accent-red" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {showStudentInfo && (
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-1">
                        <User className="w-4 h-4" />
                        <span className="truncate">{getStudentName(transaction.studentId)}</span>
                      </div>
                    )}
                    <h4 className="font-semibold text-foreground">
                      {transaction.type === 'deposit' ? 'Setoran' : 'Penarikan'}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1 truncate">{transaction.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                      <span className="truncate">oleh {getPerformedByName(transaction.performedBy)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end space-y-2">
                  <div>
                    <p className={`text-lg font-bold ${
                      transaction.type === 'deposit' ? 'text-accent-green' : 'text-accent-red'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Saldo: {formatCurrency(transaction.balance)}
                    </p>
                  </div>
                  {(user?.role === 'admin' || user?.role === 'teacher') && (
                    <Button
                      onClick={() => handleGeneratePDF(transaction)}
                      className="flex items-center space-x-1 px-2 py-1 text-xs"
                      variant="gray-light"
                    >
                      <Download className="w-3 h-3" />
                      <span>Cetak Bukti {transaction.type === 'deposit' ? 'Setoran' : 'Penarikan'}</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4 py-3 bg-card border border-border rounded-lg">
          <div className="text-sm text-muted-foreground">
            Menampilkan {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, transactions.length)} dari {transactions.length} transaksi
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              className="text-sm"
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Halaman {currentPage} dari {totalPages}
            </span>
            <Button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="text-sm"
              variant="outline"
              size="sm"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}