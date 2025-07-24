import { useState, useEffect } from 'react';
import { SavingsGoal } from '../../types';
import { X, GraduationCap, Users, Target, Clock } from 'lucide-react';
import { useStudents } from '../../contexts/StudentsContext';
import { Button } from '../ui/button';

interface SavingsGoalFormProps {
  goal?: SavingsGoal | null; // Make goal optional for add mode
  onSubmit: (data: {
    classId: string;
    goalName: string; 
    goalAmount: number; 
    targetDate: string;
    dayOfWeek: string; // New: day of week
  }) => void;
  onClose: () => void;
}

export default function SavingsGoalForm({ goal, onSubmit, onClose }: SavingsGoalFormProps) {
  const { students } = useStudents();
  const [formData, setFormData] = useState({
    classId: goal?.classId || '',
    dayOfWeek: goal?.dayOfWeek || '', 
  });
  const [formError, setFormError] = useState('');

  const classes = [...new Set(students.map(s => s.class))].sort();
  const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']; // Exclude Sunday, now in Indonesian

  useEffect(() => {
    if (goal) {
      setFormData({
        classId: goal.classId || '',
        dayOfWeek: goal.dayOfWeek || '',
      });
    }
  }, [goal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const { classId, dayOfWeek } = formData;

    if (!classId || !dayOfWeek) {
      setFormError('Semua kolom harus diisi.');
      return;
    }

    // Hardcoded values for goalName, goalAmount, targetDate
    const hardcodedGoalName = "Tabungan Kelas";
    const hardcodedGoalAmount = 1000000; // Example: Rp 1.000.000
    const hardcodedTargetDate = new Date(new Date().getFullYear() + 1, 6, 30).toISOString().split('T')[0]; // Example: July 30th next year

    onSubmit({
      classId,
      goalName: hardcodedGoalName,
      goalAmount: hardcodedGoalAmount,
      targetDate: hardcodedTargetDate,
      dayOfWeek,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-theme-border-light">
          <h2 className="text-xl font-bold text-foreground">
            {goal ? 'Edit Jadwal Menabung Kelas' : 'Tambah Jadwal Menabung Kelas'}
          </h2>
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

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <GraduationCap className="w-4 h-4 inline mr-1" />
              Pilih Kelas
            </label>
            <select
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground"
              required
              disabled={!!goal} // Disable class selection when editing
            >
              <option value="">Pilih Kelas</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>Kelas {cls}</option>
              ))}
            </select>
            {formData.classId && (
              <p className="text-sm text-muted-foreground mt-2 flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>Jumlah siswa di Kelas {formData.classId}: {students.filter(s => s.class === formData.classId).length}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Hari Menabung Rutin
            </label>
            <select
              value={formData.dayOfWeek}
              onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground"
              required
            >
              <option value="">Pilih Hari</option>
              {daysOfWeek.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
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
            >
              {goal ? 'Simpan Perubahan' : 'Tambah Jadwal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}