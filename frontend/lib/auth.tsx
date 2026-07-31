'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getActiveBranchId, setActiveBranchId } from './api';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string | null;
  branchId?: string | null;
  memberId?: string | null;
};

export type AuthBranch = { id: string; name: string };

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  hasRole: (...roles: string[]) => boolean;
  // Multi-branch switcher — branches this user can see, and which one is
  // currently active. Only meaningful for TENANT_OWNER/BRANCH_MANAGER/STAFF.
  branches: AuthBranch[];
  activeBranchId: string | null;
  switchBranch: (branchId: string) => void;
  // Optional modules the Super Admin has turned on for this org (Expenses,
  // Notices, Requests, Seating, Reports, Attendance) — null until loaded, in
  // which case UI should assume everything's on rather than flash-hide links.
  enabledFeatures: string[] | null;
  // The tenant's own study-hall name — shown as the primary brand in
  // tenant-facing chrome (owner/staff/student sidebars), since that's the
  // identity those users actually care about, not the platform's name.
  tenantName: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const ROLES_WITH_BRANCHES = ['TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<AuthBranch[]>([]);
  const [activeBranchId, setActiveBranchIdState] = useState<string | null>(null);
  const [enabledFeatures, setEnabledFeatures] = useState<string[] | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);

  const loadFeatures = useCallback(async (currentUser: AuthUser) => {
    if (!currentUser.tenantId) return; // SUPER_ADMIN isn't scoped to a tenant
    try {
      const res = await api.myTenant();
      const raw = res.tenant?.enabledFeatures;
      setEnabledFeatures(typeof raw === 'string' ? raw.split(',') : null);
      setTenantName(res.tenant?.name ?? null);
    } catch {
      // Non-fatal — links just won't be hidden if this fails.
    }
  }, []);

  const loadBranches = useCallback(async (currentUser: AuthUser) => {
    if (!ROLES_WITH_BRANCHES.includes(currentUser.role)) return;
    try {
      const list = await api.myBranches();
      setBranches(list);

      const stored = getActiveBranchId();
      const valid = stored && list.some((b: AuthBranch) => b.id === stored);
      const fallback = currentUser.branchId ?? list[0]?.id;
      const resolved = valid ? stored : fallback;
      if (resolved) {
        setActiveBranchId(resolved);
        setActiveBranchIdState(resolved);
      }
    } catch {
      // Non-fatal — branch switcher just won't show up.
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const stored = localStorage.getItem('user');
    if (token && stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        loadBranches(parsed);
        loadFeatures(parsed);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, [loadBranches, loadFeatures]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('user', JSON.stringify(res.user));
    localStorage.removeItem('activeBranchId');
    setUser(res.user);
    await Promise.all([loadBranches(res.user), loadFeatures(res.user)]);
    return res.user as AuthUser;
  }, [loadBranches, loadFeatures]);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('activeBranchId');
    setUser(null);
    setBranches([]);
    setActiveBranchIdState(null);
    setEnabledFeatures(null);
    setTenantName(null);
  }, []);

  const hasRole = useCallback((...roles: string[]) => !!user && roles.includes(user.role), [user]);

  const switchBranch = useCallback((branchId: string) => {
    setActiveBranchId(branchId);
    setActiveBranchIdState(branchId);
    // Simplest reliable way to make every page refetch under the new branch
    // context, rather than threading a refresh signal through every page.
    window.location.reload();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, hasRole, branches, activeBranchId, switchBranch, enabledFeatures, tenantName }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
