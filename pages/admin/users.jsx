import { useEffect, useState } from "react";
import Head from "next/head";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import { useAuth } from "@/context/AuthContext";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const ROLE_OPTIONS = [
  { value: "", label: "No role" },
  { value: "admin", label: "Admin (IT)" },
  { value: "operations", label: "Operations" },
  { value: "safety", label: "Safety" },
  { value: "social_media", label: "Social Media" },
  { value: "hr", label: "HR" },
  { value: "sales", label: "Sales" },
  { value: "viewer", label: "Staff / Viewer" },
];

const LEVEL_OPTIONS = [
  { value: 1, label: "1 — View", hint: "Read-only, can chat" },
  { value: 2, label: "2 — Standard", hint: "Can write, core tools" },
  { value: 3, label: "3 — Lead", hint: "Full access within role" },
];

function roleBadge(role) {
  if (!role) return "bg-neutral-100 text-neutral-500";
  if (role === "admin") return "bg-[#0b2a5a] text-white";
  if (role === "operations" || role === "safety") return "bg-blue-100 text-blue-800";
  if (role === "hr") return "bg-violet-100 text-violet-800";
  if (role === "sales") return "bg-amber-100 text-amber-800";
  if (role === "social_media") return "bg-rose-100 text-rose-800";
  return "bg-neutral-100 text-neutral-600";
}

function roleLabel(role) {
  return ROLE_OPTIONS.find((o) => o.value === role)?.label || role || "Unassigned";
}

function timeAgo(dateString) {
  if (!dateString) return "Never";
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

const inputClass =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#0b2a5a] focus:outline-none focus:ring-2 focus:ring-[#0b2a5a]/20";
const selectClass =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#0b2a5a] focus:outline-none focus:ring-2 focus:ring-[#0b2a5a]/20";

function UserManagement() {
  const { role: currentRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add user form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", password: "", full_name: "", role: "viewer", department: "" });
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin-users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users");
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Add user ──

  const handleAdd = async (e) => {
    e.preventDefault();
    if (adding) return;
    setAddError("");

    if (!addForm.email.trim()) { setAddError("Email is required"); return; }
    if (!addForm.password || addForm.password.length < 6) {
      setAddError("Password must be at least 6 characters");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");

      if (data.user) {
        setUsers((prev) => [data.user, ...prev]);
      }
      setAddForm({ email: "", password: "", full_name: "", role: "viewer", department: "" });
      setShowAddForm(false);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  };

  // ── Edit user ──

  const startEdit = (user) => {
    setEditingId(user.id);
    setEditForm({
      full_name: user.full_name || "",
      username: user.username || "",
      role: user.role || "",
      department: user.department || "",
      access_level: user.access_level || 3,
    });
    setSaveMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setSaveMessage("");
  };

  const saveEdit = async () => {
    if (!editingId || saving) return;
    setSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch("/api/admin-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...editForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setUsers((prev) =>
        prev.map((u) => (u.id === editingId ? { ...u, ...editForm } : u))
      );
      setSaveMessage("Saved");
      setTimeout(() => {
        setEditingId(null);
        setSaveMessage("");
      }, 1200);
    } catch (err) {
      setSaveMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (currentRole !== "admin") {
    return (
      <>
        <Head><title>Users | Admin</title><meta name="robots" content="noindex" /></Head>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
          Only admins can manage users.
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Users | Admin</title><meta name="robots" content="noindex" /></Head>
      <div>
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>
              Team Members
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Add users, assign roles, and manage access
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={() => { setShowAddForm(!showAddForm); setAddError(""); }}
              className="rounded-lg bg-[#0b2a5a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#143a75]"
            >
              {showAddForm ? "Cancel" : "+ Add User"}
            </button>
          </div>
        </div>

        {/* Add user form */}
        {showAddForm && (
          <form
            onSubmit={handleAdd}
            className="mb-6 rounded-xl border border-[#dbe4f0] bg-[#f8fbff] p-5"
          >
            <div className="mb-4 text-sm font-bold text-[#0b2a5a]">New User</div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-600">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="name@company.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-600">
                  Temporary Password *
                </label>
                <input
                  type="text"
                  required
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-600">
                  Full Name
                </label>
                <input
                  type="text"
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  placeholder="John Smith"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-600">
                  Role
                </label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  className={selectClass}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-600">
                  Department
                </label>
                <input
                  type="text"
                  value={addForm.department}
                  onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                  placeholder="e.g. Field, Office, Admin"
                  className={inputClass}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={adding}
                  className="w-full rounded-lg bg-[#0b2a5a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#143a75] disabled:opacity-50"
                >
                  {adding ? "Creating..." : "Create User"}
                </button>
              </div>
            </div>
            {addError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {addError}
              </div>
            )}
            <p className="mt-3 text-xs text-neutral-500">
              The user can log in immediately with this email and password. They can reset their password from the login page.
            </p>
          </form>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Users table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-neutral-500">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading users...
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-4 py-3 font-semibold text-neutral-700">Name</th>
                    <th className="px-4 py-3 font-semibold text-neutral-700">Email</th>
                    <th className="px-4 py-3 font-semibold text-neutral-700">Role</th>
                    <th className="px-4 py-3 font-semibold text-neutral-700">Level</th>
                    <th className="px-4 py-3 font-semibold text-neutral-700">Department</th>
                    <th className="px-4 py-3 font-semibold text-neutral-700">Last Login</th>
                    <th className="px-4 py-3 font-semibold text-neutral-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isEditing = editingId === user.id;
                    return (
                      <tr
                        key={user.id}
                        className={`border-b border-neutral-100 transition-colors ${
                          isEditing ? "bg-blue-50/50" : "hover:bg-neutral-50"
                        }`}
                      >
                        {/* Name */}
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.full_name}
                              onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                              placeholder="Full name"
                              className="w-full rounded-lg border border-neutral-300 px-2.5 py-1.5 text-sm focus:border-[#0b2a5a] focus:outline-none focus:ring-1 focus:ring-[#0b2a5a]/20"
                            />
                          ) : (
                            <div className="font-medium text-neutral-900">
                              {user.full_name || <span className="italic text-neutral-400">No name</span>}
                            </div>
                          )}
                        </td>
                        {/* Email */}
                        <td className="px-4 py-3 text-neutral-600">{user.email}</td>
                        {/* Role */}
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <select
                              value={editForm.role}
                              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                              className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-sm focus:border-[#0b2a5a] focus:outline-none focus:ring-1 focus:ring-[#0b2a5a]/20"
                            >
                              {ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadge(user.role)}`}>
                              {roleLabel(user.role)}
                            </span>
                          )}
                        </td>
                        {/* Department */}
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.department}
                              onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                              placeholder="Department"
                              className="w-full rounded-lg border border-neutral-300 px-2.5 py-1.5 text-sm focus:border-[#0b2a5a] focus:outline-none focus:ring-1 focus:ring-[#0b2a5a]/20"
                            />
                          ) : (
                            <span className="text-neutral-600">
                              {user.department || <span className="text-xs italic text-neutral-400">&mdash;</span>}
                            </span>
                          )}
                        </td>
                        {/* Last login */}
                        <td className="px-4 py-3 text-neutral-500">{timeAgo(user.last_sign_in)}</td>
                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              {saveMessage && (
                                <span className={`text-xs font-medium ${saveMessage === "Saved" ? "text-green-600" : "text-red-600"}`}>
                                  {saveMessage}
                                </span>
                              )}
                              <button
                                onClick={cancelEdit}
                                disabled={saving}
                                className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={saveEdit}
                                disabled={saving}
                                className="rounded-lg bg-[#0b2a5a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#143a75] disabled:opacity-50"
                              >
                                {saving ? "Saving..." : "Save"}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(user)}
                              className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#0b2a5a] hover:bg-neutral-50"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {!users.length && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
              {users.length} user{users.length !== 1 ? "s" : ""} total
            </div>
          </div>
        )}
      </div>
    </>
  );
}

UserManagement.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(UserManagement);
