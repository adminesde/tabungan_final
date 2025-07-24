import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Student } from '../../types'; // Import Student type

interface StudentSummary extends Student {
  totalDeposits: number;
  totalWithdrawals: number;
}

interface RecapitulasiStudentTableProps {
  studentSummary: StudentSummary[];
  includeClassColumn: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  formatCurrency: (amount: number) => string;
}

export default function RecapitulasiStudentTable({
  studentSummary,
  includeClassColumn,
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  formatCurrency,
}: RecapitulasiStudentTableProps) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudentSummary = studentSummary.slice(startIndex, startIndex + itemsPerPage);

  return (
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
              onClick={() => onPageChange(currentPage - 1)}
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
              onClick={() => onPageChange(currentPage + 1)}
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
  );
}