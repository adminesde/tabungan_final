import { useState, useEffect } from 'react';
import { User } from '../../types';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Users, Lock } from 'lucide-react';
import UserForm from './UserForm';
import ResetPasswordModal from './ResetPasswordModal';
import { supabase } from '../../integrations/supabase/client';
import { showError, showSuccess } from '../../utils/toast';
import { Button } from '../ui/button';
import { useIsMobile } from '../../hooks/useIsMobile';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchUsers();
    const channel = supabase
      .channel('profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error("Error fetching users:", error);
      showError("Gagal memuat data pengguna.");
    } else {
      const fetchedUsers: User[] = data.map(profile => ({
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
        email: profile.email,
        role: profile.role as 'admin' | 'teacher' | 'parent',
        class: profile.class || undefined,
        createdAt: profile.created_at,
        isActive: profile.is_active,
        nip: profile.nip || undefined,
      }));
      setUsers(fetchedUsers);
      console.log("UserManagement: Fetched users count:", fetchedUsers.length);
      console.log("UserManagement: Fetched users data:", fetchedUsers);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  
  const handleAddUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDeleteClick = (userId: string, userName: string) => {
    setUserToDelete({ id: userId, name: userName });
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        // Call the Edge Function to delete the user from auth.users
        const { data, error: edgeFunctionError } = await supabase.functions.invoke('delete-user', {
          body: { userId: userToDelete.id },
        });

        if (edgeFunctionError) {
          console.error("Error calling delete-user edge function:", edgeFunctionError);
          showError("Gagal menghapus pengguna: " + edgeFunctionError.message);
        } else if (data && data.message) {
          showSuccess("Pengguna berhasil dihapus.");
          fetchUsers(); // Re-fetch the list after successful deletion
        } else {
          showError("Gagal menghapus pengguna. Respon tidak valid.");
        }
      } catch (err: any) {
        console.error("Unexpected error during user deletion:", err);
        showError("Terjadi kesalahan tak terduga saat menghapus pengguna: " + err.message);
      } finally {
        setUserToDelete(null);
      }
    }
  };

  const handleToggleStatus = async (userToUpdate: User) => {
    const newStatus = !userToUpdate.isActive;
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: newStatus })
      .eq('id', userToUpdate.id);

    if (error) {
      console.error("Error updating user status:", error);
      showError("Gagal memperbarui status pengguna.");
    } else {
      showSuccess(`Status pengguna ${userToUpdate.name} berhasil diperbarui.`);
      fetchUsers();
    }
  };

  const handleOpenResetPasswordModal = (user: User) => {
    setUserToResetPassword(user);
    setShowResetPasswordModal(true);
  };

  const handleResetPasswordSubmit = async (userId: string, newPassword: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('update-user-password', {
        body: { userId, newPassword },
      });

      if (error) {
        console.error("Error calling update-user-password edge function:", error);
        showError("Gagal mereset password: " + error.message);
      } else if (data && data.message) {
        showSuccess("Password berhasil direset!");
        setShowResetPasswordModal(false);
      } else {
        showError("Gagal mereset password. Respon tidak valid.");
      }
    } catch (err: any) {
      console.error("Unexpected error during password reset:", err);
      showError("Terjadi kesalahan tak terduga saat mereset password: " + err.message);
    }
  };
  
  const handleSubmitUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    const [firstName, ...lastNameParts] = userData.name.split(' ');
    const lastName = lastNameParts.join(' ');

    if (editingUser) {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          first_name: firstName, 
          last_name: lastName, 
          email: userData.email, 
          role: userData.role, 
          class: userData.class, 
          is_active: userData.isActive,
          nip: userData.nip,
        })
        .eq('id', editingUser.id);

      if (error) {
        console.error("Error updating user:", error);
        showError("Gagal memperbarui pengguna.");
      } else {
        showSuccess("Pengguna berhasil diperbarui.");
        setShowForm(false);
        fetchUsers();
      }
    } else {
      setShowForm(false);
      fetchUsers();
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'teacher': return 'Guru';
      case 'parent': return 'Orang Tua';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'parent': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Pengguna</h1>
          <p className="text-muted-foreground">Kelola akun admin, guru, dan orang tua</p>
        </div>
        <Button
          onClick={handleAddUser}
          className="flex items-center space-x-2 group"
          variant="accent-blue"
          title="Tambah Pengguna"
        >
          <Plus className="w-4 h-4" />
          {isMobile ? (
            <span className="sr-only">Tambah Pengguna</span>
          ) : (
            <span>Tambah Pengguna</span>
          )}
        </Button>
      </div>

      <div className="bg-background rounded-xl shadow-sm border border-border p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-green focus:border-transparent text-foreground placeholder-muted-foreground bg-background"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-green focus:border-transparent text-foreground bg-background"
            >
              <option value="">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="teacher">Guru</option>
              <option value="parent">Orang Tua</option>
            </select>
          </div>
        </div>

        {paginatedUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Tidak ada pengguna ditemukan</h3>
            <p className="text-muted-foreground">Coba ubah kata kunci pencarian atau filter role</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Nama</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Kelas</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-muted-foreground">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium text-foreground">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {user.class ? `Kelas ${user.class}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(user)}
                          className={`${
                            user.isActive 
                              ? 'text-accent-green hover:bg-green-100'
                              : 'text-accent-red hover:bg-red-100'
                          }`}
                        >
                          {user.isActive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                        </Button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenResetPasswordModal(user)}
                            className="text-accent-orange hover:bg-orange-100"
                            title="Reset Password"
                          >
                            <Lock className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUser(user)}
                            className="text-accent-blue hover:bg-blue-100"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(user.id, user.name)}
                                className="text-accent-red hover:bg-red-100"
                                disabled={user.role === 'admin'}
                                title="Hapus Pengguna"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus pengguna "{userToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={handleConfirmDelete} className="bg-accent-red hover:bg-red-700 text-white">
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 px-4 py-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredUsers.length)} dari {filteredUsers.length} pengguna
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="text-sm"
                    variant="outline"
                    size="sm"
                  >
                    Sebelumnya
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="text-sm"
                    variant="outline"
                    size="sm"
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <UserForm
          user={editingUser}
          onSubmit={handleSubmitUser}
          onClose={() => setShowForm(false)}
        />
      )}

      {showResetPasswordModal && userToResetPassword && (
        <ResetPasswordModal
          user={userToResetPassword}
          onSubmit={handleResetPasswordSubmit}
          onClose={() => setShowResetPasswordModal(false)}
        />
      )}
    </div>
  );
}