# QueueCure API Reference

All API endpoints reside under `http://localhost:3001/api`.

## Authentication
Currently, QueueCure operates within an internal clinic network. In production, requests should include an Authorization header: `Authorization: Bearer <token>`.

---

## 1. Queue Management

### `GET /api/queue`
Retrieve the current state of the queue for a specific clinic.

**Query Parameters**
- `clinicId` (String) - Optional. Filters by clinic ID.

**Response**
```json
{
  "waiting": [
    {
      "_id": "60d5ec...",
      "name": "John Doe",
      "tokenNumber": 14,
      "priority": "NORMAL",
      "status": "WAITING"
    }
  ],
  "current": {
    "name": "Jane Smith",
    "tokenNumber": 13,
    "calledAt": "2026-10-24T10:30:00.000Z"
  },
  "avgConsultationTime": 15
}
```

### `POST /api/queue`
Add a new patient to the queue.

**Body**
```json
{
  "name": "John Doe",
  "priority": "NORMAL", // "NORMAL" | "PRIORITY" | "EMERGENCY"
  "clinicId": "clinic_default"
}
```

### `POST /api/queue/call-next`
Marks the current patient as `COMPLETED` and atomically moves the highest-priority waiting patient to `IN_CONSULTATION`.

**Response**
```json
{
  "message": "Patient called successfully",
  "patient": { ... }
}
```

## 2. Patient Tracking

### `GET /api/queue/track/:queueId`
Retrieve live status for a specific patient using their secure tracking ID.

**Response**
```json
{
  "patient": {
    "name": "John Doe",
    "status": "WAITING",
    "priority": "NORMAL"
  },
  "patientsAhead": 4,
  "estimatedWaitMinutes": 60,
  "isCurrent": false
}
```

## 3. Analytics & Diagnostics

### `GET /api/analytics`
Retrieve aggregated clinic performance statistics.

**Response**
```json
{
  "totalServed": 142,
  "longestWaitTime": 45,
  "doctorUtilization": 87,
  "chartData": [
    { "name": "9 AM", "waitTime": 12 },
    { "name": "10 AM", "waitTime": 15 }
  ]
}
```

### `POST /api/demo/seed`
Wipes the database and seeds 50 synthetic patients to simulate a busy day, generating consultation logs and wait events. Intended for demonstration purposes only.
