# BloodBridge frontend

React + Vite frontend for the separately run BloodBridge API. The red-and-white UI uses the supplied backend as its source of truth; it does not persist users, credentials, requests, inventory, or demo records in browser storage.

## Run both applications

1. In VS Code, open a terminal in the separate backend folder. Configure a private backend `.env` with `MONGO_URI`, `JWT_SECRET`, `ADMIN_PASSWORD` (at least 12 characters), and optionally `ADMIN_EMAIL`, `PORT`, `CLIENT_URL`, and `NODE_ENV`. Keep MongoDB connection details, JWT signing keys, administrator passwords, and device secrets in this backend environment only.
2. Start the backend from its own folder:

   ```bash
   npm install
   npm run seed       # optional; requires configured MongoDB and ADMIN_PASSWORD
   npm run dev        # http://localhost:5000
   ```

   The seed creates a Super Admin (email defaults to `admin@bloodbridge.local`), a synthetic hospital, a synthetic blood bank, their assignment, and a small O+ Red cells inventory record. Use only development/test data.
3. From this frontend folder, install and start:

   ```bash
   npm install
   Copy-Item .env.example .env.local
   npm run dev
   ```

4. Open `http://localhost:5173`. The backend's default CORS origin is `http://localhost:5173`; keep `CLIENT_URL` set to the exact browser origin. The frontend sends requests with `credentials: 'include'` and uses the backend's HTTP-only `bb_access` cookie.

Use `npm run build` for a production build and `npm run preview` to serve it locally. Node 18 or newer is recommended.

### Frontend environment

`.env.example` sets:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
```

Set `VITE_API_BASE_URL` to the reachable backend `/api` base URL when the backend is hosted elsewhere. Restart Vite after changing environment variables. This value is public configuration, not a secret. Do not place MongoDB URIs, JWT secrets, administrator passwords, or device secrets in a `VITE_` variable.

### Backend configuration to check

- `PORT` (defaults to `5000`)
- `CLIENT_URL` (defaults to `http://localhost:5173`; also used for Socket.IO CORS and generated hospital QR links)
- `MONGO_URI` and `JWT_SECRET`, configured only in the backend's private environment
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` if using the backend seed script
- `NODE_ENV=production` when deploying over HTTPS so the backend marks the auth cookie `Secure`

The backend uses MongoDB transactions for inventory reservations; use a MongoDB deployment configured to support transactions (replica set or sharded cluster). The frontend does not start, configure, or modify the backend.

## Backend-connected workflows

The frontend calls only routes present in the supplied backend:

| Frontend area | Verified API behavior |
| --- | --- |
| Sign-in/session | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`; browser-only HTTP-only cookie session |
| Public requests | `GET /api/requests/public/qr/:token`, multipart `POST /api/requests`, `GET /api/requests/public/track/:token` |
| Requests | `GET /api/requests`; status transitions via `PATCH /api/requests/:requestId/status`; reserve and forward via their `POST` actions |
| Hospital / bank workflows | Operations stats and hospital overview, inventory reads, sample collection, compatibility outcome and shipment creation |
| Organizations | Super Admin organization create/update/list, administrator creation, hospital-to-bank assignment, hospital QR rotation |
| Operations | Notifications and read state, temperature alerts and permitted alert state updates, shipment status transitions, shipment telemetry |
| Complaints | Hospital complaint create/list and Super Admin complaint review/update |
| IoT | Device registration/revocation, device-secret-authenticated reading submission, and authenticated-session telemetry history; Socket.IO events use backend event names |

All API responses are displayed in their backend shape or a direct view of those fields. The UI surfaces API/network/authorization errors instead of substituting demo records. Socket.IO uses the same cookie and verified event names (`notification:new`, `temperature:reading`, `temperature:alert`, `request:created`, `request:forwarded`, `request:status`).

### API integration map (verified backend contract)

| Frontend page / action | Method and path | Payload / response used by frontend | Backend role / authorization |
| --- | --- | --- | --- |
| Login / session / sign out | `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` | Login `{ email, password }`; JSON `{ success, user }`; `bb_access` is an HTTP-only cookie | Login/logout public; `/me` authenticated |
| Public QR request form | `GET /api/requests/public/qr/:token` | Response `{ success, hospital, assignedBank }` | Public; rate limited |
| Public request submit | `POST /api/requests` | Multipart `patientName`, `contact`, `bloodGroup`, `component`, `units`, optional `urgency`, `notes`, `qrToken`, `idempotencyKey`, required `document`; response `{ success, request: { reference, status, hospital, assignedBank, trackingToken } }` | Public with optional session; rate limited |
| Public request tracking | `GET /api/requests/public/track/:token` | Response `{ success, request }` with limited fields | Public bearer token; rate limited |
| Portal request list / detail | `GET /api/requests` | Response `{ success, requests }`, populated hospital and assigned bank; detail screen selects by `_id` or reference from this role-scoped list | Any authenticated role; backend scopes results |
| Reserve / forward / status | `POST /api/requests/:requestId/reserve`, `POST /api/requests/:requestId/forward`, `PATCH /api/requests/:requestId/status` | Reserve `{}` → `{ success, reservation }`; forward `{ reason }`; status `{ status }` → request reference/status | Reserve/forward Super Admin or blood bank admin; status Super Admin, hospital admin or blood bank admin within organization, backend transition checks apply |
| Operations dashboard | `GET /api/operations/stats`, `GET /api/operations/hospital-overview` | `{ stats: { activeRequests, alerts, organizations, availableUnits } }`; hospital view `{ organization, assignedBank, inventory }` | Authenticated; hospital overview hospital admin only |
| Inventory / notifications / alerts | `GET /api/operations/inventory`, `GET /api/operations/notifications`, `PATCH /api/operations/notifications/:id/read`, `GET /api/operations/alerts` | `{ inventory }`; `{ unread, notifications }`; read returns `{ notification }`; alerts `{ alerts }` | Authenticated; records role-scoped by backend; alert read scopes vary by role |
| Request sample / compatibility | `POST /api/operations/requests/:requestId/sample`, `POST /api/operations/requests/:requestId/compatibility` | Sample `{}`; compatibility `{ outcome, notes }`, outcome `pending`, `in_progress`, `confirmed` or `failed` | Sample Super Admin, hospital admin or blood bank admin within organization; compatibility Super Admin or blood bank admin within organization |
| Create / update shipment | `POST /api/operations/requests/:requestId/shipment`, `PATCH /api/operations/shipments/:shipmentId/status` | Create `{ vehicle }` when a vehicle ID is available; update `{ status }`; response includes `{ shipment }` | Create Super Admin or blood bank admin; status Super Admin, blood bank admin or hospital admin within organization; compatibility must already be confirmed |
| Shipment telemetry | `GET /api/operations/telemetry/:shipmentId` | `{ readings, alerts }`, selected by shipment database ID | Authenticated and shipment organization-scoped |
| Organizations / admins / assignment / QR | `GET|POST /api/organizations`, `PATCH /api/organizations/:organizationId`, `POST|GET /api/organizations/:organizationId/admins`, `PATCH /api/organizations/:organizationId/admins/:userId`, `POST /api/organizations/:organizationId/qr/rotate`, `POST /api/organizations/assignments` | Organization `{ name, type, address, latitude, longitude }`; edit `{ name, address, status }`; admin `{ name, email, password, permissions? }`; assignment `{ hospital, bloodBank }`; QR response includes one-time token and data URL | Super Admin only |
| Complaint list / submit / review | `GET|POST /api/complaints`, `PATCH /api/complaints/:complaintId` | Create `{ subject, description, requestId? }`; update `{ status?, resolution? }`; statuses `open`, `in_review`, `resolved`, `closed` | Authenticated list scoped to hospital unless Super Admin; create hospital admin; update Super Admin |
| IoT devices / telemetry ingestion | `POST /api/iot/devices`, `PATCH /api/iot/devices/:id/revoke`, `POST /api/iot/readings`, `PATCH /api/iot/alerts/:id` | Device create `{ deviceId, vehicle }` → one-time `secret`; reading `{ deviceId, deviceSecret, shipmentId, sensorId, temperature, deviceTimestamp, sequence }`; alert update `{ status: acknowledged|resolved }` | Device create/revoke Super Admin or blood bank admin; reading is authenticated by device ID/secret and shipment assignment, not a user cookie; alert update Super Admin, blood bank admin or hospital admin |

The sidebar portal roles map backend `user` → requester, `hospital_admin` → hospital, `blood_bank_admin` → bank, and `super_admin` → admin. Authorization is still enforced by the API. For multipart request submission the browser sets the boundary automatically; the shared API client does not override the `Content-Type`.

## Limitations in the supplied backend

These former prototype areas are not presented as working integrations because the backend has no corresponding API:

- Self-service patient/organization registration, payments, report exports, audit-log listing, hospital profile edits, and delivery-operator accounts/portal.
- Shipment and vehicle listing/search; shipment updates require a known shipment database ID. The UI supports creation and status updates but explains that it cannot discover shipments.
- Inventory creation or editing; inventory is read-only in the frontend. There is no inventory management endpoint.
- Vehicle/device discovery remains unavailable. Reading ingestion is wired as a diagnostic form that sends the exact device payload; it is not a sensor simulator. It requires a valid device secret and shipment/vehicle assignment. Do not enter production device secrets in a browser; use a device client in deployment. The form clears the secret after submission and does not persist it.
- Hospital-side QR rotation. The backend only exposes QR rotation through Super Admin organization routes; the QR page is therefore reported as admin-managed.
- A separate clinical authorization endpoint. Compatibility confirmation is kept distinct from inventory reservation, and shipment creation is a separate action gated by the backend's `compatibility_confirmed` state. The frontend does not fabricate an additional clinical approval API.

The API has no inventory or vehicle management endpoint. The provided seed creates one synthetic O+ Red cells inventory record for development. To test reservation, use a matching O+ Red cells request that does not exceed its available units and check that it has not expired. Shipment creation/status can then be tested after compatibility confirmation. Telemetry history still requires an existing vehicle, IoT device and readings; device readings must be posted by an appropriately authenticated device client. Do not treat an unavailable UI action as an API success.

## Suggested integration test path

1. Configure the backend environment, start MongoDB, run the backend seed if appropriate, then start the API on port `5000`.
2. Sign in using the administrator credentials configured for the backend seed. The frontend does not ship demo passwords.
3. In **Admin → Organizations**, create hospital and blood bank organizations, create their administrator accounts, and assign the bank to a hospital. The backend returns a hospital QR token on creation or QR rotation.
4. Open the generated QR link (or `/request?qr=...`), submit a request with a PDF/JPEG/PNG attachment, and keep the returned reference/tracking link.
5. Sign in as a hospital/bank administrator created above. Verify request scope, reserve stock only when compatible unexpired inventory exists, record sample collection, then have authorized blood-bank staff record the compatibility outcome.
6. Create a shipment only after compatibility is confirmed. Copy the shipment ID from the response and use **Shipments** to submit only a backend-permitted next status; use **Telemetry** to query readings for that shipment.
7. In **IoT devices**, optionally register a test device with a known vehicle ID and securely copy the one-time secret. For synthetic development testing only, use the device-reading form to submit an actual API payload with a known shipment ID and a strictly increasing sequence. Verify returned readings and alerts under **Telemetry** and **Temperature alerts**. Do not put production device secrets in the browser.
8. Verify notifications, read-state changes, alerts, and complaints using the role-specific navigation. Realtime alerts require a reachable Socket.IO server and an authenticated cookie session.

The backend's own API suite can be run separately from the backend folder with `npm test`; it requires the configured test database. The frontend validation command is `npm run build`.

Backend request statuses include `submitted`, `under_review`, `accepted`, `forwarded`, `awaiting_sample`, `compatibility_confirmed`, `ready_for_dispatch`, `dispatched`, `in_transit`, `delivered`, `cancelled`, and `unfulfilled`. Shipment statuses and allowed transitions are enforced by the API. The UI does not grant access based only on navigation; the backend remains authoritative.

## Frontend structure

- `src/lib/api.js` — configurable API base, credentialed fetch wrapper, verified endpoint functions, Socket.IO connection.
- `src/state/store.jsx` — cookie-backed session, notifications, socket lifecycle, and toasts; no authentication secret persistence.
- `src/pages/IntegrationWorkspace.jsx` — role-scoped backend data and supported operations.
- `src/pages/public/` — public marketing pages, live request form, tracking, backend login, and honest registration limitation.
- `src/components/layout/` and `src/styles/` — existing responsive red-and-white portal design system.

Legacy demo page components remain in the source tree for reference but are no longer wired into authenticated routes. The active portals use the API-backed workspace, and unsupported routes explain the backend limitation instead of running their former simulated actions.
