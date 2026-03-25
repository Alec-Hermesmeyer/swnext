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
        .select("id, category_id, worker_id, job_id, job_name, crew_workers(name), crew_jobs(job_name)")
        .eq("schedule_id", schedule.id);

      const { data: rigDetails } = await supabase
        .from("schedule_rig_details")
        .select("category_id, crew_superintendents(name), crew_trucks(truck_number), crane_info")
        .eq("schedule_id", schedule.id);

      const mappedAssignments = (assignments || []).map((a) => ({
        category_id: a.category_id,
        worker_name: a.crew_workers?.name || "Unassigned",
        job_name: a.crew_jobs?.job_name || a.job_name || "",
      }));

      const mappedRigDetails = (rigDetails || []).map((r) => ({
        category_id: r.category_id,
        superintendent_name: r.crew_superintendents?.name || "",
        truck_number: r.crew_trucks?.truck_number || "",
        crane_info: r.crane_info || "",
      }));

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

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}
