# controlit-ptw# CONTROLIT — Permit to Work Management Platform

![CONTROLIT](https://img.shields.io/badge/CONTROLIT-PTW%20Platform-1A3A5C?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active%20Development-0E9E6E?style=for-the-badge)
![Built With](https://img.shields.io/badge/Built%20With-React%20%7C%20Supabase-0E9E6E?style=for-the-badge)

---

## Overview

**CONTROLIT** is a digital Permit to Work (PTW) management platform designed for HSE-critical industries including Oil & Gas, Construction, Energy, and Heavy Industry.

It enables organisations to fully digitise and control their permit to work system — from initial request through multi-stage approval, field verification, issuance, extension, and closure — with a complete audit trail at every step.

CONTROLIT is built as a **multi-tenant SaaS platform**, meaning multiple organisations can operate independently within the same system with complete data isolation.

---

## Key Features

- **7 Permit Types** — Hot Work, Cold Work (Critical), Confined Space Entry, Electrical Isolation (LOTO), Working at Height, Excavation & Ground Disturbance, Critical Lifting Operations
- **4-Stage Approval Workflow** — Requesting Party → Area Authority → Safety Officer → Issuer
- **Field Verification Checklist** — Issuer must physically verify all site controls before permit goes live
- **SIMOPS Conflict Detection** — Automatically flags conflicting active permits in the same zone
- **Extension Control** — Maximum 2 extensions per permit with re-approval routing
- **AI Risk Assessment** — Powered by Anthropic Claude API
- **Full Audit Trail** — Immutable timestamped log of every action per permit
- **Role-Based Access Control** — Requester, Area Authority, Safety Officer, Issuer, Admin
- **Multi-Tenant Architecture** — Each organisation operates in complete isolation
- **Invite-Only Access** — No public sign-ups; users join via admin invitation
- **Notification System** — Role-aware alerts for approvals, SIMOPS, expiry, and escalations
- **Print-Ready Permit** — Branded permit document for job site posting
- **Mobile-First PWA** — Designed for field use on any device

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (single file PWA) |
| Backend / Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (invite-only) |
| AI | Anthropic Claude API |
| Realtime | Supabase Realtime WebSocket |
| Deployment | GitHub Pages / Vercel / Netlify |

---

## Permit Workflow

```
Requesting Party → Area Authority → Safety Officer → Issuer
      ↓                  ↓                ↓              ↓
  Submits           Checks area      Reviews HSE    Field verify
  permit            & SIMOPS         compliance     & issues PTW
```

After issuance, permits can be **Extended** (max 2×), **Suspended**, **Revoked**, or **Closed**. All actions are logged to an immutable audit trail.

---

## Multi-Tenancy

Every organisation on CONTROLIT operates in complete isolation:

- Separate data namespace per organisation (`org_id` on every table)
- Row Level Security (RLS) enforced at database level via Supabase
- Users can only see data belonging to their organisation
- Admins invite users — no cross-tenant access possible

---

## Database Schema

8 core tables:

- `organisations` — tenant registry
- `profiles` — users linked to organisations with roles
- `areas` — work zones per organisation
- `permits` — full permit lifecycle data
- `permit_audit` — immutable action log
- `permit_checklist` — field verification items per permit
- `notifications` — role-aware alerts per user
- `org_invites` — invite token management

---

## Part of the HSE Suite

CONTROLIT is part of a growing HSE digital product suite:

| Product | Purpose |
|---|---|
| **FLAGIT** | Field observation and NCR tracking |
| **CONTROLIT** | Permit to Work management |

---

## License

Private — All rights reserved © Kindness Njoku C.

---

## Contact

For enquiries, partnerships or enterprise licensing:
**kindnessnjoku@outlook.com**
