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
    <div className="bg-card rounded-xl p-4 flex-1 border border-black/5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center text-sm">{icon}</div>
        {actionNeeded ? (
          <span className="text-[10px] bg-expiring/20 text-expiring rounded-full px-2 py-0.5 font-medium">
            Action needed
          </span>
        ) : (
          changePct !== undefined && (
            <span className="text-[10px] text-free font-medium">+{changePct}%</span>
          )
        )}
      </div>
      <div className="text-2xl font-serif font-semibold">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
