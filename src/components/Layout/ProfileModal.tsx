import { useState, useEffect } from 'react'; // Removed React import
import ReactDOM from 'react-dom';
import { X, User, Lock } from 'lucide-react';
import { Button } from '../ui/button';
import ProfileForm from './ProfileForm';
import PasswordChangeForm from './PasswordChangeForm';
import { useAuth } from '../../contexts/Auth/AuthContext';

interface ProfileModalProps {
  onClose: () => void;
  initialTab?: 'profile' | 'password';
}

export default function ProfileModal({ onClose, initialTab = 'profile' }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>(initialTab);
  const { user } = useAuth();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!user) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-theme-border-light">
          <h2 className="text-xl font-bold text-foreground">Pengaturan Profil</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 border-b border-theme-border-light">
          <div className="flex space-x-2">
            <Button
              variant={activeTab === 'profile' ? 'accent-blue' : 'ghost'}
              onClick={() => setActiveTab('profile')}
              className="flex-1"
            >
              <User className="w-4 h-4 mr-2" />
              Profil Saya
            </Button>
            <Button
              variant={activeTab === 'password' ? 'accent-blue' : 'ghost'}
              onClick={() => setActiveTab('password')}
              className="flex-1"
            >
              <Lock className="w-4 h-4 mr-2" />
              Ubah Password
            </Button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && <ProfileForm onClose={onClose} />}
          {activeTab === 'password' && <PasswordChangeForm onClose={onClose} />}
        </div>
      </div>
    </div>
  );

  const modalRoot = document.getElementById('modal-root');
  return modalRoot ? ReactDOM.createPortal(modalContent, modalRoot) : null;
}