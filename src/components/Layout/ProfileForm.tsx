import React, { useState, useEffect } from 'react';
import { User as UserIcon, Mail, GraduationCap } from 'lucide-react'; // Removed Upload icon
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/Auth/AuthContext';
import { showSuccess, showError } from '../../utils/toast';

interface ProfileFormProps {
  onClose: () => void;
}

export default function ProfileForm({ onClose }: ProfileFormProps) {
  const { user, updateUser, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    class: user?.class || '',
    nip: user?.nip || '',
    // avatarUrl: user?.avatarUrl || '', // Removed avatarUrl from state
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        class: user.class || '',
        nip: user.nip || '',
        // avatarUrl: user.avatarUrl || '', // Removed avatarUrl from state
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!formData.name || !formData.email) {
      setFormError('Nama dan Email harus diisi.');
      setIsSubmitting(false);
      return;
    }

    if (user?.role === 'teacher' && !formData.class) {
      setFormError('Kelas harus dipilih untuk peran Guru.');
      setIsSubmitting(false);
      return;
    }

    const success = await updateUser({
      name: formData.name,
      email: formData.email,
      class: formData.class,
      nip: formData.nip,
      // avatarUrl: formData.avatarUrl, // Removed avatarUrl from update payload
    });

    if (success) {
      showSuccess('Profil berhasil diperbarui!');
      onClose();
    } else {
      showError('Gagal memperbarui profil.');
      setFormError('Gagal memperbarui profil. Silakan coba lagi.');
    }
    setIsSubmitting(false);
  };

  const classes = ['1', '2', '3', '4', '5', '6'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {formError}
        </div>
      )}

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
          className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground bg-background"
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
          className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground bg-background"
          required
        />
      </div>

      {user?.role === 'teacher' && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <GraduationCap className="w-4 h-4 inline mr-1" />
            Kelas yang Diajar
          </label>
          <select
            value={formData.class}
            onChange={(e) => setFormData({ ...formData, class: e.target.value })}
            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground bg-background"
            required
          >
            <option value="">Pilih Kelas</option>
            {classes.map(cls => (
              <option key={cls} value={cls}>Kelas {cls}</option>
            ))}
          </select>
        </div>
      )}

      {(user?.role === 'admin' || user?.role === 'teacher') && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            NIP (Nomor Induk Pegawai)
          </label>
          <input
            type="text"
            value={formData.nip}
            onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
            placeholder="Masukkan NIP (opsional)"
            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground bg-background"
          />
        </div>
      )}

      {/* Removed URL Avatar section */}

      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
        <Button
          type="button"
          onClick={onClose}
          className="flex-1"
          variant="gray-outline"
          disabled={isSubmitting || isLoading}
        >
          Batal
        </Button>
        <Button
          type="submit"
          className="flex-1"
          variant="accent-blue"
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting || isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Simpan Perubahan'
          )}
        </Button>
      </div>
    </form>
  );
}