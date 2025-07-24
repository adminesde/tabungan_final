import { useState, useEffect } from 'react'; // Removed React import
import { useAuth } from '../contexts/Auth/AuthContext';
import { useStudents } from '../contexts/StudentsContext';
import StudentTable from '../components/Students/StudentTable';
import StudentForm from '../components/Students/StudentForm';
import ImportStudentsModal from '../components/Students/ImportStudentsModal';
import { Plus, Search, Filter, UploadCloud, RefreshCw } from 'lucide-react';
import { Student } from '../types';
import { Button } from '../components/ui/button';
import { useIsMobile } from '../hooks/useIsMobile'; // Import useIsMobile

export default function Students() {
  const { user } = useAuth();
  const { students, addStudent, updateStudent, deleteStudent, fetchStudents } = useStudents();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const isMobile = useIsMobile(); // Use the hook

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  if (!user) return null;

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = (user.role === 'teacher' && student.class === user.class) ||
                         (user.role === 'admin' && (!selectedClass || student.class === selectedClass)) ||
                         (user.role === 'parent' && student.parentId === user.id);
    
    return matchesSearch && matchesClass;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  const classes = [...new Set(students.map(s => s.class))].sort();

  // Removed handleViewStudent as it's not used

  const handleAddStudent = () => {
    setEditingStudent(undefined);
    setShowForm(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setShowForm(true);
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus siswa ${studentName}? Tindakan ini tidak dapat dibatalkan.`)) {
      const success = await deleteStudent(studentId);
      if (success) {
        // UI will update via real-time listener
      }
    }
  };

  const handleSubmitStudent = async (data: Omit<Student, 'id' | 'createdAt'>) => {
    let success = false;
    if (editingStudent) {
      success = await updateStudent({ ...data, id: editingStudent.id, createdAt: editingStudent.createdAt, balance: editingStudent.balance, parentId: editingStudent.parentId });
    } else {
      success = await addStudent(data);
    }
    if (success) {
      setShowForm(false);
    }
  };

  const getTitle = () => {
    switch (user.role) {
      case 'admin': return 'Kelola Siswa';
      case 'teacher': return 'Data Siswa';
      case 'parent': return 'Data Anak';
      default: return 'Data Siswa';
    }
  };

  const canManageStudents = user.role === 'admin' || user.role === 'teacher';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{getTitle()}</h1>
          <p className="text-muted-foreground">
            {user.role === 'parent' 
              ? 'Informasi tabungan anak-anak Anda'
              : 'Kelola data siswa dan tabungan mereka'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={fetchStudents}
            className="flex items-center space-x-2"
            variant="outline"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {canManageStudents && (
            <Button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center space-x-2"
              variant="accent-green"
              title="Import Siswa"
            >
              <UploadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">Import Siswa</span>
            </Button>
          )}
          {canManageStudents && (
            <Button 
              onClick={handleAddStudent}
              className="flex items-center space-x-2 group"
              variant="accent-blue"
              title="Tambah Siswa"
            >
              <Plus className="w-4 h-4" />
              {isMobile ? (
                <span className="sr-only">Tambah Siswa</span> 
              ) : (
                <span>Tambah Siswa</span>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="bg-background rounded-xl shadow-sm border border-theme-border-light p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nama atau NISN siswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground bg-background"
            />
          </div>

          {(user.role === 'admin') && (
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground bg-background"
              >
                <option value="">Semua Kelas</option>
                {classes.map(cls => (
                  <option key={cls} value={cls}>Kelas {cls}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <StudentTable
          students={paginatedStudents}
          // Removed onView prop
          onEdit={canManageStudents ? handleEditStudent : undefined}
          onDelete={canManageStudents ? handleDeleteStudent : undefined}
          showPagination={true}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {showForm && (
        <StudentForm
          student={editingStudent}
          onSubmit={handleSubmitStudent}
          onClose={() => setShowForm(false)}
        />
      )}

      {showImportModal && (
        <ImportStudentsModal onClose={() => setShowImportModal(false)} />
      )}
    </div>
  );
}