import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
// Removed StatsCard import as it's not used directly in this component

interface RecapitulasiSummaryCardsProps {
  totalDeposits: number;
  totalWithdrawals: number;
  netAmount: number;
  formatCurrency: (amount: number) => string;
}

export default function RecapitulasiSummaryCards({
  totalDeposits,
  totalWithdrawals,
  netAmount,
  formatCurrency,
}: RecapitulasiSummaryCardsProps) {
  return (
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
  );
}