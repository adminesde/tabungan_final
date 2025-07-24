import { useState } from 'react';
import { useAuth } from '../../contexts/Auth/AuthContext';
import { User, Lock, LogIn, Hash, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import RegisterFormContent from '../Auth/RegisterForm';
import ForgotPasswordForm from '../Auth/ForgotPasswordForm';
import { useNisnLookup } from '../../hooks/useNisnLookup';
import { Button } from '../ui/button';

import { showSuccess, showError } from '../../utils/toast';

export default function LoginForm() {
  const [loginType, setLoginType] = useState<'adminTeacher' | 'parent' | 'initial'>('initial');
  const [isRegistering, setIsRegistering] = useState(false);
  const [adminTeacherFormData, setAdminTeacherFormData] = useState({
    email: '',
    password: '',
  });
  const [parentFormData, setParentFormData] = useState({
    password: '',
  });
  const [error, setError] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showAdminTeacherPassword, setShowAdminTeacherPassword] = useState(false);
  const [showParentPassword, setShowParentPassword] = useState(false);

  const { nisn, setNisn, nisnStudentInfo, nisnError, isLoadingNisnLookup } = useNisnLookup();

  const { login, isLoading } = useAuth();

  const handleParentNisnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNisn(e.target.value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (loginType === 'parent' && (!nisnStudentInfo || nisnError)) {
      setError(nisnError || 'NISN tidak valid atau tidak ditemukan.');
      return;
    }

    let success = false;
    try {
      if (loginType === 'adminTeacher') {
        success = await login(adminTeacherFormData.email, adminTeacherFormData.password, 'admin');
      } else if (loginType === 'parent') {
        success = await login(nisn, parentFormData.password, 'parent');
      }

      if (!success) {
        showError('Kredensial tidak valid. Silakan coba lagi.');
        setError('Kredensial tidak valid. Silakan coba lagi.');
      } else {
        showSuccess('Berhasil masuk!');
      }
    } catch (err) {
      console.error("Login handleSubmit error:", err);
      showError('Terjadi kesalahan saat login. Silakan coba lagi.');
      setError('Terjadi kesalahan saat login. Silakan coba lagi.');
    }
  };

  const mainBoxClasses = `
    relative z-10 bg-white rounded-2xl shadow-2xl flex flex-col lg:flex-row w-full overflow-hidden
    transition-all duration-500 ease-in-out
    ${loginType === 'initial' ? 'max-w-sm sm:max-w-md lg:max-w-3xl' : 'max-w-sm sm:max-w-md md:max-w-lg lg:max-w-4xl'}
    ${loginType === 'initial' ? 'h-[400px] lg:h-[450px]' : 'h-[600px] lg:h-[700px]'} max-h-[90vh]
  `;

  const leftSectionBackground = loginType === 'parent'
    ? 'bg-gradient-to-br from-emerald-600 to-emerald-800'
    : 'bg-gradient-to-br from-blue-600 to-blue-800';

  const screenBackgroundClasses = loginType === 'parent'
    ? 'bg-gradient-to-br from-emerald-500 to-emerald-700'
    : 'bg-gradient-to-br from-blue-600 to-blue-800';

  return (
    <div className={`min-h-screen ${screenBackgroundClasses} flex items-center justify-center p-4 relative overflow-hidden`}>
      <div className="absolute w-96 h-96 bg-blue-500 rounded-full -top-24 -left-24 opacity-20"></div>
      <div className="absolute w-72 h-72 bg-blue-500 rounded-full -bottom-16 -right-16 opacity-20"></div>
      <div className="absolute w-48 h-48 bg-blue-500 rounded-full top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 opacity-20"></div>

      <div className={mainBoxClasses}>
        <div className={`${leftSectionBackground} text-white p-8 lg:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden lg:w-1/2`}>
          <div className="w-24 h-24 bg-blue-500 rounded-full absolute -top-10 -right-10 opacity-30"></div>
          <div className="w-16 h-16 bg-blue-500 rounded-full absolute bottom-5 left-5 opacity-30"></div>
          
          <div className="relative z-10 flex flex-col items-center justify-center h-full py-4 px-2">
            {loginType === 'initial' ? (
              <>
                <h2 className="text-3xl sm:text-4xl font-bold mb-0 leading-tight whitespace-nowrap">SELAMAT DATANG</h2>
                <p className="text-base sm:text-lg font-medium mt-1 mb-0 px-2 whitespace-nowrap">Sistem Tabungan Digital Siswa</p>
                <p className="text-sm opacity-80 mx-auto px-4 mt-2 whitespace-nowrap">SD Negeri Dukuhwaru 01</p>
              </>
            ) : (
              <>
                <h2 className="text-xl lg:text-2xl font-bold mb-4 leading-tight whitespace-nowrap">Sistem Tabungan Digital Siswa</h2>
                <p className="text-lg font-medium mb-2 px-2">
                  {loginType === 'adminTeacher' && <span className="block text-xl font-bold mt-1">GURU</span>}
                  {loginType === 'parent' && <span className="block text-xl font-bold mt-1">ORANG TUA</span>}
                </p>
                <p className="text-sm opacity-80 mx-auto px-4">
                  {loginType === 'adminTeacher' ? 'Kelola tabungan siswa dengan mudah dan efisien.' : 'Pantau tabungan anak dengan mudah dan efisien.'}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="p-8 lg:p-12 relative lg:w-1/2 flex flex-col h-full overflow-y-auto">
          {loginType !== 'initial' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setLoginType('initial'); setIsRegistering(false); setError(''); setNisn(''); }}
              className="absolute top-4 left-4 z-20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          <div className={`flex-1 flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out
            ${loginType === 'initial' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none absolute inset-0'}`}>
            <h1 className="text-3xl font-bold text-foreground mb-2">Pilih Jenis Login</h1>
            <p className="text-muted-foreground mb-8 text-center">Silakan pilih jenis login Anda.</p>
            <Button
              type="button"
              onClick={() => setLoginType('adminTeacher')}
              className="w-full py-4 px-4 mb-4 flex items-center justify-center space-x-2"
              variant="accent-blue"
            >
              <User className="w-6 h-6" />
              <span>Login Guru</span>
            </Button>
            <Button
              type="button"
              onClick={() => setLoginType('parent')}
              className="w-full py-4 px-4 flex items-center justify-center space-x-2"
              variant="accent-green"
            >
              <User className="w-6 h-6" />
              <span>Login Orang Tua Siswa</span>
            </Button>
          </div>

          <div className={`flex-1 flex flex-col transition-opacity duration-500 ease-in-out
            ${loginType === 'adminTeacher' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none absolute inset-0'}`}>
            {!isRegistering ? (
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
                        value={adminTeacherFormData.email}
                        onChange={(e) => setAdminTeacherFormData({ ...adminTeacherFormData, email: e.target.value })}
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
                        type={showAdminTeacherPassword ? 'text' : 'password'}
                        value={adminTeacherFormData.password}
                        onChange={(e) => setAdminTeacherFormData({ ...adminTeacherFormData, password: e.target.value })}
                        className="w-full pl-10 pr-10 py-3 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground bg-background"
                        placeholder="Masukkan password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminTeacherPassword(!showAdminTeacherPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showAdminTeacherPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                        onClick={() => setIsRegistering(true)}
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
                        onClick={() => setShowForgotPasswordModal(true)}
                        variant="link"
                        className="p-0 h-auto"
                      >
                        Reset di sini
                      </Button>
                    </p>
                  </div>
                </form>
              </>
            ) : (
              <RegisterFormContent
                initialRole="teacher"
                onSuccess={() => { setIsRegistering(false); setError(''); }}
                onCancel={() => { setIsRegistering(false); setError(''); }}
              />
            )}
          </div>

          <div className={`flex-1 flex flex-col transition-opacity duration-500 ease-in-out
            ${loginType === 'parent' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none absolute inset-0'}`}>
            {!isRegistering ? (
              <>
                <h1 className="text-3xl font-bold text-foreground mb-4">Masuk</h1>

                <form onSubmit={handleSubmit} className="space-y-2 flex-1 flex flex-col justify-center overflow-y-auto">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      NISN Anak
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <input
                        type="text"
                        value={nisn}
                        onChange={handleParentNisnChange}
                        className="w-full pl-10 pr-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground bg-background"
                        placeholder="Masukkan NISN anak"
                        maxLength={10}
                        required
                      />
                    </div>
                    {nisnStudentInfo && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                        <p><span className="font-semibold">{nisnStudentInfo.name}</span> - Kelas: <span className="font-semibold">{nisnStudentInfo.class}</span></p>
                      </div>
                    )}
                    {nisnError && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        <p>{nisnError}</p>
                      </div>
                    )}
                  </div>

                  {/* Removed "Nama Anak" input field */}

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <input
                        type={showParentPassword ? 'text' : 'password'}
                        value={parentFormData.password}
                        onChange={(e) => setParentFormData({ ...parentFormData, password: e.target.value })}
                        className="w-full pl-10 pr-10 py-3 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground bg-background"
                        placeholder="Masukkan password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowParentPassword(!showParentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showParentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                    disabled={isLoading || !nisnStudentInfo || isLoadingNisnLookup}
                    className="w-full py-3 px-4 flex items-center justify-center space-x-2"
                    variant="accent-green"
                  >
                    {isLoading || isLoadingNisnLookup ? (
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
                        onClick={() => setIsRegistering(true)}
                        variant="accent-green"
                        className="p-2 h-auto"
                      >
                        Daftar Sekarang
                      </Button>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Lupa password?{' '}
                      <Button
                        type="button"
                        onClick={() => setShowForgotPasswordModal(true)}
                        variant="link"
                        className="p-0 h-auto"
                      >
                        Reset di sini
                      </Button>
                    </p>
                  </div>
                </form>
              </>
            ) : (
              <RegisterFormContent
                initialRole="parent"
                onSuccess={() => { setIsRegistering(false); setError(''); }}
                onCancel={() => { setIsRegistering(false); setError(''); }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 text-xs text-gray-300 opacity-80 text-center w-full">
        SIBUDIS - SD Negeri Dukuhwaru 01
      </div>

      {showForgotPasswordModal && (
        <ForgotPasswordForm
          onClose={() => setShowForgotPasswordModal(false)}
        />
      )}
    </div>
  );
}