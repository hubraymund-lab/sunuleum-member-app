// Created: 2026-03-18
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 size={40} className="animate-spin text-indigo-600" />
    </div>
  );
}
