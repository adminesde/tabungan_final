import { Filter, Calendar, Search } from 'lucide-react';
import { Button } from '../ui/button';

interface RecapitulasiFiltersProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedClass: string;
  setSelectedClass: (cls: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  classes: string[];
  userRole: string | undefined;
  // userClass: string | undefined; // Removed as it's not used here
}

export default function RecapitulasiFilters({
  selectedDate,
  setSelectedDate,
  selectedClass,
  setSelectedClass,
  searchTerm,
  setSearchTerm,
  classes,
  userRole,
  // userClass, // Removed from destructuring
}: RecapitulasiFiltersProps) {
  return (
    <div className="bg-background rounded-xl shadow-sm border border-theme-border-light p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Filter Laporan</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent text-foreground placeholder-muted-foreground bg-background"
            placeholder="Pilih Tanggal"
          />
        </div>
        {(userRole === 'admin') && (
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
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
          }}
          className="w-full"
          variant="gray-light"
        >
          Reset Filter
        </Button>
      </div>
    </div>
  );
}