import React from 'react';
import { User } from 'lucide-react';
import { Button } from '../ui/button';

interface LoginTypeSelectionProps {
  onSelectAdminTeacher: () => void;
  onSelectParent: () => void;
}

export default function LoginTypeSelection({ onSelectAdminTeacher, onSelectParent }: LoginTypeSelectionProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out">
      <h1 className="text-3xl font-bold text-foreground mb-2">Pilih Jenis Login</h1>
      <p className="text-muted-foreground mb-8 text-center">Silakan pilih jenis login Anda.</p>
      <Button
        type="button"
        onClick={onSelectAdminTeacher}
        className="w-full py-4 px-4 mb-4 flex items-center justify-center space-x-2"
        variant="accent-blue"
      >
        <User className="w-6 h-6" />
        <span>Login Guru</span>
      </Button>
      <Button
        type="button"
        onClick={onSelectParent}
        className="w-full py-4 px-4 flex items-center justify-center space-x-2"
        variant="accent-green"
      >
        <User className="w-6 h-6" />
        <span>Login Orang Tua Siswa</span>
      </Button>
    </div>
  );
}