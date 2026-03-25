const cleanTextOrNull = (value) => {
  const cleaned = String(value || "").trim();
  return cleaned || null;
};

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
});

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
  ].forEach((field) => {
    const value = cleanTextOrNull(rawInput[field]);
    if (value !== null) {
      updates[field] = value;
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

export async function executeAdminAssistantMutation(supabase, name, args) {
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

    case "create_crew_job":
      return upsertCrewJob(supabase, args);

    case "update_crew_job_detail":
      return updateCrewJobDetail(supabase, args);

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

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}
