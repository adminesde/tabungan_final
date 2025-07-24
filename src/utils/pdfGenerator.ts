import { jsPDF } from 'jspdf';
import { Transaction, Student, User as SupabaseUser } from '../types';
import { showError } from './toast';

// Helper functions (can be moved to a general utils file if used elsewhere)
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

export const generateTransactionPDF = (
  transaction: Transaction,
  students: Student[],
  allUsers: SupabaseUser[],
  isMobile: boolean
) => {
  try {
    const student = students.find(s => s.id === transaction.studentId);
    if (!student) {
      console.error("Student not found for PDF generation.");
      showError("Gagal membuat bukti PDF: Siswa tidak ditemukan.");
      return;
    }

    const getPerformedByName = (performedByEmail: string) => {
      const performer = allUsers.find(u => u.email === performedByEmail);
      return performer ? performer.name : performedByEmail;
    };

    const getTeacherNameByClass = (studentClass: string) => {
      const teacher = allUsers.find(u => u.role === 'teacher' && u.class === studentClass);
      return teacher ? teacher.name : 'Guru Kelas';
    };

    const getParentNameById = (parentId: string | null) => {
      if (!parentId) return 'Orang Tua';
      const parent = allUsers.find(u => u.id === parentId);
      return parent ? parent.name : 'Orang Tua';
    };

    const doc = new jsPDF();
    let y = 20;
    const margin = 20;
    const lineHeight = 7;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(8);
    doc.text(`Tanggal Cetak: ${formatDate(new Date().toISOString())}`, pageWidth - margin, y, { align: 'right' });
    y += 10;

    doc.setFontSize(16);
    doc.text(`BUKTI ${transaction.type === 'deposit' ? 'SETORAN' : 'PENARIKAN'}`, pageWidth / 2, y, { align: 'center' });
    y += 20;

    doc.setFontSize(10);
    doc.text(`ID Transaksi: ${transaction.id}`, margin, y);
    y += lineHeight * 2;

    doc.setFontSize(12);
    doc.text('Detail Siswa:', margin, y);
    y += lineHeight;
    doc.text(`Nama Siswa: ${student.name}`, margin, y);
    y += lineHeight;
    doc.text(`Kelas: ${student.class}`, margin, y);
    y += lineHeight;
    doc.text(`NISN: ${student.studentId}`, margin, y);
    y += 15;

    doc.text('Detail Transaksi:', margin, y);
    y += lineHeight;
    doc.text(`Tanggal: ${formatDate(transaction.date)}`, margin, y);
    y += lineHeight;
    doc.text(`Jumlah: ${formatCurrency(transaction.amount)}`, margin, y);
    y += lineHeight;
    doc.text(`Keterangan: ${transaction.description}`, margin, y);
    y += lineHeight;
    doc.text(`Saldo Setelah Transaksi: ${formatCurrency(transaction.balance)}`, margin, y);
    y += 15;

    doc.text(`Dilakukan oleh: ${getPerformedByName(transaction.performedBy)}`, margin, y);
    y += lineHeight;
    doc.text(`Peran: ${transaction.performedByRole === 'admin' ? 'Admin' : 'Guru'}`, margin, y);
    y += 20;

    const signatureY = y + 20;
    const col1X = pageWidth / 4;
    const col2X = pageWidth * 3 / 4;

    doc.setFontSize(10);
    doc.text('Mengetahui:', col1X, signatureY, { align: 'center' });
    doc.text('Orang Tua', col2X, signatureY, { align: 'center' });
    
    doc.text(`Guru Kelas ${student.class}`, col1X, signatureY + lineHeight, { align: 'center' });

    doc.text(getTeacherNameByClass(student.class), col1X, signatureY + lineHeight * 6, { align: 'center' });
    doc.text(getParentNameById(student.parentId), col2X, signatureY + lineHeight * 6, { align: 'center' });

    doc.setFontSize(8);
    doc.text('SIBUDIS - Anang Creative Production', pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('Terimakasih telah menggunakan layanan kami.', pageWidth / 2, pageHeight - 5, { align: 'center' });

    if (isMobile) {
      window.open(doc.output('bloburl'), '_blank');
    } else {
      doc.save(`Bukti_Transaksi_${transaction.id}.pdf`);
    }
  } catch (error) {
    console.error("Error generating PDF for transaction:", error);
    showError("Gagal mengunduh bukti transaksi PDF. Silakan coba lagi.");
  }
};