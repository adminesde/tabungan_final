import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Student } from '../../types';
import { X, User, GraduationCap, DollarSign, Hash } from 'lucide-react';
import { useStudents } from '../../contexts/StudentsContext';
import { useAuth } from '../../contexts/Auth/AuthContext';
import { Button } from '../ui/button';

interface StudentFormProps {
  student?: Student;
  onSubmit: (data: Omit<Student, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export default function StudentForm({ student, onSubmit, onClose }: StudentFormProps) {
  const { students } = useStudents();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: student?.name || '',
    class: student?.class || (user?.role === 'teacher' ? user.class || '' : ''),
    studentId: student?.studentId || '',
    balance: student?.balance.toString() || '0',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const classes = ['1', '2', '3', '4', '5', '6'];

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name,
        class: student.class,
        studentId: student.studentId,
        balance: student.balance.toString(),
      });
    } else if (user?.role === 'teacher') {
      setFormData(prev => ({ ...prev, class: user.class || '' }));
    }
  }, [student, user]);

  const isClassDisabled = user?.role === 'teacher';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!formData.name || !formData.class || !formData.studentId) {
      setFormError('Nama, Kelas, dan NISN harus diisi.');
      setIsSubmitting(false);
      return;
    }
    if (formData.studentId.length !== 10 || !/^\d+$/.test(formData.studentId)) {
      setFormError('NISN harus 10 digit angka.');
      setIsSubmitting(false);
      return;
    }

    if (!student && students.some(s => s.studentId === formData.studentId)) {
      setFormError('NISN ini sudah terdaftar.');
      setIsSubmitting(false);
      return;
    }
    if (student && students.some(s => s.studentId === formData.studentId && s.id !== student.id)) {
      setFormError('NISN ini sudah terdaftar pada siswa lain.');
      setIsSubmitting(false);
      return;
    }

    const parentId = student?.parentId || null;

    onSubmit({
      name: formData.name,
      class: formData.class,
      studentId: formData.studentId,
      balance: parseInt(formData.balance),
      parentId: parentId
    });
    setIsSubmitting(false);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col"> {/* Added flex flex-col */}
        <div className="flex items-center justify-between p-6 border-b border-theme-border-light">
          <h2 className="text-xl font-bold text-foreground">
            {student ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto"> {/* Added flex-1 overflow-y-auto */}
          {formError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Nama Lengkap Siswa
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masukkan nama lengkap siswa"
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground bg-background"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <GraduationCap className="w-4 h-4 inline mr-1" />
              Kelas
            </label>
            <select
              value={formData.class}
              onChange={(e) => setFormData({ ...formData, class: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground bg-background"
              required
              disabled={isClassDisabled}
            >
              <option value="">Pilih Kelas</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>Kelas {cls}</option>
              ))}
            </select>
            {isClassDisabled && (
              <p className="text-xs text-muted-foreground mt-1">Kelas dikunci sesuai peran Anda.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Hash className="w-4 h-4 inline mr-1" />
              Nomor Induk Siswa Nasional (NISN)
            </label>
            <input
              type="text"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              placeholder="Masukkan NISN siswa (10 digit)"
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground bg-background"
              maxLength={10}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Saldo Awal (Rp)
            </label>
            <input
              type="number"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              placeholder="Masukkan saldo awal"
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground bg-background"
              required
              min="0"
              step="1000"
              disabled={!!student}
            />
            {student && (
              <p className="text-xs text-muted-foreground mt-1">Saldo hanya bisa diubah melalui transaksi.</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1"
              variant="gray-outline"
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1"
              variant="accent-blue"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                student ? 'Simpan Perubahan' : 'Tambah Siswa'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  const modalRoot = document.getElementById('modal-root');
  return modalRoot ? ReactDOM.createPortal(modalContent, modalRoot) : null;
}