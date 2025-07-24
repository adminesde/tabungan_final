import { useState } from 'react';
import { useAuth } from '../contexts/Auth/AuthContext';
import { useRecapitulasiData } from '../components/Recapitulasi/useRecapitulasiData';
import RecapitulasiFilters from '../components/Recapitulasi/RecapitulasiFilters';
import RecapitulasiSummaryCards from '../components/Recapitulasi/RecapitulasiSummaryCards';
import RecapitulasiStudentTable from '../components/Recapitulasi/RecapitulasiStudentTable';
import RecapitulasiPDFExportButton from '../components/Recapitulasi/RecapitulasiPDFExportButton';

export default function Recapitulasi() {
  const { user } = useAuth();
  const {
    selectedDate,
    setSelectedDate,
    selectedClass,
    setSelectedClass,
    searchTerm,
    setSearchTerm,
    totalDeposits,
    totalWithdrawals,
    netAmount,
    studentSummary,
    classes,
    allUsers,
    isLoading,
    includeClassColumn,
  } = useRecapitulasiData();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) return null;
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rekapitulasi Tabungan</h1>
          <p className="text-muted-foreground">Ringkasan dan analisis data tabungan siswa</p>
        </div>
        <RecapitulasiPDFExportButton
          studentSummary={studentSummary}
          totalDeposits={totalDeposits}
          totalWithdrawals={totalWithdrawals}
          netAmount={netAmount}
          selectedDate={selectedDate}
          selectedClass={selectedClass}
          user={user} // Pass the full user object
          allUsers={allUsers}
          includeClassColumn={includeClassColumn}
        />
      </div>

      <RecapitulasiFilters
        selectedDate={selectedDate}
        setSelectedDate={(date) => { setSelectedDate(date); setCurrentPage(1); }}
        selectedClass={selectedClass}
        setSelectedClass={(cls) => { setSelectedClass(cls); setCurrentPage(1); }}
        searchTerm={searchTerm}
        setSearchTerm={(term) => { setSearchTerm(term); setCurrentPage(1); }}
        classes={classes}
        userRole={user.role}
      />

      <RecapitulasiSummaryCards
        totalDeposits={totalDeposits}
        totalWithdrawals={totalWithdrawals}
        netAmount={netAmount}
        formatCurrency={formatCurrency}
      />

      <RecapitulasiStudentTable
        studentSummary={studentSummary}
        includeClassColumn={includeClassColumn}
        currentPage={currentPage}
        totalPages={Math.ceil(studentSummary.length / itemsPerPage)}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}