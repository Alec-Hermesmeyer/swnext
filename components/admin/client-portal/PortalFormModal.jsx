import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

export default function PortalFormModal({
  form,
  editing,
  customerNames,
  saving,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 className={`${lato.className} text-lg font-bold text-neutral-900`}>
              {editing ? "Edit Portal" : "New Client Portal"}
            </h2>
            <p className="text-xs text-neutral-500">
              One portal per customer. Auto-matches any job where{" "}
              <code className="rounded bg-neutral-100 px-1 font-mono">customer_name</code> or{" "}
              <code className="rounded bg-neutral-100 px-1 font-mono">hiring_contractor</code> matches.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <label className="block text-sm font-semibold text-neutral-700">
            Portal Label
            <input
              type="text"
              value={form.label}
              onChange={(e) => onChange("label", e.target.value)}
              placeholder="Acme GC Portal"
              className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              required
            />
            <span className="mt-1 block text-[11px] font-normal text-neutral-400">
              Shown at the top of the client's view.
            </span>
          </label>

          <label className="block text-sm font-semibold text-neutral-700">
            Matching Customer Name
            <input
              type="text"
              value={form.match_name}
              onChange={(e) => onChange("match_name", e.target.value)}
              placeholder="Acme General Contractors"
              list="customer-suggestions"
              className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              required
            />
            <datalist id="customer-suggestions">
              {customerNames.map((name) => <option key={name} value={name} />)}
            </datalist>
            <span className="mt-1 block text-[11px] font-normal text-neutral-400">
              Case-insensitive exact match on customer_name or hiring_contractor.
            </span>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-neutral-700">
              Contact Name
              <input
                type="text"
                value={form.contact_name}
                onChange={(e) => onChange("contact_name", e.target.value)}
                placeholder="John Smith"
                className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              />
            </label>
            <label className="block text-sm font-semibold text-neutral-700">
              Contact Email
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => onChange("contact_email", e.target.value)}
                placeholder="john@acme.com"
                className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              />
            </label>
          </div>

          <label className="block text-sm font-semibold text-neutral-700">
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => onChange("notes", e.target.value)}
              placeholder="Internal notes — e.g., sent initial link 4/12"
              className="mt-1 min-h-[60px] w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => onChange("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand/20"
            />
            Active (client can access the URL)
          </label>
        </form>

        <footer className="flex items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            onClick={onSubmit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-light hover:shadow-md disabled:opacity-60"
          >
            {saving ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              editing ? "Save changes" : "Create portal"
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
