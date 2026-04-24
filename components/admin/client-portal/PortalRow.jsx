import { buildPortalMailto, formatDateTime, getPortalHealth, getPortalUrl } from "./helpers";

export default function PortalRow({
  portal,
  busy,
  justCopied,
  jobCount,
  onEdit,
  onDelete,
  onToggle,
  onRotate,
  onCopy,
  onManageDocs,
  onViewJobs,
}) {
  const url = getPortalUrl(portal);
  const health = getPortalHealth(portal);
  const mailto = buildPortalMailto(portal, url);

  return (
    <li className="flex flex-wrap items-center gap-4 px-4 py-4 transition-colors hover:bg-neutral-50">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-neutral-900">{portal.label}</p>
          {portal.is_active ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              Active
            </span>
          ) : (
            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
              Paused
            </span>
          )}
          {health ? (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${health.cls}`}>
              {health.label}
            </span>
          ) : null}
          {jobCount > 0 ? (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-blue-700">
              {jobCount} {jobCount === 1 ? "job" : "jobs"}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[11px] text-neutral-500">
          Matches jobs for <span className="font-mono font-semibold text-neutral-700">{portal.match_name}</span>
          {portal.contact_name ? <> · Contact: {portal.contact_name}</> : null}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <code className="max-w-[420px] truncate rounded bg-neutral-100 px-2 py-1 font-mono text-[11px] text-neutral-600">
            {url}
          </code>
          <button
            type="button"
            onClick={onCopy}
            className="rounded-md px-2 py-1 text-[11px] font-semibold text-brand transition-colors hover:bg-brand-50"
          >
            {justCopied ? "Copied" : "Copy"}
          </button>
          {mailto ? (
            <a
              href={mailto}
              className="rounded-md px-2 py-1 text-[11px] font-semibold text-brand transition-colors hover:bg-brand-50"
              title={`Email link to ${portal.contact_email}`}
            >
              Email
            </a>
          ) : (
            <span
              className="rounded-md px-2 py-1 text-[11px] font-semibold text-neutral-300"
              title="Add a contact email to enable"
            >
              Email
            </span>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md px-2 py-1 text-[11px] font-semibold text-neutral-600 transition-colors hover:bg-neutral-100"
          >
            Preview
          </a>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[11px] text-neutral-500">
        <div className="text-center">
          <p className="font-bold text-neutral-400">Jobs</p>
          <p className="font-mono font-bold text-blue-700">{jobCount || 0}</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-neutral-400">Views</p>
          <p className="font-mono text-neutral-700">{portal.access_count || 0}</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-neutral-400">Last Seen</p>
          <p className="text-neutral-700">{formatDateTime(portal.last_accessed_at)}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onViewJobs}
          className="rounded-md px-2 py-1 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50"
        >
          Jobs
        </button>
        <button
          type="button"
          onClick={onManageDocs}
          className="rounded-md px-2 py-1 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-50"
        >
          Docs
        </button>
        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          className="rounded-md px-2 py-1 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-60"
        >
          {portal.is_active ? "Pause" : "Activate"}
        </button>
        <button
          type="button"
          onClick={onRotate}
          disabled={busy}
          className="rounded-md px-2 py-1 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-60"
        >
          Rotate token
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md px-2 py-1 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
        >
          {busy ? "..." : "Delete"}
        </button>
      </div>
    </li>
  );
}
