'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import TopBar from '@/components/TopBar';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function SettingsPage() {
  const { user, hasRole } = useAuth();
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchId, setBranchId] = useState<string | null>(null);
  const [notifyExpiry, setNotifyExpiry] = useState(true);
  const [notifyPayments, setNotifyPayments] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    api
      .myTenant()
      .then((res) => {
        if (res.tenant?.name) setTenantName(res.tenant.name);
        if (res.tenant?.slug) setTenantSlug(res.tenant.slug);
        if (res.branch?.name) setBranchName(res.branch.name);
        if (res.branch?.id) setBranchId(res.branch.id);
      })
      .catch(() => {});
  }, []);

  const applyUrl = tenantSlug && typeof window !== 'undefined'
    ? `${window.location.origin}/apply/${tenantSlug}`
    : '';

  useEffect(() => {
    if (!applyUrl) return;
    QRCode.toDataURL(applyUrl, { margin: 1, width: 176 }).then(setQrDataUrl).catch(() => {});
  }, [applyUrl]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(applyUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSaved(false);
    setSavingProfile(true);
    try {
      await Promise.all([
        api.updateTenant(tenantName),
        branchId ? api.updateBranch(branchId, { name: branchName }) : Promise.resolve(),
      ]);
      setProfileSaved(true);
    } catch (err: any) {
      setProfileError(err.message || 'Could not save changes');
    } finally {
      setSavingProfile(false);
    }
  };

  const [staff, setStaff] = useState<{ name: string; role: string }[]>(
    user ? [{ name: user.name, role: user.role }] : [],
  );
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState('STAFF');
  const [inviteError, setInviteError] = useState('');
  const [inviting, setInviting] = useState(false);

  if (!hasRole('TENANT_OWNER')) {
    return (
      <div>
        <h1 className="text-2xl font-serif font-semibold mb-2">Settings</h1>
        <p className="text-sm text-gray-500">Only the tenant owner can manage settings.</p>
      </div>
    );
  }

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviting(true);
    try {
      await api.inviteStaff({ name: inviteName, email: inviteEmail, password: invitePassword, role: inviteRole });
      setStaff((prev) => [...prev, { name: inviteName, role: inviteRole }]);
      setInviteName('');
      setInviteEmail('');
      setInvitePassword('');
      setInviteRole('STAFF');
      setShowInvite(false);
    } catch (err: any) {
      setInviteError(err.message || 'Could not invite staff member');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Settings</h1>
          <p className="text-sm text-gray-500">Tenant, branch, and account preferences</p>
        </div>
        <TopBar />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-5 border border-black/5">
          <h2 className="font-serif font-semibold mb-4">Tenant / Branch Profile</h2>
          <form onSubmit={saveProfile}>
            <label className="block text-xs text-gray-500 mb-1">Study Hall Name</label>
            <input
              value={tenantName}
              onChange={(e) => {
                setTenantName(e.target.value);
                setProfileSaved(false);
              }}
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm mb-4"
            />
            <label className="block text-xs text-gray-500 mb-1">Branch Name</label>
            <input
              value={branchName}
              onChange={(e) => {
                setBranchName(e.target.value);
                setProfileSaved(false);
              }}
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm mb-4"
            />
            {profileError && <p className="text-xs text-expiring mb-3">{profileError}</p>}
            {profileSaved && <p className="text-xs text-free mb-3">Saved.</p>}
            <button
              type="submit"
              disabled={savingProfile}
              className="bg-sidebar text-white text-sm px-4 py-2 rounded-lg disabled:opacity-60"
            >
              {savingProfile ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="bg-card rounded-xl p-5 border border-black/5">
          <h2 className="font-serif font-semibold mb-1">Application QR Code</h2>
          <p className="text-xs text-gray-500 mb-4">
            Print this or show it on a screen — anyone who scans it gets a form to apply for a
            seat, no login needed. Submissions land in Applications as Pending.
          </p>
          {qrDataUrl ? (
            <div className="flex flex-col items-center gap-3">
              <div className="text-[11px] font-medium text-navy bg-navy/5 border border-navy/10 rounded-full px-3 py-1">
                📷 Scan with a phone camera to open the "Apply for a Seat" form
              </div>
              <img src={qrDataUrl} alt="Application QR code" className="rounded-lg border border-black/10" />
              <p className="text-xs text-gray-400 -mt-1">This code just links to the page below ↓</p>
              <div className="flex items-center gap-2 w-full">
                <input
                  readOnly
                  value={applyUrl}
                  className="flex-1 border border-black/10 rounded-lg px-3 py-2 text-xs text-gray-500"
                />
                <button
                  onClick={copyLink}
                  className="border border-black/10 text-xs px-3 py-2 rounded-lg shrink-0"
                >
                  {linkCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Loading QR code…</p>
          )}
        </div>

        <div className="bg-card rounded-xl p-5 border border-black/5">
          <h2 className="font-serif font-semibold mb-4">Admin &amp; Staff Accounts</h2>
          <div className="space-y-3 text-sm">
            {staff.map((s, i) => (
              <div key={i} className="flex items-center justify-between border-b border-black/5 pb-2">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-400">{s.role.replace('_', ' ')}</div>
                </div>
              </div>
            ))}
          </div>

          {showInvite ? (
            <form onSubmit={invite} className="mt-4 space-y-2">
              <input
                placeholder="Name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Temporary password"
                type="password"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                required
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
              >
                <option value="STAFF">Staff</option>
                <option value="BRANCH_MANAGER">Branch Manager</option>
              </select>
              {inviteError && <p className="text-xs text-expiring">{inviteError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="flex-1 border border-black/10 text-sm py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 bg-sidebar text-white text-sm py-2 rounded-lg disabled:opacity-60"
                >
                  {inviting ? 'Inviting…' : 'Invite'}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowInvite(true)}
              className="mt-4 border border-black/10 text-sm px-4 py-2 rounded-lg"
            >
              + Invite Staff Member
            </button>
          )}
        </div>

        <div className="bg-card rounded-xl p-5 border border-black/5 lg:col-span-2">
          <h2 className="font-serif font-semibold mb-4">Notification Preferences</h2>
          <div className="space-y-3 text-sm">
            <label className="flex items-center justify-between">
              <span>Membership expiry reminders</span>
              <input
                type="checkbox"
                checked={notifyExpiry}
                onChange={(e) => setNotifyExpiry(e.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between">
              <span>Payment received/refunded alerts</span>
              <input
                type="checkbox"
                checked={notifyPayments}
                onChange={(e) => setNotifyPayments(e.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between">
              <span>
                WhatsApp notifications
                <span className="block text-[11px] text-gray-400">Sends expiry & payment alerts via WhatsApp</span>
              </span>
              <input
                type="checkbox"
                checked={notifyWhatsapp}
                onChange={(e) => setNotifyWhatsapp(e.target.checked)}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
