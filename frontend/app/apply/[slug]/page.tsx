'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function ApplyPage({ params }: { params: { slug: string } }) {
  const [applicant, setApplicant] = useState('');
  const [goalTag, setGoalTag] = useState('');
  const [plan, setPlan] = useState('MONTHLY');
  const [batch, setBatch] = useState('Morning');
  const [aadharCard, setAadharCard] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!aadharCard) {
      setError('Please upload a photo or PDF of your Aadhar card');
      return;
    }
    setSubmitting(true);
    try {
      await api.publicApply(params.slug, {
        applicant,
        goalTag: goalTag || undefined,
        plan,
        batch,
        aadharCard,
      });
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Could not submit your application');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sidebar px-4">
        <div className="bg-card rounded-xl p-8 w-full max-w-sm border border-black/5 text-center">
          <h1 className="text-xl font-serif font-semibold mb-2">Application Submitted</h1>
          <p className="text-sm text-gray-500">
            Thanks, {applicant}! Your application has been sent — the admin will review it and get in touch.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar px-4">
      <div className="bg-card rounded-xl p-8 w-full max-w-sm border border-black/5">
        <h1 className="text-xl font-serif font-semibold mb-1">Apply for a Seat</h1>
        <p className="text-sm text-gray-500 mb-6">Fill in your details and we'll get back to you</p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Your Name</label>
            <input
              value={applicant}
              onChange={(e) => setApplicant(e.target.value)}
              required
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
          </div>
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
            <p className="text-[11px] text-gray-400 mt-1">Used to verify your identity before your seat is confirmed.</p>
          </div>
          {error && <p className="text-xs text-expiring">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-sidebar text-white text-sm py-2.5 rounded-lg font-medium disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
