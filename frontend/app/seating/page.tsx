'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import AddZoneModal from '@/components/AddZoneModal';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, formatPlan, memberNameOf } from '@/lib/format';

export default function SeatingPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF');
  const canAddZone = hasRole('TENANT_OWNER', 'BRANCH_MANAGER');

  const [zones, setZones] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [seat, setSeat] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [showAddZone, setShowAddZone] = useState(false);
  const [addingSeatsToZone, setAddingSeatsToZone] = useState<string | null>(null);
  const [addSeatsCount, setAddSeatsCount] = useState('5');
  const [assignMemberId, setAssignMemberId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refetchZones = () => {
    api.seatMap().then(setZones).catch(() => {});
  };

  useEffect(() => {
    refetchZones();
    api.members().then((res) => setMembers(res.members ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    setEditing(false);
    setAssignMemberId('');
    if (!selectedSeatId) {
      setSeat(null);
      return;
    }
    api.seatDetail(selectedSeatId).then(setSeat).catch(() => {});
  }, [selectedSeatId]);

  const color = (s: string) =>
    s === 'FREE' ? 'bg-free' : s === 'EXPIRING_SOON' ? 'bg-expiring' : 'bg-occupied';

  const allSeats = zones.flatMap((z: any) => z.seats ?? []);
  const seatCounts = {
    total: allSeats.length,
    free: allSeats.filter((s: any) => s.status === 'FREE').length,
    occupied: allSeats.filter((s: any) => s.status === 'OCCUPIED').length,
    expiringSoon: allSeats.filter((s: any) => s.status === 'EXPIRING_SOON').length,
  };

  const assign = async () => {
    if (!selectedSeatId || !assignMemberId) return;
    setError('');
    setBusy(true);
    try {
      await api.assignSeat(selectedSeatId, assignMemberId);
      if (paymentAmount && Number(paymentAmount) > 0) {
        await api.createPayment({
          memberId: assignMemberId,
          amount: Number(paymentAmount),
          method: paymentMethod,
          label: 'Seat Assignment',
          status: 'PAID',
        });
      }
      setSeat(await api.seatDetail(selectedSeatId));
      refetchZones();
      setAssignMemberId('');
      setPaymentAmount('');
      setPaymentMethod('UPI');
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'Could not assign seat');
    } finally {
      setBusy(false);
    }
  };

  const release = async () => {
    if (!selectedSeatId) return;
    setError('');
    setBusy(true);
    try {
      await api.releaseSeat(selectedSeatId);
      setSeat(await api.seatDetail(selectedSeatId));
      refetchZones();
    } catch (err: any) {
      setError(err.message || 'Could not release seat');
    } finally {
      setBusy(false);
    }
  };

  const deleteSeat = async () => {
    if (!selectedSeatId || !seat) return;
    if (!window.confirm(`Delete seat #${seat.seatNumber}? This can't be undone.`)) return;
    setError('');
    setBusy(true);
    try {
      await api.deleteSeat(selectedSeatId);
      setSelectedSeatId(null);
      setSeat(null);
      refetchZones();
    } catch (err: any) {
      setError(err.message || 'Could not delete seat');
    } finally {
      setBusy(false);
    }
  };

  const addSeats = async (zoneId: string) => {
    const count = Number(addSeatsCount);
    if (!count || count < 1) {
      setError('Enter a valid number of seats to add');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api.addSeatsToZone(zoneId, count);
      setAddingSeatsToZone(null);
      setAddSeatsCount('5');
      refetchZones();
    } catch (err: any) {
      setError(err.message || 'Could not add seats');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Seating Management</h1>
          <p className="text-sm text-gray-500">Click any seat for details</p>
        </div>
        <div className="flex items-center gap-3">
          <TopBar />
          {canAddZone && (
            <button
              onClick={() => setShowAddZone(true)}
              className="bg-sidebar text-white text-sm px-4 py-2 rounded-lg shrink-0"
            >
              + Add Zone
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs mb-4">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-free inline-block" /> Free ({seatCounts.free})</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-occupied inline-block" /> Occupied ({seatCounts.occupied})</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-expiring inline-block" /> Expiring Soon ({seatCounts.expiringSoon})</span>
        <span className="text-gray-400">· {seatCounts.total} total seats</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {zones.map((zone: any) => (
            <div key={zone.id} className="bg-card rounded-xl p-5 border border-black/5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs tracking-wide text-gray-500">
                  {zone.name?.toUpperCase()} · {zone.seats?.length ?? 0} SEATS
                </h2>
                {canAddZone && addingSeatsToZone !== zone.id && (
                  <button
                    onClick={() => setAddingSeatsToZone(zone.id)}
                    className="text-[11px] text-accent font-medium shrink-0"
                  >
                    + Add Seats
                  </button>
                )}
              </div>
              {addingSeatsToZone === zone.id && (
                <div className="flex items-center gap-2 mb-3 bg-accent/5 border border-accent/10 rounded-lg p-2">
                  <span className="text-[11px] text-gray-500 shrink-0">Add</span>
                  <input
                    type="number"
                    min="1"
                    value={addSeatsCount}
                    onChange={(e) => setAddSeatsCount(e.target.value)}
                    className="w-16 border border-black/10 rounded-lg px-2 py-1 text-xs"
                  />
                  <span className="text-[11px] text-gray-500 shrink-0">more seats to this zone</span>
                  <button
                    onClick={() => addSeats(zone.id)}
                    disabled={busy}
                    className="ml-auto text-[11px] bg-sidebar text-white px-3 py-1 rounded-lg disabled:opacity-60 shrink-0"
                  >
                    {busy ? 'Adding…' : 'Add'}
                  </button>
                  <button
                    onClick={() => setAddingSeatsToZone(null)}
                    className="text-[11px] text-gray-400 shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5">
                {zone.seats?.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSeatId(s.id)}
                    className={`aspect-square rounded text-[10px] font-medium text-white flex items-center justify-center transition-transform hover:scale-110 hover:brightness-110 ${color(s.status)} ${
                      selectedSeatId === s.id ? 'ring-2 ring-sidebar ring-offset-1' : ''
                    }`}
                  >
                    {s.seatNumber}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {zones.length === 0 && <p className="text-sm text-gray-400">No seating data yet.</p>}
        </div>

        <div className="bg-card rounded-xl p-5 border border-black/5 h-fit">
          {seat ? (
            <>
              <div className="text-[10px] text-accent tracking-wide mb-1">SELECTED</div>
              <h2 className="text-xl font-serif font-semibold mb-1">Seat {seat.seatNumber}</h2>
              <p className="text-xs text-gray-400 mb-4">
                {seat.status === 'FREE' ? 'Free' : seat.status === 'EXPIRING_SOON' ? 'Expiring Soon' : 'Occupied'}
                {seat.zone?.name ? ` — ${seat.zone.name}` : ''}
              </p>

              {seat.member ? (
                <div className="space-y-3 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Member</span>
                    <span className="font-medium">{memberNameOf(seat.member)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Plan</span>
                    <span className="font-medium">{formatPlan(seat.member.plan)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Batch</span>
                    <span className="font-medium">{seat.member.batch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expires</span>
                    <span className="font-medium">{formatDate(seat.member.expiresAt)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 mb-4">This seat is free.</p>
              )}

              {error && <p className="text-xs text-expiring mb-3">{error}</p>}

              {canManage && seat.status !== 'FREE' && !editing && (
                <>
                  <Link
                    href={`/members?highlight=${seat.memberId}`}
                    className="block w-full text-center bg-sidebar text-white text-sm py-2.5 rounded-lg font-medium mb-2"
                  >
                    View Member Profile
                  </Link>
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full border border-black/10 text-sm py-2.5 rounded-lg mb-2"
                  >
                    Edit / Reassign Seat
                  </button>
                  <button
                    onClick={release}
                    disabled={busy}
                    className="w-full border border-black/10 text-sm py-2.5 rounded-lg disabled:opacity-60"
                  >
                    {busy ? 'Releasing…' : 'Release Seat'}
                  </button>
                </>
              )}

              {canManage && seat.status !== 'FREE' && editing && (
                <div className="space-y-2">
                  <label className="block text-xs text-gray-500 mb-1">Reassign to</label>
                  <select
                    value={assignMemberId}
                    onChange={(e) => setAssignMemberId(e.target.value)}
                    className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select a member…</option>
                    {members.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        setEditing(false);
                        setAssignMemberId('');
                      }}
                      className="flex-1 border border-black/10 text-sm py-2.5 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={assign}
                      disabled={busy || !assignMemberId}
                      className="flex-1 bg-sidebar text-white text-sm py-2.5 rounded-lg font-medium disabled:opacity-60"
                    >
                      {busy ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              )}

              {canManage && seat.status === 'FREE' && (
                <div className="space-y-2">
                  <select
                    value={assignMemberId}
                    onChange={(e) => setAssignMemberId(e.target.value)}
                    className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select a member…</option>
                    {members.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>

                  <div className="pt-1">
                    <label className="block text-xs text-gray-500 mb-1">Payment (optional)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Amount ₹"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
                      />
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="UPI">UPI</option>
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={assign}
                    disabled={busy || !assignMemberId}
                    className="w-full bg-sidebar text-white text-sm py-2.5 rounded-lg font-medium disabled:opacity-60"
                  >
                    {busy
                      ? 'Assigning…'
                      : paymentAmount && Number(paymentAmount) > 0
                        ? 'Assign Seat & Record Payment'
                        : 'Assign Seat'}
                  </button>

                  {canAddZone && (
                    <button
                      onClick={deleteSeat}
                      disabled={busy}
                      className="w-full border border-expiring/30 text-expiring text-sm py-2.5 rounded-lg disabled:opacity-60"
                    >
                      {busy ? 'Deleting…' : 'Delete Seat'}
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">Select a seat to view details.</p>
          )}
        </div>
      </div>

      {showAddZone && (
        <AddZoneModal onClose={() => setShowAddZone(false)} onSuccess={refetchZones} />
      )}
    </div>
  );
}
