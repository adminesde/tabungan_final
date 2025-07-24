import { useState } from 'react'; // Removed React import
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import RegisterFormContent from '../components/Auth/RegisterForm';
import ForgotPasswordForm from '../components/Auth/ForgotPasswordForm';
import LoginTypeSelection from '../components/Auth/LoginTypeSelection';
import AdminTeacherLoginForm from '../components/Auth/AdminTeacherLoginForm';
import ParentLoginForm from '../components/Auth/ParentLoginForm';

export default function Login() {
  const [loginType, setLoginType] = useState<'adminTeacher' | 'parent' | 'initial'>('initial');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const mainBoxClasses = `
    relative z-10 bg-background rounded-2xl shadow-2xl flex flex-col lg:flex-row w-full overflow-hidden
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

  // Determine logo size for desktop based on loginType
  const desktopLogoSizeClass = loginType === 'initial' ? 'w-64 h-64' : 'w-80 h-80'; // Increased sizes

  return (
    <div className={`min-h-screen ${screenBackgroundClasses} flex items-center justify-center p-4 relative overflow-hidden`}>
      <div className="absolute w-96 h-96 bg-blue-500 rounded-full -top-24 -left-24 opacity-20"></div>
      <div className="absolute w-72 h-72 bg-blue-500 rounded-full -bottom-16 -right-16 opacity-20"></div>
      <div className="absolute w-48 h-48 bg-blue-500 rounded-full top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 opacity-20"></div>

      {/* Logo for Mobile View (outside panel) */}
      {loginType === 'initial' && (
        <img 
          src="https://imglink.io/i/e3c1edc7-3019-4a70-b7de-5d2c1b23ff7b.png" 
          alt="Logo SIBUDIS" 
          className="absolute top-8 left-1/2 -translate-x-1/2 w-24 h-24 lg:hidden transition-opacity duration-300" 
        />
      )}

      <div className={mainBoxClasses}>
        <div className={`${leftSectionBackground} text-white p-8 lg:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden lg:w-1/2`}>
          <div className="w-24 h-24 bg-blue-500 rounded-full absolute -top-10 -right-10 opacity-30"></div>
          <div className="w-16 h-16 bg-blue-500 rounded-full absolute bottom-5 left-5 opacity-30"></div>
          
          {/* Menggeser seluruh blok konten ke atas */}
          {/* Menggunakan space-y-1 untuk jarak yang lebih rapat */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-2 lg:-translate-y-24 space-y-1">
            {/* Logo untuk Desktop View (di dalam panel) */}
            <img 
              src="https://imglink.io/i/e3c1edc7-3019-4a70-b7de-5d2c1b23ff7b.png" 
              alt="Logo SIBUDIS" 
              className={`hidden lg:block mx-auto transition-all duration-500 ease-in-out ${desktopLogoSizeClass} mt-[72px]`} 
            />
            {loginType === 'initial' ? (
              <>
                <h2 className="text-3xl sm:text-4xl font-bold leading-tight whitespace-nowrap">SELAMAT DATANG</h2>
                <p className="text-base sm:text-lg font-medium px-2 whitespace-nowrap">Sistem Tabungan Digital Siswa</p>
                <p className="text-sm opacity-80 mx-auto px-4">SD Negeri Dukuhwaru 01</p>
              </>
            ) : (
              <>
                <h2 className="text-xl lg:text-2xl font-bold leading-tight whitespace-nowrap">Sistem Tabungan Digital Siswa</h2>
                <p className="text-lg font-medium px-2">
                  {loginType === 'adminTeacher' && <span className="block text-xl font-bold">GURU</span>}
                  {loginType === 'parent' && <span className="block text-xl font-bold">ORANG TUA</span>}
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
              onClick={() => { setLoginType('initial'); setIsRegistering(false); }}
              className="absolute top-4 left-4 z-20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          {loginType === 'initial' && (
            <LoginTypeSelection
              onSelectAdminTeacher={() => setLoginType('adminTeacher')}
              onSelectParent={() => setLoginType('parent')}
            />
          )}

          {loginType === 'adminTeacher' && (
            !isRegistering ? (
              <AdminTeacherLoginForm
                onShowRegister={() => setIsRegistering(true)}
                onShowForgotPassword={() => setShowForgotPasswordModal(true)}
              />
            ) : (
              <RegisterFormContent
                initialRole="teacher"
                onSuccess={() => setIsRegistering(false)}
                onCancel={() => setIsRegistering(false)}
              />
            )
          )}

          {loginType === 'parent' && (
            !isRegistering ? (
              <ParentLoginForm
                onShowRegister={() => setIsRegistering(true)}
                onShowForgotPassword={() => setShowForgotPasswordModal(true)}
              />
            ) : (
              <RegisterFormContent
                initialRole="parent"
                onSuccess={() => setIsRegistering(false)}
                onCancel={() => setIsRegistering(false)}
              />
            )
          )}
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