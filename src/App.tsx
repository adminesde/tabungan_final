import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/Auth/AuthContext';
import { TransactionsProvider } from './contexts/TransactionsContext';
import { SavingsGoalsProvider } from './contexts/SavingsGoalsContext';
import { StudentsProvider } from './contexts/StudentsContext';
import { ThemeProvider } from './contexts/ThemeContext'; // New import
import Login from './pages/Login';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Transactions from './pages/Transactions';
import Reports from '././pages/Reports';
import UserManagement from './components/Users/UserManagement';
import SavingsSchedule from './pages/SavingsSchedule';
import ErrorBoundary from './components/ErrorBoundary';
import UpdatePassword from './pages/UpdatePassword';
import Recapitulasi from './pages/Recapitulasi';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/students':
        return user.role === 'parent' ? 'Data Anak' : 'Manajemen Siswa';
      case '/transactions':
        return user.role === 'parent' ? 'Riwayat Transaksi' : 'Transaksi';
      case '/reports':
        return user.role === 'teacher' ? 'Rekapitulasi' : user.role === 'parent' ? 'Riwayat Transaksi' : 'Laporan';
      case '/users':
        return 'Manajemen Pengguna';
      case '/schedule':
        return 'Jadwal Menabung';
      case '/recapitulasi':
        return 'Rekapitulasi';
      default:
        return 'Dashboard';
    }
  };

  const isParent = user.role === 'parent';
  const sidebarBgClass = isParent
    ? 'bg-gradient-to-br from-emerald-600 to-emerald-800'
    : 'bg-gradient-to-br from-blue-600 to-blue-800';
  const headerBgClass = isParent
    ? 'bg-gradient-to-br from-emerald-600 to-emerald-800'
    : 'bg-gradient-to-br from-blue-600 to-blue-800';

  return (
    <div className="h-screen flex">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:static lg:inset-0 lg:w-64 lg:translate-x-0
        w-64
      `}>
        <Sidebar sidebarOpen={sidebarOpen} className={sidebarBgClass} />
      </div>

      <div className={`
        flex-1 flex flex-col overflow-y-auto
        transition-all duration-300 ease-in-out
        lg:ml-[0.5cm]
        bg-theme-content-bg
      `}>
        <Header 
          title={getPageTitle()}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          className={headerBgClass}
        />
        <main className="flex-1">
          <div className="container mx-auto px-6 py-8">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/schedule" element={<SavingsSchedule />} />
              <Route path="/recapitulasi" element={<Recapitulasi />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </div>
        </main>
        <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border bg-background">
          SIBUDIS - Anang Creative Production
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <StudentsProvider>
            <TransactionsProvider>
              <SavingsGoalsProvider>
                <ThemeProvider> {/* Add ThemeProvider here */}
                  <ErrorBoundary>
                    <AppContent />
                  </ErrorBoundary>
                </ThemeProvider>
              </SavingsGoalsProvider>
            </TransactionsProvider>
        </StudentsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;