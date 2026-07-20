const styles: Record<string, string> = {
  Active: 'text-free',
  'Expiring Soon': 'text-accent',
  Expired: 'text-gray-400',
  PENDING: 'bg-accent/20 text-accent',
  PAID: 'bg-free/20 text-free',
  REFUNDED: 'bg-gray-200 text-gray-600',
};

export default function StatusPill({ status }: { status: string }) {
  const isDot = status === 'Active' || status === 'Expiring Soon' || status === 'Expired';

  if (isDot) {
    const dotColor =
      status === 'Active' ? 'bg-free' : status === 'Expiring Soon' ? 'bg-accent' : 'bg-gray-400';
    return (
      <span className={`flex items-center gap-1.5 text-xs font-medium ${styles[status]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        {status}
      </span>
    );
  }

  return (
    <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${styles[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
}
