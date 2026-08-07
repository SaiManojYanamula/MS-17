"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import TopBar from "@/components/TopBar";
import StatusPill from "@/components/StatusPill";
import AddMemberModal from "@/components/AddMemberModal";
import EditMemberModal from "@/components/EditMemberModal";
import RenewMemberModal from "@/components/RenewMemberModal";
import ImportMembersModal from "@/components/ImportMembersModal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatPlan, seatNumberOf } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";

const tabs = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "expiring", label: "Expiring Soon" },
  { key: "expired", label: "Expired" },
];

const EMPTY_COUNTS = { all: 0, active: 0, expiring: 0, expired: 0 };

export default function MembersPage() {
  const { hasRole } = useAuth();
  const canDelete = hasRole("TENANT_OWNER", "BRANCH_MANAGER");
  const canImport = hasRole("TENANT_OWNER", "BRANCH_MANAGER");
  const [filter, setFilter] = useState<
    "all" | "active" | "expiring" | "expired"
  >("all");
  // const [search, setSearch] = useState('');
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");

  const [members, setMembers] = useState<any[]>([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [renewingMember, setRenewingMember] = useState<any>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState<"grid" | "table">("table");
  const highlightId = useSearchParams().get("highlight");

  // const refetch = () => {
  //   api
  //     .members(filter === 'all' ? undefined : filter, search || undefined)
  //     .then((res) => {
  //       setMembers(res.members ?? []);
  //       setCounts(res.counts ?? EMPTY_COUNTS);
  //     })
  //     .catch(() => {});
  // };

  // useEffect(() => {
  //   const t = setTimeout(refetch, 300); // debounce search-as-you-type
  //   return () => clearTimeout(t);
  // }, [filter, search]);

  const applyDateRange = () => {
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
  };
  const clearDateRange = () => {
    setFromDate("");
    setToDate("");
    setAppliedFromDate("");
    setAppliedToDate("");
  };

  const refetch = () => {
    api
      .members(
        filter === "all" ? undefined : filter,
        search || undefined,
        appliedFromDate || undefined,
        appliedToDate || undefined,
      )
      .then((res) => {
        setMembers(res.members ?? []);
        setCounts(res.counts ?? EMPTY_COUNTS);
      })
      .catch(() => {});
  };

  useEffect(() => {
    const t = setTimeout(refetch, 300); // debounce search-as-you-type
    return () => clearTimeout(t);
  }, [filter, search, appliedFromDate, appliedToDate]);

  const exportCsv = () => {
    downloadCsv(
      `members-${filter}-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { header: "Name", key: "name" },
        { header: "Phone", key: "phone" },
        { header: "Goal", key: "goalTag" },
        { header: "Plan", key: "plan" },
        { header: "Batch", key: "batch" },
        { header: "Seat", key: "seatNumber" },
        { header: "Status", key: "status" },
        { header: "Joined", key: "joinedAt" },
        { header: "Expires", key: "expiresAt" },
      ],
      members.map((m: any) => ({ ...m, seatNumber: seatNumberOf(m.seat) })),
    );
  };

  const deleteMember = async (m: any) => {
    if (
      !window.confirm(
        `Delete ${m.name}? This also removes their payment history and frees their seat.`,
      )
    ) {
      return;
    }
    setError("");
    try {
      await api.deleteMember(m.id);
      refetch();
    } catch (err: any) {
      setError(err.message || "Couldn't delete member — try again.");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Members</h1>

          <p className="text-sm text-gray-500">
            {counts.active} active members across{" "}
            {new Set(members.map((m: any) => m.batch)).size || 0} batches
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TopBar value={search} onChange={setSearch} />

          <div className="flex items-center border border-black/10 rounded-lg overflow-hidden shrink-0 text-sm">
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-2 ${view === "grid" ? "bg-sidebar text-white" : "bg-white text-gray-500"}`}
            >
              Grid
            </button>
            <button
              onClick={() => setView("table")}
              className={`px-3 py-2 ${view === "table" ? "bg-sidebar text-white" : "bg-white text-gray-500"}`}
            >
              Table
            </button>
          </div>
          <button
            onClick={exportCsv}
            className="border border-black/10 text-sm px-4 py-2 rounded-lg shrink-0"
          >
            Export CSV
          </button>
          {canImport && (
            <button
              onClick={() => setShowImport(true)}
              className="border border-black/10 text-sm px-4 py-2 rounded-lg shrink-0"
            >
              Import Students
            </button>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="bg-sidebar text-white text-sm px-4 py-2 rounded-lg shadow-sm shadow-accent/20 shrink-0"
          >
            + Add Member
          </button>
        </div>

        <div className="flex items-center border border-black/10 rounded-lg overflow-hidden shrink-0 text-sm">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-black/10 rounded-lg px-2 py-2 text-sm shrink-0"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            min={fromDate || undefined}
            className="border border-black/10 rounded-lg px-2 py-2 text-sm shrink-0"
          />
          <button
            onClick={applyDateRange}
            disabled={!fromDate || !toDate}
            className="bg-sidebar text-white text-sm px-3 py-2 rounded-lg shrink-0 disabled:opacity-40"
          >
            Apply
          </button>
          {(appliedFromDate || appliedToDate) && (
            <button
              onClick={clearDateRange}
              className="text-xs text-gray-400 underline shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <div className="flex gap-6 border-b border-black/10 mb-6 text-sm overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key as any)}
            className={`pb-3 flex items-center gap-2 transition-colors ${
              filter === t.key
                ? "border-b-2 border-accent text-accent font-medium"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                filter === t.key
                  ? "bg-accent/10 text-accent"
                  : "bg-black/5 text-gray-500"
              }`}
            >
              {counts[t.key as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-expiring mb-3">{error}</p>}

      {view === "table" ? (
        <div className="bg-card rounded-xl border border-black/5 overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="text-left text-[10px] text-gray-400 tracking-wide border-b border-black/5">
                <th className="p-4 font-normal">NAME</th>
                <th className="font-normal">PHONE</th>
                <th className="font-normal">PLAN</th>
                <th className="font-normal">BATCH</th>
                <th className="font-normal">SEAT</th>
                <th className="font-normal">SEAT</th>
                <th className="font-normal">JOINED</th>
                {/* <th className="font-normal">EXPIRES</th> */}
                <th className="font-normal">STATUS</th>
                <th className="font-normal">PORTAL</th>
                <th className="font-normal" />
              </tr>
            </thead>
            <tbody>
              {members.map((m: any) => (
                <tr
                  key={m.id}
                  className={`border-b border-black/5 last:border-0 ${m.id === highlightId ? "bg-accent/5" : ""}`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent/70 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                        {m.name
                          .split(" ")
                          .map((p: string) => p[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-gray-400">{m.goalTag}</div>
                      </div>
                    </div>
                  </td>
                  <td>{m.phone || "—"}</td>
                  <td>{formatPlan(m.plan)}</td>
                  <td>{m.batch}</td>
                  {/* <td>#{seatNumberOf(m.seat)}</td>
                  <td>{formatDate(m.expiresAt)}</td> */}
                  <td>#{seatNumberOf(m.seat)}</td>
                  <td>{formatDate(m.joinedAt)}</td>
                  <td>{formatDate(m.expiresAt)}</td>
                  <td>
                    <StatusPill status={m.status} />
                  </td>
                  <td>
                    {m.user ? (
                      <span className="text-[10px] bg-free/15 text-free font-medium rounded-full px-2 py-0.5">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] bg-black/5 text-gray-400 font-medium rounded-full px-2 py-0.5">
                        {m.phone ? "Pending" : "No phone"}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRenewingMember(m)}
                        className="text-xs text-free font-medium"
                      >
                        Renew
                      </button>
                      <button
                        onClick={() => setEditingMember(m)}
                        className="text-xs text-accent font-medium"
                      >
                        Edit
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => deleteMember(m)}
                          className="text-xs text-expiring font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  {/* <td colSpan={9} className="p-8 text-center text-gray-400"> */}
                  <td colSpan={10} className="p-8 text-center text-gray-400">
                    No members match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m: any) => (
            <div
              key={m.id}
              className={`group bg-card rounded-2xl p-4 border transition-all hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 ${
                m.id === highlightId
                  ? "ring-2 ring-accent border-transparent"
                  : "border-black/5"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent/70 text-white flex items-center justify-center text-xs font-semibold shadow-sm">
                    {m.name
                      .split(" ")
                      .map((p: string) => p[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{m.name}</div>
                    <div className="text-xs text-gray-400">{m.goalTag}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setRenewingMember(m)}
                    title="Renew"
                    className="w-9 h-9 rounded-full bg-free/10 text-free hover:bg-free/20 text-base flex items-center justify-center"
                  >
                    ↻
                  </button>
                  <button
                    onClick={() => setEditingMember(m)}
                    title="Edit"
                    className="w-9 h-9 rounded-full bg-accent/10 text-accent hover:bg-accent/20 text-base flex items-center justify-center"
                  >
                    ✎
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => deleteMember(m)}
                      title="Delete"
                      className="w-9 h-9 rounded-full bg-expiring/10 text-expiring hover:bg-expiring/20 text-base flex items-center justify-center"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Seat</span>
                  <span className="font-medium">#{seatNumberOf(m.seat)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Phone</span>
                  <span className="font-medium">{m.phone || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Plan</span>
                  <span className="font-medium">{formatPlan(m.plan)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Expires</span>
                  <span className="font-medium">{formatDate(m.expiresAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status</span>
                  <StatusPill status={m.status} />
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-black/5 mt-1">
                  <span className="text-gray-400">Portal</span>
                  {m.user ? (
                    <span className="text-[10px] bg-free/15 text-free font-medium rounded-full px-2 py-0.5">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] bg-black/5 text-gray-400 font-medium rounded-full px-2 py-0.5">
                      {m.phone ? "Pending" : "No phone"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-gray-400 col-span-3 text-center py-8">
              No members match.
            </p>
          )}
        </div>
      )}

      {showAdd && (
        <AddMemberModal onClose={() => setShowAdd(false)} onSuccess={refetch} />
      )}
      {showImport && (
        <ImportMembersModal
          onClose={() => setShowImport(false)}
          onSuccess={refetch}
        />
      )}
      {renewingMember && (
        <RenewMemberModal
          member={renewingMember}
          onClose={() => setRenewingMember(null)}
          onSuccess={refetch}
        />
      )}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
