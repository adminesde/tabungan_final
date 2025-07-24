import { useState, useEffect } from 'react'; // Removed React import
import ReactDOM from 'react-dom';
import { User as UserType } from '../../types';
import { X, User as UserIcon, Mail, Lock, GraduationCap, Hash, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { showError, showSuccess } from '../../utils/toast';
import { Button } from '../ui/button';
import { useNisnLookup } from '../../hooks/useNisnLookup';

interface UserFormProps {
  user: UserType | null;
  onSubmit: (data: Omit<UserType, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export default function UserForm({ user, onSubmit, onClose }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'teacher' as 'admin' | 'teacher' | 'parent',
    class: user?.class || '',
    isActive: user?.isActive ?? true,
    password: '',
    confirmPassword: '',
    nip: user?.nip || '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { nisn, setNisn, nisnStudentInfo, nisnError, isLoadingNisnLookup } = useNisnLookup();

  const classes = ['1', '2', '3', '4', '5', '6'];

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        class: user.class || '',
        isActive: user.isActive,
        password: '',
        confirmPassword: '',
        nip: user.nip || '',
      });
      if (user.role === 'parent' && user.studentInfo?.studentId) {
        setNisn(user.studentInfo.studentId);
      }
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'teacher',
        class: '',
        isActive: true,
        password: '',
        confirmPassword: '',
        nip: '',
      });
      setNisn('');
    }
  }, [user]);

  useEffect(() => {
    if (!user && formData.role === 'parent' && nisn.length === 10 && !nisnError) {
      setFormData(prev => ({ ...prev, email: `${nisn}@parent.com` }));
    } else if (!user && formData.role === 'parent' && (nisn.length !== 10 || nisnError)) {
      setFormData(prev => ({ ...prev, email: '' }));
    }
  }, [nisn, nisnError, formData.role, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (formData.role === 'teacher' && !formData.class) {
      setFormError('Kelas harus dipilih untuk peran Guru.');
      setIsSubmitting(false);
      return;
    }

    if (!user) {
      if (!formData.password || !formData.confirmPassword) {
        setFormError('Password dan Konfirmasi Password harus diisi.');
        setIsSubmitting(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setFormError('Password baru dan konfirmasi password tidak cocok.');
        setIsSubmitting(false);
        return;
      }
      if (formData.password.length < 6) {
        setFormError('Password minimal 6 karakter.');
        setIsSubmitting(false);
        return;
      }
      if (formData.role === 'parent' && (!nisnStudentInfo || nisnError)) {
        setFormError(nisnError || 'NISN tidak valid atau tidak ditemukan.');
        setIsSubmitting(false);
        return;
      }
    }

    const [firstName, ...lastNameParts] = formData.name.split(' ');
    const lastName = lastNameParts.join(' ');

    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          first_name: firstName, 
          last_name: lastName, 
          email: formData.email, 
          role: formData.role, 
          class: formData.class, 
          is_active: formData.isActive,
          nip: formData.nip,
        })
        .eq('id', user.id);

      if (error) {
        console.error("Error updating user:", error);
        showError("Gagal memperbarui pengguna.");
        setFormError("Gagal memperbarui pengguna: " + error.message);
      } else {
        showSuccess("Pengguna berhasil diperbarui.");
        onSubmit({ ...formData, name: formData.name, nip: formData.nip });
        onClose();
      }
    } else {
      try {
        const { data, error: edgeFunctionError } = await supabase.functions.invoke('create-user', {
          body: {
            email: formData.email,
            password: formData.password,
            first_name: formData.role === 'parent' ? 'Orang Tua' : firstName,
            last_name: formData.role === 'parent' ? nisnStudentInfo?.name : lastName,
            role: formData.role,
            class: formData.class,
            nisn: formData.role === 'parent' ? nisn : undefined,
          },
        });

        if (edgeFunctionError) {
          console.error("Error calling create-user edge function:", edgeFunctionError);
          let errorMessage = "Gagal menambahkan pengguna baru. Terjadi kesalahan tidak dikenal.";
          if (edgeFunctionError.context && edgeFunctionError.context.json && edgeFunctionError.context.json.error && edgeFunctionError.context.json.error.message) {
            errorMessage = edgeFunctionError.context.json.error.message;
          } else if (edgeFunctionError.message) {
            errorMessage = edgeFunctionError.message;
          }
          showError(errorMessage);
          setFormError(errorMessage);
        } else if (data && data.user) {
          showSuccess("Pengguna baru berhasil ditambahkan.");
          onClose();
        } else {
          showError("Gagal menambahkan pengguna baru. Respon tidak valid.");
          setFormError("Gagal menambahkan pengguna baru. Respon tidak valid.");
        }
      } catch (err: any) {
        console.error("Unexpected error when adding user:", err);
        showError("Terjadi kesalahan saat menambahkan pengguna baru: " + err.message);
        setFormError("Terjadi kesalahan saat menambahkan pengguna baru: " + err.message);
      }
    }
    setIsSubmitting(false);
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"> {/* Added overflow-y-auto */}
        <div className="flex items-center justify-between p-6 border-b border-theme-border-light">
          <h2 className="text-xl font-bold text-foreground">
            {user ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
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
              Role Pengguna
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['admin', 'teacher', 'parent'] as const).map((role) => (
                <Button
                  key={role}
                  type="button"
                  onClick={() => setFormData({ ...formData, role, class: role !== 'teacher' ? '' : formData.class })}
                  className={`p-3 rounded-lg border-2 text-center transition-colors ${
                    formData.role === role
                      ? 'border-accent-green bg-green-50 text-accent-green'
                      : 'border-border text-muted-foreground hover:border-foreground'
                  }`}
                  variant="outline"
                  disabled={!!user}
                >
                  <UserIcon className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-xs font-medium">
                    {role === 'admin' ? 'Admin' : role === 'teacher' ? 'Guru' : 'Orang Tua'}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {formData.role === 'parent' && !user ? (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Hash className="w-4 h-4 inline mr-1" />
                  NISN Anak
                </label>
                <input
                  type="text"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                  placeholder="Masukkan NISN anak (10 digit)"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground"
                  maxLength={10}
                  required
                />
                {isLoadingNisnLookup && <p className="text-sm text-muted-foreground mt-1">Mencari siswa...</p>}
                {nisnStudentInfo && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                    <p>Nama Siswa: <span className="font-semibold">{nisnStudentInfo.name}</span></p>
                    <p>Kelas: <span className="font-semibold">{nisnStudentInfo.class}</span></p>
                  </div>
                )}
                {nisnError && (
                  <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                    <p>{nisnError}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Orang Tua
                </label>
                <input
                  type="email"
                  value={formData.email}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground"
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">Email akan otomatis dibuat dari NISN.</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <UserIcon className="w-4 h-4 inline mr-1" />
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Masukkan alamat email"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground"
                  required
                />
              </div>
            </>
          )}

          {formData.role === 'teacher' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <GraduationCap className="w-4 h-4 inline mr-1" />
                Kelas yang Diajar
              </label>
              <select
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground"
                required
              >
                <option value="">Pilih Kelas</option>
                {classes.map(cls => (
                  <option key={cls} value={cls}>Kelas {cls}</option>
                ))}
              </select>
            </div>
          )}

          {!user && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Masukkan password"
                    className="w-full pl-3 pr-10 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Konfirmasi password"
                    className="w-full pl-3 pr-10 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-accent-green border-border rounded focus:ring-accent-blue"
            />
            <label htmlFor="isActive" className="text-sm text-foreground">
              Akun aktif
            </label>
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
              disabled={isSubmitting || (formData.role === 'parent' && (!nisnStudentInfo || isLoadingNisnLookup))}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                user ? 'Simpan' : 'Simpan'
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