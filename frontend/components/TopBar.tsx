export default function TopBar({
  placeholder = 'Search applicant, member...',
  value,
  onChange,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          className="bg-white border border-gray-200 rounded-full text-sm px-4 py-2 w-64 focus:outline-none focus:ring-1 focus:ring-accent"
          {...(value !== undefined ? { value, onChange: (e: any) => onChange?.(e.target.value) } : {})}
        />
      </div>
      <button className="relative w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center">
        🔔
        <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-expiring rounded-full" />
      </button>
    </div>
  );
}
