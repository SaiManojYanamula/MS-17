const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

  dashboardStats: () => request('/reports/dashboard'),
  recentActivity: (limit = 5) => request(`/reports/recent-activity?limit=${limit}`),
  revenueTrend: (months = 6) => request(`/reports/revenue-trend?months=${months}`),
  occupancyTrend: (weeks = 8) => request(`/reports/occupancy-trend?weeks=${weeks}`),
  planDistribution: () => request('/reports/plan-distribution'),
  keyNumbers: () => request('/reports/key-numbers'),

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

  members: (filter?: string, search?: string) => {
    const params = new URLSearchParams();
    if (filter) params.set('filter', filter);
    if (search) params.set('search', search);
    return request(`/members?${params.toString()}`);
  },
  createMember: (data: {
    name: string;
    goalTag?: string;
    plan: string;
    batch: string;
    expiresAt: string;
    status?: string;
  }) => request('/members', { method: 'POST', body: JSON.stringify(data) }),
  updateMember: (id: string, data: Partial<{
    name: string;
    goalTag?: string;
    plan: string;
    batch: string;
    expiresAt: string;
    status: string;
  }>) => request(`/members/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteMember: (id: string) => request(`/members/${id}`, { method: 'DELETE' }),
  myMember: () => request('/members/me'),

  seatMap: (branchId?: string) => request(`/seating${branchId ? `?branchId=${branchId}` : ''}`),
  seatDetail: (seatId: string) => request(`/seating/${seatId}`),
  assignSeat: (seatId: string, memberId: string) =>
    request(`/seating/${seatId}/assign`, { method: 'PATCH', body: JSON.stringify({ memberId }) }),
  releaseSeat: (seatId: string) => request(`/seating/${seatId}/release`, { method: 'PATCH' }),

  payments: (status?: string) => request(`/payments${status ? `?status=${status}` : ''}`),
  paymentsSummary: () => request('/payments/summary'),
  createPayment: (data: { memberId: string; amount: number; method: string; label: string; status?: string }) =>
    request('/payments', { method: 'POST', body: JSON.stringify(data) }),
  refundPayment: (id: string) => request(`/payments/${id}/refund`, { method: 'PATCH' }),

  inviteStaff: (data: { name: string; email: string; password: string; role: string; branchId?: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  createStudentLogin: (memberId: string, data: { name: string; email: string; password: string }) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, role: 'STUDENT', memberId }),
    }),

  myTenant: () => request('/tenants/me'),
  updateTenant: (name: string) => request('/tenants/me', { method: 'PATCH', body: JSON.stringify({ name }) }),
  updateBranch: (branchId: string, data: { name?: string; address?: string }) =>
    request(`/tenants/branches/${branchId}`, { method: 'PATCH', body: JSON.stringify(data) }),
};
