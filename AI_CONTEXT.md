# AI Context - Real Estate CRM

## Project Name
Real Estate CRM (Supabase-to-Postgres Flow)

## Tech Stack
* **Frontend**: React (v18), Vite, TypeScript, Tailwind CSS (v3), Shadcn UI, Redux Toolkit, TanStack React Query, React Router Dom (v7)
* **Backend**: Express.js (Node.js REST API with socket.io)
* **Database**: PostgreSQL (local database)

## Folder Structure
* `src/components/`: Reusable UI & section components
  * `auth/`: Auth guards & login components
  * `common/`: Common utilities / UI widgets
  * `crm/`: CRM-specific components
  * `dashboard/`: Components for the dashboard
  * `layout/`: Layout shell, sidebar, and headers
  * `leads/`: Lead management screens
  * `projects/`: Project list and details
  * `properties/`: Property/units listing & creation
  * `security/`: Audit / security monitoring
  * `settings/`: Settings panes (billing, goals, notifications, company details, reassignment, custom fields)
  * `ui/`: Radix-based shadcn components (dialog, button, table, input, card, dropdown, etc.)
* `src/pages/`: Page-level components
  * `Login.tsx`: Login credentials page
  * `Dashboard.tsx` (Dashboard.classic.tsx / Dashboard.enhanced.tsx): Dashboard views
  * `ForgotPassword.tsx`: Recover account credentials
  * `ProjectSetup.tsx`: Setup configuration for projects
  * `Quotations.tsx`, `ProjectQuotations.tsx`, `QuotationView.tsx`: Quotation system screens
  * `FollowUp.tsx`: Follow-ups calendar / list
  * `Settings.tsx`: User profile, billing, imports, etc.
  * `ChatHome.tsx`: Direct/group messages
  * `Report.tsx`: Analytics / PDF reports
* `src/contexts/`: React Contexts (AuthContext, LeadsContext, FormContext, SocketContext)
* `api/`: Node.js Express server backend code
* `database/`: SQL schema & migrations

## UI Framework
* Tailwind CSS + Shadcn UI (Radix primitives)

## Theme Colors
* **Light Mode (Default)**:
  * Background: `#ffffff`
  * Foreground: `#020817`
  * Primary: `#0f172a` (Slate 900)
  * Secondary: `#f1f5f9` (Slate 100)
  * Muted: `#f1f5f9` (Slate 100) / `#64748b` (Slate 500)
  * Border / Input: `#e2e8f0` (Slate 200)
* **Dark Mode**:
  * Background: `#020817` (Deep Dark Slate)
  * Foreground: `#f8fafc`
  * Primary: `#f8fafc`
  * Secondary: `#1e293b`

## Typography
* Default Tailwind Font Family (`sans-serif` / Inter / system-ui)
* Base font size set to `12px` in `index.css` (html, body)

## Spacing System
* Tailwind CSS spacing system (`p-*`, `m-*`, `gap-*`, etc.)

## Reusable Components
* Radix UI based components (`Button`, `Input`, `Label`, `Card`, `Dialog`, `DropdownMenu`, `Tabs`, `Table`, `Select`, `Calendar`, etc.) in `src/components/ui/`

## Completed Screens
* None (Starting UI/UX refinement pass)

## Pending Screens
* [ ] Login / Forgot Password
* [ ] Dashboard
* [ ] Leads Management (List & Details)
* [ ] Projects & Project Setup
* [ ] Quotations & Quotation View
* [ ] Follow-ups & Tasks
* [ ] Users & User Management
* [ ] Reports
* [ ] Chat
* [ ] Settings (including Billing, Notification Settings, Lead Types, Reassignments, Custom Fields, Company Details, Goals, Document Management)

## Design Principles
* **Modern & Minimal**: Sleek UI borders, crisp fonts, harmonized colors, elegant dark modes.
* **Premium SaaS CRM**: Layouts should look like a high-end application (e.g., Linear, Stripe, Vercel).
* **Responsive**: Seamless adaptation across mobile, tablet, and desktop viewports.
* **Micro-interactions**: Smooth transitions, subtle hover states, interactive elements.
* **Accessibility**: Proper ARIA roles, clean labels, keyboard nav, clear focus rings.

## Known Issues
* None documented yet.

## Things Never To Change
* **Business logic / handlers**: Must remain fully intact.
* **API calls & endpoints**: Never modify backend router or frontend fetch patterns.
* **Database structure**: Keep schemas unchanged.
* **Routes**: Avoid renaming react-router paths unless absolutely required.

## Overall Architecture
* Single Page Application (Vite + React) communication via REST JSON API (Express) and WebSockets (Socket.io).
