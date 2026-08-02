'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import TopBar from '@/components/TopBar';
import PasswordInput from '@/components/PasswordInput';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function SettingsPage() {
  const { user, hasRole } = useAuth();
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiPhone, setUpiPhone] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverError, setCoverError] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchId, setBranchId] = useState<string | null>(null);
  const [notifyExpiry, setNotifyExpiry] = useState(true);
  const [notifyPayments, setNotifyPayments] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [whatsappAccessEnabled, setWhatsappAccessEnabled] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const [allBranches, setAllBranches] = useState<{ id: string; name: string }[]>([]);
  const [newBranchName, setNewBranchName] = useState('');
  const [addingBranch, setAddingBranch] = useState(false);
  const [branchError, setBranchError] = useState('');

  const refetchBranches = () => api.myBranches().then(setAllBranches).catch(() => {});

  useEffect(() => {
    api
      .myTenant()
      .then((res) => {
        if (res.tenant?.name) setTenantName(res.tenant.name);
        if (res.tenant?.slug) setTenantSlug(res.tenant.slug);
        if (res.tenant?.upiId) setUpiId(res.tenant.upiId);
        if (res.tenant?.upiPhone) setUpiPhone(res.tenant.upiPhone);
        if (res.tenant?.coverImageUrl) setCoverImageUrl(res.tenant.coverImageUrl);
        if (res.tenant?.notifyExpiry !== undefined) setNotifyExpiry(res.tenant.notifyExpiry);
        if (res.tenant?.notifyPayments !== undefined) setNotifyPayments(res.tenant.notifyPayments);
        if (res.tenant?.notifyWhatsapp !== undefined) setNotifyWhatsapp(res.tenant.notifyWhatsapp);
        if (res.tenant?.whatsappAccessEnabled !== undefined) setWhatsappAccessEnabled(res.tenant.whatsappAccessEnabled);
        if (res.branch?.name) setBranchName(res.branch.name);
        if (res.branch?.id) setBranchId(res.branch.id);
      })
      .catch(() => {});
    refetchBranches();
  }, []);

  const addBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBranchError('');
    setAddingBranch(true);
    try {
      await api.addBranch({ name: newBranchName });
      setNewBranchName('');
      refetchBranches();
    } catch (err: any) {
      setBranchError(err.message || 'Could not add branch');
    } finally {
      setAddingBranch(false);
    }
  };

  const uploadCover = async (file: File) => {
    setCoverError('');
    setUploadingCover(true);
    try {
      const res = await api.uploadTenantCover(file);
      if (res.coverImageUrl) setCoverImageUrl(res.coverImageUrl);
    } catch (err: any) {
      setCoverError(err.message || 'Could not upload image');
    } finally {
      setUploadingCover(false);
    }
  };

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
        api.updateTenant({ name: tenantName, upiId: upiId || undefined, upiPhone: upiPhone || undefined }),
        branchId ? api.updateBranch(branchId, { name: branchName }) : Promise.resolve(),
      ]);
      setProfileSaved(true);
    } catch (err: any) {
      setProfileError(err.message || 'Could not save changes');
    } finally {
      setSavingProfile(false);
    }
  };

  const [staff, setStaff] = useState<
    { id: string; name: string; email: string; role: string; isActive: boolean }[]
  >([]);
  const refetchUsers = () => api.myUsers().then(setStaff).catch(() => {});
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState('STAFF');
  const [inviteBranchIds, setInviteBranchIds] = useState<string[]>([]);
  const [inviteError, setInviteError] = useState('');
  const [inviting, setInviting] = useState(false);

  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);

  const toggleInviteBranch = (id: string) => {
    setInviteBranchIds((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  };

  useEffect(() => {
    refetchUsers();
  }, []);

  const submitResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUserId) return;
    setResetError('');
    setResetting(true);
    try {
      await api.resetUserPassword(resettingUserId, resetPasswordValue);
      setResettingUserId(null);
      setResetPasswordValue('');
    } catch (err: any) {
      setResetError(err.message || 'Could not reset password');
    } finally {
      setResetting(false);
    }
  };

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
      await api.inviteStaff({
        name: inviteName,
        email: inviteEmail,
        password: invitePassword,
        role: inviteRole,
        branchIds: inviteBranchIds.length ? inviteBranchIds : undefined,
      });
      refetchUsers();
      setInviteName('');
      setInviteEmail('');
      setInvitePassword('');
      setInviteRole('STAFF');
      setInviteBranchIds([]);
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
            <label className="block text-xs text-gray-500 mb-1">UPI ID (for student self-booking payments)</label>
            <input
              value={upiId}
              onChange={(e) => {
                setUpiId(e.target.value);
                setProfileSaved(false);
              }}
              placeholder="yourname@okhdfcbank"
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm mb-4"
            />
            <label className="block text-xs text-gray-500 mb-1">GPay / PhonePe Number (optional)</label>
            <input
              value={upiPhone}
              onChange={(e) => {
                setUpiPhone(e.target.value);
                setProfileSaved(false);
              }}
              placeholder="9876543210"
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm mb-4"
            />

            <label className="block text-xs text-gray-500 mb-1">
              Booking Page Background Image (optional)
            </label>
            <p className="text-[11px] text-gray-400 mb-2">
              Shown behind your QR/booking page instead of the plain color — a photo of your
              study hall works well.
            </p>
            {coverImageUrl && (
              <img
                src={coverImageUrl}
                alt="Booking page background"
                className="w-full h-28 object-cover rounded-lg mb-2 border border-black/10"
              />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploadingCover}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadCover(file);
              }}
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm mb-1 file:mr-3 file:border-0 file:bg-navy/5 file:text-navy file:rounded-md file:px-3 file:py-1.5 file:text-xs"
            />
            {uploadingCover && <p className="text-xs text-gray-400 mb-3">Uploading…</p>}
            {coverError && <p className="text-xs text-expiring mb-3">{coverError}</p>}

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
          <h2 className="font-serif font-semibold mb-1">Seat Booking QR Code</h2>
          <p className="text-xs text-gray-500 mb-4">
            Print this or show it on a screen — anyone who scans it can pick a branch, see live
            available seats, and book one instantly by paying via your UPI QR. No login needed,
            and no approval step — they become a member the moment they pay.
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
            {staff.map((s) => (
              <div key={s.id} className="border-b border-black/5 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {s.name} {s.id === user?.id && <span className="text-gray-400">(you)</span>}
                    </div>
                    <div className="text-xs text-gray-400">
                      {s.email} · {s.role.replace('_', ' ')}
                    </div>
                  </div>
                  {s.id !== user?.id && (
                    <button
                      onClick={() => {
                        setResettingUserId(resettingUserId === s.id ? null : s.id);
                        setResetPasswordValue('');
                        setResetError('');
                      }}
                      className="text-xs text-accent font-medium shrink-0"
                    >
                      Reset Password
                    </button>
                  )}
                </div>
                {resettingUserId === s.id && (
                  <form onSubmit={submitResetPassword} className="flex gap-2 mt-2">
                    <PasswordInput
                      placeholder="New password (min 6 chars)"
                      value={resetPasswordValue}
                      onChange={(e) => setResetPasswordValue(e.target.value)}
                      required
                      minLength={6}
                      className="flex-1 border border-black/10 rounded-lg px-3 py-1.5 text-xs"
                    />
                    <button
                      type="submit"
                      disabled={resetting}
                      className="bg-sidebar text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-60 shrink-0"
                    >
                      {resetting ? 'Saving…' : 'Save'}
                    </button>
                  </form>
                )}
                {resettingUserId === s.id && resetError && (
                  <p className="text-xs text-expiring mt-1">{resetError}</p>
                )}
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
              <PasswordInput
                placeholder="Temporary password (min 6 characters)"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                required
                minLength={6}
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
              {allBranches.length > 1 && (
                <div className="border border-black/10 rounded-lg p-2">
                  <div className="text-xs text-gray-500 mb-1">
                    Branches this account can access (defaults to your primary branch if none picked)
                  </div>
                  {allBranches.map((b) => (
                    <label key={b.id} className="flex items-center gap-2 text-sm py-0.5">
                      <input
                        type="checkbox"
                        checked={inviteBranchIds.includes(b.id)}
                        onChange={() => toggleInviteBranch(b.id)}
                      />
                      {b.name}
                    </label>
                  ))}
                </div>
              )}
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

        <div className="bg-card rounded-xl p-5 border border-black/5">
          <h2 className="font-serif font-semibold mb-1">Branches</h2>
          <p className="text-xs text-gray-500 mb-4">
            Running more than one location? Add each branch here — you can see and manage all of
            them from the branch switcher in the sidebar.
          </p>
          <div className="space-y-2 text-sm mb-4">
            {allBranches.map((b) => (
              <div key={b.id} className="border-b border-black/5 pb-2">
                {b.name}
              </div>
            ))}
          </div>
          <form onSubmit={addBranch} className="flex gap-2">
            <input
              placeholder="New branch name"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              required
              className="flex-1 border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={addingBranch}
              className="bg-sidebar text-white text-sm px-4 py-2 rounded-lg disabled:opacity-60 shrink-0"
            >
              {addingBranch ? 'Adding…' : '+ Add Branch'}
            </button>
          </form>
          {branchError && <p className="text-xs text-expiring mt-2">{branchError}</p>}
        </div>

        <div className="bg-card rounded-xl p-5 border border-black/5 lg:col-span-2">
          <h2 className="font-serif font-semibold mb-4">Notification Preferences</h2>
          <div className="space-y-3 text-sm">
            <label className="flex items-center justify-between">
              <span>Membership expiry reminders</span>
              <input
                type="checkbox"
                checked={notifyExpiry}
                onChange={(e) => {
                  setNotifyExpiry(e.target.checked);
                  api.updateTenant({ notifyExpiry: e.target.checked }).catch(() => {});
                }}
              />
            </label>
            <label className="flex items-center justify-between">
              <span>Payment received/refunded alerts</span>
              <input
                type="checkbox"
                checked={notifyPayments}
                onChange={(e) => {
                  setNotifyPayments(e.target.checked);
                  api.updateTenant({ notifyPayments: e.target.checked }).catch(() => {});
                }}
              />
            </label>
            <label className="flex items-center justify-between">
              <span>
                WhatsApp notifications
                <span className="block text-[11px] text-gray-400">
                  {whatsappAccessEnabled
                    ? 'Sends expiry & payment alerts via WhatsApp'
                    : 'Not enabled for your organization yet — contact the platform admin'}
                </span>
              </span>
              <input
                type="checkbox"
                checked={notifyWhatsapp}
                disabled={!whatsappAccessEnabled}
                onChange={(e) => {
                  setNotifyWhatsapp(e.target.checked);
                  api.updateTenant({ notifyWhatsapp: e.target.checked }).catch(() => {});
                }}
                className="disabled:opacity-40"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
