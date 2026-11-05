// CONTROLIT — send-email Edge Function
// Sends Resend email notifications to ONLY the roles relevant to each permit event.
// Deployed to: Supabase project sguptjhsfyygwazmxfpk → Functions → send-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Human-readable subject + body for each event type
const EVENT_COPY: Record<string, { subject: string; body: string }> = {
  submitted: {
    subject: "New Permit Submitted — Action Required",
    body: "A new permit has been submitted and is awaiting your review as Area Authority.",
  },
  aa_approved: {
    subject: "Permit Forwarded to OSH Manager — Action Required",
    body: "The Area Authority has approved this permit. It is now awaiting your review as OSH Manager.",
  },
  osh_approved: {
    subject: "Permit Approved — Ready to Issue",
    body: "The OSH Manager has approved this permit. Please review and issue it as Issuing Authority.",
  },
  issued: {
    subject: "Your Permit Has Been Issued",
    body: "Your permit has been approved and issued. Work may now commence.",
  },
  rejected: {
    subject: "Permit Rejected",
    body: "Your permit has been rejected. Please review the remarks in CONTROLIT and resubmit if necessary.",
  },
  suspended: {
    subject: "Permit Suspended",
    body: "This permit has been suspended. Work must stop immediately until the permit is reinstated.",
  },
  closed: {
    subject: "Permit Closed",
    body: "This permit has been closed. No further work is permitted under this PTW.",
  },
  work_complete: {
    subject: "Work Completion Signed Off — Awaiting Closure",
    body: "The work in-charge has signed off work completion. Please close the permit as Issuing Authority.",
  },
  ext_requested: {
    subject: "Permit Extension Requested — Action Required",
    body: "A permit extension has been requested. Please review and approve or reject it as Issuing Authority.",
  },
  ext_approved: {
    subject: "Permit Extension Approved",
    body: "Your permit extension request has been approved.",
  },
  ext_rejected: {
    subject: "Permit Extension Rejected",
    body: "Your permit extension request has been rejected.",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const {
      orgId,
      permitNumber,
      permitTitle,
      eventType,
      actorId,
      actorName,
      permitId,
      targetRoles,   // string[] — roles to email; may include "permit_requester" sentinel
    } = await req.json();

    if (!orgId || !eventType) {
      return new Response(JSON.stringify({ error: "Missing orgId or eventType" }), { status: 400 });
    }

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const copy = EVENT_COPY[eventType] || {
      subject: "Permit Update",
      body: `Your permit has been updated (${eventType}).`,
    };

    // Collect recipient email addresses
    const recipientEmails = new Set<string>();

    // Resolve role-based recipients (exclude the actor themselves)
    const roleList = (targetRoles || []).filter((r: string) => r !== "permit_requester");
    if (roleList.length > 0) {
      const { data: roleUsers } = await db
        .from("profiles")
        .select("email")
        .eq("org_id", orgId)
        .eq("active", true)
        .in("role", roleList)
        .neq("id", actorId || "00000000-0000-0000-0000-000000000000");

      (roleUsers || []).forEach((u: { email: string }) => {
        if (u.email) recipientEmails.add(u.email);
      });
    }

    // Resolve "permit_requester" — the user who submitted this specific permit
    if ((targetRoles || []).includes("permit_requester") && permitId) {
      const { data: permitRow } = await db
        .from("permits")
        .select("submitted_by")
        .eq("id", permitId)
        .single();

      if (permitRow?.submitted_by) {
        const { data: reqProfile } = await db
          .from("profiles")
          .select("email, id")
          .eq("id", permitRow.submitted_by)
          .single();

        // Don't email the actor back to themselves
        if (reqProfile?.email && reqProfile.id !== actorId) {
          recipientEmails.add(reqProfile.email);
        }
      }
    }

    if (recipientEmails.size === 0) {
      return new Response(JSON.stringify({ sent: 0, total: 0, note: "No recipients matched" }), { status: 200 });
    }

    // Send one email per recipient via Resend
    let sent = 0;
    for (const email of recipientEmails) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "CONTROLIT <notifications@getcontrolit.com>",
          to: [email],
          subject: `${copy.subject} — ${permitNumber}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <div style="background:#1A3A5C;padding:16px 24px;border-radius:8px 8px 0 0">
                <h2 style="color:#ffffff;margin:0;font-size:18px">CONTROLIT</h2>
                <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:12px">Permit to Work System</p>
              </div>
              <div style="background:#f8f9fa;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e0e0e0">
                <h3 style="color:#1A3A5C;margin:0 0 8px">${copy.subject}</h3>
                <p style="color:#444;font-size:14px;margin:0 0 16px">${copy.body}</p>
                <div style="background:#fff;border:1px solid #ddd;border-radius:6px;padding:12px 16px;margin-bottom:16px">
                  <p style="margin:0 0 4px;font-size:12px;color:#888">Permit Reference</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#1A3A5C">${permitNumber}</p>
                  ${permitTitle ? `<p style="margin:4px 0 0;font-size:13px;color:#555">${permitTitle}</p>` : ""}
                </div>
                ${actorName ? `<p style="font-size:13px;color:#666;margin:0 0 16px">Action by: <strong>${actorName}</strong></p>` : ""}
                <a href="https://getcontrolit.com/app.html" style="display:inline-block;background:#1A3A5C;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">Open in CONTROLIT →</a>
                <p style="font-size:11px;color:#aaa;margin:20px 0 0">You received this because you are a member of this organisation's Permit to Work system. To manage notifications, contact your CONTROLIT administrator.</p>
              </div>
            </div>
          `,
        }),
      });

      if (res.ok) sent++;
      else {
        const errBody = await res.text();
        console.warn(`Failed to send to ${email}:`, errBody);
      }
    }

    return new Response(
      JSON.stringify({ sent, total: recipientEmails.size }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
