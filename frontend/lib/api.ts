const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

// The branch a multi-branch user is currently "switched into" — sent as a
// header so the backend can act on a branch other than the one baked into
// their JWT (see tenant.middleware.ts). Owners can switch to any branch in
// their org; managers/staff only to branches they were explicitly granted.
export function getActiveBranchId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('activeBranchId');
}

export function setActiveBranchId(branchId: string) {
  localStorage.setItem('activeBranchId', branchId);
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const activeBranchId = getActiveBranchId();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(activeBranchId ? { 'x-branch-id': activeBranchId } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  forgotPassword: (email: string) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  dashboardStats: () => request('/reports/dashboard'),
  recentActivity: (limit = 5) => request(`/reports/recent-activity?limit=${limit}`),
  revenueTrend: (months = 6) => request(`/reports/revenue-trend?months=${months}`),
  occupancyTrend: (weeks = 8) => request(`/reports/occupancy-trend?weeks=${weeks}`),
  planDistribution: () => request('/reports/plan-distribution'),
  keyNumbers: () => request('/reports/key-numbers'),
  newMembersThisWeek: (days = 7) => request(`/reports/new-members?days=${days}`),
  membersJoinedInRange: (from: string, to: string) => request(`/reports/members-joined?from=${from}&to=${to}`),

  applications: (status?: string) =>
    request(`/applications${status ? `?status=${status}` : ''}`),
  approveApplication: (id: string) => request(`/applications/${id}/approve`, { method: 'PATCH' }),
  rejectApplication: (id: string) => request(`/applications/${id}/reject`, { method: 'PATCH' }),
  createApplication: (data: { applicant: string; goalTag?: string; plan: string; batch: string }) =>
    request('/applications', { method: 'POST', body: JSON.stringify(data) }),
  publicApply: (
    slug: string,
    data: { applicant: string; goalTag?: string; plan: string; batch: string; aadharCard: File },
  ) => {
    const formData = new FormData();
    formData.append('applicant', data.applicant);
    if (data.goalTag) formData.append('goalTag', data.goalTag);
    formData.append('plan', data.plan);
    formData.append('batch', data.batch);
    formData.append('aadharCard', data.aadharCard);
    return request(`/public/apply/${slug}`, { method: 'POST', body: formData });
  },

  // Self-service QR booking flow — welcome page, branch picker, live seats, book+pay.
  publicTenant: (slug: string) => request(`/public/tenant/${slug}`),
  publicSeats: (slug: string, branchId: string) => request(`/public/seats/${slug}/${branchId}`),
  publicBook: (data: {
    slug: string;
    branchId: string;
    seatId: string;
    name: string;
    phone: string;
    goalTag?: string;
    plan: string;
    batch: string;
    amount?: number;
    method?: string;
    aadharCard: File;
    paymentScreenshot?: File;
  }) => {
    const formData = new FormData();
    formData.append('slug', data.slug);
    formData.append('branchId', data.branchId);
    formData.append('seatId', data.seatId);
    formData.append('name', data.name);
    formData.append('phone', data.phone);
    if (data.goalTag) formData.append('goalTag', data.goalTag);
    formData.append('plan', data.plan);
    formData.append('batch', data.batch);
    if (data.amount) formData.append('amount', String(data.amount));
    if (data.method) formData.append('method', data.method);
    formData.append('aadharCard', data.aadharCard);
    if (data.paymentScreenshot) formData.append('paymentScreenshot', data.paymentScreenshot);
    return request('/public/book', { method: 'POST', body: formData });
  },

  members: (filter?: string, search?: string) => {
    const params = new URLSearchParams();
    if (filter) params.set('filter', filter);
    if (search) params.set('search', search);
    return request(`/members?${params.toString()}`);
  },
  createMember: (data: {
    name: string;
    phone: string;
    goalTag?: string;
    plan: string;
    batch: string;
    joinedAt: string;
  }) => request('/members', { method: 'POST', body: JSON.stringify(data) }),
  updateMember: (id: string, data: Partial<{
    name: string;
    phone: string;
    goalTag?: string;
    plan: string;
    batch: string;
    expiresAt: string;
  }>) => request(`/members/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteMember: (id: string) => request(`/members/${id}`, { method: 'DELETE' }),
  renewMember: (id: string, amount: number, method: string) =>
    request(`/members/${id}/renew`, { method: 'PATCH', body: JSON.stringify({ amount, method }) }),
  importMembers: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/members/import', { method: 'POST', body: formData });
  },
  myMember: () => request('/members/me'),
  resetMemberPassword: (id: string, password: string) =>
    request(`/members/${id}/reset-password`, { method: 'PATCH', body: JSON.stringify({ password }) }),

  seatMap: (branchId?: string) => request(`/seating${branchId ? `?branchId=${branchId}` : ''}`),
  seatDetail: (seatId: string) => request(`/seating/${seatId}`),
  assignSeat: (seatId: string, memberId: string) =>
    request(`/seating/${seatId}/assign`, { method: 'PATCH', body: JSON.stringify({ memberId }) }),
  releaseSeat: (seatId: string) => request(`/seating/${seatId}/release`, { method: 'PATCH' }),
  deleteSeat: (seatId: string) => request(`/seating/${seatId}`, { method: 'DELETE' }),
  createZone: (data: { name: string; startSeat: number; endSeat: number }) =>
    request('/seating/zones', { method: 'POST', body: JSON.stringify(data) }),
  addSeatsToZone: (zoneId: string, count: number) =>
    request(`/seating/zones/${zoneId}/seats`, { method: 'POST', body: JSON.stringify({ count }) }),
  uploadZoneImage: (zoneId: string, image: File) => {
    const formData = new FormData();
    formData.append('image', image);
    return request(`/seating/zones/${zoneId}/image`, { method: 'POST', body: formData });
  },
  deleteZoneImage: (zoneId: string) => request(`/seating/zones/${zoneId}/image`, { method: 'DELETE' }),
  renameZone: (zoneId: string, name: string) =>
    request(`/seating/zones/${zoneId}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  deleteZone: (zoneId: string) => request(`/seating/zones/${zoneId}`, { method: 'DELETE' }),

  payments: (status?: string) => request(`/payments${status ? `?status=${status}` : ''}`),
  paymentsSummary: () => request('/payments/summary'),
  pendingMembers: () => request('/payments/pending-members'),
  createPayment: (data: {
    memberId: string;
    amount: number;
    method: string;
    label: string;
    status?: string;
    screenshot?: File | null;
  }) => {
    const formData = new FormData();
    formData.append('memberId', data.memberId);
    formData.append('amount', String(data.amount));
    formData.append('method', data.method);
    formData.append('label', data.label);
    if (data.status) formData.append('status', data.status);
    if (data.screenshot) formData.append('screenshot', data.screenshot);
    return request('/payments', { method: 'POST', body: formData });
  },
  refundPayment: (id: string) => request(`/payments/${id}/refund`, { method: 'PATCH' }),

  expenses: () => request('/expenses'),
  expensesSummary: () => request('/expenses/summary'),
  createExpense: (data: { category: string; amount: number; note?: string; receipt?: File | null }) => {
    const formData = new FormData();
    formData.append('category', data.category);
    formData.append('amount', String(data.amount));
    if (data.note) formData.append('note', data.note);
    if (data.receipt) formData.append('receipt', data.receipt);
    return request('/expenses', { method: 'POST', body: formData });
  },
  updateExpense: (
    id: string,
    data: { category?: string; amount?: number; note?: string; receipt?: File | null },
  ) => {
    const formData = new FormData();
    if (data.category !== undefined) formData.append('category', data.category);
    if (data.amount !== undefined) formData.append('amount', String(data.amount));
    if (data.note !== undefined) formData.append('note', data.note);
    if (data.receipt) formData.append('receipt', data.receipt);
    return request(`/expenses/${id}`, { method: 'PATCH', body: formData });
  },

  inviteStaff: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    branchId?: string;
    branchIds?: string[];
  }) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  myTenant: () => request('/tenants/me'),
  updateTenant: (data: {
    name?: string;
    upiId?: string;
    upiPhone?: string;
    notifyExpiry?: boolean;
    notifyPayments?: boolean;
    notifyWhatsapp?: boolean;
    monthlyFee?: number | null;
    quarterlyFee?: number | null;
    yearlyFee?: number | null;
    dailyPassFee?: number | null;
  }) =>
    request('/tenants/me', { method: 'PATCH', body: JSON.stringify(data) }),
  uploadTenantCover: (cover: File) => {
    const formData = new FormData();
    formData.append('cover', cover);
    return request('/tenants/me/cover', { method: 'POST', body: formData });
  },
  updateBranch: (branchId: string, data: { name?: string; address?: string }) =>
    request(`/tenants/branches/${branchId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  // Branches the current user can access — all of them for a TENANT_OWNER,
  // only the assigned subset for BRANCH_MANAGER/STAFF.
  myBranches: () => request('/tenants/branches'),
  addBranch: (data: { name: string; address?: string }) =>
    request('/tenants/branches', { method: 'POST', body: JSON.stringify(data) }),
  // Staff/owner accounts in the current tenant (students are managed via Members).
  myUsers: () => request('/tenants/users'),
  resetUserPassword: (id: string, password: string) =>
    request(`/tenants/users/${id}/reset-password`, { method: 'PATCH', body: JSON.stringify({ password }) }),

  // Super Admin — platform-wide, cross-tenant
  organizations: () => request('/super-admin/organizations'),
  createOrganization: (data: {
    name: string;
    slug: string;
    branchName?: string;
    branchAddress?: string;
    ownerName: string;
    ownerEmail: string;
    ownerPassword: string;
  }) => request('/super-admin/organizations', { method: 'POST', body: JSON.stringify(data) }),
  updateOrganization: (
    id: string,
    data: {
      name?: string;
      plan?: string;
      status?: string;
      whatsappAccessEnabled?: boolean;
      enabledFeatures?: string[];
    },
  ) =>
    request(`/super-admin/organizations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  whatsappUsage: () => request('/super-admin/whatsapp-usage'),

  backups: () => request('/super-admin/backups'),
  runBackup: () => request('/super-admin/backups/run', { method: 'POST' }),
  backupDownloadUrl: (key: string) => request(`/super-admin/backups/download?key=${encodeURIComponent(key)}`),

  superAdminBranches: () => request('/super-admin/branches'),
  createSuperAdminBranch: (data: { tenantId: string; name: string; address?: string }) =>
    request('/super-admin/branches', { method: 'POST', body: JSON.stringify(data) }),
  updateSuperAdminBranch: (id: string, data: { name?: string; address?: string }) =>
    request(`/super-admin/branches/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  platformUsers: () => request('/super-admin/users'),
  createPlatformUser: (data: {
    tenantId: string;
    branchId?: string;
    name: string;
    email: string;
    password: string;
    role: string;
  }) => request('/super-admin/users', { method: 'POST', body: JSON.stringify(data) }),
  updatePlatformUser: (id: string, data: { role?: string; isActive?: boolean }) =>
    request(`/super-admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  resetPlatformUserPassword: (id: string, password: string) =>
    request(`/super-admin/users/${id}/reset-password`, { method: 'PATCH', body: JSON.stringify({ password }) }),
  passwordResetRequests: () => request('/super-admin/password-reset-requests'),
  resolvePasswordResetRequest: (id: string) =>
    request(`/super-admin/password-reset-requests/${id}/resolve`, { method: 'PATCH' }),

  // Attendance
  myAttendance: () => request('/attendance/me'),
  staffAttendance: (date: string) => request(`/attendance?date=${date}`),
  markAttendance: (memberId: string, date: string, status: string) =>
    request('/attendance', { method: 'POST', body: JSON.stringify({ memberId, date, status }) }),

  // Notices
  notices: () => request('/notices'),
  postNotice: (data: { title: string; body: string; startDate?: string; endDate?: string }) =>
    request('/notices', { method: 'POST', body: JSON.stringify(data) }),
  updateNotice: (
    id: string,
    data: { title?: string; body?: string; startDate?: string; endDate?: string },
  ) => request(`/notices/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteNotice: (id: string) => request(`/notices/${id}`, { method: 'DELETE' }),

  // Requests
  myRequests: () => request('/requests/me'),
  availableSeats: () => request('/requests/available-seats'),
  createRequest: (data: { type: string; message: string; requestedSeatNumber?: number }) =>
    request('/requests', { method: 'POST', body: JSON.stringify(data) }),
  createRenewalRequest: (data: {
    message?: string;
    amount: number;
    screenshot?: File;
    requestedSeatNumber?: number;
  }) => {
    const form = new FormData();
    if (data.message) form.append('message', data.message);
    form.append('amount', String(data.amount));
    if (data.screenshot) form.append('screenshot', data.screenshot);
    if (data.requestedSeatNumber) form.append('requestedSeatNumber', String(data.requestedSeatNumber));
    return request('/requests/renewal', { method: 'POST', body: form });
  },
  allRequests: () => request('/requests'),
  resolveRequest: (id: string) => request(`/requests/${id}/resolve`, { method: 'PATCH' }),
};
