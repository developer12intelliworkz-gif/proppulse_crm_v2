/** Disposition values stored in lead_activities.details.disposition */

export const DISPOSITION_VALUES = [
  "interested_hot",
  "interested_warm",
  "not_interested",
  "no_answer",
  "call_back_later",
  "converted",
  "junk",
];

export const NOT_INTERESTED_REASONS = [
  "budget",
  "location",
  "timing",
  "competitor",
  "other",
];

const CLOSING_DISPOSITIONS = new Set([
  "not_interested",
  "converted",
  "junk",
]);

const LEAD_STATUS_BY_DISPOSITION = {
  not_interested: "lost",
  converted: "closed",
  junk: "lost",
};

const INTEREST_BY_DISPOSITION = {
  interested_hot: "hot",
  interested_warm: "warm",
  no_answer: null,
  call_back_later: null,
};

export function isValidDisposition(value) {
  return DISPOSITION_VALUES.includes(String(value || "").trim());
}

export function dispositionClosesLead(disposition) {
  return CLOSING_DISPOSITIONS.has(String(disposition || "").trim());
}

export function dispositionRequiresNextDate(disposition) {
  return String(disposition || "").trim() === "call_back_later";
}

export function mapDispositionToLeadStatus(disposition) {
  return LEAD_STATUS_BY_DISPOSITION[String(disposition || "").trim()] || null;
}

export function mapDispositionToInterestLevel(disposition) {
  const key = String(disposition || "").trim();
  return INTEREST_BY_DISPOSITION[key] ?? null;
}

/** Legacy outcome strings mapped to new disposition codes. */
export function normalizeDisposition(details = {}) {
  const raw = details.disposition || details.outcome;
  if (!raw) return null;
  const v = String(raw).trim().toLowerCase();
  const map = {
    interested: "interested_warm",
    "interested – hot": "interested_hot",
    "interested - hot": "interested_hot",
    interested_hot: "interested_hot",
    "interested – warm": "interested_warm",
    "interested - warm": "interested_warm",
    interested_warm: "interested_warm",
    "not interested": "not_interested",
    not_interested: "not_interested",
    callback: "call_back_later",
    "call back later": "call_back_later",
    call_back_later: "call_back_later",
    "no response": "no_answer",
    "no answer": "no_answer",
    no_answer: "no_answer",
    converted: "converted",
    lost: "not_interested",
    junk: "junk",
  };
  return map[v] || (isValidDisposition(v) ? v : null);
}

export function isConvertedDisposition(disposition) {
  return normalizeDisposition({ disposition }) === "converted";
}

export function validateFollowUpDisposition(details = {}) {
  const disposition = normalizeDisposition(details);
  if (!disposition) {
    return { valid: false, error: "Disposition is required when logging a follow-up" };
  }
  if (!isValidDisposition(disposition)) {
    return { valid: false, error: "Invalid disposition value" };
  }
  if (disposition === "not_interested" && !details.notInterestedReason) {
    return { valid: false, error: "Please select a reason for Not Interested" };
  }
  if (dispositionRequiresNextDate(disposition) && !details.nextScheduleOn) {
    return {
      valid: false,
      error: "Call Back Later requires a next follow-up date",
    };
  }
  return { valid: true, disposition };
}

/**
 * Apply disposition side-effects: mark activity complete, update lead status/interest.
 */
export async function applyDispositionToLead(client, leadId, activityId, details = {}) {
  const validation = validateFollowUpDisposition(details);
  if (!validation.valid) {
    return validation;
  }

  const disposition = validation.disposition;
  const patch = {
    disposition,
    status: "completed",
    completed: true,
    completedAt: new Date().toISOString(),
  };
  if (details.notInterestedReason) {
    patch.notInterestedReason = details.notInterestedReason;
  }

  await client.query(
    `UPDATE public.lead_activities
     SET details = COALESCE(details, '{}'::jsonb) || $2::jsonb,
         updated_at = NOW()
     WHERE id = $1`,
    [activityId, JSON.stringify(patch)],
  );

  const leadStatus = mapDispositionToLeadStatus(disposition);
  const interestLevel = mapDispositionToInterestLevel(disposition);

  if (leadStatus) {
    await client.query(
      `UPDATE public.leads
       SET status = $2,
           interest_level = COALESCE($3, interest_level),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [leadId, leadStatus, interestLevel],
    );
  } else if (interestLevel) {
    await client.query(
      `UPDATE public.leads
       SET interest_level = $2,
           status = CASE WHEN LOWER(status) = 'new' THEN 'contacted' ELSE status END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [leadId, interestLevel],
    );
  } else if (disposition === "call_back_later" || disposition === "no_answer") {
    await client.query(
      `UPDATE public.leads
       SET status = CASE WHEN LOWER(status) = 'new' THEN 'contacted' ELSE status END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [leadId],
    );
  }

  return { valid: true, disposition, leadStatus };
}
