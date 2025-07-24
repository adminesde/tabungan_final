import React, { useState } from 'react';
import { Lock, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { supabase } from '../../integrations/supabase/client';
import { showSuccess, showError } from '../../utils/toast';
import { useAuth } from '../../contexts/Auth/AuthContext';

interface PasswordChangeFormProps {
  onClose: () => void;
}

export default function PasswordChangeForm({ onClose }: PasswordChangeFormProps) {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    console.log("PasswordChangeForm: Submitting password change...");

    if (newPassword.length < 6) {
      setFormError('Password baru minimal 6 karakter.');
      setIsSubmitting(false);
      console.log("PasswordChangeForm: Validation failed - password too short.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setFormError('Password baru dan konfirmasi password tidak cocok.');
      setIsSubmitting(false);
      console.log("PasswordChangeForm: Validation failed - passwords do not match.");
      return;
    }

    try {
      console.log("PasswordChangeForm: Calling supabase.auth.updateUser...");
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("PasswordChangeForm: Error updating password:", error);
        showError('Gagal memperbarui password: ' + error.message);
        setFormError('Gagal memperbarui password: ' + error.message);
      } else {
        console.log("PasswordChangeForm: Password updated successfully.");
        showSuccess('Password berhasil diperbarui!');
        setNewPassword('');
        setConfirmNewPassword('');
        onClose();
      }
    } catch (err: any) {
      console.error("PasswordChangeForm: Unexpected error during password update:", err);
      showError('Terjadi kesalahan tak terduga saat memperbarui password.');
      setFormError('Terjadi kesalahan tak terduga: ' + err.message);
    } finally {
      setIsSubmitting(false);
      console.log("PasswordChangeForm: Submission process finished, isSubmitting set to false.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {formError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Password Baru
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground"
            placeholder="Masukkan password baru"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Konfirmasi Password Baru
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type={showConfirmNewPassword ? 'text' : 'password'}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground"
            placeholder="Konfirmasi password baru"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
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
            <>
              <Save className="w-4 h-4 mr-2" />
              <span>Simpan Password</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}