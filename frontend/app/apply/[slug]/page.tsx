'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { api, API_ORIGIN } from '@/lib/api';

type TenantInfo = {
  name: string;
  upiId: string | null;
  upiPhone: string | null;
  coverImageUrl: string | null;
  branches: { id: string; name: string }[];
};
type Seat = { id: string; seatNumber: number; zoneId: string };
type Step = 'loading' | 'form' | 'payment' | 'done' | 'error';

// Defined at module scope (not inside ApplyPage) so its identity stays
// stable across re-renders — nesting it inside the component would give
// React a brand-new component type on every keystroke, forcing it to
// unmount/remount the whole subtree and killing input focus (and silently
// resetting the file input's selection).
function Shell({
  children,
  wide,
  coverImageUrl,
}: {
  children: React.ReactNode;
  wide?: boolean;
  coverImageUrl?: string | null;
}) {
  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center bg-sidebar bg-cover bg-center px-4 py-10"
      style={coverImageUrl ? { backgroundImage: `url(${API_ORIGIN}${coverImageUrl})` } : undefined}
    >
      {coverImageUrl ? (
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" aria-hidden />
      ) : (
        <>
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" aria-hidden />
          <div className="absolute bottom-0 -right-24 w-[26rem] h-[26rem] rounded-full bg-accent/40 blur-3xl" aria-hidden />
        </>
      )}
      <div
        className={`relative z-10 bg-card rounded-2xl p-8 w-full border border-black/5 shadow-card ${wide ? 'max-w-lg' : 'max-w-sm'}`}
      >
        {children}
      </div>
    </div>
  );
}

export default function ApplyPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [step, setStep] = useState<Step>('loading');
  const [loadError, setLoadError] = useState('');

  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [branchId, setBranchId] = useState('');
  const [seats, setSeats] = useState<Seat[]>([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [seatId, setSeatId] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [goalTag, setGoalTag] = useState('');
  const [plan, setPlan] = useState('MONTHLY');
  const [batch, setBatch] = useState('Morning');
  const [aadharCard, setAadharCard] = useState<File | null>(null);

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookedSeatNumber, setBookedSeatNumber] = useState<number | null>(null);

  useEffect(() => {
    api
      .publicTenant(slug)
      .then((t: TenantInfo) => {
        setTenant(t);
        if (t.branches.length > 0) setBranchId(t.branches[0].id);
        setStep('form');
      })
      .catch((err: any) => {
        setLoadError(err.message || 'Study hall not found');
        setStep('error');
      });
  }, [slug]);

  useEffect(() => {
    if (!branchId) return;
    setSeatsLoading(true);
    setSeatId('');
    api
      .publicSeats(slug, branchId)
      .then(setSeats)
      .catch(() => setSeats([]))
      .finally(() => setSeatsLoading(false));
  }, [branchId, slug]);

  useEffect(() => {
    if (step !== 'payment' || !tenant?.upiId) return;
    const amt = Number(amount) || 0;
    const upiUrl = `upi://pay?pa=${encodeURIComponent(tenant.upiId)}&pn=${encodeURIComponent(tenant.name)}&am=${amt}&cu=INR&tn=${encodeURIComponent(`${plan} - ${name}`)}`;
    QRCode.toDataURL(upiUrl, { margin: 1, width: 176 }).then(setQrDataUrl).catch(() => {});
  }, [step, tenant, amount, plan, name]);

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seatId) {
      setError('Please pick a seat');
      return;
    }
    if (!aadharCard) {
      setError('Please upload a photo or PDF of your Aadhar card');
      return;
    }
    setError('');
    setStep('payment');
  };

  const requiresScreenshot = method === 'UPI' && Number(amount) > 0 && !!tenant?.upiId;

  const confirmAndBook = async () => {
    if (!aadharCard) return;
    if (requiresScreenshot && !paymentScreenshot) {
      setError('Please upload a screenshot of your payment');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await api.publicBook({
        slug,
        branchId,
        seatId,
        name,
        phone,
        goalTag: goalTag || undefined,
        plan,
        batch,
        amount: amount ? Number(amount) : undefined,
        method,
        aadharCard,
        paymentScreenshot: paymentScreenshot || undefined,
      });
      setBookedSeatNumber(res.seatNumber ?? null);
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Could not complete booking');
      // Seat may have just been taken by someone else — refresh the list.
      if (err.message?.includes('taken')) {
        setStep('form');
        api.publicSeats(slug, branchId).then(setSeats).catch(() => {});
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'loading') {
    return <Shell><p className="text-sm text-gray-400 text-center">Loading…</p></Shell>;
  }

  if (step === 'error') {
    return (
      <Shell>
        <h1 className="text-xl font-serif font-semibold mb-2">Not Found</h1>
        <p className="text-sm text-gray-500">{loadError}</p>
      </Shell>
    );
  }

  if (step === 'done') {
    return (
      <Shell coverImageUrl={tenant?.coverImageUrl}>
        <div className="text-center">
          <h1 className="text-xl font-serif font-semibold mb-2">Welcome to {tenant?.name}!</h1>
          <p className="text-sm text-gray-500">
            {bookedSeatNumber ? `Seat #${bookedSeatNumber} is confirmed for you.` : 'Your seat is confirmed.'}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            You can log in anytime with your phone number ({phone}) to view your membership.
          </p>
        </div>
      </Shell>
    );
  }

  if (step === 'payment') {
    return (
      <Shell coverImageUrl={tenant?.coverImageUrl}>
        <h1 className="text-xl font-serif font-semibold mb-1">Welcome to {tenant?.name}</h1>
        <p className="text-sm text-gray-500 mb-6">Pay to confirm your seat</p>

        <label className="block text-xs text-gray-500 mb-1">Amount</label>
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm mb-3"
        />
        <label className="block text-xs text-gray-500 mb-1">Payment Method</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm mb-4"
        >
          <option value="UPI">UPI</option>
          <option value="CASH">Cash</option>
          <option value="CARD">Card</option>
        </select>

        {tenant?.upiId && (
          <div className="flex flex-col items-center gap-2 mb-4 border border-black/10 rounded-lg p-4">
            {qrDataUrl && <img src={qrDataUrl} alt="UPI payment QR" className="rounded-lg" />}
            <p className="text-xs text-gray-500">Scan to pay via UPI/GPay/PhonePe</p>
            <p className="text-sm font-medium">{tenant.upiId}</p>
            {tenant.upiPhone && <p className="text-xs text-gray-400">Or GPay to {tenant.upiPhone}</p>}
          </div>
        )}
        {!tenant?.upiId && (
          <p className="text-xs text-gray-400 mb-4">Please pay the admin directly, then confirm below.</p>
        )}

        {method === 'UPI' && tenant?.upiId && (
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">
              Payment Screenshot{requiresScreenshot ? '' : ' (optional)'}
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => setPaymentScreenshot(e.target.files?.[0] ?? null)}
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-accent/10 file:text-accent file:rounded-md file:px-3 file:py-1.5 file:text-xs"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              After paying, take a screenshot of the confirmation and upload it here.
            </p>
          </div>
        )}

        {error && <p className="text-xs text-expiring mb-3">{error}</p>}
        <button
          onClick={confirmAndBook}
          disabled={submitting}
          className="w-full bg-sidebar text-white text-sm py-2.5 rounded-lg font-medium disabled:opacity-60"
        >
          {submitting ? 'Confirming…' : "I've Paid — Confirm My Seat"}
        </button>
        <button type="button" onClick={() => setStep('form')} className="w-full text-xs text-gray-400 mt-2">
          ← Back
        </button>
      </Shell>
    );
  }

  // step === 'form' — branch picker + live seat grid + details, all on one page.
  return (
    <Shell wide coverImageUrl={tenant?.coverImageUrl}>
      <h1 className="text-xl font-serif font-semibold mb-1">Welcome to {tenant?.name}</h1>
      <p className="text-sm text-gray-500 mb-5">Pick a branch, pick your seat, and fill in your details</p>

      <form onSubmit={submitForm} className="space-y-4">
        {tenant && tenant.branches.length > 1 && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Branch</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            >
              {tenant.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs text-gray-500 mb-1">Pick your seat</label>
          {seatsLoading ? (
            <p className="text-sm text-gray-400">Loading seats…</p>
          ) : seats.length === 0 ? (
            <p className="text-sm text-gray-400">No seats available right now — please check back later.</p>
          ) : (
            <div className="grid grid-cols-8 gap-2">
              {seats.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeatId(s.id)}
                  className={`aspect-square rounded-lg border text-xs font-medium transition-all ${
                    seatId === s.id
                      ? 'bg-accent text-white border-accent shadow-soft scale-105'
                      : 'bg-free/10 border-free/40 hover:bg-free/20 hover:border-free hover:scale-105'
                  }`}
                >
                  {s.seatNumber}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Your Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              pattern="[6-9]\d{9}"
              title="Enter a valid 10-digit Indian phone number"
              required
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <p className="text-[11px] text-gray-400 -mt-3">Phone becomes your login to check your membership later.</p>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Goal (optional)</label>
          <input
            value={goalTag}
            onChange={(e) => setGoalTag(e.target.value)}
            placeholder="e.g. UPSC Aspirant"
            className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="DAILY_PASS">Daily Pass</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Batch</label>
            <select
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            >
              <option value="Morning">Morning</option>
              <option value="Day">Day</option>
              <option value="Evening">Evening</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Aadhar Card (photo or PDF)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => setAadharCard(e.target.files?.[0] ?? null)}
            required
            className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-navy/5 file:text-navy file:rounded-md file:px-3 file:py-1.5 file:text-xs"
          />
        </div>
        {error && <p className="text-xs text-expiring">{error}</p>}
        <button type="submit" className="w-full bg-sidebar text-white text-sm py-2.5 rounded-lg font-medium">
          Continue to Payment
        </button>
      </form>
    </Shell>
  );
}
