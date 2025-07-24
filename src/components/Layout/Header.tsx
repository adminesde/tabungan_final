import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../contexts/Auth/AuthContext';
import ProfileDropdown from './ProfileDropdown';
import ProfileModal from './ProfileModal'; // Import ProfileModal
import { Button } from '../ui/button';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  className?: string;
}

export default function Header({ title, onMenuClick, className }: HeaderProps) {
  const { user } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [initialModalTab, setInitialModalTab] = useState<'profile' | 'password'>('profile');

  const handleOpenProfileModal = (tab: 'profile' | 'password') => {
    setInitialModalTab(tab);
    setShowProfileModal(true);
    setShowProfileDropdown(false);
  };

  const isParent = user?.role === 'parent';
  // Adjusted color for parent role to be brighter
  const avatarBgClass = isParent ? 'bg-emerald-500' : 'bg-accent-blue';

  return (
    <header className={`${className} px-6 py-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden text-gray-300 hover:bg-theme-light-bg hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="text-sm text-gray-300 capitalize">
              Selamat datang, <span className="hidden sm:inline">{user?.name}</span>
              <span className="inline sm:hidden">{user?.name.split(' ')[0]}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative group">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className={`w-8 h-8 ${avatarBgClass} rounded-full flex items-center justify-center hover:${avatarBgClass} transition-colors p-0`}
            >
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                <span className="text-sm font-medium text-white">
                  {user?.name.charAt(0)}
                </span>
              )}
              <span className="hidden lg:hidden group-hover:block absolute top-full mt-2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">Profil</span>
            </Button>
            
            {showProfileDropdown && (
              <ProfileDropdown 
                onClose={() => setShowProfileDropdown(false)}
                onOpenProfileModal={handleOpenProfileModal}
              />
            )}
          </div>
        </div>
      </div>

      {showProfileModal && (
        <ProfileModal 
          onClose={() => setShowProfileModal(false)} 
          initialTab={initialModalTab} 
        />
      )}
    </header>
  );
}