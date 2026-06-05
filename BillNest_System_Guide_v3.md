# BillNest: Complete System Guide & Architecture

> **Version:** 3.1 | **Status:** Reviewed & Corrected

---

## 🏢 1. Core Architecture: Organization → Team → Clients

```
┌─────────────────────────────────────────────────────┐
│               ORGANIZATION (Tenant)                 │
│              (e.g., CodeCraft Agency)               │
│   Currency: USD | Timezone: IST | GST: Registered   │
└────────────────────────┬────────────────────────────┘
                         │
      ┌──────────────────┼──────────────────┐
      ▼                  ▼                  ▼
┌───────────┐      ┌───────────┐      ┌───────────┐
│   Rahul   │      │   Amit    │      │   Pooja   │
│  (Owner)  │      │  (Admin)  │      │ (Member)  │
└───────────┘      └───────────┘      └───────────┘
                         │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌─────────────────┐             ┌─────────────────┐
│    ACME CORP    │             │ STARK INDUSTRIES│
│  (Client A)     │             │   (Client B)    │
├─────────────────┤             ├─────────────────┤
│ Plans           │             │ Plans           │
│ Subscriptions   │             │ Subscriptions   │
│ Invoices        │             │ Invoices        │
│ Payments        │             │ Payments        │
└─────────────────┘             └─────────────────┘
```

1. **Organization (Tenant)**: The master account hosting the system. (e.g., **CodeCraft Agency**).
2. **Clients**: External business accounts paying for services (e.g., **Acme Corp**, **Stark Industries**).
3. **Team Members**: Employees added to the Organization with global roles and client-level access.

---

## 👥 2. Real-World Example Scenario

**Organization:** CodeCraft Agency

### The Team:
| Name | Global Role | Real-Life Role | Description |
|---|---|---|---|
| **Rahul Patel** | Owner | CEO / Agency Founder | Absolute dashboard access and workspace configuration. |
| **Amit Shah** | Admin | Operations Manager | Manages team invites and plans. Settings tab hidden. |
| **Pooja Roy** | Member | Customer Success Exec | Creates draft invoices and records client updates. |
| **Siddharth Sen** | Read-Only | Financial Auditor | Inspects audit trails and metrics. Cannot modify data. |

### Pooja Roy's Client-Level Permissions (Global Role: Member):
| Client | Client Role | Effect |
|---|---|---|
| Acme Corp | **Admin** | Full invoice, plan, and subscription management for Acme Corp. |
| Stark Industries | **None** | Completely hidden. Blocked at backend API level (403 Forbidden). |

---

## 🔑 3. Workspace Role Privileges

### Global Roles (Workspace-Wide)

| Role | Permissions | Restrictions |
|---|---|---|
| **Owner** | Full workspace access. Configure currency, prefix, branding. Suspend/remove team members. Generate API keys. Approve join requests and assign final roles. | None. |
| **Admin** | Invite team members. Configure billing plans. Manage clients and invoices. View audit logs. | Settings tab is completely hidden. Cannot delete the Owner. Cannot generate API keys. |
| **Member** | Create draft invoices. Log payments. View subscriptions. Manage assigned clients. | No Team tab. No Settings. No API key access. |
| **Read-Only** | View dashboards, statistics, audit logs. No write buttons displayed. | Cannot create, edit, or delete anything. |

### Client-Level Roles (Granular Access Per Client)

| Client Role | Permissions |
|---|---|
| **Admin** | Edit client business info, tax IDs, addresses. Full invoice and subscription management. |
| **Member** | Create and send draft invoices. View active plans. Cannot edit core client details. |
| **Viewer** | Read invoices, transactions, and plans only. No editing or writing. |
| **None** | Complete isolation. Client does not appear anywhere in the user's dashboard, metrics, or API responses. |

> ⚠️ **Security Rule:** "None" access is enforced at the **backend API level** — a 403 Forbidden is returned for any direct URL or API call. It is not just hidden in the UI.

---

## 📋 4. Plans & Subscriptions Model

Plans are reusable billing templates. A Subscription links a Plan to a specific Client.

```
┌──────────────────┐         ┌────────────────────────────┐
│      PLAN        │  1─────▶│       SUBSCRIPTION         │
├──────────────────┤  many   ├────────────────────────────┤
│ Name             │         │ Client (linked)            │
│ Price            │         │ Plan (linked)              │
│ Billing Cycle    │         │ Start Date                 │
│ (Monthly/Yearly) │         │ End Date / Auto-Renew      │
│ Features List    │         │ Status:                    │
│ Tax Rules        │         │   Active / Paused /        │
└──────────────────┘         │   Cancelled                │
                             │ Next Invoice Date          │
                             └──────────────┬─────────────┘
                                            │ auto-generates on schedule
                                            ▼
                             ┌────────────────────────────┐
                             │          INVOICE           │
                             │        (Draft state)       │
                             └────────────────────────────┘
```

### Plan Fields:
- Plan Name (e.g., "Pro Monthly")
- Price & Currency
- Billing Cycle (Monthly / Quarterly / Yearly / One-Time)
- Features / Description
- Tax Rules (GST %, VAT %, or None)

---

## 🧾 5. Invoice Lifecycle *(Critical — Must Implement)*

Every invoice moves through defined states. This state machine must be enforced in both the UI and backend.

```
  [DRAFT] ──────▶ [SENT] ──────▶ [PAID] ✅
     │                │
     │                └──────▶ [OVERDUE] ──▶ [VOID] ❌
     │
     └──────────────────────────────────────▶ [VOID] ❌
```

### Invoice States:

| State | Description | Who Can Transition |
|---|---|---|
| **Draft** | Created but not sent. Fully editable. | Member, Admin, Owner |
| **Sent** | Shared with client. Locked from editing. | Admin, Owner |
| **Paid** | Payment logged and confirmed. | Member (log payment), Admin, Owner |
| **Overdue** | Auto-set by system after due date passes without full payment. | System (automatic scheduler) |
| **Void** | Cancelled. Stays in audit trail — never hard-deleted. | Admin, Owner only |

### Invoice Fields:
- Invoice Number (auto-generated, e.g., `INV-2024-0042`)
- Client Name & Billing Address
- Line Items: description, quantity, unit price, tax %
- Subtotal, Tax Amount, Discount (if any), Total
- Issue Date & Due Date
- Payment Terms (Net 15 / Net 30 / Due on Receipt)
- Status (Draft / Sent / Paid / Overdue / Void)
- Notes / Payment Instructions
- Linked Subscription (if auto-generated)

---

## 💳 6. Payment Logging

Payments are logged against invoices. Partial payments are supported — an invoice stays "Partially Paid" until fully settled.

```
INVOICE (Total: $1,000)
    │
    ├── Payment #1: $500 on Jan 15 — Bank Transfer  → Partially Paid
    └── Payment #2: $500 on Feb 01 — Credit Card    → PAID ✅
```

### Payment Record Fields:
| Field | Description |
|---|---|
| Amount | Payment value |
| Payment Date | Date received |
| Method | Bank Transfer / Credit Card / Cash / UPI / Other |
| Reference / Transaction ID | Bank ref or transaction number |
| Notes | Optional context |
| Logged By | Team member name (recorded for audit trail) |

---

## 🖥️ 7. Application Flow & Page Map

### 🔓 Public Gateway Pages
1. **Landing Page** (`LandingPage.jsx`): Introduction portal with feature overview.
2. **Login** (`Login.jsx`): Credential input with "Remember Me" toggle (caches email locally).
3. **Register** (`Register.jsx`): Signup form to create a new user profile.
4. **Forgot Password** (`ForgotPassword.jsx`): Recovery interface to request a reset token.

### 🏁 User Initialization
5. **Welcome Gateway** (`Welcome.jsx`):
   - **Create New Organization**: Initializes a new database tenant. User sets industry, business type, country, currency, and timezone.
   - **Join Existing Workspace**: User enters a 4-digit org code (e.g., `ORG-A1B2`) and writes an intro message. *(See correction below.)*
   - **Pending Approval**: User waits at a gateway screen until the Owner approves. Allows token refresh or request cancellation.

   > ⚠️ **Correction:** In the join flow, the user should **NOT** self-select their role (Member or Read-Only). Allowing users to request elevated roles is a security risk. The correct flow is:
   > 1. User submits join request with name + intro message only.
   > 2. Owner reviews the request and **assigns the role** (Member or Read-Only) at the time of approval.
   > 3. User receives access with the Owner-assigned role.

### 🛡️ Dashboard Routing & Tab Panels
6. **Core Router** (`Dashboard.jsx`): Resolves global role and mounts the correct dashboard:
   - `OwnerDashboard.jsx`
   - `AdminDashboard.jsx`
   - `MemberDashboard.jsx`
   - `ReadOnlyDashboard.jsx`

7. **Dashboard Tabs:**

| Tab | Available To | Description |
|---|---|---|
| **Overview** | All roles | Financial metrics: Total Revenue, Outstanding Balance, Active Subscriptions. Metrics calculated only from user's accessible clients. |
| **Clients** | Owner, Admin, Member | CRUD for clients. Filtered by client-level permissions. |
| **Invoices** | Owner, Admin, Member | Create, edit, change status, PDF export. Unified draft creation flow. |
| **Subscriptions** | Owner, Admin, Member | Assign plans to clients. Manage auto-renew and billing state. |
| **Team** (`TeamTab.jsx`) | Owner, Admin | Select any team member, view their assigned clients, update client-level roles. |
| **Settings** (`SettingsTab.jsx`) | **Owner only** | Configure currency, invoice prefix, and branding. Hidden from Admin dashboard. |
| **Audit Logs** | Owner, Admin, Read-Only | Full historic action timeline for compliance. |

---

## 💻 8. Technical Architecture & Directory Structure

```
BillNest/
├── backend/
│   ├── src/
│   │   ├── config/          # DB config, environment constants
│   │   ├── controllers/     # Controller logic (auth, invoices, clients)
│   │   ├── middleware/       # JWT protection, role checks
│   │   ├── models/          # Schemas (User, Client, Invoice, JoinRequest)
│   │   ├── routes/          # API endpoints (/api/auth, /api/invoices)
│   │   └── services/        # Business logic (token rotation, schedulers)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/      # Shared components (ProtectedRoute, etc.)
    │   ├── context/         # AuthContext (token handling, alerts)
    │   ├── pages/           # Views (Login, Welcome, Dashboard)
    │   │   └── dashboards/  # Role-specific dashboard implementations
    │   └── App.jsx          # Route definitions
    └── package.json
```

---

## 🛠️ 9. System Modifications & Bug Fixes

| Fix | Description |
|---|---|
| **JWT Concurrency Grace Period** | `/api/auth/refresh` allows a 10-second window where parallel requests with the same refresh token all succeed, preventing false "token reuse" blocks during simultaneous frontend calls. |
| **Branding Image Compression** | Logo uploads are drawn to Canvas and resized to max 150×150px as compressed JPEG (under 10KB), preventing DB and storage bloat. |
| **Self-Healing LocalStorage** | If `localStorage.setItem` throws `QuotaExceededError`, `safeSaveToLocalStorage` catches it, strips the base64 logo from the payload, and retries the save with remaining config intact. |
| **UI Cleanup: Copilot Removed** | AI Copilot assistant removed from all dashboard pages. |
| **UI Cleanup: Telegram Button Removed** | "Save & Send via Telegram" removed from invoice interface in favor of unified draft workflow. |
| **UI Cleanup: Settings Hidden from Admin** | Settings tab removed from `AdminDashboard.jsx` entirely — not just disabled. |
| **UI Cleanup: Invoice Header Image Removed** | Banner/header image removed from all invoice detail card views. |

---

## 📜 10. Audit Trail

Every action is logged automatically. Siddharth (Read-Only / Auditor) reviews this for compliance.

### Events Logged:
- Invoice created, sent, voided, paid
- Payment logged or deleted
- Client created, edited, deleted
- Team member invited, role changed, removed
- Plan or subscription created, edited, cancelled
- Join request submitted, approved, rejected
- Organization settings changed

### Log Entry Format:
```
[2024-01-15 14:32:10 IST]  Pooja Roy   →  Invoice INV-2024-0042 sent to Acme Corp
[2024-01-16 09:15:44 IST]  Pooja Roy   →  Payment of $500 logged for INV-2024-0042
[2024-01-20 11:00:00 IST]  System      →  Invoice INV-2024-0042 marked OVERDUE (auto)
[2024-01-21 10:30:00 IST]  Amit Shah   →  Invoice INV-2024-0042 voided
[2024-01-22 09:00:00 IST]  Rahul Patel →  Siddharth Sen approved as Read-Only
```

---

## ⚙️ 11. Setup & Execution

### Backend Server
```bash
cd backend
npm install
npm run dev        # Runs on port 5000
```

### Frontend App
```bash
cd frontend
npm install
npm run dev        # Runs on port 5173 (Vite, proxy configured to :5000)
```

---

## 📊 12. Entity Relationship Summary

```
Organization
    ├── has many → Team Members (Global Roles)
    │       └── has many → Client Access Rules (Client-Level Roles, per client)
    ├── has many → Clients
    │       ├── has many → Subscriptions
    │       │       └── belongs to → Plan
    │       │       └── auto-generates → Invoices (Draft)
    │       └── has many → Invoices (Manual or Auto)
    │               ├── has many → Line Items
    │               └── has many → Payments
    ├── has many → Plans
    ├── has many → Join Requests
    └── has many → Audit Logs
```
