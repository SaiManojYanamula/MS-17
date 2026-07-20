import TopBar from '@/components/TopBar';

const roles = [
  {
    name: 'SUPER_ADMIN',
    label: 'Super Admin',
    description: 'Platform owner. Not scoped to any single organization.',
    permissions: [
      'Create, view, and manage every Organization (tenant)',
      'Create and manage Branches across all organizations',
      'Create and manage Users across all organizations, suspend/reactivate accounts',
      'Change an organization’s subscription plan and status',
    ],
  },
  {
    name: 'TENANT_OWNER',
    label: 'Tenant Owner',
    description: 'Full control within their own organization.',
    permissions: [
      'Manage tenant/branch profile and settings',
      'Invite Branch Managers and Staff',
      'Full Members, Seating, Payments, Applications access',
      'Delete members',
    ],
  },
  {
    name: 'BRANCH_MANAGER',
    label: 'Branch Manager',
    description: 'Runs day-to-day operations for one branch.',
    permissions: [
      'Full Members, Seating, Payments, Applications access',
      'Delete members',
      'Cannot invite staff or change tenant settings',
    ],
  },
  {
    name: 'STAFF',
    label: 'Staff',
    description: 'Front-desk operations.',
    permissions: [
      'View and create Members, Seating, Payments, Applications',
      'Cannot delete members',
      'Cannot invite staff or change tenant settings',
    ],
  },
  {
    name: 'STUDENT',
    label: 'Student / Member',
    description: 'Self-service portal only.',
    permissions: [
      'View own membership, seat, and payment history',
      'No access to the admin console',
    ],
  },
];

export default function RolesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Roles & Permissions</h1>
          <p className="text-sm text-gray-500">What each role can currently do — reference only</p>
        </div>
        <TopBar />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {roles.map((r) => (
          <div key={r.name} className="bg-card rounded-xl p-5 border border-black/5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-serif font-semibold">{r.label}</h2>
              <span className="text-[10px] bg-accent/10 text-accent rounded-full px-2 py-0.5">{r.name}</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">{r.description}</p>
            <ul className="space-y-1.5 text-sm">
              {r.permissions.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
