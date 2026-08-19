# Dream More AppWorks — Frontend

Premium freelance marketplace frontend for the Ethiopian market. Built with
**React 19, Vite, Tailwind CSS v4, React Router v7, Axios, and Lucide React**.

The Laravel backend is a separate project (`/api/v1`). This frontend consumes it
through a single Axios client and must never invent its own backend.

## Brand

| Token | Value |
| --- | --- |
| Sunset Orange (primary) | `#FF6B35` |
| Dark Blue (primary dark) | `#0B132B` |
| Backgrounds | White / light gray |
| Navigation | Dark ink |

Design tokens are defined as Tailwind v4 `@theme` variables in
[`src/index.css`](src/index.css) — `brand-*` (orange scale) and `ink-*` (dark
blue scale) — so colors are never hardcoded across components.

## Getting started

```bash
npm install
npm run dev        # start the dev server
npm run build      # production build to dist/
npm run preview    # preview the production build
npm run lint       # oxlint
```

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to point at the
Laravel API (defaults to `http://127.0.0.1:8000/api/v1`).

## Project structure

```
src/
  api/          Axios client (base URL, token interceptor, 401 handling)
  components/
    common/     Container, Loading, EmptyState, ErrorState, PagePlaceholder
    dashboard/  StatCard, QuickActions, DashboardSkeleton
    freelancers/ Freelancer profile skeleton
    employers/   Employer profile skeleton
    landing/    Landing page sections (hero, categories, featured, etc.)
    layout/     Navbar, UserMenu, Footer
    proposals/  ProposalForm, ProposalSkeleton, ConfirmActionModal, JobProposalPanel
    ui/         Button, Input, Select, Textarea, Card, Badge, Modal
  config/       Environment access (VITE_* variables)
  constants/    App, navigation, and landing sample content
  contexts/     AuthContext (object) + AuthProvider (session state)
  hooks/        useAuth, usePageTitle
  layouts/      PublicLayout, AuthLayout, DashboardLayout
  pages/        public/, auth/, freelancer/, employer/, NotFoundPage
  routes/       Route table + ProtectedRoute / RoleRoute guards
  services/     Domain service modules (added per phase)
  utils/        cn(), format helpers, error helpers, auth helpers, mappers
```

## Routing

- Public: `/`, `/jobs`, `/jobs/:id`, `/freelancers`, `/freelancers/:id`, `/categories`
- Auth: `/login`, `/register`, `/forgot-password`
- Freelancer (role-protected): `/freelancer/*` — dashboard, profile, profile/edit, jobs, proposals, proposals/:id, contracts, messages, notifications
- Employer (role-protected): `/employer/*` — dashboard, profile, profile/edit, jobs (+ create/edit/proposals), contracts, messages, notifications

All pages are lazy-loaded per route; protected areas redirect to `/login` when
unauthenticated and enforce role access (`freelancer`, `employer`, `admin`).

## Authentication

Real API authentication against the Laravel backend (`/api/v1/auth/*`):

- `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `POST /auth/logout`
- Sanctum bearer token stored in `localStorage` (`appworks_token`) with the
  authenticated user cached alongside it (`appworks_user`).
- The session is hydrated on app start via `GET /auth/me`; route guards show a
  loader until that resolves, so protected pages never flash before redirects.
- A 401 from any authenticated request clears the session and redirects to
  `/login` (the API client drops the token and notifies `AuthProvider`).
- `authService` (`src/services/authService.js`) is the only module that talks
  to the auth endpoints; UI components go through `useAuth()`.

`/forgot-password` honestly states that password recovery is not available yet —
the backend exposes no password-reset endpoints, and the frontend does not
pretend otherwise.

## Authenticated profiles

Freelancer and employer profiles are backed by the real API:

- Freelancer: `GET /freelancer/profile`, `PUT /freelancer/profile`
  (`freelancerService`) — headline, overview, hourly rate, experience level,
  location, availability, GitHub/LinkedIn/website links, and skills
  (experience years + removal; adding new skills is blocked until the backend
  ships a skills catalog endpoint).
- Employer: `GET /employer/profile`, `PUT /employer/profile`
  (`employerService`) — company name, description, industry, size, location,
  website, plus user-level phone and bio.

Both roles have a profile view (`/freelancer/profile`, `/employer/profile`) and
an edit form (`…/profile/edit`) with client + backend validation, loading
skeletons, and friendly error states.

## Dashboards

`/freelancer/dashboard` and `/employer/dashboard` are composed from confirmed
API endpoints — there is no dedicated dashboard endpoint on the backend:

- Freelancer: `GET /freelancer/profile` + `GET /proposals` +
  `GET /contracts` → welcome header, stats (proposals, active contracts,
  completed jobs, earnings), quick actions, recent proposals/contracts, and a
  profile summary sidebar. All statistics are derived from real API data.
- Employer: `GET /employer/profile` + `GET /employer/jobs` +
  `GET /contracts` → welcome header, stats (jobs posted, proposals received,
  active contracts, total spent), quick actions, recent jobs/contracts, and a
  company summary sidebar.

Each section has an honest empty state; every statistic is real API data.

## Proposals & bidding

Connected to the Stage 14 backend (`proposalService.js`):

- **Freelancer:** `/freelancer/proposals` (paginated list with statuses) and
  `/freelancer/proposals/:id` (detail with edit + withdraw while
  pending/shortlisted). Submission happens on public job pages via the
  `JobProposalPanel` — unauthenticated users are sent to `/login`, employers
  see no submission form, and freelancers who already have an active proposal
  see "Proposal already submitted" with a link to it.
- **Employer:** `/employer/jobs/:id/proposals` — review proposals with
  shortlist / reject / accept. Accepting calls the backend only: it creates
  the contract, rejects the remaining active proposals, and moves the job to
  in progress server-side; the page then refreshes real data.

Confirmed proposal statuses: `pending`, `shortlisted`, `accepted`, `rejected`,
`withdrawn`. Fields follow `ProposalRequest`: `cover_letter`, `bid_amount`,
`currency` (3-letter, default ETB), `estimated_duration`.

Other feature pages render honest placeholders — no fake API calls, no mock
backend. Contracts, messaging, notifications, and reviews are implemented in
later phases against the existing Laravel API.
