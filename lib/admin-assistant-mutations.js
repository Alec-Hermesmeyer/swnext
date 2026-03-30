const cleanTextOrNull = (value) => {
  const cleaned = String(value || "").trim();
  return cleaned || null;
};

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
        const response = await fetch(`${siteUrl}/api/social/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage }),
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

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}
