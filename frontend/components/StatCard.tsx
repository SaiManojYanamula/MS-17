export default function StatCard({
  icon,
  value,
  label,
  changePct,
  actionNeeded,
}: {
  icon: string;
  value: string;
  label: string;
  changePct?: number;
  actionNeeded?: boolean;
}) {
  return (
    <div className="bg-card rounded-2xl p-4 flex-1 border border-black/5 shadow-soft transition-shadow hover:shadow-card">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-base">
          {icon}
        </div>
        {actionNeeded ? (
          <span className="text-[10px] bg-expiring/15 text-expiring rounded-full px-2 py-0.5 font-medium">
            Action needed
          </span>
        ) : (
          changePct !== undefined && (
            <span
              className={`text-[10px] font-medium ${changePct >= 0 ? 'text-free' : 'text-expiring'}`}
            >
              {changePct >= 0 ? '+' : ''}
              {changePct}%
            </span>
          )
        )}
      </div>
      <div className="text-2xl font-serif font-semibold tracking-tight">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
