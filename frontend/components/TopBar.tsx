'use client';

import { useEffect, useRef, useState } from 'react';
import { SearchIcon, BellIcon } from './icons';

export default function TopBar({
  placeholder = 'Search applicant, member...',
  value,
  onChange,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          className="bg-white border border-gray-200 rounded-full text-sm pl-9 pr-4 py-2 w-64 focus:outline-none focus:ring-1 focus:ring-accent"
          {...(value !== undefined ? { value, onChange: (e: any) => onChange?.(e.target.value) } : {})}
        />
      </div>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setShowNotifications((v) => !v)}
          className="relative w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900"
        >
          <BellIcon />
          <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-expiring rounded-full" />
        </button>
        {showNotifications && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-black/10 shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-black/5 text-sm font-medium">Notifications</div>
            <p className="px-4 py-6 text-sm text-gray-400 text-center">No new notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}
