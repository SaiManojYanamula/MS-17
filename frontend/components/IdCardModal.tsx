'use client';

import { formatDate, formatPlan, seatNumberOf } from '@/lib/format';

export default function IdCardModal({ member, onClose }: { member: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 print:bg-white">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-black/5 print:border-0 print:shadow-none">
        <div id="id-card" className="border-2 border-accent/30 rounded-xl p-5 bg-gradient-to-br from-accent/5 to-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-accent" />
            <div>
              <div className="font-serif font-semibold leading-tight">Akshara</div>
              <div className="text-[10px] text-gray-400 tracking-wide">STUDENT ID CARD</div>
            </div>
          </div>
          <div className="w-16 h-16 rounded-full bg-accent/15 text-accent flex items-center justify-center text-lg font-semibold mb-3">
            {member.name?.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="text-lg font-serif font-semibold">{member.name}</div>
          <div className="text-xs text-gray-400 mb-3">{member.displayId || '—'}</div>
          <div className="space-y-1.5 text-sm border-t border-black/5 pt-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Plan</span>
              <span className="font-medium">{formatPlan(member.plan)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Batch</span>
              <span className="font-medium">{member.batch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Seat</span>
              <span className="font-medium">#{seatNumberOf(member.seat)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Valid Until</span>
              <span className="font-medium">{formatDate(member.expiresAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-4 print:hidden">
          <button onClick={onClose} className="flex-1 border border-black/10 text-sm py-2 rounded-lg">
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-sidebar text-white text-sm py-2 rounded-lg"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
