import { useState, useEffect } from 'react';
import { X, GraduationCap } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/Auth/AuthContext';
import { useSavingsGoals } from '../../contexts/SavingsGoalsContext';
import { useStudents } from '../../contexts/StudentsContext';
import { Student } from '../../types';

interface TransactionFormProps {
  onSubmit: (data: {
    studentId: string;
    type: 'deposit' | 'withdrawal';
    amount: number;
    description: string;
  }) => void;
  onClose: () => void;
}

export default function TransactionForm({ onSubmit, onClose }: TransactionFormProps) {
  const { user } = useAuth();
  const { savingsGoals } = useSavingsGoals();
  const { students: allStudents } = useStudents();
  const [formData, setFormData] = useState({
    studentId: '',
    type: '' as 'deposit' | 'withdrawal' | '',
    amount: '',
    description: '',
  });
  const [selectedClassForTransaction, setSelectedClassForTransaction] = useState('');
  const [formError, setFormError] = useState('');
  const [isDepositAllowed, setIsDepositAllowed] = useState(true);
  const [depositRestrictionMessage, setDepositRestrictionMessage] = useState('');

  const availableStudents = allStudents.filter(student => {
    const matchesClass = !selectedClassForTransaction || student.class === selectedClassForTransaction;
    const matchesTeacherClass = user?.role === 'teacher' ? student.class === user.class : true;
    return matchesClass && matchesTeacherClass;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const selectedStudent = availableStudents.find(s => s.id === formData.studentId);

  const translateDayOfWeekToIndonesian = (day: string) => {
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

  useEffect(() => {
    if (formData.type === 'deposit' && selectedStudent && user?.role === 'teacher') {
      const today = new Date();
      const currentDayNameEnglish = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(today);
      const currentDayNameIndonesian = translateDayOfWeekToIndonesian(currentDayNameEnglish);

      const classSavingsGoal = savingsGoals.find(
        goal => goal.type === 'class' && goal.classId === selectedStudent.class && goal.dayOfWeek === currentDayNameIndonesian
      );

      if (!classSavingsGoal) {
        setIsDepositAllowed(false);
        setDepositRestrictionMessage(`Setoran untuk Kelas ${selectedStudent.class} hanya bisa dilakukan pada hari yang dijadwalkan oleh admin.`);
      } else {
        setIsDepositAllowed(true);
        setDepositRestrictionMessage('');
      }
    } else {
      setIsDepositAllowed(true);
      setDepositRestrictionMessage('');
    }
  }, [formData.type, formData.studentId, selectedStudent, user, savingsGoals]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, studentId: '' }));
  }, [selectedClassForTransaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.studentId || !formData.type || !formData.amount || !formData.description) {
      setFormError('Semua kolom harus diisi.');
      return;
    }

    const amount = parseInt(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setFormError('Jumlah harus angka positif.');
      return;
    }

    if (formData.type === 'deposit' && !isDepositAllowed) {
      setFormError(depositRestrictionMessage);
      return;
    }

    if (selectedStudent && formData.type === 'withdrawal' && amount > selectedStudent.balance) {
      setFormError('Jumlah penarikan melebihi saldo siswa.');
      return;
    }

    onSubmit({
      ...formData,
      amount: amount,
      type: formData.type as 'deposit' | 'withdrawal',
    });
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const classes = [...new Set(allStudents.map(s => s.class))].sort();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-theme-border-light">
          <h2 className="text-xl font-bold text-foreground">Transaksi Baru</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {formError}
            </div>
          )}

          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <GraduationCap className="w-4 h-4 inline mr-1" />
                Pilih Kelas
              </label>
              <select
                value={selectedClassForTransaction}
                onChange={(e) => setSelectedClassForTransaction(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground bg-background"
                disabled={user?.role === 'teacher'}
              >
                <option value="">Semua Kelas</option>
                {classes.map(cls => (
                  <option key={cls} value={cls}>Kelas {cls}</option>
                ))}
              </select>
              {user?.role === 'teacher' && (
                <p className="text-xs text-muted-foreground mt-1">Kelas Anda: {user.class}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Pilih Siswa
            </label>
            <select
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground bg-background"
              required
              disabled={availableStudents.length === 0}
            >
              <option value="">Pilih Siswa</option>
              {availableStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} - Kelas {student.class} (NISN: {student.studentId})
                </option>
              ))}
            </select>
            {availableStudents.length === 0 && (
              <p className="text-sm text-destructive text-sm mt-1">Tidak ada siswa di kelas ini atau belum memilih kelas.</p>
            )}
            {selectedStudent && (
              <p className="text-sm text-muted-foreground mt-1">
                Saldo saat ini: {formatCurrency(selectedStudent.balance)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Jenis Transaksi
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'deposit' | 'withdrawal' })}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground bg-background"
              required
            >
              <option value="">Pilih Jenis Transaksi</option>
              <option value="deposit">Setor</option>
              <option value="withdrawal">Tarik</option>
            </select>
          </div>

          {formData.type === 'deposit' && !isDepositAllowed && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
              {depositRestrictionMessage}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Jumlah (Rp)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Masukkan jumlah uang"
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground bg-background"
              required
              min="1000"
              step="1000"
              disabled={formData.type === 'deposit' && !isDepositAllowed}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Keterangan
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Masukkan keterangan transaksi"
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground bg-background"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1"
              variant="gray-outline"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1"
              variant="accent-blue"
              disabled={formData.type === 'deposit' && !isDepositAllowed}
            >
              Simpan Transaksi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}