import { Download } from 'lucide-react';
import { Button } from '../ui/button';
import { jsPDF } from 'jspdf';
import { useIsMobile } from '../../hooks/useIsMobile';
import { showError } from '../../utils/toast';
import { User, Student } from '../../types';

interface StudentSummary extends Student {
  totalDeposits: number;
  totalWithdrawals: number;
}

interface RecapitulasiPDFExportButtonProps {
  studentSummary: StudentSummary[];
  totalDeposits: number;
  totalWithdrawals: number;
  netAmount: number;
  selectedDate: string;
  selectedClass: string;
  userRole: string | undefined;
  userClass: string | undefined;
  allUsers: User[];
  includeClassColumn: boolean;
}

export default function RecapitulasiPDFExportButton({
  studentSummary,
  totalDeposits,
  totalWithdrawals,
  netAmount,
  selectedDate,
  selectedClass,
  userRole,
  userClass,
  allUsers,
  includeClassColumn,
}: RecapitulasiPDFExportButtonProps) {
  const isMobile = useIsMobile();

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

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      let y = 20;
      const margin = 20;
      const lineHeight = 7;
      const tableRowHeight = 8;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const tableHeaders = [
        { name: 'Nama', width: 60, align: 'left' as 'left' | 'center' | 'right' },
        ...(includeClassColumn ? [{ name: 'Kelas', width: 20, align: 'left' as 'left' | 'center' | 'right' }] : []),
        { name: 'Saldo Saat Ini', width: 40, align: 'right' as 'left' | 'center' | 'right' },
        { name: 'Setoran Periode Ini', width: 40, align: 'right' as 'left' | 'center' | 'right' },
        { name: 'Penarikan Periode Ini', width: 40, align: 'right' as 'left' | 'center' | 'right' },
      ];

      const totalTableWidth = tableHeaders.reduce((sum, header) => sum + header.width, 0);
      const tableStartX = (pageWidth - totalTableWidth) / 2;

      const addPageWithHeaders = (pdfDoc: jsPDF, currentY: number) => {
        pdfDoc.addPage();
        currentY = margin;
        pdfDoc.setFontSize(8);
        pdfDoc.text(`Tanggal Cetak: ${formatDate(new Date().toISOString())}`, pageWidth - margin, currentY, { align: 'right' });
        currentY += 10;
        pdfDoc.setFontSize(16);
        pdfDoc.text('Laporan Rekapitulasi Tabungan Siswa', pageWidth / 2, currentY, { align: 'center' });
        currentY += 10;
        pdfDoc.setFontSize(10);
        pdfDoc.text(`Periode: ${selectedDate || 'Semua Tanggal'}`, pageWidth / 2, currentY, { align: 'center' });
        if (selectedClass) {
          currentY += 5;
          pdfDoc.text(`Kelas: ${selectedClass}`, pageWidth / 2, currentY, { align: 'center' });
        } else if (userRole === 'teacher' && userClass) {
          currentY += 5;
          pdfDoc.text(`Kelas: ${userClass}`, pageWidth / 2, currentY, { align: 'center' });
        }
        currentY += 15;
        pdfDoc.setFontSize(12);
        pdfDoc.text('Ringkasan per Siswa (Lanjutan):', margin, currentY);
        currentY += lineHeight;
        
        pdfDoc.setFontSize(9);
        pdfDoc.setFont(undefined, 'bold');
        let currentX = tableStartX;
        tableHeaders.forEach(header => {
          pdfDoc.rect(currentX, currentY, header.width, tableRowHeight);
          pdfDoc.text(header.name, currentX + (header.align === 'right' ? header.width - 2 : 2), currentY + 5, { align: header.align || 'left' });
          currentX += header.width;
        });
        pdfDoc.setFont(undefined, 'normal');
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
      } else if (userRole === 'teacher' && userClass) {
        y += 5;
        doc.text(`Kelas: ${userClass}`, pageWidth / 2, y, { align: 'center' });
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

      if (userRole === 'admin') {
        doc.setFontSize(10);
        doc.text('Mengetahui:', col1X, signatureY, { align: 'center' });
        doc.text('Kepala Sekolah', col1X, signatureY + lineHeight, { align: 'center' });
        doc.text('Karnadi, S.Pd.SD.', col1X, signatureY + lineHeight * 6, { align: 'center' });

        doc.text('Admin Aplikasi', col2X, signatureY, { align: 'center' });
        doc.text(adminSignatureName, col2X, signatureY + lineHeight * 6, { align: 'center' });
      } else {
        const teacherSignatureName = userRole === 'teacher' ? (allUsers.find(u => u.id === user?.id)?.name ?? 'Nama Guru') : 'Nama Guru'; // Ensure string
        doc.setFontSize(10);
        doc.text('Mengetahui:', col1X, signatureY, { align: 'center' });
        doc.text(`Guru Kelas ${selectedClass || (userRole === 'teacher' ? userClass || '' : '')}`, col1X, signatureY + lineHeight, { align: 'center' });
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

  return (
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
  );
}