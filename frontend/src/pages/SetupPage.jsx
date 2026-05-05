import { useCallback, useEffect, useState } from 'react';
import { http, unwrap } from '../api/http.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';

const TABS = ['Farms', 'Poultry types', 'Units', 'Account heads', 'Roles', 'Users'];

/**
 * Setup module: master data maintenance (farms, units, chart-style heads, users).
 */
export default function SetupPage() {
  const [tab, setTab] = useState(TABS[0]);

  return (
    <div>
      <PageHeader
        title="Setup"
        subtitle="Configure farms, catalog data, account heads, roles, and application users."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              'rounded-md border px-3 py-1.5 text-sm font-medium',
              tab === t
                ? 'border-brand-700 bg-brand-700 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
            ].join(' ')}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'Farms' && <FarmsCrud />}
      {tab === 'Poultry types' && <PoultryCrud />}
      {tab === 'Units' && <UnitsCrud />}
      {tab === 'Account heads' && <HeadsCrud />}
      {tab === 'Roles' && <RolesCrud />}
      {tab === 'Users' && <UsersCrud />}
    </div>
  );
}

function FarmsCrud() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: '', location: '', notes: '' });
  const load = useCallback(async () => {
    const data = await unwrap(await http.get('/setup/farms'));
    setRows(data);
  }, []);
  useEffect(() => {
    load().catch(() => {});
  }, [load]);
  const save = async (e) => {
    e.preventDefault();
    await http.post('/setup/farms', form);
    setForm({ name: '', location: '', notes: '' });
    load();
  };
  const del = async (id) => {
    if (!confirm('Delete farm?')) return;
    await http.delete(`/setup/farms/${id}`);
    load();
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={save} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">New farm</h3>
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
        <Field label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
        <button type="submit" className="mt-3 rounded bg-brand-700 px-3 py-1.5 text-sm text-white">
          Save farm
        </button>
      </form>
      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'location', label: 'Location' },
          {
            key: '_id',
            label: '',
            sortable: false,
            render: (r) => (
              <button type="button" className="text-red-600 hover:underline" onClick={() => del(r._id)}>
                Delete
              </button>
            ),
          },
        ]}
        rows={rows}
        filterKeys={['name', 'location']}
      />
    </div>
  );
}

function PoultryCrud() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const load = useCallback(async () => {
    setRows(await unwrap(await http.get('/setup/poultry-types')));
  }, []);
  useEffect(() => {
    load().catch(() => {});
  }, [load]);
  const save = async (e) => {
    e.preventDefault();
    await http.post('/setup/poultry-types', form);
    setForm({ name: '', code: '', description: '' });
    load();
  };
  const del = async (id) => {
    if (!confirm('Delete type?')) return;
    await http.delete(`/setup/poultry-types/${id}`);
    load();
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={save} className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">New poultry type</h3>
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="Code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} />
        <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        <button type="submit" className="mt-2 rounded bg-brand-700 px-3 py-1.5 text-sm text-white">
          Save
        </button>
      </form>
      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'code', label: 'Code' },
          {
            key: '_id',
            label: '',
            sortable: false,
            render: (r) => (
              <button type="button" className="text-red-600 hover:underline" onClick={() => del(r._id)}>
                Delete
              </button>
            ),
          },
        ]}
        rows={rows}
        filterKeys={['name', 'code']}
      />
    </div>
  );
}

function UnitsCrud() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: '', abbreviation: '' });
  const load = useCallback(async () => {
    setRows(await unwrap(await http.get('/setup/units')));
  }, []);
  useEffect(() => {
    load().catch(() => {});
  }, [load]);
  const save = async (e) => {
    e.preventDefault();
    await http.post('/setup/units', { ...form, abbreviation: form.abbreviation.toUpperCase() });
    setForm({ name: '', abbreviation: '' });
    load();
  };
  const del = async (id) => {
    if (!confirm('Delete unit?')) return;
    await http.delete(`/setup/units/${id}`);
    load();
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={save} className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">New unit</h3>
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="Abbreviation" value={form.abbreviation} onChange={(v) => setForm({ ...form, abbreviation: v })} required />
        <button type="submit" className="mt-2 rounded bg-brand-700 px-3 py-1.5 text-sm text-white">
          Save
        </button>
      </form>
      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'abbreviation', label: 'Abbr' },
          {
            key: '_id',
            label: '',
            sortable: false,
            render: (r) => (
              <button type="button" className="text-red-600 hover:underline" onClick={() => del(r._id)}>
                Delete
              </button>
            ),
          },
        ]}
        rows={rows}
        filterKeys={['name', 'abbreviation']}
      />
    </div>
  );
}

const HEAD_TYPES = ['customer', 'supplier', 'expense', 'bank', 'cash', 'other'];

function HeadsCrud() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    name: '',
    type: 'supplier',
    phone: '',
    email: '',
    address: '',
    openingBalance: 0,
  });
  const load = useCallback(async () => {
    setRows(await unwrap(await http.get('/setup/account-heads')));
  }, []);
  useEffect(() => {
    load().catch(() => {});
  }, [load]);
  const save = async (e) => {
    e.preventDefault();
    await http.post('/setup/account-heads', { ...form, openingBalance: Number(form.openingBalance) || 0 });
    setForm({ name: '', type: 'supplier', phone: '', email: '', address: '', openingBalance: 0 });
    load();
  };
  const del = async (id) => {
    if (!confirm('Delete account head?')) return;
    await http.delete(`/setup/account-heads/${id}`);
    load();
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={save} className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">New account head</h3>
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <label className="block text-xs font-medium text-slate-600">
          Type
          <select
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {HEAD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Field label="Opening balance" value={form.openingBalance} onChange={(v) => setForm({ ...form, openingBalance: v })} />
        <button type="submit" className="mt-2 rounded bg-brand-700 px-3 py-1.5 text-sm text-white">
          Save
        </button>
      </form>
      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'type', label: 'Type' },
          { key: 'phone', label: 'Phone' },
          {
            key: '_id',
            label: '',
            sortable: false,
            render: (r) => (
              <button type="button" className="text-red-600 hover:underline" onClick={() => del(r._id)}>
                Delete
              </button>
            ),
          },
        ]}
        rows={rows}
        filterKeys={['name', 'type']}
      />
    </div>
  );
}

function RolesCrud() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const load = useCallback(async () => {
    setRows(await unwrap(await http.get('/setup/roles')));
  }, []);
  useEffect(() => {
    load().catch(() => {});
  }, [load]);
  const save = async (e) => {
    e.preventDefault();
    await http.post('/setup/roles', form);
    setForm({ name: '', description: '' });
    load();
  };
  const del = async (id) => {
    if (!confirm('Delete role?')) return;
    await http.delete(`/setup/roles/${id}`);
    load();
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={save} className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">New role</h3>
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        <button type="submit" className="mt-2 rounded bg-brand-700 px-3 py-1.5 text-sm text-white">
          Save
        </button>
      </form>
      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'description', label: 'Description' },
          {
            key: '_id',
            label: '',
            sortable: false,
            render: (r) => (
              <button type="button" className="text-red-600 hover:underline" onClick={() => del(r._id)}>
                Delete
              </button>
            ),
          },
        ]}
        rows={rows}
        filterKeys={['name']}
      />
    </div>
  );
}

function UsersCrud() {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '' });
  const load = useCallback(async () => {
    const [u, r] = await Promise.all([
      unwrap(await http.get('/setup/users')),
      unwrap(await http.get('/setup/roles')),
    ]);
    setRows(u);
    setRoles(r);
  }, []);
  useEffect(() => {
    load().catch(() => {});
  }, [load]);
  const save = async (e) => {
    e.preventDefault();
    await http.post('/setup/users', { ...form, role: form.role || roles[0]?._id });
    setForm({ name: '', email: '', password: '', role: roles[0]?._id || '' });
    load();
  };
  const del = async (id) => {
    if (!confirm('Delete user?')) return;
    await http.delete(`/setup/users/${id}`);
    load();
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={save} className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">New user</h3>
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <Field label="Password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
        <label className="block text-xs font-medium text-slate-600">
          Role
          <select
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {roles.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="mt-2 rounded bg-brand-700 px-3 py-1.5 text-sm text-white">
          Save user
        </button>
      </form>
      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role', render: (r) => r.role?.name },
          {
            key: '_id',
            label: '',
            sortable: false,
            render: (r) => (
              <button type="button" className="text-red-600 hover:underline" onClick={() => del(r._id)}>
                Delete
              </button>
            ),
          },
        ]}
        rows={rows}
        filterKeys={['name', 'email']}
      />
    </div>
  );
}

function Field({ label, value, onChange, required }) {
  return (
    <label className="block text-xs font-medium text-slate-600">
      {label}
      <input
        required={required}
        className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
