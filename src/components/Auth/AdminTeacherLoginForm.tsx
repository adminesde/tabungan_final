import React, { useState } from 'react';
import { User, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/Auth/AuthContext';
import { showSuccess, showError } from '../../utils/toast';
import RegisterFormContent from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';

interface AdminTeacherLoginFormProps {
  onShowRegister: () => void;
  onShowForgotPassword: () => void;
}

export default function AdminTeacherLoginForm({ onShowRegister, onShowForgotPassword }: AdminTeacherLoginFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const success = await login(formData.email, formData.password, 'admin'); // Assuming 'admin' role for login check

      if (!success) {
        showError('Kredensial tidak valid. Silakan coba lagi.');
        setError('Kredensial tidak valid. Silakan coba lagi.');
      } else {
        showSuccess('Berhasil masuk!');
      }
    } catch (err) {
      console.error("AdminTeacherLoginForm handleSubmit error:", err);
      showError('Terjadi kesalahan saat login. Silakan coba lagi.');
      setError('Terjadi kesalahan saat login. Silakan coba lagi.');
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-foreground mb-4">Masuk</h1>

      <form onSubmit={handleSubmit} className="space-y-2 flex-1 flex flex-col justify-center overflow-y-auto">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Email
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground bg-background"
              placeholder="Masukkan email"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-10 pr-10 py-3 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground bg-background"
              placeholder="Masukkan password"
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

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 flex items-center justify-center space-x-2"
          variant="accent-blue"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>Masuk</span>
            </>
          )}
        </Button>
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Belum punya akun?{' '}
            <Button
              type="button"
              onClick={onShowRegister}
              variant="link"
              className="p-0 h-auto"
            >
              Daftar Sekarang
            </Button>
          </p>
          <p className="text-sm text-muted-foreground">
            Lupa password?{' '}
            <Button
              type="button"
              onClick={onShowForgotPassword}
              variant="link"
              className="p-0 h-auto"
            >
              Reset di sini
            </Button>
          </p>
        </div>
      </form>
    </>
  );
}