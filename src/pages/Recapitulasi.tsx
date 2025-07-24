import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/Auth/AuthContext';
import { useStudents } from '../contexts/StudentsContext';
import { useTransactions } from '../contexts/TransactionsContext';
import { jsPDF } from 'jspdf';
import { supabase } from '../integrations/supabase/client';
import { User as SupabaseUser } from '../types';
import { Filter, Calendar, Search, Download, BarChart3, TrendingUp, TrendingDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useIsMobile } from '../hooks/useIsMobile';
import { showError } from '../utils/toast';

export default function Recapitulasi() {
  const { user } = useAuth();
  const { students: allStudents } = useStudents();
  const { transactions: allTransactions } = useTransactions();
  const [allUsers, setAllUsers] = useState<SupabaseUser[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error("Error fetching users for recapitulation:", error);
      } else {
        const fetchedUsers: SupabaseUser[] = data.map(profile => ({
          id: profile.id,
          name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
          email: profile.email,
          role: profile.role as 'admin' | 'teacher' | 'parent',
          class: profile.class || undefined,
          createdAt: profile.created_at,
          isActive: profile.is_active,
        }));
        setAllUsers(fetchedUsers);
      }
    };
    fetchUsers();
  }, []);

  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getFilteredData = () => {
    let studentsInScope = allStudents;
    let transactionsInScope = allTransactions;

    if (user.role === 'teacher' && user.class) {
      studentsInScope = studentsInScope.filter(s => s.class === user.class);
      const classStudentIds = studentsInScope.map(s => s.id);
      transactionsInScope = transactionsInScope.filter(t => classStudentIds.includes(t.studentId));
    }

    if (selectedClass) {
      studentsInScope = studentsInScope.filter(s => s.class === selectedClass);
      const classStudentIds = studentsInScope.map(s => s.id);
      transactionsInScope = transactionsInScope.filter(t => classStudentIds.includes(t.studentId));
    }

    if (selectedDate) {
      transactionsInScope = transactionsInScope.filter(t =>
        t.date.startsWith(selectedDate)
      );
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      studentsInScope = studentsInScope.filter(s => s.name.toLowerCase().includes(searchLower));
      const searchedStudentIds = studentsInScope.map(s => s.id);
      transactionsInScope = transactionsInScope.filter(t => searchedStudentIds.includes(t.studentId));
    }

    return { students: studentsInScope, transactions: transactionsInScope };
  };

  const { students, transactions } = getFilteredData();

  const totalDeposits = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  const netAmount = totalDeposits - totalWithdrawals;

  const getStudentSummary = () => {
    return students.map(student => {
      const studentTransactions = transactions.filter(t => t.studentId === student.id);
      const deposits = studentTransactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);
      const withdrawals = studentTransactions
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        ...student,
        totalDeposits: deposits,
        totalWithdrawals: withdrawals,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  };

  const studentSummary = getStudentSummary();

  const totalPages = Math.ceil(studentSummary.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudentSummary = studentSummary.slice(startIndex, startIndex + itemsPerPage);

  const classes = [...new Set(allStudents.map(s => s.class))].sort();

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      let y = 20;
      const margin = 20;
      const lineHeight = 7;
      const tableRowHeight = 8;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const includeClassColumn = !selectedClass && !(user.role === 'teacher' && user.class);

      const tableHeaders = [
        { name: 'Nama', width: 60, align: 'left' as 'left' | 'center' | 'right' },
        ...(includeClassColumn ? [{ name: 'Kelas', width: 20, align: 'left' as 'left' | 'center' | 'right' }] : []),
        { name: 'Saldo Saat Ini', width: 40, align: 'right' as 'left' | 'center' | 'right' },
        { name: 'Setoran Periode Ini', width: 40, align: 'right' as 'left' | 'center' | 'right' },
        { name: 'Penarikan Periode Ini', width: 40, align: 'right' as 'left' | 'center' | 'right' },
      ];

      const totalTableWidth = tableHeaders.reduce((sum, header) => sum + header.width, 0);
      const tableStartX = (pageWidth - totalTableWidth) / 2;

      const addPageWithHeaders = (doc: jsPDF, currentY: number) => {
        doc.addPage();
        currentY = margin;
        doc.setFontSize(8);
        doc.text(`Tanggal Cetak: ${formatDate(new Date().toISOString())}`, pageWidth - margin, currentY, { align: 'right' });
        currentY += 10;
        doc.setFontSize(16);
        doc.text('Laporan Rekapitulasi Tabungan Siswa', pageWidth / 2, currentY, { align: 'center' });
        currentY += 10;
        doc.setFontSize(10);
        doc.text(`Periode: ${selectedDate || 'Semua Tanggal'}`, pageWidth / 2, currentY, { align: 'center' });
        if (selectedClass) {
          currentY += 5;
          doc.text(`Kelas: ${selectedClass}`, pageWidth / 2, currentY, { align: 'center' });
        } else if (user.role === 'teacher' && user.class) {
          currentY += 5;
          doc.text(`Kelas: ${user.class}`, pageWidth / 2, currentY, { align: 'center' });
        }
        currentY += 15;
        doc.setFontSize(12);
        doc.text('Ringkasan per Siswa (Lanjutan):', margin, currentY);
        currentY += lineHeight;
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        let currentX = tableStartX;
        tableHeaders.forEach(header => {
          doc.rect(currentX, currentY, header.width, tableRowHeight);
          doc.text(header.name, currentX + (header.align === 'right' ? header.width - 2 : 2), currentY + 5, { align: header.align || 'left' });
          currentX += header.width;
        });
        doc.setFont(undefined, 'normal');
        currentY += tableRowHeight;
        return currentY;
      };

      doc.setFontSize(8);
      doc.text(`Tanggal Cetak: ${formatDate(new Date().toISOString())}`, pageWidth - margin, y, { align: 'right' });
      y += 10;

      doc.setFontSize(16);
      doc.text('Laporan Rekapitulasi Tabungan Siswa', pageWidth / 2, y, { align: 'center' });
      y += 10;
      doc.setFontSize(10);
      doc.text(`Periode: ${selectedDate || 'Semua Tanggal'}`, pageWidth / 2, y, { align: 'center' });
      if (selectedClass) {
        y += 5;
        doc.text(`Kelas: ${selectedClass}`, pageWidth / 2, y, { align: 'center' });
      } else if (user.role === 'teacher' && user.class) {
        y += 5;
        doc.text(`Kelas: ${user.class}`, pageWidth / 2, y, { align: 'center' });
      }
      y += 15;

      doc.setFontSize(12);
      doc.text('Ringkasan Global:', margin, y);
      y += lineHeight;
      doc.setFontSize(10);
      doc.text(`Total Setoran: ${formatCurrency(totalDeposits)}`, margin, y);
      y += lineHeight;
      doc.text(`Total Penarikan: ${formatCurrency(totalWithdrawals)}`, margin, y);
      y += lineHeight;
      doc.text(`Saldo Bersih Periode Ini: ${formatCurrency(netAmount)}`, margin, y);
      y += 15;

      doc.setFontSize(12);
      doc.text('Ringkasan per Siswa:', margin, y);
      y += lineHeight;

      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      let currentX = tableStartX;
      tableHeaders.forEach(header => {
        doc.rect(currentX, y, header.width, tableRowHeight);
        doc.text(header.name, currentX + (header.align === 'right' ? header.width - 2 : 2), y + 5, { align: header.align || 'left' });
        currentX += header.width;
      });
      doc.setFont(undefined, 'normal');
      y += tableRowHeight;

      studentSummary.forEach(s => {
        let rowHeight = tableRowHeight;
        const nameLines = doc.splitTextToSize(s.name, tableHeaders[0].width - 4);
        const nameHeight = nameLines.length * lineHeight;
        rowHeight = Math.max(rowHeight, nameHeight + 2);

        if (y + rowHeight + 6 * lineHeight + 20 > pageHeight - margin) { // Adjusted for footer
          y = addPageWithHeaders(doc, y);
        }
        doc.setFontSize(9);
        currentX = tableStartX;
        
        doc.rect(currentX, y, tableHeaders[0].width, rowHeight);
        doc.text(nameLines, currentX + 2, y + 5);
        currentX += tableHeaders[0].width;

        if (includeClassColumn) {
          doc.rect(currentX, y, tableHeaders[1].width, rowHeight);
          doc.text(s.class, currentX + 2, y + (rowHeight / 2) + 2.5);
          currentX += tableHeaders[1].width;
        }

        doc.rect(currentX, y, tableHeaders[includeClassColumn ? 2 : 1].width, rowHeight);
        doc.text(formatCurrency(s.balance), currentX + tableHeaders[includeClassColumn ? 2 : 1].width - 2, y + (rowHeight / 2) + 2.5, { align: 'right' });
        currentX += tableHeaders[includeClassColumn ? 2 : 1].width;

        doc.rect(currentX, y, tableHeaders[includeClassColumn ? 3 : 2].width, rowHeight);
        doc.text(formatCurrency(s.totalDeposits), currentX + tableHeaders[includeClassColumn ? 3 : 2].width - 2, y + (rowHeight / 2) + 2.5, { align: 'right' });
        currentX += tableHeaders[includeClassColumn ? 3 : 2].width;

        doc.rect(currentX, y, tableHeaders[includeClassColumn ? 4 : 3].width, rowHeight);
        doc.text(formatCurrency(s.totalWithdrawals), currentX + tableHeaders[includeClassColumn ? 4 : 3].width - 2, y + (rowHeight / 2) + 2.5, { align: 'right' });
        currentX += tableHeaders[includeClassColumn ? 4 : 3].width;

        y += rowHeight;
      });

      if (y + 6 * lineHeight + 20 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      const signatureY = y + 20;
      const col1X = pageWidth / 4;
      const col2X = pageWidth * 3 / 4;

      const actualAdminUser = allUsers.find(u => u.role === 'admin');
      const adminSignatureName = actualAdminUser?.name ?? 'Nama Admin'; // Ensure string

      if (user.role === 'admin') {
        doc.setFontSize(10);
        doc.text('Mengetahui:', col1X, signatureY, { align: 'center' });
        doc.text('Kepala Sekolah', col1X, signatureY + lineHeight, { align: 'center' });
        doc.text('Karnadi, S.Pd.SD.', col1X, signatureY + lineHeight * 6, { align: 'center' });

        doc.text('Admin Aplikasi', col2X, signatureY, { align: 'center' });
        doc.text(adminSignatureName, col2X, signatureY + lineHeight * 6, { align: 'center' });
      } else {
        const teacherSignatureName = user.name ?? 'Nama Guru'; // Ensure string
        doc.setFontSize(10);
        doc.text('Mengetahui:', col1X, signatureY, { align: 'center' });
        doc.text(`Guru Kelas ${selectedClass || (user.role === 'teacher' ? user.class || '' : '')}`, col1X, signatureY + lineHeight, { align: 'center' });
        doc.text(teacherSignatureName, col1X, signatureY + lineHeight * 6, { align: 'center' });

        doc.text('Admin Aplikasi', col2X, signatureY, { align: 'center' });
        doc.text(adminSignatureName, col2X, signatureY + lineHeight * 6, { align: 'center' });
      }

      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      doc.setFontSize(8);
      doc.text('SIBUDIS - Anang Creative Production', pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text('Terimakasih telah menggunakan layanan kami.', pageWidth / 2, pageHeight - 5, { align: 'center' });

      if (isMobile) {
        window.open(doc.output('bloburl'), '_blank');
      } else {
        doc.save(`Laporan_Rekapitulasi_Tabungan_Siswa_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      showError("Gagal mengunduh laporan PDF. Silakan coba lagi.");
    }
  };

  const includeClassColumn = !selectedClass && !(user.role === 'teacher' && user.class);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rekapitulasi Tabungan</h1>
          <p className="text-muted-foreground">Ringkasan dan analisis data tabungan siswa</p>
        </div>
        <Button 
          onClick={handleExportPDF}
          className="flex items-center space-x-2 sm:w-auto w-full justify-center"
          variant="accent-green"
          title="Export PDF"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export PDF</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </div>

      <div className="bg-background rounded-xl shadow-sm border border-theme-border-light p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Filter Laporan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground bg-background"
              placeholder="Pilih Tanggal"
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
                className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground bg-background"
              >
                <option value="">Semua Kelas</option>
                {classes.map(cls => (
                  <option key={cls} value={cls}>Kelas {cls}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex-1 relative col-span-1 sm:col-span-2 lg:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nama siswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground bg-background"
            />
          </div>
          <Button
            onClick={() => {
              setSelectedDate('');
              setSelectedClass('');
              setSearchTerm('');
              setCurrentPage(1);
            }}
            className="w-full"
            variant="gray-light"
          >
            Reset Filter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-background rounded-xl shadow-md border border-theme-border-light p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-icon-green-bg rounded-lg">
              <TrendingUp className="w-6 h-6 text-accent-green" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Setoran</p>
              <p className="text-2xl font-bold text-accent-green">{formatCurrency(totalDeposits)}</p>
            </div>
          </div>
        </div>

        <div className="bg-background rounded-xl shadow-md border border-theme-border-light p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-icon-red-bg rounded-lg">
              <TrendingDown className="w-6 h-6 text-accent-red" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Penarikan</p>
              <p className="text-2xl font-bold text-accent-red">{formatCurrency(totalWithdrawals)}</p>
            </div>
          </div>
        </div>

        <div className="bg-background rounded-xl shadow-md border border-theme-border-light p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-icon-blue-bg rounded-lg">
              <BarChart3 className="w-6 h-6 text-accent-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Saldo Bersih Periode Ini</p>
              <p className={`text-2xl font-bold ${netAmount >= 0 ? 'text-accent-blue' : 'text-accent-red'}`}>
                {formatCurrency(netAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-background rounded-xl shadow-sm border border-theme-border-light p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Ringkasan per Siswa</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">Nama</th>
                {includeClassColumn && <th className="text-left py-3 px-4 font-semibold text-foreground">Kelas</th>}
                <th className="text-right py-3 px-4 font-semibold text-foreground">Saldo Saat Ini</th>
                <th className="text-right py-3 px-4 font-semibold text-foreground">Setoran Periode Ini</th>
                <th className="text-right py-3 px-4 font-semibold text-foreground">Penarikan Periode Ini</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudentSummary.length === 0 ? (
                <tr>
                  <td colSpan={includeClassColumn ? 5 : 4} className="text-center py-8 text-muted-foreground">Tidak ada data siswa ditemukan untuk filter ini.</td>
                </tr>
              ) : (
                paginatedStudentSummary.map((student) => (
                  <tr key={student.id} className="border-b border-border hover:bg-muted">
                    <td className="py-3 px-4 font-medium text-foreground">{student.name}</td>
                    {includeClassColumn && <td className="py-3 px-4 text-muted-foreground">{student.class}</td>}
                    <td className="py-3 px-4 text-right font-semibold text-accent-blue">
                      {formatCurrency(student.balance)}
                    </td>
                    <td className="py-3 px-4 text-right text-accent-green">
                      {formatCurrency(student.totalDeposits)}
                    </td>
                    <td className="py-3 px-4 text-right text-accent-red">
                      {formatCurrency(student.totalWithdrawals)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-4 py-3 bg-background border border-theme-border-light rounded-lg">
            <div className="text-sm text-muted-foreground">
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, studentSummary.length)} dari {studentSummary.length} siswa
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="text-sm"
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4" />
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
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}