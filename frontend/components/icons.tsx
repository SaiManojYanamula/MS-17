type IconProps = { className?: string };

const base = 'w-[18px] h-[18px]';

export function MenuIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
    </svg>
  );
}

export function CloseIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function DashboardIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function InboxIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3.5 12h5l1.5 3h4l1.5-3h5" />
      <path d="M6 5.5h12l2 6.5v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6l2-6.5Z" />
    </svg>
  );
}

export function UsersIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M2.5 19c0-3 3-5 6.5-5s6.5 2 6.5 5" />
      <path d="M15.5 4.3a3 3 0 0 1 0 5.9" />
      <path d="M17.5 14.2c2.4.5 4 2.2 4 4.8" />
    </svg>
  );
}

export function SeatingIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3.5" y="3.5" width="17" height="11" rx="1.5" />
      <path d="M3.5 9.5h17" />
      <path d="M3.5 9.5v10M20.5 9.5v10" />
    </svg>
  );
}

export function PaymentsIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      <path d="M2.5 9.5h19" />
      <path d="M6 14.5h4" />
    </svg>
  );
}

export function ExpensesIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3.5 6.5h13a2 2 0 0 1 2 2v9h-15a2 2 0 0 1-2-2v-9Z" />
      <path d="M16.5 8.5h2a2 2 0 0 1 2 2v6.5h-4" />
      <path d="M7 6.5V5a1.5 1.5 0 0 1 1.5-1.5H14" />
      <circle cx="14.5" cy="12.5" r="1.7" />
    </svg>
  );
}

export function ReportsIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 20V10M11 20V4M18 20v-7" />
      <path d="M2.5 20h19" />
    </svg>
  );
}

export function SettingsIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4M17.8 17.8l-1.4-1.4M7.6 7.6 6.2 6.2" />
    </svg>
  );
}

export function BuildingIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4.5" y="3.5" width="10" height="17" rx="1" />
      <path d="M14.5 9.5h5v11h-5" />
      <path d="M7.5 7.5h1M11 7.5h1M7.5 11h1M11 11h1M7.5 14.5h1M11 14.5h1" />
    </svg>
  );
}

export function BranchIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 21.5s7-6.2 7-12A7 7 0 0 0 5 9.5c0 5.8 7 12 7 12Z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </svg>
  );
}

export function ShieldIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3.5 19 6v6c0 5-3 8-7 9.5-4-1.5-7-4.5-7-9.5V6l7-2.5Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function PlansIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <path d="M7 9h10M7 13h6M7 17h4" />
    </svg>
  );
}

export function BackupIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <ellipse cx="12" cy="6" rx="7" ry="2.5" />
      <path d="M5 6v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
      <path d="M5 12v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6" />
    </svg>
  );
}

export function LogoutIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 4.5H5.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H9" />
      <path d="M16 15.5 20.5 12 16 8.5" />
      <path d="M20.5 12H9" />
    </svg>
  );
}

export function SearchIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.3-4.3" />
    </svg>
  );
}

export function BellIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function CalendarIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3.5M16 3v3.5" />
      <path d="M7.5 13.2h1.5M11.2 13.2h1.5M15 13.2h1.5M7.5 16.7h1.5M11.2 16.7h1.5" />
    </svg>
  );
}

export function IdCardIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      <circle cx="8.5" cy="11" r="2.2" />
      <path d="M5.3 16.8c.6-1.6 1.9-2.4 3.2-2.4s2.6.8 3.2 2.4" />
      <path d="M14.5 9.5h4M14.5 13h4" />
    </svg>
  );
}

export function RequestIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 4.5h16v11H8.5L4 19.5v-4H4Z" />
      <path d="M8 9h8M8 12.2h5" />
    </svg>
  );
}
