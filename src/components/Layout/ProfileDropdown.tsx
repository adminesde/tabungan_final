import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/Auth/AuthContext';
import { Button } from '../ui/button';

interface ProfileDropdownProps {
  onClose: () => void;
  onOpenProfileModal: (tab: 'profile' | 'password') => void;
}

export default function ProfileDropdown({ onClose, onOpenProfileModal }: ProfileDropdownProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleProfileClick = () => {
    onOpenProfileModal('profile');
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  // Removed getUserDisplayName as it's not used here

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'teacher': return 'Guru';
      case 'parent': return 'Orang Tua';
      default: return role;
    }
  };

  const isParent = user.role === 'parent';
  // Adjusted color for parent role to be brighter
  const avatarBgClass = isParent ? 'bg-emerald-500' : 'bg-accent-blue';

  return (
    <>
      <div className="absolute right-0 top-full mt-2 w-64 bg-background rounded-lg shadow-lg border border-border z-50">
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 ${avatarBgClass} rounded-full flex items-center justify-center relative`}>
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                <span className="text-lg font-medium text-white">
                  {user.name.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium text-foreground capitalize">{getRoleLabel(user.role)}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.class && user.role === 'teacher' && (
                <p className="text-xs text-accent-blue">Kelas {user.class}</p>
              )}
            </div>
          </div>
        </div>

        <div className="py-2">
          <Button
            variant="ghost"
            onClick={handleProfileClick}
            className="w-full flex items-center justify-start space-x-3 px-4 py-2 text-foreground hover:bg-muted"
          >
            <User className="w-4 h-4" />
            <span>Profil Saya</span>
          </Button>
        </div>

        <div className="border-t border-border py-2">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full flex items-center justify-start space-x-3 px-4 py-2 text-accent-red hover:text-accent-red hover:bg-muted"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </Button>
        </div>
      </div>
    </>
  );
}