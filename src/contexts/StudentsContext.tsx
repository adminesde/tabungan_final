import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Student } from '../types';
import { supabase } from '../integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';
import { useAuth } from './Auth/AuthContext';

interface StudentsContextType {
  students: Student[];
  addStudent: (newStudent: Omit<Student, 'id' | 'createdAt'>) => Promise<boolean>;
  addMultipleStudents: (newStudents: Omit<Student, 'id' | 'createdAt'>[]) => Promise<boolean>;
  updateStudent: (updatedStudent: Student) => Promise<boolean>;
  deleteStudent: (studentId: string) => Promise<boolean>;
  fetchStudents: () => Promise<void>;
}

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

export function StudentsProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const { user, isLoading: isAuthLoading } = useAuth();

  const fetchStudents = useCallback(async () => {
    if (isAuthLoading) {
      console.log("StudentsContext: Auth still loading, deferring fetchStudents.");
      return;
    }
    if (!user) {
      console.log("StudentsContext: No user logged in, clearing students.");
      setStudents([]);
      return;
    }
    console.log("StudentsContext: Fetching students for user:", user.id, "role:", user.role, "studentInfo:", user.studentInfo);
    const { data, error } = await supabase
      .from('students')
      .select('*');

    if (error) {
      console.error("StudentsContext: Error fetching students:", error);
      showError("Gagal memuat data siswa.");
    } else {
      const fetchedStudents: Student[] = data.map(s => ({
        id: s.id,
        name: s.name,
        class: s.class,
        studentId: s.student_id,
        parentId: s.parent_id,
        balance: s.balance,
        createdAt: s.created_at,
      }));
      setStudents(fetchedStudents);
      console.log("StudentsContext: Fetched students count:", fetchedStudents.length);
      console.log("StudentsContext: Fetched students data:", fetchedStudents);
    }
  }, [user, isAuthLoading]);

  useEffect(() => {
    if (!isAuthLoading && user) {
      fetchStudents();
    }
    
    const channel = supabase
      .channel('students_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        console.log("StudentsContext: Realtime change detected, re-fetching students.");
        fetchStudents();
      })
      .subscribe();

    return () => {
      console.log("StudentsContext: Unsubscribing from realtime listener.");
      supabase.removeChannel(channel);
    };
  }, [fetchStudents, user, isAuthLoading]);

  const addStudent = async (newStudentData: Omit<Student, 'id' | 'createdAt'>): Promise<boolean> => {
    const { error } = await supabase
      .from('students')
      .insert({
        name: newStudentData.name,
        class: newStudentData.class,
        student_id: newStudentData.studentId,
        parent_id: newStudentData.parentId,
        balance: newStudentData.balance,
      });

    if (error) {
      console.error("Error adding student:", error);
      showError("Gagal menambahkan siswa baru.");
      return false;
    } else {
      showSuccess("Siswa baru berhasil ditambahkan.");
      return true;
    }
  };

  const addMultipleStudents = async (newStudentsData: Omit<Student, 'id' | 'createdAt'>[]): Promise<boolean> => {
    const studentsToInsert = newStudentsData.map(data => ({
      name: data.name,
      class: data.class,
      student_id: data.studentId,
      parent_id: data.parentId,
      balance: data.balance,
    }));

    console.log("StudentsContext: Attempting to insert multiple students:", studentsToInsert);
    const { error } = await supabase
      .from('students')
      .insert(studentsToInsert);

    if (error) {
      console.error("StudentsContext: Error adding multiple students:", error);
      showError("Gagal mengimpor beberapa siswa.");
      return false;
    } else {
      console.log("StudentsContext: Multiple students successfully imported.");
      showSuccess("Beberapa siswa berhasil diimpor.");
      return true;
    }
  };

  const updateStudent = async (updatedStudent: Student): Promise<boolean> => {
    const { error } = await supabase
      .from('students')
      .update({
        name: updatedStudent.name,
        class: updatedStudent.class,
        student_id: updatedStudent.studentId,
      })
      .eq('id', updatedStudent.id);

    if (error) {
      console.error("Error updating student:", error);
      showError("Gagal memperbarui data siswa.");
      return false;
    } else {
      showSuccess("Data siswa berhasil diperbarui.");
      return true;
    }
  };

  const deleteStudent = async (studentId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);

    if (error) {
      console.error("Error deleting student:", error);
      showError("Gagal menghapus siswa.");
      return false;
    } else {
      showSuccess("Siswa berhasil dihapus.");
      return true;
    }
  };

  return (
    <StudentsContext.Provider value={{ students, addStudent, addMultipleStudents, updateStudent, deleteStudent, fetchStudents }}>
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  const context = useContext(StudentsContext);
  if (context === undefined) {
    throw new Error('useStudents must be used within a StudentsProvider');
  }
  return context;
}