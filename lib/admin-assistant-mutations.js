import { VALID_STAGE_IDS } from "@/lib/sales-pipeline";

const cleanTextOrNull = (value) => {
  const cleaned = String(value || "").trim();
  return cleaned || null;
};

function normalizeSpamRule(ruleType, ruleValue) {
  const type = String(ruleType || "").trim().toLowerCase();
  let value = String(ruleValue || "").trim().toLowerCase();
  if (type === "domain" && value.startsWith("@")) value = value.slice(1);
  return { type, value };
}

// ── Schedule builder helpers ──

async function ensureScheduleExists(supabase, date) {
  const { data: existing } = await supabase
    .from("crew_schedules")
    .select("id, schedule_date, is_finalized")
    .eq("schedule_date", date)
    .limit(1)
    .single();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("crew_schedules")
    .insert({ schedule_date: date })
    .select("id, schedule_date, is_finalized")
    .single();

  if (error) return null;
  return created;
}

async function resolveByName(supabase, table, nameField, nameValue, extraFilters = {}) {
  const clean = String(nameValue || "").trim();
  if (!clean) return null;

  let query = supabase.from(table).select("*").ilike(nameField, clean);
  for (const [key, val] of Object.entries(extraFilters)) {
    query = query.eq(key, val);
  }
  const { data } = await query.limit(1);
  if (data?.[0]) return data[0];

  let partialQuery = supabase.from(table).select("*").ilike(nameField, `%${clean}%`);
  for (const [key, val] of Object.entries(extraFilters)) {
    partialQuery = partialQuery.eq(key, val);
  }
  const { data: partial } = await partialQuery.limit(1);
  return partial?.[0] || null;
}

function parseIntOrNull(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseNumericOrNull(v) {
  if (v === undefined || v === null || v === "") return null;
  const s = String(v).replace(/[$,\s]/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

const normalizeCrewJobPayload = (input = {}) => ({
  job_name: String(input.job_name || "").trim(),
  job_number: cleanTextOrNull(input.job_number),
  dig_tess_number: cleanTextOrNull(input.dig_tess_number),
  customer_name: cleanTextOrNull(input.customer_name),
  hiring_contractor: cleanTextOrNull(input.hiring_contractor),
  hiring_contact_name: cleanTextOrNull(input.hiring_contact_name),
  hiring_contact_phone: cleanTextOrNull(input.hiring_contact_phone),
  hiring_contact_email: cleanTextOrNull(input.hiring_contact_email),
  address: cleanTextOrNull(input.address),
  city: cleanTextOrNull(input.city),
  zip: cleanTextOrNull(input.zip),
  pm_name: cleanTextOrNull(input.pm_name),
  pm_phone: cleanTextOrNull(input.pm_phone),
  default_rig: cleanTextOrNull(input.default_rig),
  crane_required: !!input.crane_required,
  estimated_days: parseIntOrNull(input.estimated_days),
  actual_days: parseIntOrNull(input.actual_days),
  mob_days: parseIntOrNull(input.mob_days),
  actual_mob_days: parseIntOrNull(input.actual_mob_days),
  bid_amount: parseNumericOrNull(input.bid_amount),
  contract_amount: parseNumericOrNull(input.contract_amount),
  pier_count: parseIntOrNull(input.pier_count),
  scope_description: cleanTextOrNull(input.scope_description),
  job_status: cleanTextOrNull(input.job_status),
  start_date: parseSalesDateInput(input.start_date),
  end_date: parseSalesDateInput(input.end_date),
});

function parseSalesDateInput(v) {
  if (v === undefined || v === null || v === "") return null;
  const s = String(v).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function normalizeSalesStage(v) {
  const s = String(v || "").trim().toLowerCase();
  return VALID_STAGE_IDS.has(s) ? s : null;
}

async function ensureCustomerExists(supabase, name) {
  const clean = String(name || "").trim();
  if (!clean) return;

  const { data: existing, error: findError } = await supabase
    .from("Customer")
    .select("id")
    .ilike("name", clean)
    .limit(1);

  if (findError || (existing && existing.length > 0)) return;

  await supabase.from("Customer").insert({ name: clean });
}

export async function upsertCrewJob(supabase, rawInput) {
  const payload = normalizeCrewJobPayload(rawInput);
  if (!payload.job_name) {
    return { success: false, error: "job_name is required for crew jobs" };
  }

  let match = null;
  if (payload.job_number) {
    const { data: numberMatch, error: numberError } = await supabase
      .from("crew_jobs")
      .select("id, job_name, job_number")
      .eq("job_number", payload.job_number)
      .limit(1);
    if (numberError) return { success: false, error: numberError.message };
    match = numberMatch?.[0] || null;
  }

  if (!match) {
    const { data: nameMatch, error: nameError } = await supabase
      .from("crew_jobs")
      .select("id, job_name, job_number")
      .ilike("job_name", payload.job_name)
      .limit(1);
    if (nameError) return { success: false, error: nameError.message };
    match = nameMatch?.[0] || null;
  }

  if (match) {
    const { error: updateError, data: updated } = await supabase
      .from("crew_jobs")
      .update({ ...payload, is_active: true })
      .eq("id", match.id)
      .select("id, job_name, job_number")
      .single();
    if (updateError) return { success: false, error: updateError.message };
    await ensureCustomerExists(supabase, payload.hiring_contractor);
    return {
      success: true,
      action: "updated",
      message: `Updated crew job "${updated.job_name}"${
        updated.job_number ? ` (#${updated.job_number})` : ""
      }`,
      job: updated,
    };
  }

  const { error: insertError, data: inserted } = await supabase
    .from("crew_jobs")
    .insert(payload)
    .select("id, job_name, job_number")
    .single();
  if (insertError) return { success: false, error: insertError.message };
  await ensureCustomerExists(supabase, payload.hiring_contractor);
  return {
    success: true,
    action: "created",
    message: `Created crew job "${inserted.job_name}"${
      inserted.job_number ? ` (#${inserted.job_number})` : ""
    }`,
    job: inserted,
  };
}

export async function updateCrewJobDetail(supabase, rawInput = {}) {
  const jobId = cleanTextOrNull(rawInput.job_id || rawInput.id);
  if (!jobId) {
    return { success: false, error: "job_id is required to update a crew job" };
  }

  const { data: existing, error: findError } = await supabase
    .from("crew_jobs")
    .select("id, job_name, job_number")
    .eq("id", jobId)
    .single();

  if (findError || !existing) {
    return { success: false, error: "Could not find that crew job" };
  }

  const updates = {};
  [
    "job_name",
    "job_number",
    "dig_tess_number",
    "customer_name",
    "hiring_contractor",
    "hiring_contact_name",
    "hiring_contact_phone",
    "hiring_contact_email",
    "address",
    "city",
    "zip",
    "pm_name",
    "pm_phone",
    "default_rig",
    "scope_description",
    "job_status",
  ].forEach((field) => {
    const value = cleanTextOrNull(rawInput[field]);
    if (value !== null) {
      updates[field] = value;
    }
  });

  // Integer fields
  ["estimated_days", "actual_days", "mob_days", "actual_mob_days", "pier_count"].forEach((field) => {
    if (rawInput[field] !== undefined && rawInput[field] !== null) {
      const parsed = parseIntOrNull(rawInput[field]);
      if (parsed !== null) updates[field] = parsed;
    }
  });

  // Numeric/dollar fields
  ["bid_amount", "contract_amount"].forEach((field) => {
    if (rawInput[field] !== undefined && rawInput[field] !== null) {
      const parsed = parseNumericOrNull(rawInput[field]);
      if (parsed !== null) updates[field] = parsed;
    }
  });

  // Date fields
  ["start_date", "end_date"].forEach((field) => {
    if (rawInput[field] !== undefined && rawInput[field] !== null) {
      const parsed = parseSalesDateInput(rawInput[field]);
      if (parsed) updates[field] = parsed;
    }
  });

  if (rawInput.crane_required === true || rawInput.crane_required === "true") {
    updates.crane_required = true;
  }

  if (rawInput.crane_required === false || rawInput.crane_required === "false") {
    updates.crane_required = false;
  }

  if (!Object.keys(updates).length) {
    return { success: false, error: "Provide at least one field to update" };
  }

  updates.is_active = true;

  const { error: updateError, data: updated } = await supabase
    .from("crew_jobs")
    .update(updates)
    .eq("id", jobId)
    .select("id, job_name, job_number")
    .single();

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  await ensureCustomerExists(supabase, updates.hiring_contractor);

  return {
    success: true,
    action: "updated",
    message: `Updated crew job "${updated.job_name}"${
      updated.job_number ? ` (#${updated.job_number})` : ""
    }`,
    job: updated,
  };
}

export async function toggleCrewJobActive(supabase, rawInput = {}) {
  const jobId = cleanTextOrNull(rawInput.job_id || rawInput.id);
  const setActive = rawInput.set_active;

  if (!jobId) {
    return { success: false, error: "job_id is required to toggle a crew job" };
  }

  if (typeof setActive !== "boolean") {
    return { success: false, error: "set_active must be true or false" };
  }

  const { data: existing, error: findError } = await supabase
    .from("crew_jobs")
    .select("id, job_name, job_number, is_active")
    .eq("id", jobId)
    .single();

  if (findError || !existing) {
    return { success: false, error: "Could not find that crew job" };
  }

  const { data: updated, error: updateError } = await supabase
    .from("crew_jobs")
    .update({ is_active: setActive })
    .eq("id", jobId)
    .select("id, job_name, job_number, is_active")
    .single();

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return {
    success: true,
    action: "updated",
    message: `Set crew job "${updated.job_name}"${
      updated.job_number ? ` (#${updated.job_number})` : ""
    } to ${setActive ? "active" : "inactive"}`,
    job: updated,
  };
}

export async function createAdminUser(supabase, rawInput = {}) {
  const email = String(rawInput.email || "").trim().toLowerCase();
  const password = String(rawInput.password || "");
  const fullName = String(rawInput.full_name || "").trim();
  const role = cleanTextOrNull(rawInput.role) || "viewer";
  const department = cleanTextOrNull(rawInput.department);
  const accessLevel = Math.max(1, Math.min(3, Number(rawInput.access_level) || 3));

  if (!email) {
    return { success: false, error: "Email is required" };
  }

  if (!password || password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || "" },
  });

  if (authError) {
    return { success: false, error: authError.message || "Could not create user" };
  }

  const userId = authData?.user?.id;
  if (!userId) {
    return { success: false, error: "User created but no ID was returned" };
  }

  const profileRow = {
    id: userId,
    role,
    access_level: accessLevel,
  };

  if (fullName) profileRow.full_name = fullName;
  if (department) profileRow.department = department;

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(profileRow, { onConflict: "id" });

  if (profileError) {
    return {
      success: false,
      error: profileError.message || "User account created but profile save failed",
    };
  }

  return {
    success: true,
    action: "created",
    message: `Created user "${fullName || email}" as ${role} with access level ${accessLevel}`,
    user: {
      id: userId,
      email,
      full_name: fullName,
      role,
      department: department || "",
      access_level: accessLevel,
    },
  };
}

export async function executeAdminAssistantMutation(supabase, name, args, context = {}) {
  switch (name) {
    case "create_job_position": {
      const { jobTitle, jobDesc, is_Open = true } = args;
      const { data, error } = await supabase
        .from("jobs")
        .insert([{ jobTitle, jobDesc, is_Open }])
        .select("*");
      if (error) return { success: false, error: error.message };
      return {
        success: true,
        message: `Created job position "${jobTitle}" (${is_Open ? "Open" : "Closed"})`,
        job: data[0],
      };
    }

    case "toggle_job_position": {
      const { jobTitle, setOpen } = args;
      const { data: matches } = await supabase
        .from("jobs")
        .select("id, jobTitle, is_Open")
        .ilike("jobTitle", jobTitle);
      if (!matches || matches.length === 0) {
        return { success: false, error: `No job position found matching "${jobTitle}"` };
      }
      const job = matches[0];
      const { error } = await supabase
        .from("jobs")
        .update({ is_Open: setOpen })
        .eq("id", job.id);
      if (error) return { success: false, error: error.message };
      return {
        success: true,
        message: `"${job.jobTitle}" is now ${
          setOpen ? "Open (visible on website)" : "Closed (hidden from website)"
        }`,
      };
    }

    case "add_company_contact": {
      const { name, job_title, email = "", phone = "" } = args;
      const { data, error } = await supabase
        .from("company_contacts")
        .insert([{ name, job_title, email, phone }])
        .select("*");
      if (error) return { success: false, error: error.message };
      return {
        success: true,
        message: `Added ${name} (${job_title}) to company contacts`,
        contact: data[0],
      };
    }

    case "delete_company_contact": {
      const { name } = args;
      const { data: matches } = await supabase
        .from("company_contacts")
        .select("id, name")
        .ilike("name", name);
      if (!matches || matches.length === 0) {
        return { success: false, error: `No contact found matching "${name}"` };
      }
      const contact = matches[0];
      const { error } = await supabase
        .from("company_contacts")
        .delete()
        .eq("id", contact.id);
      if (error) return { success: false, error: error.message };
      return { success: true, message: `Removed ${contact.name} from company contacts` };
    }

    case "add_spam_block_rule": {
      const { type, value } = normalizeSpamRule(args.rule_type, args.rule_value);
      if (!["email", "domain"].includes(type) || !value) {
        return { success: false, error: "rule_type must be email/domain and rule_value is required" };
      }
      const { data, error } = await supabase
        .from("spam_blocklist")
        .insert({
          rule_type: type,
          rule_value: value,
          reason: cleanTextOrNull(args.reason),
          is_active: true,
        })
        .select("id, rule_type, rule_value, is_active")
        .single();
      if (error) return { success: false, error: error.message };
      return {
        success: true,
        message: `Blocked ${type === "domain" ? `domain ${data.rule_value}` : data.rule_value}. Future submissions will be silently accepted without email notification.`,
        rule: data,
      };
    }

    case "list_spam_block_rules": {
      const { data, error } = await supabase
        .from("spam_blocklist")
        .select("id, rule_type, rule_value, reason, is_active, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) return { success: false, error: error.message };
      if (!data?.length) {
        return { success: true, message: "No spam block rules are configured yet." };
      }
      const lines = data.map((rule) => {
        const label = rule.rule_type === "domain" ? `@${rule.rule_value}` : rule.rule_value;
        return `- [${rule.is_active ? "active" : "inactive"}] ${label}${rule.reason ? ` — ${rule.reason}` : ""}`;
      });
      return {
        success: true,
        message: `Spam block rules (${data.length}):\n${lines.join("\n")}`,
        rules: data,
      };
    }

    case "toggle_spam_block_rule": {
      const id = cleanTextOrNull(args.id);
      const isActive = args.is_active;
      if (!id || typeof isActive !== "boolean") {
        return { success: false, error: "id and is_active are required" };
      }
      const { data, error } = await supabase
        .from("spam_blocklist")
        .update({ is_active: isActive })
        .eq("id", id)
        .select("id, rule_type, rule_value, is_active")
        .single();
      if (error) return { success: false, error: error.message };
      return {
        success: true,
        message: `${data.rule_type === "domain" ? `@${data.rule_value}` : data.rule_value} is now ${data.is_active ? "active" : "inactive"} in the spam blocklist.`,
        rule: data,
      };
    }

    case "remove_spam_block_rule": {
      const id = cleanTextOrNull(args.id);
      if (!id) {
        return { success: false, error: "id is required" };
      }
      const { data: existing } = await supabase
        .from("spam_blocklist")
        .select("id, rule_type, rule_value")
        .eq("id", id)
        .single();
      const { error } = await supabase
        .from("spam_blocklist")
        .delete()
        .eq("id", id);
      if (error) return { success: false, error: error.message };
      const label = existing
        ? existing.rule_type === "domain"
          ? `@${existing.rule_value}`
          : existing.rule_value
        : "rule";
      return { success: true, message: `Removed ${label} from the spam blocklist.` };
    }

    case "create_crew_job":
      return upsertCrewJob(supabase, args);

    case "update_crew_job_detail":
      return updateCrewJobDetail(supabase, args);

    case "toggle_crew_job_active":
      return toggleCrewJobActive(supabase, args);

    case "create_admin_user":
      return createAdminUser(supabase, args);

    case "bulk_create_crew_jobs": {
      const rows = Array.isArray(args?.rows) ? args.rows : [];
      if (!rows.length) {
        return { success: false, error: "rows is required and must include at least one job" };
      }

      let created = 0;
      let updated = 0;
      let failed = 0;
      const failures = [];
      const maxRows = 40;

      for (const [index, row] of rows.slice(0, maxRows).entries()) {
        const result = await upsertCrewJob(supabase, row);
        if (!result.success) {
          failed += 1;
          failures.push(`Row ${index + 1}: ${result.error}`);
          continue;
        }
        if (result.action === "updated") updated += 1;
        else created += 1;
      }

      return {
        success: failed === 0,
        message: `Bulk crew job intake complete. Created: ${created}, Updated: ${updated}, Failed: ${failed}.`,
        created,
        updated,
        failed,
        failures: failures.slice(0, 5),
      };
    }

    // ── Down day ──

    case "mark_down_day": {
      const { schedule_date, reason, clear_assignments } = args;
      if (!schedule_date || !reason) {
        return { success: false, error: "schedule_date and reason are required" };
      }

      const schedule = await ensureScheduleExists(supabase, schedule_date);
      if (!schedule) {
        return { success: false, error: `Could not create schedule for ${schedule_date}` };
      }

      // Add down day note via rig details — use a special "Down Day" category
      // First check if a "Down Day" category exists, if not just store in notes
      const { data: categories } = await supabase
        .from("crew_categories")
        .select("id, name")
        .ilike("name", "%down%")
        .limit(1);

      const downNote = `DOWN DAY: ${reason}`;

      if (categories?.length) {
        await supabase
          .from("schedule_rig_details")
          .upsert({
            schedule_id: schedule.id,
            category_id: categories[0].id,
            notes: downNote,
          }, { onConflict: "schedule_id,category_id" });
      }

      // Optionally clear all assignments for this day
      if (clear_assignments) {
        await supabase
          .from("crew_assignments")
          .delete()
          .eq("schedule_id", schedule.id);
      }

      // Mark as finalized with the down day note
      await supabase
        .from("crew_schedules")
        .update({
          is_finalized: true,
          finalized_at: new Date().toISOString(),
        })
        .eq("id", schedule.id);

      return {
        success: true,
        message: `Marked ${schedule_date} as a down day: ${reason}.${clear_assignments ? " All crew assignments for this day have been cleared." : ""} Schedule is finalized.`,
      };
    }

    // ── Schedule automation mutations ──

    case "finalize_schedule": {
      const { schedule_date } = args;
      if (!schedule_date) {
        return { success: false, error: "schedule_date is required" };
      }

      const { data: schedule, error: findError } = await supabase
        .from("crew_schedules")
        .select("id, schedule_date, is_finalized")
        .eq("schedule_date", schedule_date)
        .limit(1)
        .single();

      if (findError || !schedule) {
        return { success: false, error: `No schedule found for ${schedule_date}` };
      }

      if (schedule.is_finalized) {
        return { success: true, message: `Schedule for ${schedule_date} is already finalized.` };
      }

      const { error: updateError } = await supabase
        .from("crew_schedules")
        .update({
          is_finalized: true,
          finalized_at: new Date().toISOString(),
          finalized_by: args._user_name || "assistant",
        })
        .eq("id", schedule.id);

      if (updateError) return { success: false, error: updateError.message };
      return { success: true, message: `Finalized the crew schedule for ${schedule_date}.` };
    }

    case "send_schedule_email": {
      const { schedule_date } = args;
      if (!schedule_date) {
        return { success: false, error: "schedule_date is required" };
      }

      const { data: schedule } = await supabase
        .from("crew_schedules")
        .select("id, schedule_date, is_finalized")
        .eq("schedule_date", schedule_date)
        .limit(1)
        .single();

      if (!schedule) {
        return { success: false, error: `No schedule found for ${schedule_date}` };
      }

      const { data: categories } = await supabase
        .from("crew_categories")
        .select("id, name, color, sort_order")
        .order("sort_order");

      const { data: assignments } = await supabase
        .from("crew_assignments")
        .select("id, category_id, worker_id, job_id, job_name, notes, crew_workers(name), crew_jobs(job_name)")
        .eq("schedule_id", schedule.id);

      const { data: rigDetails } = await supabase
        .from("schedule_rig_details")
        .select("category_id, crew_superintendents(name), crew_trucks(truck_number), crane_info")
        .eq("schedule_id", schedule.id);

      const rigDetailMap = {};
      (rigDetails || []).forEach((detail) => {
        rigDetailMap[detail.category_id] = detail;
      });

      const parseDayTypeFromNotes = (notes) => {
        const raw = String(notes || "").trim();
        if (!raw.startsWith("__rig_day_type__:")) return "working";
        const value = raw.replace("__rig_day_type__:", "").trim().toLowerCase();
        return value || "working";
      };

      const defaultStatusLabel = (dayType) => {
        if (dayType === "mob") return "Mob Rig";
        if (dayType === "down_day") return "Down Day";
        if (dayType === "repairs") return "Repairs";
        if (dayType === "shop") return "Shop / Yard";
        if (dayType === "custom") return "Custom Status";
        return "";
      };

      const rigStatusByCategoryId = {};
      (assignments || []).forEach((assignment) => {
        const dayType = parseDayTypeFromNotes(assignment.notes);
        if (dayType === "working") return;
        rigStatusByCategoryId[assignment.category_id] = {
          day_type: dayType,
          status_label:
            String(assignment.job_name || "").trim() || defaultStatusLabel(dayType),
        };
      });

      const mappedAssignments = (assignments || [])
        .filter((assignment) => assignment.worker_id)
        .map((a) => ({
        category_id: a.category_id,
        worker_name: a.crew_workers?.name || "Unassigned",
        job_name: a.crew_jobs?.job_name || a.job_name || "",
      }));

      const mappedRigDetails = (categories || []).map((category) => {
        const detail = rigDetailMap[category.id] || {};
        const status = rigStatusByCategoryId[category.id] || {};
        return {
          category_id: category.id,
          superintendent_name: detail.crew_superintendents?.name || "",
          truck_number: detail.crew_trucks?.truck_number || "",
          crane_info: detail.crane_info || "",
          day_type: status.day_type || "working",
          status_label: status.status_label || "",
        };
      });

      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const response = await fetch(`${siteUrl}/api/send-schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduleDate: schedule_date,
            categories: categories || [],
            assignments: mappedAssignments,
            rigDetails: mappedRigDetails,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          return { success: false, error: errData.message || "Failed to send schedule email" };
        }

        return { success: true, message: `Schedule email sent for ${schedule_date}.` };
      } catch (err) {
        return { success: false, error: `Email send failed: ${err.message}` };
      }
    }

    case "send_packets": {
      const { schedule_date } = args;
      if (!schedule_date) {
        return { success: false, error: "schedule_date is required" };
      }

      const { data: schedule } = await supabase
        .from("crew_schedules")
        .select("id, schedule_date")
        .eq("schedule_date", schedule_date)
        .limit(1)
        .single();

      if (!schedule) {
        return { success: false, error: `No schedule found for ${schedule_date}` };
      }

      const { data: assignments } = await supabase
        .from("crew_assignments")
        .select(
          "id, category_id, crew_workers(name, phone), crew_jobs(job_name, job_number, customer_name, address, city, zip, hiring_contact_name, hiring_contact_phone, hiring_contact_email, pm_name, dig_tess_number), crew_categories(name)"
        )
        .eq("schedule_id", schedule.id);

      const { data: rigDetails } = await supabase
        .from("schedule_rig_details")
        .select("category_id, crew_superintendents(name, phone), crew_trucks(truck_number), crane_info")
        .eq("schedule_id", schedule.id);

      const rigDetailMap = {};
      (rigDetails || []).forEach((r) => {
        rigDetailMap[r.category_id] = r;
      });

      const packets = (assignments || [])
        .filter((a) => a.crew_workers?.name)
        .map((a) => {
          const rd = rigDetailMap[a.category_id] || {};
          const job = a.crew_jobs || {};
          return {
            worker_name: a.crew_workers.name,
            worker_phone: a.crew_workers.phone || "",
            rig_name: a.crew_categories?.name || "",
            job_name: job.job_name || "",
            job_number: job.job_number || "",
            customer_name: job.customer_name || "",
            address: job.address || "",
            city: job.city || "",
            zip: job.zip || "",
            hiring_contact_name: job.hiring_contact_name || "",
            hiring_contact_phone: job.hiring_contact_phone || "",
            hiring_contact_email: job.hiring_contact_email || "",
            pm_name: job.pm_name || "",
            dig_tess_number: job.dig_tess_number || "",
            superintendent_name: rd.crew_superintendents?.name || "",
            superintendent_phone: rd.crew_superintendents?.phone || "",
            truck_number: rd.crew_trucks?.truck_number || "",
            crane_info: rd.crane_info || "",
          };
        });

      if (!packets.length) {
        return { success: false, error: `No crew assignments found for ${schedule_date} to build packets.` };
      }

      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const response = await fetch(`${siteUrl}/api/send-packets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduleDate: schedule_date, packets }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          return { success: false, error: errData.message || "Failed to send packets" };
        }

        return { success: true, message: `Sent ${packets.length} crew packet(s) for ${schedule_date}.` };
      } catch (err) {
        return { success: false, error: `Packet send failed: ${err.message}` };
      }
    }

    case "update_job_progress": {
      const jobName = cleanTextOrNull(args.job_name);
      if (!jobName) {
        return { success: false, error: "job_name is required" };
      }

      const { data: matches } = await supabase
        .from("crew_jobs")
        .select("id, job_name, job_number")
        .or(`job_name.ilike.%${jobName}%,job_number.ilike.%${jobName}%`)
        .limit(3);

      if (!matches || !matches.length) {
        return { success: false, error: `No crew job found matching "${jobName}"` };
      }

      const job = matches[0];
      const progressPayload = {
        job_id: job.id,
        ...(args.holes_completed != null && { holes_completed: Number(args.holes_completed) }),
        ...(args.holes_target != null && { holes_target: Number(args.holes_target) }),
        ...(args.status && { status: args.status }),
        ...(args.notes && { notes: args.notes }),
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from("crew_job_progress")
        .select("job_id")
        .eq("job_id", job.id)
        .limit(1)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("crew_job_progress")
          .update(progressPayload)
          .eq("job_id", job.id);
        if (error) return { success: false, error: error.message };
      } else {
        const { error } = await supabase
          .from("crew_job_progress")
          .insert({ ...progressPayload, status: progressPayload.status || "active" });
        if (error) return { success: false, error: error.message };
      }

      await supabase.from("crew_job_progress_updates").insert({
        job_id: job.id,
        update_date: new Date().toISOString().split("T")[0],
        status: progressPayload.status || existing?.status || "active",
        holes_completed: progressPayload.holes_completed ?? null,
        holes_target: progressPayload.holes_target ?? null,
        notes: progressPayload.notes || null,
      });

      const label = `${job.job_name}${job.job_number ? ` #${job.job_number}` : ""}`;
      return { success: true, message: `Updated progress for ${label}.` };
    }

    // ── Social media mutations ──

    case "create_social_post": {
      const content = cleanTextOrNull(args.content);
      if (!content) {
        return { success: false, error: "content is required for a social post" };
      }

      const platforms = Array.isArray(args.platforms) && args.platforms.length
        ? args.platforms
        : ["facebook"];

      const insertPayload = {
        content,
        platforms,
        post_type: args.post_type || "general",
        status: "pending",
        ...(args.scheduled_for && { scheduled_for: args.scheduled_for }),
      };

      const { data: post, error: insertError } = await supabase
        .from("social_posts")
        .insert(insertPayload)
        .select("id, platforms, status, post_type")
        .single();

      if (insertError) return { success: false, error: insertError.message };
      return {
        success: true,
        message: `Created a ${post.post_type} social post draft for ${platforms.join(", ")}. Status: pending review.`,
        post,
      };
    }

    case "update_social_post": {
      const postId = cleanTextOrNull(args.post_id);
      if (!postId) {
        return { success: false, error: "post_id is required" };
      }

      const { data: existing, error: findError } = await supabase
        .from("social_posts")
        .select("id, status")
        .eq("id", postId)
        .single();

      if (findError || !existing) {
        return { success: false, error: "Social post not found" };
      }

      const updates = {};
      if (args.content) updates.content = args.content;
      if (args.status) updates.status = args.status;
      if (args.scheduled_for) updates.scheduled_for = args.scheduled_for;
      updates.updated_at = new Date().toISOString();

      if (!Object.keys(updates).length) {
        return { success: false, error: "Provide at least one field to update" };
      }

      const { error: updateError } = await supabase
        .from("social_posts")
        .update(updates)
        .eq("id", postId);

      if (updateError) return { success: false, error: updateError.message };
      return { success: true, message: `Updated social post ${postId}. ${updates.status ? `Status: ${updates.status}.` : ""}` };
    }

    // ── Social media Flask API mutations ──

    case "get_social_planning": {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(`${siteUrl}/api/social/planning/summary`, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) {
          return { success: false, error: `Planning API returned ${response.status}` };
        }
        const data = await response.json();
        return { success: true, message: JSON.stringify(data, null, 2) };
      } catch (err) {
        return { success: false, error: `Could not fetch planning summary: ${err.name === "AbortError" ? "request timed out — the social media backend may not be running" : err.message}` };
      }
    }

    case "get_social_library": {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(`${siteUrl}/api/social/library/posts`, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) {
          return { success: false, error: `Library API returned ${response.status}` };
        }
        const data = await response.json();
        const posts = Array.isArray(data.posts || data) ? (data.posts || data) : [];
        const summary = posts.slice(0, 10).map((p) => {
          const content = String(p.content || p.text || "").substring(0, 100);
          return `- [${p.status || "unknown"}] ${p.platform || ""}: "${content}${content.length >= 100 ? "..." : ""}"`;
        }).join("\n");
        return { success: true, message: `${posts.length} post(s) in library:\n${summary || "No posts found."}` };
      } catch (err) {
        return { success: false, error: `Could not fetch post library: ${err.name === "AbortError" ? "request timed out — the social media backend may not be running" : err.message}` };
      }
    }

    case "social_strategy_chat": {
      const userMessage = String(args.message || "").trim();
      if (!userMessage) {
        return { success: false, error: "message is required for social strategy chat" };
      }
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const headers = { "Content-Type": "application/json" };
        if (context.cookieHeader) {
          headers.Cookie = context.cookieHeader;
        }
        const response = await fetch(`${siteUrl}/api/social/chat`, {
          method: "POST",
          headers,
          body: JSON.stringify({ message: userMessage, ...(context.userId ? { user_id: context.userId } : {}) }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!response.ok) {
          return { success: false, error: `Social chat API returned ${response.status}` };
        }
        const data = await response.json();
        return { success: true, message: data.response || data.reply || data.message || JSON.stringify(data) };
      } catch (err) {
        return { success: false, error: `Social strategy chat failed: ${err.name === "AbortError" ? "request timed out — the social media backend may not be running" : err.message}` };
      }
    }

    // ── Team insights (admin only) ──

    case "get_team_insights": {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(`${siteUrl}/api/team-insights`, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) {
          return { success: false, error: `Team insights API returned ${response.status}` };
        }
        const data = await response.json();
        if (!data.count) {
          return { success: true, message: "No workflow profiles have been submitted yet. Team members can fill one out by clicking 'Teach how I work' in the assistant." };
        }
        return { success: true, message: `${data.count} team workflow profile(s) collected:\n\n${data.summary}` };
      } catch (err) {
        return { success: false, error: `Could not fetch team insights: ${err.name === "AbortError" ? "request timed out" : err.message}` };
      }
    }

    case "lookup_crew_job": {
      const raw = String(args.query || "").trim();
      const safe = raw.replace(/[%_\\]/g, "").slice(0, 120);
      if (!safe) {
        return { success: false, error: "query is required (job name, number, or customer keyword)" };
      }
      const p = `%${safe}%`;
      try {
        const { data, error } = await supabase
          .from("crew_jobs")
          .select(
            "id, job_name, job_number, customer_name, address, city, pm_name, crane_required, is_active, default_rig, hiring_contractor"
          )
          .or(
            `job_name.ilike.${p},job_number.ilike.${p},customer_name.ilike.${p},hiring_contractor.ilike.${p},address.ilike.${p},city.ilike.${p}`
          )
          .limit(10);

        if (error) {
          return { success: false, error: `Job lookup failed: ${error.message}` };
        }
        if (!data?.length) {
          return {
            success: true,
            message:
              "No crew jobs matched that search. The job may not be entered in Crew Scheduler yet. Suggest adding it via job intake or the scheduler.",
          };
        }
        const lines = data.map((j) => {
          const parts = [
            `[${j.id}] ${j.job_name || "Job"}`,
            j.job_number ? `#${j.job_number}` : null,
            j.customer_name ? `Customer: ${j.customer_name}` : null,
            j.hiring_contractor ? `GC: ${j.hiring_contractor}` : null,
            j.address || j.city ? `Location: ${[j.address, j.city].filter(Boolean).join(", ")}` : null,
            j.pm_name ? `PM: ${j.pm_name}` : null,
            j.default_rig ? `Default rig: ${j.default_rig}` : null,
            j.crane_required ? "Crane required" : null,
            j.is_active === false ? "INACTIVE" : "Active",
          ].filter(Boolean);
          return parts.join(" | ");
        });
        return {
          success: true,
          message: `Found ${data.length} job(s):\n\n${lines.join("\n")}`,
        };
      } catch (err) {
        return { success: false, error: `lookup_crew_job: ${err.message}` };
      }
    }

    // ── Knowledge base RAG search ──

    case "search_knowledge_base": {
      const query = String(args.query || "").trim();
      if (!query) {
        return { success: false, error: "query is required" };
      }

      try {
        const { getEmbedding } = await import("@/lib/embeddings");

        // Prefix short queries so the embedding captures intent better
        const embeddingInput =
          query.length < 60
            ? `S&W Foundation Contractors context: ${query}`
            : query;

        const embedding = await getEmbedding(embeddingInput);

        // Retrieve more candidates at a lower threshold, then filter for quality
        const RAG_MATCH_THRESHOLD = parseFloat(process.env.RAG_MATCH_THRESHOLD) || 0.68;
        const RAG_MATCH_COUNT = parseInt(process.env.RAG_MATCH_COUNT, 10) || 8;
        const RAG_MAX_CHUNK_CHARS = parseInt(process.env.RAG_MAX_CHUNK_CHARS, 10) || 600;

        const { data, error } = await supabase.rpc("match_documents", {
          query_embedding: embedding,
          match_threshold: Math.max(RAG_MATCH_THRESHOLD - 0.05, 0.55),
          match_count: RAG_MATCH_COUNT,
        });

        if (error) {
          return { success: false, error: `Knowledge base search failed: ${error.message}` };
        }

        if (!data?.length) {
          return { success: true, message: "No relevant documents found in the knowledge base for that query." };
        }

        // Keep only results above the real threshold and sort best-first
        const filtered = data
          .filter((d) => d.similarity >= RAG_MATCH_THRESHOLD)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 5);

        if (!filtered.length) {
          return { success: true, message: "No sufficiently relevant documents found. The knowledge base may not have content on this topic yet." };
        }

        const lines = filtered.map((d, i) => {
          const score = Math.round(d.similarity * 100);
          const category = d.category || "general";
          const content = (d.content || "").length > RAG_MAX_CHUNK_CHARS
            ? d.content.substring(0, RAG_MAX_CHUNK_CHARS) + "..."
            : d.content;
          return `[Result ${i + 1} | ${category} | ${score}% relevance]\n${content}`;
        });

        return {
          success: true,
          message: `Found ${filtered.length} relevant document(s) (out of ${data.length} candidates):\n\n${lines.join("\n\n---\n\n")}`,
        };
      } catch (err) {
        return { success: false, error: `Knowledge base search error: ${err.message}` };
      }
    }

    // ── Image management tools (query Supabase directly) ──

    case "get_page_images": {
      try {
        const { data, error } = await supabase
          .from("image_assignments")
          .select("page, slot, image_url")
          .order("page");

        if (error || !data?.length) {
          return { success: true, message: "No custom image assignments saved yet. Pages are using the default images from the config. The admin can assign images at /admin/image-assignments." };
        }

        const pageFilter = args.page ? String(args.page).toLowerCase() : null;
        const filtered = pageFilter
          ? data.filter((r) => r.page.toLowerCase().includes(pageFilter))
          : data;

        if (!filtered.length) {
          return { success: true, message: `No custom assignments for "${args.page}". That section is using default images.` };
        }

        const lines = filtered.map((r) => {
          const filename = r.image_url.split("/").pop();
          return `- **${r.page}.${r.slot}**: ${filename}`;
        });
        return { success: true, message: `${filtered.length} custom image assignment(s):\n${lines.join("\n")}\n\nTo change an image, go to /admin/image-assignments or tell me which slot to update.` };
      } catch (err) {
        return { success: false, error: `Could not fetch image assignments: ${err.message}` };
      }
    }

    case "get_gallery_images": {
      try {
        let query = supabase
          .from("gallery_images")
          .select("id, filename, category, is_visible, sort_order")
          .order("category")
          .order("sort_order");

        if (!args.include_hidden) {
          query = query.eq("is_visible", true);
        }

        const { data, error } = await query;

        if (error) {
          return { success: false, error: `Gallery query failed: ${error.message}` };
        }

        const images = data || [];
        if (!images.length) {
          return { success: true, message: "No gallery images found in the database." };
        }

        const catFilter = args.category ? String(args.category).toLowerCase() : null;
        const filtered = catFilter
          ? images.filter((img) => (img.category || "").toLowerCase().includes(catFilter))
          : images;

        const grouped = {};
        filtered.forEach((img) => {
          const cat = img.category || "Uncategorized";
          if (!grouped[cat]) grouped[cat] = { visible: [], hidden: [] };
          if (img.is_visible) grouped[cat].visible.push(img);
          else grouped[cat].hidden.push(img);
        });

        const totalVisible = filtered.filter((i) => i.is_visible).length;
        const totalHidden = filtered.filter((i) => !i.is_visible).length;

        const lines = [`${totalVisible} visible, ${totalHidden} hidden across ${Object.keys(grouped).length} categories.\n`];
        Object.entries(grouped).forEach(([cat, { visible, hidden }]) => {
          lines.push(`**${cat}**: ${visible.length} visible${hidden.length ? `, ${hidden.length} hidden` : ""}`);
          visible.slice(0, 3).forEach((img) => {
            lines.push(`  - ${img.filename}`);
          });
          if (visible.length > 3) lines.push(`  - ... and ${visible.length - 3} more`);
          hidden.forEach((img) => {
            lines.push(`  - HIDDEN: ${img.filename} (id: ${img.id})`);
          });
        });

        lines.push(`\nTo hide an image, tell me the filename. To manage visually, go to /admin/gallery.`);
        return { success: true, message: lines.join("\n") };
      } catch (err) {
        return { success: false, error: `Could not fetch gallery images: ${err.message}` };
      }
    }

    case "toggle_gallery_image": {
      const { image_id, visible } = args;
      if (!image_id) {
        return { success: false, error: "image_id is required" };
      }
      try {
        const { error } = await supabase
          .from("gallery_images")
          .update({ is_visible: !!visible })
          .eq("id", image_id);

        if (error) {
          return { success: false, error: `Failed to update gallery image: ${error.message}` };
        }
        return { success: true, message: `Gallery image ${visible ? "is now visible on" : "has been hidden from"} the public gallery page. The change is live immediately.` };
      } catch (err) {
        return { success: false, error: `Could not update gallery image: ${err.message}` };
      }
    }

    // ── Schedule builder mutations ──

    case "assign_worker_to_rig": {
      const { schedule_date, worker_name, rig_name, job_name } = args;
      if (!schedule_date || !worker_name || !rig_name) {
        return { success: false, error: "schedule_date, worker_name, and rig_name are required" };
      }

      const schedule = await ensureScheduleExists(supabase, schedule_date);
      if (!schedule) return { success: false, error: `Could not create schedule for ${schedule_date}` };
      if (schedule.is_finalized) return { success: false, error: `Schedule for ${schedule_date} is finalized. Unfinalize it first.` };

      const worker = await resolveByName(supabase, "crew_workers", "name", worker_name, { is_active: true });
      if (!worker) return { success: false, error: `No active worker found matching "${worker_name}"` };

      const rig = await resolveByName(supabase, "crew_categories", "name", rig_name);
      if (!rig) return { success: false, error: `No rig/category found matching "${rig_name}"` };

      let jobRecord = null;
      if (job_name) {
        jobRecord = await resolveByName(supabase, "crew_jobs", "job_name", job_name, { is_active: true });
        if (!jobRecord) {
          jobRecord = await resolveByName(supabase, "crew_jobs", "job_number", job_name, { is_active: true });
        }
      }

      const { data: existing } = await supabase
        .from("crew_assignments")
        .select("id")
        .eq("schedule_id", schedule.id)
        .eq("category_id", rig.id)
        .eq("worker_id", worker.id)
        .limit(1);

      if (existing?.length) {
        if (jobRecord) {
          await supabase
            .from("crew_assignments")
            .update({ job_id: jobRecord.id, job_name: jobRecord.job_name })
            .eq("id", existing[0].id);
        }
        return { success: true, message: `${worker.name} is already on ${rig.name}${jobRecord ? ` — updated job to ${jobRecord.job_name}` : ""}.` };
      }

      const { error: insertError } = await supabase
        .from("crew_assignments")
        .insert({
          schedule_id: schedule.id,
          category_id: rig.id,
          worker_id: worker.id,
          job_id: jobRecord?.id || null,
          job_name: jobRecord?.job_name || null,
          sort_order: 0,
        });

      if (insertError) return { success: false, error: insertError.message };

      if (jobRecord) {
        await supabase
          .from("crew_assignments")
          .update({ job_id: jobRecord.id, job_name: jobRecord.job_name })
          .eq("schedule_id", schedule.id)
          .eq("category_id", rig.id)
          .is("job_id", null);
      }

      return { success: true, message: `Assigned ${worker.name} to ${rig.name}${jobRecord ? ` for ${jobRecord.job_name}` : ""} on ${schedule_date}.` };
    }

    case "remove_worker_from_schedule": {
      const { schedule_date, worker_name, rig_name } = args;
      if (!schedule_date || !worker_name) {
        return { success: false, error: "schedule_date and worker_name are required" };
      }

      const { data: schedule } = await supabase
        .from("crew_schedules")
        .select("id, is_finalized")
        .eq("schedule_date", schedule_date)
        .limit(1)
        .single();

      if (!schedule) return { success: false, error: `No schedule found for ${schedule_date}` };
      if (schedule.is_finalized) return { success: false, error: `Schedule for ${schedule_date} is finalized.` };

      const worker = await resolveByName(supabase, "crew_workers", "name", worker_name);
      if (!worker) return { success: false, error: `No worker found matching "${worker_name}"` };

      let query = supabase
        .from("crew_assignments")
        .delete()
        .eq("schedule_id", schedule.id)
        .eq("worker_id", worker.id);

      if (rig_name) {
        const rig = await resolveByName(supabase, "crew_categories", "name", rig_name);
        if (rig) query = query.eq("category_id", rig.id);
      }

      const { error } = await query;
      if (error) return { success: false, error: error.message };
      return { success: true, message: `Removed ${worker.name} from ${rig_name ? rig_name + " on " : ""}${schedule_date}.` };
    }

    case "set_rig_details": {
      const { schedule_date, rig_name, superintendent_name, truck_number, crane_info, notes } = args;
      if (!schedule_date || !rig_name) {
        return { success: false, error: "schedule_date and rig_name are required" };
      }

      const schedule = await ensureScheduleExists(supabase, schedule_date);
      if (!schedule) return { success: false, error: `Could not create schedule for ${schedule_date}` };

      const rig = await resolveByName(supabase, "crew_categories", "name", rig_name);
      if (!rig) return { success: false, error: `No rig/category found matching "${rig_name}"` };

      const upsertPayload = {
        schedule_id: schedule.id,
        category_id: rig.id,
      };

      const changes = [];

      if (superintendent_name) {
        const supt = await resolveByName(supabase, "crew_superintendents", "name", superintendent_name, { is_active: true });
        if (!supt) return { success: false, error: `No superintendent found matching "${superintendent_name}"` };
        upsertPayload.superintendent_id = supt.id;
        changes.push(`superintendent: ${supt.name}`);
      }

      if (truck_number) {
        const truck = await resolveByName(supabase, "crew_trucks", "truck_number", truck_number, { is_active: true });
        if (!truck) return { success: false, error: `No truck found matching "${truck_number}"` };
        upsertPayload.truck_id = truck.id;
        changes.push(`truck: ${truck.truck_number}`);
      }

      if (crane_info) {
        upsertPayload.crane_info = crane_info;
        changes.push(`crane: ${crane_info}`);
      }

      if (notes) {
        upsertPayload.notes = notes;
        changes.push("notes updated");
      }

      if (!changes.length) {
        return { success: false, error: "Provide at least one detail to set (superintendent, truck, crane, or notes)" };
      }

      const { error } = await supabase
        .from("schedule_rig_details")
        .upsert(upsertPayload, { onConflict: "schedule_id,category_id" });

      if (error) return { success: false, error: error.message };
      return { success: true, message: `Updated ${rig.name} on ${schedule_date}: ${changes.join(", ")}.` };
    }

    case "copy_schedule": {
      const { source_date, target_dates } = args;
      if (!source_date || !Array.isArray(target_dates) || !target_dates.length) {
        return { success: false, error: "source_date and at least one target_date are required" };
      }

      const dates = target_dates.slice(0, 7);

      const { data: sourceSchedule } = await supabase
        .from("crew_schedules")
        .select("id")
        .eq("schedule_date", source_date)
        .limit(1)
        .single();

      if (!sourceSchedule) return { success: false, error: `No schedule found for ${source_date}` };

      const { data: sourceAssignments } = await supabase
        .from("crew_assignments")
        .select("category_id, worker_id, job_id, job_name, notes, sort_order")
        .eq("schedule_id", sourceSchedule.id);

      const { data: sourceDetails } = await supabase
        .from("schedule_rig_details")
        .select("category_id, superintendent_id, truck_id, crane_info, notes")
        .eq("schedule_id", sourceSchedule.id);

      if (!sourceAssignments?.length && !sourceDetails?.length) {
        return { success: false, error: `Source schedule ${source_date} has no assignments or rig details to copy.` };
      }

      let copied = 0;
      let skipped = 0;

      for (const targetDate of dates) {
        const targetSchedule = await ensureScheduleExists(supabase, targetDate);
        if (!targetSchedule) { skipped++; continue; }
        if (targetSchedule.is_finalized) { skipped++; continue; }

        const { data: existingAssignments } = await supabase
          .from("crew_assignments")
          .select("id")
          .eq("schedule_id", targetSchedule.id)
          .limit(1);

        if (existingAssignments?.length) { skipped++; continue; }

        if (sourceAssignments?.length) {
          const rows = sourceAssignments.map((a) => ({
            schedule_id: targetSchedule.id,
            category_id: a.category_id,
            worker_id: a.worker_id,
            job_id: a.job_id,
            job_name: a.job_name,
            notes: a.notes,
            sort_order: a.sort_order || 0,
          }));
          await supabase.from("crew_assignments").insert(rows);
        }

        if (sourceDetails?.length) {
          const detailRows = sourceDetails.map((d) => ({
            schedule_id: targetSchedule.id,
            category_id: d.category_id,
            superintendent_id: d.superintendent_id,
            truck_id: d.truck_id,
            crane_info: d.crane_info,
            notes: d.notes,
          }));
          await supabase.from("schedule_rig_details").insert(detailRows);
        }

        copied++;
      }

      return {
        success: true,
        message: `Copied schedule from ${source_date} to ${copied} date(s).${skipped ? ` Skipped ${skipped} (already had data or finalized).` : ""}`,
      };
    }

    case "create_sales_opportunity": {
      const title = String(args.title || "").trim();
      if (!title) {
        return { success: false, error: "title is required" };
      }
      const created_by = String(args.created_by || "").trim();
      if (!created_by) {
        return { success: false, error: "created_by is required" };
      }
      const stage = normalizeSalesStage(args.stage) || "qualify";
      let value_estimate =
        args.value_estimate === "" || args.value_estimate === undefined || args.value_estimate === null
          ? null
          : Number(args.value_estimate);
      if (value_estimate !== null && Number.isNaN(value_estimate)) {
        return { success: false, error: "value_estimate must be a number" };
      }
      const owner_user_id = String(args.owner_user_id || "").trim() || created_by;
      const row = {
        title,
        company: cleanTextOrNull(args.company),
        contact_name: cleanTextOrNull(args.contact_name),
        contact_email: cleanTextOrNull(args.contact_email),
        contact_phone: cleanTextOrNull(args.contact_phone),
        stage,
        value_estimate,
        bid_due: parseSalesDateInput(args.bid_due),
        next_follow_up: parseSalesDateInput(args.next_follow_up),
        owner_name: cleanTextOrNull(args.owner_name),
        notes: cleanTextOrNull(args.notes),
        lost_reason: cleanTextOrNull(args.lost_reason),
        created_by,
        owner_user_id,
      };
      const { data, error } = await supabase.from("sales_opportunities").insert(row).select("*").single();
      if (error) return { success: false, error: error.message };
      return {
        success: true,
        message: `Added sales opportunity "${title}" (${stage})`,
        opportunity: data,
      };
    }

    case "update_sales_opportunity": {
      const id = String(args.id || args.opportunity_id || "").trim();
      if (!id) {
        return { success: false, error: "id is required" };
      }

      const updates = {};

      if (args.title !== undefined) {
        const title = String(args.title || "").trim();
        if (!title) {
          return { success: false, error: "title cannot be empty" };
        }
        updates.title = title;
      }

      if (args.company !== undefined) updates.company = cleanTextOrNull(args.company);
      if (args.contact_name !== undefined) updates.contact_name = cleanTextOrNull(args.contact_name);
      if (args.contact_email !== undefined) updates.contact_email = cleanTextOrNull(args.contact_email);
      if (args.contact_phone !== undefined) updates.contact_phone = cleanTextOrNull(args.contact_phone);
      if (args.owner_name !== undefined) updates.owner_name = cleanTextOrNull(args.owner_name);
      if (args.notes !== undefined) updates.notes = cleanTextOrNull(args.notes);
      if (args.lost_reason !== undefined) updates.lost_reason = cleanTextOrNull(args.lost_reason);
      if (args.bid_due !== undefined) updates.bid_due = parseSalesDateInput(args.bid_due);
      if (args.next_follow_up !== undefined) updates.next_follow_up = parseSalesDateInput(args.next_follow_up);
      if (args.owner_user_id !== undefined) updates.owner_user_id = cleanTextOrNull(args.owner_user_id);

      if (args.stage !== undefined) {
        const stage = normalizeSalesStage(args.stage);
        if (!stage) {
          return { success: false, error: "Invalid sales stage" };
        }
        updates.stage = stage;
      }

      if (args.value_estimate !== undefined) {
        updates.value_estimate =
          args.value_estimate === "" || args.value_estimate === null
            ? null
            : Number(args.value_estimate);
        if (updates.value_estimate !== null && Number.isNaN(updates.value_estimate)) {
          return { success: false, error: "value_estimate must be a number" };
        }
      }

      if (!Object.keys(updates).length) {
        return { success: false, error: "No updates were provided" };
      }

      const { data, error } = await supabase
        .from("sales_opportunities")
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();

      if (error) return { success: false, error: error.message };

      return {
        success: true,
        message: `Updated sales opportunity "${data?.title || id}"${data?.stage ? ` (${data.stage})` : ""}`,
        opportunity: data,
      };
    }

    // ── Hiring pipeline tools ──

    case "create_hiring_candidate": {
      const title = String(args.title || "").trim();
      if (!title) {
        return { success: false, error: "title is required" };
      }
      const VALID_HIRING_STAGES = new Set(["new", "reviewing", "interview", "offer", "hired", "declined"]);
      const stage = VALID_HIRING_STAGES.has(String(args.stage || "").toLowerCase())
        ? String(args.stage).toLowerCase()
        : "new";
      const row = {
        title,
        applicant_name: cleanTextOrNull(args.applicant_name),
        contact_email: cleanTextOrNull(args.contact_email),
        contact_phone: cleanTextOrNull(args.contact_phone),
        position_applied: cleanTextOrNull(args.position_applied),
        stage,
        next_follow_up: parseSalesDateInput(args.next_follow_up),
        notes: cleanTextOrNull(args.notes),
        decline_reason: cleanTextOrNull(args.decline_reason),
        created_by: context?.userId || null,
        owner_user_id: context?.userId || null,
      };
      const { data, error } = await supabase.from("hiring_opportunities").insert(row).select("*").single();
      if (error) return { success: false, error: error.message };
      return {
        success: true,
        message: `Added hiring candidate "${title}" (${stage})`,
        candidate: data,
      };
    }

    case "update_hiring_candidate": {
      const id = String(args.candidate_id || args.id || "").trim();
      if (!id) {
        return { success: false, error: "candidate_id is required" };
      }
      const VALID_HIRING_STAGES = new Set(["new", "reviewing", "interview", "offer", "hired", "declined"]);
      const updates = {};
      if (args.title !== undefined) {
        const title = String(args.title || "").trim();
        if (!title) return { success: false, error: "title cannot be empty" };
        updates.title = title;
      }
      if (args.applicant_name !== undefined) updates.applicant_name = cleanTextOrNull(args.applicant_name);
      if (args.contact_email !== undefined) updates.contact_email = cleanTextOrNull(args.contact_email);
      if (args.contact_phone !== undefined) updates.contact_phone = cleanTextOrNull(args.contact_phone);
      if (args.position_applied !== undefined) updates.position_applied = cleanTextOrNull(args.position_applied);
      if (args.notes !== undefined) updates.notes = cleanTextOrNull(args.notes);
      if (args.decline_reason !== undefined) updates.decline_reason = cleanTextOrNull(args.decline_reason);
      if (args.next_follow_up !== undefined) updates.next_follow_up = parseSalesDateInput(args.next_follow_up);
      if (args.stage !== undefined) {
        const stage = String(args.stage || "").toLowerCase();
        if (!VALID_HIRING_STAGES.has(stage)) {
          return { success: false, error: "Invalid hiring stage" };
        }
        updates.stage = stage;
      }
      if (!Object.keys(updates).length) {
        return { success: false, error: "No updates were provided" };
      }
      const { data, error } = await supabase
        .from("hiring_opportunities")
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();
      if (error) return { success: false, error: error.message };
      return {
        success: true,
        message: `Updated hiring candidate "${data?.title || id}"${data?.stage ? ` (${data.stage})` : ""}`,
        candidate: data,
      };
    }

    // ── Bidding analysis tools (proxy to bidding API) ──

    case "analyze_bid": {
      const opportunityId = String(args.opportunity_id || "").trim();
      if (!opportunityId) {
        return { success: false, error: "opportunity_id is required" };
      }

      const BIDDING_API_URL = process.env.BIDDING_API_URL;
      if (!BIDDING_API_URL) {
        // Fall back to local calculation if bidding API is not configured
        return await localBidAnalysis(supabase, opportunityId, args);
      }

      try {
        const res = await fetch(`${BIDDING_API_URL}/api/ai-bidding/analyze-bid`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(context?.cookieHeader ? { Cookie: context.cookieHeader } : {}),
          },
          body: JSON.stringify({
            opportunity_id: opportunityId,
            include_competitors: args.include_competitors !== false,
            include_market_data: args.include_market_data !== false,
            include_client_history: args.include_client_history !== false,
            ...(args.target_margin != null ? { target_margin: args.target_margin } : {}),
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return { success: false, error: errData.detail || `Bidding API error (${res.status})` };
        }

        const result = await res.json();
        const money = (n) =>
          n != null
            ? Number(n).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
            : "N/A";

        return {
          success: true,
          message: [
            `**Bid Recommendation**`,
            `- Recommended amount: ${money(result.recommended_amount)}`,
            `- Confidence: ${Math.round((result.confidence_score || 0) * 100)}%`,
            `- Margin: ${result.margin_percentage}%`,
            `- Risk level: ${result.risk_assessment?.level || "unknown"}${result.risk_assessment?.factors?.length ? ` (${result.risk_assessment.factors.join(", ")})` : ""}`,
            `- Competitive position: ranked ${result.competitive_position?.estimated_rank || "?"} of ${result.competitive_position?.total_competitors || "?"} competitors`,
            `- Win probability: ${Math.round((result.competitive_position?.win_probability || 0) * 100)}%`,
            ``,
            `Reasoning: ${result.reasoning || "N/A"}`,
          ].join("\n"),
          recommendation: result,
        };
      } catch (err) {
        return { success: false, error: `Bidding API error: ${err.message}` };
      }
    }

    case "add_competitor_intel": {
      const opportunityId = String(args.opportunity_id || "").trim();
      const competitorName = String(args.competitor_name || "").trim();
      if (!opportunityId || !competitorName) {
        return { success: false, error: "opportunity_id and competitor_name are required" };
      }

      const BIDDING_API_URL = process.env.BIDDING_API_URL;
      if (!BIDDING_API_URL) {
        // Write directly to Supabase if no bidding API
        const row = {
          opportunity_id: opportunityId,
          competitor_name: competitorName,
          ...(args.estimated_bid != null ? { estimated_bid: args.estimated_bid } : {}),
          ...(args.known_strengths ? { known_strengths: args.known_strengths } : {}),
          ...(args.known_weaknesses ? { known_weaknesses: args.known_weaknesses } : {}),
          ...(args.historical_win_rate != null ? { historical_win_rate: args.historical_win_rate } : {}),
          ...(args.notes ? { notes: args.notes } : {}),
        };
        const { data: existing } = await supabase
          .from("competitor_analysis")
          .select("id")
          .eq("opportunity_id", opportunityId)
          .eq("competitor_name", competitorName)
          .limit(1);
        let result;
        if (existing?.length) {
          result = await supabase.from("competitor_analysis").update(row).eq("id", existing[0].id).select("*").single();
        } else {
          result = await supabase.from("competitor_analysis").insert(row).select("*").single();
        }
        if (result.error) return { success: false, error: result.error.message };
        return { success: true, message: `Logged competitor intel for "${competitorName}" on this opportunity.` };
      }

      try {
        const res = await fetch(`${BIDDING_API_URL}/api/ai-bidding/competitor-analysis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            opportunity_id: opportunityId,
            competitor_name: competitorName,
            ...(args.estimated_bid != null ? { estimated_bid: args.estimated_bid } : {}),
            ...(args.known_strengths ? { known_strengths: args.known_strengths } : {}),
            ...(args.known_weaknesses ? { known_weaknesses: args.known_weaknesses } : {}),
            ...(args.historical_win_rate != null ? { historical_win_rate: args.historical_win_rate } : {}),
            ...(args.notes ? { notes: args.notes } : {}),
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, error: err.detail || "Failed to save competitor intel" };
        }
        return { success: true, message: `Logged competitor intel for "${competitorName}" on this opportunity.` };
      } catch (err) {
        return { success: false, error: `Bidding API error: ${err.message}` };
      }
    }

    case "get_bid_performance": {
      const BIDDING_API_URL = process.env.BIDDING_API_URL;

      // Works without bidding API — calculate directly from sales_opportunities
      try {
        let query = supabase.from("sales_opportunities").select("owner_name, stage, final_bid_amount, value_estimate");
        if (args.owner_name) query = query.eq("owner_name", args.owner_name);
        const { data: opps, error } = await query;
        if (error) return { success: false, error: error.message };

        const metrics = {};
        for (const o of opps || []) {
          const owner = o.owner_name || "Unassigned";
          if (!metrics[owner]) {
            metrics[owner] = { owner, total: 0, won: 0, lost: 0, active: 0, revenue: 0 };
          }
          const m = metrics[owner];
          m.total++;
          if (o.stage === "won") {
            m.won++;
            m.revenue += Number(o.final_bid_amount || o.value_estimate || 0);
          } else if (o.stage === "lost") {
            m.lost++;
          } else {
            m.active++;
          }
        }

        const lines = Object.values(metrics).map((m) => {
          const closed = m.won + m.lost;
          const winRate = closed > 0 ? Math.round((m.won / closed) * 100) : 0;
          const money = m.revenue
            ? Number(m.revenue).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
            : "$0";
          return `- ${m.owner}: ${m.total} bids (${m.won} won, ${m.lost} lost, ${m.active} active) | Win rate: ${winRate}% | Revenue: ${money}`;
        });

        return {
          success: true,
          message: lines.length
            ? `**Bid Performance**\n${lines.join("\n")}`
            : "No bid performance data available yet.",
        };
      } catch (err) {
        return { success: false, error: `Performance metrics error: ${err.message}` };
      }
    }

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}

/**
 * Local bid analysis fallback when BIDDING_API_URL is not configured.
 * Mirrors the Python perform_ai_analysis logic.
 */
async function localBidAnalysis(supabase, opportunityId, args) {
  try {
    const { data: opp, error: oppErr } = await supabase
      .from("sales_opportunities")
      .select("*")
      .eq("id", opportunityId)
      .single();
    if (oppErr || !opp) return { success: false, error: "Opportunity not found" };

    // Gather context
    const { data: competitors } = args.include_competitors !== false
      ? await supabase.from("competitor_analysis").select("*").eq("opportunity_id", opportunityId)
      : { data: [] };

    let marketData = [];
    if (args.include_market_data !== false && opp.project_type && opp.location_region) {
      const { data: md } = await supabase
        .from("market_intelligence")
        .select("*")
        .eq("project_type", opp.project_type)
        .eq("region", opp.location_region)
        .order("period_end", { ascending: false })
        .limit(1);
      marketData = md || [];
    }

    let clientHistory = null;
    if (args.include_client_history !== false && opp.company) {
      const { data: ch } = await supabase
        .from("client_patterns")
        .select("*")
        .eq("company_name", opp.company)
        .limit(1);
      if (ch?.length) clientHistory = ch[0];
    }

    // Algorithm (matches Python engine)
    const baseAmount = Number(opp.value_estimate || 0) || 100000;
    let avgMargin = 15.0;
    if (marketData.length) avgMargin = Number(marketData[0].average_margin || avgMargin);

    const competitorCount = (competitors || []).length;
    if (competitorCount > 3) avgMargin -= 2;
    else if (competitorCount < 2) avgMargin += 2;

    let confidence = 0.5;
    if (clientHistory) {
      const winRate = (clientHistory.total_bids_won || 0) / Math.max(clientHistory.total_bids_submitted || 1, 1);
      confidence = Math.min(0.9, confidence + winRate * 0.3);
      if (clientHistory.price_sensitivity === "high") avgMargin -= 3;
      else if (clientHistory.price_sensitivity === "low") avgMargin += 2;
    }

    if (args.target_margin != null) avgMargin = args.target_margin;

    const recommendedAmount = Math.round(baseAmount * (1 + avgMargin / 100) * 100) / 100;

    const riskFactors = [];
    let riskLevel = "low";
    if (competitorCount > 5) { riskFactors.push("High competition"); riskLevel = "high"; }
    if (!clientHistory) { riskFactors.push("No previous client history"); if (riskLevel === "low") riskLevel = "medium"; }
    if (!marketData.length) { riskFactors.push("Limited market data"); if (riskLevel === "low") riskLevel = "medium"; }

    const estimatedRank = competitorCount === 0 ? 1 : Math.min(competitorCount, 2);

    // Save recommendation to opportunity
    await supabase.from("sales_opportunities").update({
      ai_suggested_amount: recommendedAmount,
      ai_confidence_score: Math.round(confidence * 1000) / 1000,
      ai_reasoning: `Based on market analysis with ${competitorCount} competitors and target margin of ${Math.round(avgMargin * 100) / 100}%`,
      margin_percentage: Math.round(avgMargin * 100) / 100,
    }).eq("id", opportunityId);

    const money = (n) => Number(n).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

    return {
      success: true,
      message: [
        `**Bid Recommendation**`,
        `- Recommended amount: ${money(recommendedAmount)}`,
        `- Confidence: ${Math.round(confidence * 100)}%`,
        `- Margin: ${Math.round(avgMargin * 100) / 100}%`,
        `- Risk level: ${riskLevel}${riskFactors.length ? ` (${riskFactors.join(", ")})` : ""}`,
        `- Competitive position: ranked ${estimatedRank} of ${competitorCount} competitors`,
        `- Win probability: ${Math.round(confidence * 100)}%`,
        ``,
        `Reasoning: Based on market analysis with ${competitorCount} competitors and target margin of ${Math.round(avgMargin * 100) / 100}%`,
      ].join("\n"),
    };
  } catch (err) {
    return { success: false, error: `Bid analysis error: ${err.message}` };
  }
}
