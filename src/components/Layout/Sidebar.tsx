import { 
  Home, 
  Users, 
  CreditCard, 
  BarChart3, 
  LogOut,
  TrendingUp,
  Sun, // New
  Moon, // New
} from 'lucide-react';
import { useAuth } from '../../contexts/Auth/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext'; // New import

interface SidebarProps {
  sidebarOpen: boolean;
  className?: string;
}

const menuItems = {
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'recap', label: 'Rekapitulasi', icon: BarChart3, path: '/recapitulasi' },
    { id: 'transactions', label: 'Transaksi', icon: CreditCard, path: '/transactions' },
    { id: 'schedule', label: 'Jadwal Menabung', icon: TrendingUp, path: '/schedule' },
    { id: 'users', label: 'Manajemen Pengguna', icon: Users, path: '/users' },
  ],
  teacher: [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'students', label: 'Manajemen Siswa', icon: Users, path: '/students' },
    { id: 'savings', label: 'Tabungan Siswa', icon: CreditCard, path: '/transactions' },
    { id: 'schedule', label: 'Jadwal Menabung', icon: TrendingUp, path: '/schedule' },
    { id: 'recap', label: 'Rekapitulasi', icon: BarChart3, path: '/recapitulasi' },
  ],
  parent: [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'reports', label: 'Riwayat Transaksi', icon: TrendingUp, path: '/transactions' },
  ],
};

export default function Sidebar({ sidebarOpen, className }: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme(); // New
  const location = useLocation();

  if (!user) return null;

  const items = menuItems[user.role] || [];

  const getUserDisplayName = () => {
    if (user.role === 'parent' && user.studentInfo) {
      return user.studentInfo.name;
    }
    return user.name;
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'teacher': return 'Guru';
      case 'parent': return 'Orang Tua';
      default: return role;
    }
  };

  const isParent = user.role === 'parent';
  // Adjusted colors for parent role to be brighter
  const avatarBgClass = isParent ? 'bg-emerald-500' : 'bg-blue-500';

  return (
    <div className={`${className} shadow-lg h-full flex flex-col`}>
      <div className={`p-6 border-b ${isParent ? 'border-emerald-500' : 'border-blue-500'} flex items-center justify-between`}>
        <div className={`flex items-center space-x-3 ${sidebarOpen ? 'flex' : 'hidden lg:flex'}`}>
          <div className={`w-12 h-12 flex items-center justify-center`}> {/* Ukuran logo diperbesar menjadi w-12 h-12 */}
            <img 
              src="https://imglink.io/i/e3c1edc7-3019-4a70-b7de-5d2c1b23ff7b.png" 
              alt="Logo SIBUDIS" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white whitespace-nowrap">
              <span className="hidden sm:inline">Tabungan Digital</span>
              <span className="inline sm:hidden">SIBUDIS</span>
            </h2>
            <p className="text-sm text-gray-300 whitespace-nowrap">
              <span className="hidden sm:inline">SD Negeri Dukuhwaru 01</span>
              <span className="inline sm:hidden">SDN Dukuhwaru 01</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? (isParent ? 'bg-emerald-500 text-white border-r-4 border-emerald-700' : 'bg-blue-500 text-white border-r-4 border-accent-blue') 
                    : 'text-gray-300 hover:bg-blue-500 hover:text-white'}
                  group
                `}
              >
                <Icon className="w-5 h-5" />
                <span className={`
                  font-medium whitespace-nowrap ${sidebarOpen ? 'block' : 'hidden lg:block'}
                `}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={`p-4 border-t ${isParent ? 'border-emerald-500' : 'border-blue-500'}`}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`
            w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors mb-2
            ${theme === 'dark' ? 'text-yellow-300 hover:bg-gray-700' : 'text-gray-300 hover:bg-blue-500 hover:text-white'}
          `}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span className={`font-medium ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
            {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          </span>
        </button>

        <div className={`flex items-center space-x-3 mb-4 ${sidebarOpen ? 'flex' : 'hidden lg:flex'}`}>
          <div className={`w-8 h-8 ${avatarBgClass} rounded-full flex items-center justify-center`}>
            {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                <span className="text-sm font-medium text-white">
                  {user.name.charAt(0)}
                </span>
              )}
          </div>
          <div className={`flex-1 min-w-0 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
            <p className="text-sm font-medium text-white capitalize">{getRoleLabel(user.role)}</p>
            <p className="text-xs text-gray-300 truncate">{getUserDisplayName()}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className={`
            w-full flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-blue-500 hover:text-accent-red rounded-lg transition-colors
          `}
        >
          <LogOut className="w-4 h-4" />
          <span className={`font-medium ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>Keluar</span>
        </button>
      </div>
    </div>
  );
}