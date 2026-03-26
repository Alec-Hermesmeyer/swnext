import { useEffect, useState } from "react";

function buildInitialValues(surface) {
  const initial = {};

  (surface?.fields || []).forEach((field) => {
    if (field.type === "checkbox") {
      initial[field.name] = false;
      return;
    }

    initial[field.name] = "";
  });

  return {
    ...initial,
    ...(surface?.prefill || {}),
  };
}

function renderField(field, value, onChange) {
  const sharedClassName =
    "w-full rounded-[1rem] border border-[#dbe4f0] bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-all placeholder:text-neutral-400 focus:border-[#0b2a5a]/18 focus:ring-2 focus:ring-[#0b2a5a]/8";

  if (field.type === "textarea") {
    return (
      <textarea
        rows={4}
        value={value}
        placeholder={field.placeholder || ""}
        onChange={(event) => onChange(field.name, event.target.value)}
        className={`${sharedClassName} resize-y min-h-[120px]`}
      />
    );
  }

  if (field.type === "select") {
    const hasEmptyOption = (field.options || []).some((option) => option.value === "");
    return (
      <select
        value={value}
        onChange={(event) => onChange(field.name, event.target.value)}
        className={sharedClassName}
      >
        {!hasEmptyOption ? (
          <option value="">{field.placeholder || "Select an option"}</option>
        ) : null}
        {(field.options || []).map((option) => (
          <option key={`${field.name}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-3 rounded-[1rem] border border-[#dbe4f0] bg-white px-3 py-3 text-sm font-medium text-neutral-700">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(event) => onChange(field.name, event.target.checked)}
          className="h-4 w-4 rounded border-neutral-300 text-[#0b2a5a] focus:ring-[#0b2a5a]/20"
        />
        <span>{field.label}</span>
      </label>
    );
  }

  return (
    <input
      type={field.type === "email" ? "email" : "text"}
      value={value}
      placeholder={field.placeholder || ""}
      onChange={(event) => onChange(field.name, event.target.value)}
      className={sharedClassName}
    />
  );
}

function renderScheduleOverview(surface) {
  return (
    <div className="px-4 py-4 md:px-5">
      {surface.summary?.length ? (
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          {surface.summary.map((item) => (
            <div
              key={`${surface.id}-${item.label}`}
              className="rounded-[1.15rem] border border-[#e6edf5] bg-white/84 px-4 py-3"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                {item.label}
              </div>
              <div className="mt-1 text-xl font-bold tracking-tight text-neutral-950">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {surface.days?.length ? (
        <div className="space-y-3">
          {surface.days.map((day) => (
            <div
              key={`${surface.id}-${day.date}`}
              className="rounded-[1.2rem] border border-[#e6edf5] bg-white/84 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold tracking-tight text-neutral-950">
                    {day.dateFormatted}
                  </div>
                  <div className="text-xs text-neutral-400">{day.date}</div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                    day.finalized
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-[#dbe4f0] bg-[#f7f9fc] text-neutral-500"
                  }`}
                >
                  {day.finalized ? "Finalized" : "Draft"}
                </span>
              </div>

              {day.rigs?.length ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {day.rigs.map((rigEntry) => (
                    <div
                      key={`${day.date}-${rigEntry.rig}`}
                      className="rounded-[1.05rem] border border-[#edf2f7] bg-[#f8fbff] p-3"
                    >
                      <div className="text-sm font-semibold text-[#0b2a5a]">{rigEntry.rig}</div>
                      <div className="mt-2 space-y-1.5 text-sm leading-6 text-neutral-600">
                        <div>
                          <span className="font-medium text-neutral-900">Jobs:</span>{" "}
                          {(rigEntry.jobs || []).join(", ") || "None"}
                        </div>
                        <div>
                          <span className="font-medium text-neutral-900">Crew:</span>{" "}
                          {(rigEntry.workers || []).join(", ") || "None"}
                        </div>
                        {rigEntry.superintendent ? (
                          <div>
                            <span className="font-medium text-neutral-900">Supt:</span>{" "}
                            {rigEntry.superintendent}
                          </div>
                        ) : null}
                        {rigEntry.truck ? (
                          <div>
                            <span className="font-medium text-neutral-900">Truck:</span>{" "}
                            {rigEntry.truck}
                          </div>
                        ) : null}
                        {rigEntry.notes?.length ? (
                          <div>
                            <span className="font-medium text-neutral-900">Notes:</span>{" "}
                            {rigEntry.notes.join(" / ")}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-[1rem] border border-dashed border-[#dbe4f0] bg-[#f8fbff] px-4 py-3 text-sm text-neutral-500">
                  No rig assignments are saved for this day yet.
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.2rem] border border-dashed border-[#dbe4f0] bg-white/80 px-4 py-4 text-sm text-neutral-500">
          {surface.emptyMessage || "No live schedule rows matched this request."}
        </div>
      )}

      {surface.tips?.length ? (
        <div className="mt-4 rounded-[1.15rem] border border-[#e6edf5] bg-white/72 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Why this surface exists
          </div>
          <div className="mt-2 space-y-1 text-sm leading-6 text-neutral-500">
            {surface.tips.map((tip) => (
              <div key={tip}>{tip}</div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function renderScheduleBuilderContext(surface) {
  return (
    <div className="px-4 py-4 md:px-5">
      {surface.summary?.length ? (
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          {surface.summary.map((item) => (
            <div
              key={`${surface.id}-${item.label}`}
              className="rounded-[1.1rem] border border-[#e6edf5] bg-white/84 px-3 py-3 text-center"
            >
              <div className="text-lg font-bold text-[#0b2a5a]">{item.value}</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.2rem] border border-[#e6edf5] bg-white/84 p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Crew ({surface.crewList?.length || 0})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(surface.crewList || []).map((w) => (
              <span
                key={w.name}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  w.scheduled
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-600"
                    : "border border-[#dbe4f0] bg-[#f8fbff] text-neutral-700"
                }`}
              >
                {w.name}
                {w.role ? ` (${w.role})` : ""}
                {w.scheduled ? " ✓" : ""}
              </span>
            ))}
            {!surface.crewList?.length ? (
              <span className="text-sm text-neutral-400">No active crew loaded</span>
            ) : null}
          </div>
        </div>

        <div className="rounded-[1.2rem] border border-[#e6edf5] bg-white/84 p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Active Jobs ({surface.jobList?.length || 0})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(surface.jobList || []).map((j) => (
              <span
                key={j.name}
                className="rounded-full border border-[#dbe4f0] bg-[#f8fbff] px-2.5 py-1 text-xs font-medium text-neutral-700"
              >
                {j.name}
                {j.number ? ` #${j.number}` : ""}
              </span>
            ))}
            {!surface.jobList?.length ? (
              <span className="text-sm text-neutral-400">No active jobs loaded</span>
            ) : null}
          </div>
        </div>
      </div>

      {surface.existingRigs?.length ? (
        <div className="mt-4 rounded-[1.2rem] border border-[#e6edf5] bg-white/84 p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Already scheduled for this date
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {surface.existingRigs.map((rig) => (
              <div key={rig.rig} className="rounded-[1rem] border border-[#e6edf5] bg-white px-3 py-2.5">
                <div className="text-xs font-bold text-[#0b2a5a]">{rig.rig}</div>
                {rig.workers?.length ? (
                  <div className="mt-1 text-xs text-neutral-600">Crew: {rig.workers.join(", ")}</div>
                ) : null}
                {rig.jobs?.length ? (
                  <div className="mt-0.5 text-xs text-neutral-500">Jobs: {rig.jobs.join(", ")}</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {surface.tips?.length ? (
        <div className="mt-4 rounded-[1.15rem] border border-[#e6edf5] bg-white/72 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Tips
          </div>
          <div className="mt-2 space-y-1 text-sm leading-6 text-neutral-500">
            {surface.tips.map((tip) => (
              <div key={tip}>{tip}</div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function renderQuickActions(actions, onQuickAction) {
  if (!actions?.length || !onQuickAction) return null;

  return (
    <div className="border-t border-[#e6edf5] px-4 py-3 md:px-5">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        Quick actions
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => onQuickAction(action.message)}
            className="rounded-full border border-[#dbe4f0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0b2a5a] transition-all hover:border-[#0b2a5a]/30 hover:bg-[#f0f5ff]"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AssistantTaskSurface({
  surface,
  sessionId,
  onComplete,
  onQuickAction,
}) {
  const [values, setValues] = useState(() => buildInitialValues(surface));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(!!surface?.completed);
  const [completedMessage, setCompletedMessage] = useState(
    surface?.completed ? "This work surface was already completed in this thread." : ""
  );

  useEffect(() => {
    setValues(buildInitialValues(surface));
    setSubmitting(false);
    setError("");
    setCompleted(!!surface?.completed);
    setCompletedMessage(
      surface?.completed ? "This work surface was already completed in this thread." : ""
    );
  }, [surface]);

  const handleChange = (name, nextValue) => {
    setValues((current) => ({
      ...current,
      [name]: nextValue,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || !surface?.id || !sessionId) return;

    const missingRequiredField = (surface.fields || []).find((field) => {
      if (!field.required) return false;
      const value = values[field.name];
      return value === "" || value === null || value === undefined;
    });

    if (missingRequiredField) {
      setError(`${missingRequiredField.label} is required.`);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin-assistant-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          surfaceType: surface.type,
          surfaceId: surface.id,
          values,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not complete assistant action.");
      }

      setCompleted(true);
      setCompletedMessage(data.assistantMessage || surface.successLabel || "Completed.");
      if (typeof onComplete === "function") {
        onComplete({
          surfaceId: surface.id,
          userMessage: data.userMessage,
          assistantMessage: data.assistantMessage,
          actionsPerformed: !!data.actionsPerformed,
        });
      }
    } catch (submitError) {
      setError(submitError.message || "Could not complete assistant action.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 overflow-hidden rounded-[1.55rem] border border-[#dbe4f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_16px_42px_rgba(15,23,42,0.05)]">
      <div className="border-b border-[#e6edf5] px-4 py-4 md:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#dbe4f0] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0b2a5a]">
            {surface.module}
          </span>
          {surface.stage ? (
            <span className="rounded-full border border-[#dbe4f0] bg-[#f7f9fc] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              {surface.stage}
            </span>
          ) : null}
          {surface.readOnly ? (
            <span className="rounded-full border border-[#dbe4f0] bg-[#f7f9fc] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Live view
            </span>
          ) : completed ? (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Completed
            </span>
          ) : (
            <span className="rounded-full border border-[#dbe4f0] bg-[#f7f9fc] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Interactive surface
            </span>
          )}
        </div>
        <div className="mt-3 text-lg font-bold tracking-tight text-neutral-950">
          {surface.title}
        </div>
        <p className="mt-1 text-sm leading-6 text-neutral-500">{surface.description}</p>
      </div>

      {surface.type === "schedule_builder_context" ? (
        renderScheduleBuilderContext(surface)
      ) : surface.readOnly ? (
        renderScheduleOverview(surface)
      ) : completed ? (
        <div className="px-4 py-4 md:px-5">
          <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
            {completedMessage}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="px-4 py-4 md:px-5">
          <div className="grid gap-3 md:grid-cols-2">
            {(surface.fields || []).map((field) => (
              <div
                key={field.name}
                className={field.type === "checkbox" ? "md:col-span-2" : field.span === 2 ? "md:col-span-2" : ""}
              >
                {field.type !== "checkbox" ? (
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    {field.label}
                    {field.required ? " *" : ""}
                  </label>
                ) : null}
                {renderField(field, values[field.name], handleChange)}
                {field.type === "select" && values[field.name] && field.options?.find((option) => option.value === values[field.name])?.hint ? (
                  <div className="mt-1.5 text-xs text-neutral-400">
                    {field.options.find((option) => option.value === values[field.name]).hint}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {surface.tips?.length ? (
            <div className="mt-4 rounded-[1.15rem] border border-[#e6edf5] bg-white/72 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Why this surface exists
              </div>
              <div className="mt-2 space-y-1 text-sm leading-6 text-neutral-500">
                {surface.tips.map((tip) => (
                  <div key={tip}>{tip}</div>
                ))}
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-[1.1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-neutral-400">
              Saving here updates the live admin data behind the assistant.
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center rounded-[1rem] bg-[linear-gradient(180deg,#143a75_0%,#0b2a5a_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(11,42,90,0.18)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving..." : surface.submitLabel || "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
