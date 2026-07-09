# StadiumMind AI - API Specifications & Security Matrix

This document defines the REST APIs, Authentication framework, Rate Limiting, and Security policies designed for the **StadiumMind AI** ecosystem.

---

## 1. REST API Endpoints

All requests require an `Authorization: Bearer <Firebase_ID_Token>` header, except for public schedules.

### A. Navigation & Routing API
Generates crowd-aware, accessibility-friendly walking routes within the venue.

* **Endpoint**: `POST /api/v1/navigation/route`
* **Request Header**:
  ```http
  Content-Type: application/json
  Authorization: Bearer <JWT_TOKEN>
  ```
* **Request Payload**:
  ```json
  {
    "userId": "usr_998811",
    "origin": { "lat": 40.8128, "lng": -74.0742 },
    "destination": { "section": "104", "row": "K", "seat": "12" },
    "accessibilityMode": {
      "wheelchair": true,
      "avoidStairs": true,
      "sensoryFriendly": false
    }
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "routeId": "rt_7f382a",
    "distanceMeters": 420.5,
    "estimatedDurationSeconds": 310,
    "avoidedZones": ["concourse_gate_c_congested"],
    "waypoints": [
      { "step": 1, "instruction": "Proceed from Gate A toward Elevator West 2", "lat": 40.8125, "lng": -74.0739 },
      { "step": 2, "instruction": "Take Elevator West 2 to Level 1 Concourse", "lat": 40.8123, "lng": -74.0735 },
      { "step": 3, "instruction": "Turn left and follow Corridor B to Block 104 entrance", "lat": 40.8121, "lng": -74.0731 }
    ]
  }
  ```

---

### B. Incident Reporting & AI Dispatches
Report events (medical, safety, maintenance). Triggers automated multi-agent triage and schedules volunteer deployment.

* **Endpoint**: `POST /api/v1/incidents/report`
* **Request Payload**:
  ```json
  {
    "reporterId": "usr_vol_4422",
    "category": "medical",
    "severity": "high",
    "description": "Spectator experiencing heat exhaustion at Section 212, near Concession Stand 4.",
    "location": {
      "stadiumId": "metlife_stadium",
      "section": "212",
      "lat": 40.8130,
      "lng": -74.0750
    }
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "incidentId": "inc_901122",
    "status": "dispatching",
    "assignedVolunteers": [
      { "volunteerId": "usr_vol_7711", "name": "Maria Silva", "skill": "first_aid" }
    ],
    "aiActionPlan": {
      "summary": "Dispatch medical team + first-aid volunteer. Coordinate route with escalator access.",
      "steps": [
        "1. Confirm volunteer Maria Silva is en route with water/ice pack.",
        "2. Alert Stadium Medical Hub Sector 2.",
        "3. Provide Maria Silva with route avoiding Concourse B crowd congestion."
      ]
    },
    "createdAt": "2026-07-09T11:45:00Z"
  }
  ```

---

### C. Live Crowd Density & IoT Push
Aggregates sensor streams. Primarily invoked by Cloud Dataflow edge nodes.

* **Endpoint**: `POST /api/v1/telemetry/density`
* **Request Payload**:
  ```json
  {
    "stadiumId": "metlife_stadium",
    "zoneId": "gate_a_ingress",
    "sensorType": "wifi_ap_density",
    "connectedClientsCount": 1850,
    "capacityThreshold": 2000,
    "timestamp": "2026-07-09T11:45:10Z"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "zoneId": "gate_a_ingress",
    "densityStatus": "warning",
    "actionSuggested": "Trigger gate-redirect recommendation routines in Navigation Agent"
  }
  ```

---

## 2. Security Architecture

### Authentication & Authorization
1. **Firebase Authentication**: Decodes credentials client-side and validates ID tokens (JWTs) using GCF (Google Cloud Functions) middleware.
2. **Role-Based Access Control (RBAC)**: Custom Claims embedded within token payloads restrict API access:
   - `role: fan` -> Access to `/navigation/*`, `/tickets/*`, `/feedback`.
   - `role: volunteer` -> Access to `/volunteer/*`, `/incidents/report`.
   - `role: organizer` -> Access to operations control panel, `/telemetry/*`, system reports.

### Security Controls & Data Encryption
- **Encryption at Rest**: Fully handled via Google Cloud Secret Manager for credentials/API keys. Database storage is encrypted with Customer-Managed Encryption Keys (CMEK) via Cloud KMS.
- **Encryption in Transit**: TLS 1.3 mandated across all endpoints. HSTS (HTTP Strict Transport Security) enabled.
- **Audit Logging**: GCP Cloud Logging logs every API ingestion, user privilege escalation, and emergency action plan execution.
- **GDPR & Privacy Compliance**:
  - Live CCTV metadata acts strictly on *anonymized count metrics* (Vision AI counts blobs, not faces).
  - Location logs are ephemeral, cached in local memory, and deleted immediately when the session ends.
  - "Right to be forgotten" deletes all reference keys in the `Users` and `Feedback` collections.

---

## 3. Generative AI Safety & Guardrails

To run a reliable GenAI application for a massive event, we implement safety layers to secure Gemini prompts:

### Prompt Injection Defenses
- **Structured JSON Framing**: All prompts utilize rigorous XML or JSON encapsulation schemas to prevent user input from overriding the system instructions.
- **Content Moderation API**: All inputs pass through a Cloud Natural Language safety filter to drop prompts containing malicious phrases, hate speech, or jailbreaks.

### Hallucination Mitigation (Dual-LLM Blueprint)
Every AI-generated operational summary or safety plan undergoes a automated checks cycle:

```
[System Request] ──> [Gemini Pro: Primary Draft]
                            │
                            ▼
              [Gemini Flash: Validator Model] <── [Grounding Policy Index]
                            │
            Does plan contain non-policy recommendations?
             /                               \
         (Yes)                               (No)
           /                                   \
  [Regenerate / Fallback Plan]            [Approve & Return API response]
```
- **RAG Grounding**: Prompt context is enriched with data queried directly from Firestore (`Incidents`, `CrowdZones`) ensuring output details are factually accurate.
- **Structured Output**: Models are strictly executed with `responseSchema` parameters set to force output validation against strict schemas.

---

## 4. Rate Limiting Matrix

Configured in Cloud Armor edge configurations to prevent denial of service:

| API Namespace | Limit Threshold | Action | Reason |
|---|---|---|---|
| `/api/v1/navigation/*` | 30 requests / min | HTTP 429 Too Many Requests | Prevent map-scraping & coordinate loops |
| `/api/v1/incidents/report` | 5 requests / min | HTTP 429 | Prevent spam reports |
| `/api/v1/telemetry/*` | 10,000 requests / min | Block / Edge throttle | Internal data processing scaling |
| `/api/v1/auth/*` | 5 attempts / min | Account Lock / ReCaptcha | Prevent brute force auth attempts |
