"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Lato } from "next/font/google";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import supabase from "@/components/Supabase";
import { useLiveData } from "@/hooks/useLiveData";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const EMPTY_FORM = {
  id: null,
  name: "",
  unit_number: "",
  make: "",
  model: "",
  capacity: "",
  default_operator_id: "",
  default_oiler_id: "",
  is_active: true,
  notes: "",
};

function AdminCranesPage() {
  const [cranes, setCranes] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [savingId, setSavingId] = useState("");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("active");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const [cranesResult, workersResult] = await Promise.all([
        supabase
          .from("crew_cranes")
          .select("*, default_operator:default_operator_id(id, name, role), default_oiler:default_oiler_id(id, name, role)")
          .order("name"),
        supabase.from("crew_workers").select("id, name, role, is_active").eq("is_active", true).order("name"),
      ]);
      if (cranesResult.error) throw cranesResult.error;
      if (workersResult.error) throw workersResult.error;
      setCranes(cranesResult.data || []);
      setWorkers(workersResult.data || []);
    } catch (err) {
      setErrorMessage(err?.message || "Could not load cranes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useLiveData(loadData, { realtimeTables: ["crew_cranes"] });

  const filtered = useMemo(() => {
    const searchLc = search.trim().toLowerCase();
    return cranes.filter((c) => {
      if (activeFilter === "active" && c.is_active === false) return false;
      if (activeFilter === "inactive" && c.is_active !== false) return false;
      if (!searchLc) return true;
      return (
        String(c.name || "").toLowerCase().includes(searchLc) ||
        String(c.unit_number || "").toLowerCase().includes(searchLc) ||
        String(c.make || "").toLowerCase().includes(searchLc) ||
        String(c.model || "").toLowerCase().includes(searchLc) ||
        String(c.capacity || "").toLowerCase().includes(searchLc)
      );
    });
  }, [cranes, search, activeFilter]);

  const summary = useMemo(() => {
    const active = cranes.filter((c) => c.is_active !== false).length;
    const inactive = cranes.length - active;
    return { total: cranes.length, active, inactive };
  }, [cranes]);

  const openNew = () => { setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (crane) => {
    setForm({
      id: crane.id,
      name: crane.name || "",
      unit_number: crane.unit_number || "",
      make: crane.make || "",
      model: crane.model || "",
      capacity: crane.capacity || "",
      default_operator_id: crane.default_operator_id || "",
      default_oiler_id: crane.default_oiler_id || "",
      is_active: crane.is_active !== false,
      notes: crane.notes || "",
    });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setForm(EMPTY_FORM); };

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submitForm = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setStatus({ type: "error", message: "Name is required." });
      return;
    }
    setSavingId(form.id || "new");
    try {
      const payload = {
        name: form.name.trim(),
        unit_number: form.unit_number.trim() || null,
        make: form.make.trim() || null,
        model: form.model.trim() || null,
        capacity: form.capacity.trim() || null,
        default_operator_id: form.default_operator_id || null,
        default_oiler_id: form.default_oiler_id || null,
        is_active: Boolean(form.is_active),
        notes: form.notes.trim() || null,
      };
      if (form.id) {
        const { error } = await supabase.from("crew_cranes").update(payload).eq("id", form.id);
        if (error) throw error;
        setStatus({ type: "success", message: "Crane updated." });
      } else {
        const { error } = await supabase.from("crew_cranes").insert(payload);
        if (error) throw error;
        setStatus({ type: "success", message: "Crane added." });
      }
      closeModal();
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not save." });
    } finally {
      setSavingId("");
    }
  };

  const toggleActive = async (crane) => {
    setSavingId(crane.id);
    try {
      const next = !(crane.is_active !== false);
      const { error } = await supabase.from("crew_cranes").update({ is_active: next }).eq("id", crane.id);
      if (error) throw error;
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not update." });
    } finally {
      setSavingId("");
    }
  };

  const deleteCrane = async (crane) => {
    if (!confirm(`Delete ${crane.name}? This cannot be undone.`)) return;
    setSavingId(crane.id);
    try {
      const { error } = await supabase.from("crew_cranes").delete().eq("id", crane.id);
      if (error) throw error;
      setStatus({ type: "success", message: "Crane deleted." });
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not delete." });
    } finally {
      setSavingId("");
    }
  };

  return (
    <>
      <Head>
        <title>Cranes | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light shadow-sm">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M4 21V3m0 0h12l-2 4 2 4H4m0 0v2m0-2l9 7m0 0v4m0-4l-2 1" />
              </svg>
            </div>
            <div>
              <h1 className={`${lato.className} text-2xl font-extrabold text-brand leading-tight`}>Cranes</h1>
              <p className="mt-0.5 text-sm text-neutral-600">
                Track each crane with its default operator + oiler. Pulls from{" "}
                <Link href="/admin/crew" className="font-semibold text-brand underline">Crew</Link>.
                Tell me what fields are missing and we'll expand.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-light hover:shadow-md"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Crane
          </button>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Total Cranes" value={summary.total} tone="blue" />
          <SummaryCard label="Active" value={summary.active} tone="emerald" />
          <SummaryCard label="Inactive" value={summary.inactive} tone="neutral" />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-card">
          <div className="relative flex-1 min-w-[220px]">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, make, model, capacity..."
              className="h-9 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1">
            <SegButton value="active" current={activeFilter} onChange={setActiveFilter}>Active</SegButton>
            <SegButton value="inactive" current={activeFilter} onChange={setActiveFilter}>Inactive</SegButton>
            <SegButton value="all" current={activeFilter} onChange={setActiveFilter}>All</SegButton>
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {errorMessage}
            {errorMessage.toLowerCase().includes("does not exist") ? (
              <span className="ml-2 font-normal">
                Run <code className="rounded bg-red-100 px-1 font-mono text-xs">scripts/add-crew-cranes.sql</code> in Supabase first.
              </span>
            ) : null}
          </div>
        ) : null}

        {loading && cranes.length === 0 ? (
          <div className="flex items-center justify-center rounded-2xl border border-neutral-200 bg-white py-16 shadow-card">
            <div className="flex items-center gap-3 text-neutral-500">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading cranes...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-neutral-300 bg-white py-16 text-center">
            <p className={`${lato.className} text-lg font-bold text-neutral-700`}>
              {cranes.length === 0 ? "No cranes yet" : "No cranes match your filters"}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {cranes.length === 0 ? "Add your first crane to start tracking." : "Adjust search or filters."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((crane) => (
              <CraneCard
                key={crane.id}
                crane={crane}
                busy={savingId === crane.id}
                onEdit={() => openEdit(crane)}
                onToggleActive={() => toggleActive(crane)}
                onDelete={() => deleteCrane(crane)}
              />
            ))}
          </div>
        )}

        {modalOpen ? (
          <CraneFormModal
            form={form}
            workers={workers}
            saving={Boolean(savingId)}
            onChange={updateField}
            onSubmit={submitForm}
            onCancel={closeModal}
          />
        ) : null}

        {status ? (
          <div
            className={`fixed bottom-6 right-6 z-50 flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-card-hover ${
              status.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <p className="flex-1 text-sm font-medium">{status.message}</p>
            <button type="button" onClick={() => setStatus(null)} className="shrink-0 rounded-md p-0.5 hover:bg-black/5" aria-label="Dismiss">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}

function SummaryCard({ label, value, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    neutral: "bg-neutral-100 text-neutral-700 border-neutral-200",
  };
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">{label}</p>
          <p className={`${lato.className} mt-1.5 text-2xl font-black text-neutral-900`}>{value}</p>
        </div>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${tones[tone] || tones.blue}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        </div>
      </div>
    </div>
  );
}

function SegButton({ value, current, onChange, children }) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
        active ? "bg-white text-brand shadow-sm" : "text-neutral-600 hover:text-neutral-900"
      }`}
    >
      {children}
    </button>
  );
}

function CraneCard({ crane, busy, onEdit, onToggleActive, onDelete }) {
  const isActive = crane.is_active !== false;
  return (
    <article className={`flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-card transition-shadow hover:shadow-card-hover ${isActive ? "" : "opacity-60"}`}>
      <header className="border-b border-neutral-100 bg-gradient-to-br from-brand to-brand-light px-5 py-4 text-white rounded-t-2xl">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/80">
              {crane.unit_number ? `Unit ${crane.unit_number}` : "No unit #"}
            </p>
            <h3 className="mt-0.5 text-lg font-extrabold leading-tight">{crane.name}</h3>
            <p className="mt-0.5 text-xs font-semibold text-white/85">
              {[crane.make, crane.model].filter(Boolean).join(" ") || "Make/model not set"}
              {crane.capacity ? ` · ${crane.capacity}` : ""}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            isActive ? "bg-emerald-300 text-emerald-900" : "bg-white/20 text-white"
          }`}>
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-px bg-neutral-100">
        <CrewCell label="Operator" worker={crane.default_operator} />
        <CrewCell label="Oiler" worker={crane.default_oiler} />
      </dl>

      {crane.notes ? (
        <p className="border-t border-neutral-100 px-5 py-3 text-xs text-neutral-600">{crane.notes}</p>
      ) : null}

      <footer className="flex items-center justify-end gap-1 border-t border-neutral-100 px-4 py-2">
        <button type="button" onClick={onEdit} className="rounded-md px-2 py-1 text-xs font-semibold text-brand hover:bg-brand-50">Edit</button>
        <button type="button" onClick={onToggleActive} disabled={busy} className="rounded-md px-2 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-60">
          {busy ? "..." : isActive ? "Deactivate" : "Activate"}
        </button>
        <button type="button" onClick={onDelete} disabled={busy} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">
          Delete
        </button>
      </footer>
    </article>
  );
}

function CrewCell({ label, worker }) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400">{label}</p>
      {worker?.name ? (
        <div>
          <p className="text-sm font-semibold text-neutral-900">{worker.name}</p>
          {worker.role ? <p className="text-[11px] text-neutral-500">{worker.role}</p> : null}
        </div>
      ) : (
        <p className="text-sm italic text-neutral-400">Unassigned</p>
      )}
    </div>
  );
}

function CraneFormModal({ form, workers, saving, onChange, onSubmit, onCancel }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 className={`${lato.className} text-lg font-bold text-neutral-900`}>
              {form.id ? "Edit Crane" : "Add Crane"}
            </h2>
            <p className="text-xs text-neutral-500">Default crew can be overridden per schedule day.</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="Link-Belt 138"
                required
                autoFocus
                className={inputClass}
              />
            </Field>
            <Field label="Unit Number">
              <input
                type="text"
                value={form.unit_number}
                onChange={(e) => onChange("unit_number", e.target.value)}
                placeholder="C-12"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Make">
              <input
                type="text"
                value={form.make}
                onChange={(e) => onChange("make", e.target.value)}
                placeholder="Link-Belt"
                className={inputClass}
              />
            </Field>
            <Field label="Model">
              <input
                type="text"
                value={form.model}
                onChange={(e) => onChange("model", e.target.value)}
                placeholder="138"
                className={inputClass}
              />
            </Field>
            <Field label="Capacity">
              <input
                type="text"
                value={form.capacity}
                onChange={(e) => onChange("capacity", e.target.value)}
                placeholder="70-ton"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Default Operator">
              <select
                value={form.default_operator_id}
                onChange={(e) => onChange("default_operator_id", e.target.value)}
                className={inputClass}
              >
                <option value="">Unassigned</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}{w.role ? ` — ${w.role}` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Default Oiler">
              <select
                value={form.default_oiler_id}
                onChange={(e) => onChange("default_oiler_id", e.target.value)}
                className={inputClass}
              >
                <option value="">Unassigned</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}{w.role ? ` — ${w.role}` : ""}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => onChange("notes", e.target.value)}
              placeholder="Maintenance notes, idiosyncrasies, etc."
              className={`${inputClass} min-h-[70px] py-2`}
            />
          </Field>

          <label className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-700">
            <input
              type="checkbox"
              checked={Boolean(form.is_active)}
              onChange={(e) => onChange("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand/20"
            />
            Active (available for scheduling)
          </label>
        </form>

        <footer className="flex items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
          <button type="button" onClick={onCancel} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            onClick={onSubmit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-light hover:shadow-md disabled:opacity-60"
          >
            {saving ? "Saving..." : (form.id ? "Save changes" : "Add crane")}
          </button>
        </footer>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10";

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-500">
        {label}{required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

AdminCranesPage.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(AdminCranesPage);
