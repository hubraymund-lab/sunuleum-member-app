// Created: 2026-03-18
const STYLES = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-yellow-100 text-yellow-800',
  withdrawn: 'bg-red-100 text-red-800',
  open: 'bg-blue-100 text-blue-800',
  closed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  enrolled: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  paid: 'bg-green-100 text-green-800',
  unpaid: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function StatusBadge({ status, label }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STYLES[status] || 'bg-gray-100 text-gray-800'}`}>
      {label || status}
    </span>
  );
}
