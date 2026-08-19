# Frontend API Documentation

Frontend-focused reference for the current backend implementation.

## Base URLs

- API base path: `/api/v1`
- OpenAPI UI: `/docs`
- ReDoc: `/redoc`
- Scalar docs: `/scalar`
- Health check: `/health`

## Authentication

Protected endpoints require:

- `Authorization: Bearer <access_token>`

Auth flow:

1. Register or login to receive `access_token` and `refresh_token`.
2. Send `access_token` in `Authorization` header for protected requests.
3. If access token expires, call refresh endpoint with `refresh_token`.

## Common Error Response

Most application errors return this shape:

```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

Typical status codes:

- `400`: bad request or validation/application errors
- `401`: unauthorized
- `404`: resource not found
- `422`: request validation failed
- `429`: rate limit exceeded

## Data Enums

### DocumentType

- `prescription`
- `lab_report`
- `discharge_summary`
- `clinical_note`
- `other`

### ProcessingStatus

- `uploaded`
- `ocr_completed`
- `extracted`
- `analyzed`
- `user_edited` — user edited the extracted data; awaiting re-acceptance
- `accepted` — user accepted the extracted data
- `failed`

### RiskLevel

- `low`
- `medium`
- `high`

## Endpoints

## Auth

### POST /api/v1/auth/register

Public.

Request body:

```json
{
  "email": "user@example.com",
  "full_name": "Jane Doe",
  "password": "strongPassword123"
}
```

Response 200:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "Jane Doe",
  "is_active": true
}
```

### POST /api/v1/auth/login

Public.

Request body:

```json
{
  "email": "user@example.com",
  "password": "strongPassword123"
}
```

Response 200:

```json
{
  "access_token": "jwt",
  "refresh_token": "jwt",
  "token_type": "bearer"
}
```

### POST /api/v1/auth/refresh

Public.

Request body:

```json
{
  "refresh_token": "jwt"
}
```

Response 200:

```json
{
  "access_token": "jwt",
  "refresh_token": "jwt",
  "token_type": "bearer"
}
```

### GET /api/v1/auth/me

Protected.

Response 200:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "Jane Doe",
  "is_active": true
}
```

## Documents

### POST /api/v1/documents/upload

Protected. Multipart upload.

Content-Type: `multipart/form-data`

Form fields:

- `files`: one or many file inputs with the same field name `files`

Response 200:

```json
{
  "uploaded": [
    {
      "file_name": "report.pdf",
      "document_id": "uuid",
      "status": "uploaded"
    }
  ],
  "failed": []
}
```

### GET /api/v1/documents

Protected.

Response 200:

```json
[
  {
    "id": "uuid",
    "file_name": "report.pdf",
    "mime_type": "application/pdf",
    "file_size": 123456,
    "document_type": "lab_report",
    "processing_status": "extracted",
    "created_at": "2026-08-02T10:00:00Z"
  }
]
```

### GET /api/v1/documents/{document_id}

Protected. Renders a server-side HTML page, not JSON — not used by this frontend.
Use `GET /api/v1/documents/{document_id}/detail` below instead.

### GET /api/v1/documents/{document_id}/detail

Protected.

Path params:

- `document_id`: UUID

Response 200:

```json
{
  "id": "uuid",
  "file_name": "report.pdf",
  "mime_type": "application/pdf",
  "file_size": 123456,
  "document_type": "lab_report",
  "processing_status": "extracted",
  "created_at": "2026-08-02T10:00:00Z",
  "visit_date": "2026-07-15",
  "doctor_name": "Dr. Example",
  "hospital_name": "City Hospital",
  "extraction_result": { "...": "raw AI extraction JSON, or null" }
}
```

### PATCH /api/v1/documents/{document_id}/extraction

Protected. Edits and saves the extracted data for a document. Available any time after extraction has
completed, including after the document has been accepted — editing is always allowed and moves the
document back to `user_edited` status.

Path params:

- `document_id`: UUID

Request body:

```json
{
  "extraction_result": { "...": "edited extraction JSON" }
}
```

Response 200: same shape as the detail endpoint above, with `processing_status` set to `user_edited`.

Errors:

- 422: document has not been extracted yet (still `uploaded`/`ocr_completed`/`failed`)

### POST /api/v1/documents/{document_id}/accept

Protected. Marks the extracted data for a document as accepted by the user.

Path params:

- `document_id`: UUID

Response 200: same shape as the detail endpoint above, with `processing_status` set to `accepted`.

Errors:

- 422: document has not been extracted yet (still `uploaded`/`ocr_completed`/`failed`)

## Analysis

### POST /api/v1/analysis/run

Protected. Triggers background processing.

Request body:

```json
{
  "document_ids": ["uuid", "uuid"]
}
```

Response 200:

```json
{
  "status": "accepted",
  "message": "Analysis started"
}
```

Note: This endpoint returns immediately and does not provide progress in this API surface yet.

## Dashboard

### GET /api/v1/timeline

Protected.

Response 200:

```json
{
  "timeline": [
    {
      "visit_id": "uuid",
      "visit_date": "2026-07-15",
      "doctor_name": "Dr. Example",
      "hospital_name": "City Hospital",
      "medications": ["Drug A"],
      "labs": ["HbA1c"],
      "notes": ["Follow-up in 2 weeks"]
    }
  ]
}
```

### GET /api/v1/medications

Protected.

Response 200:

```json
[
  "Metformin",
  "Atorvastatin"
]
```

### GET /api/v1/lab-trends

Protected.

Response 200:

```json
{
  "trends": [
    {
      "test_name": "HbA1c",
      "trend_direction": "increasing",
      "normal_range_comparison": "above_normal",
      "explanation": "Recent values indicate an upward trend",
      "confidence": 0.82
    }
  ],
  "warning": {
    "message": "Trend output is informational and not diagnostic.",
    "recommend_doctor_consult": true
  }
}
```

### GET /api/v1/alerts

Protected.

Response 200:

```json
[
  {
    "category": "drug_interaction",
    "details": "Drug A interacts with Drug B",
    "assessment": {
      "risk_level": "high",
      "explanation": "Potential severe interaction",
      "evidence": [
        {
          "source_document_id": "uuid",
          "snippet": "...",
          "page": 3
        }
      ],
      "confidence": 0.9
    }
  }
]
```

## Chat

### POST /api/v1/chat

Protected.

Request body:

```json
{
  "question": "Can you summarize my recent lab changes?",
  "session_id": "uuid-optional"
}
```

Response 200:

```json
{
  "session_id": "uuid",
  "answer": "...",
  "confidence": 0.78,
  "citations": [
    {
      "source_document_id": "uuid",
      "snippet": "...",
      "page": 2
    }
  ],
  "warning": {
    "message": "Informational output only.",
    "recommend_doctor_consult": true
  }
}
```

### GET /api/v1/chat/history?session_id={uuid}

Protected.

Query params:

- `session_id`: UUID

Response 200:

```json
{
  "session_id": "uuid",
  "messages": [
    {
      "role": "user",
      "content": "Question text",
      "confidence": 1.0,
      "created_at": "2026-08-02T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "Answer text",
      "confidence": 0.76,
      "created_at": "2026-08-02T10:00:01Z"
    }
  ]
}
```

## Frontend Integration Notes

- Keep access token in memory when possible. If persisted, use a secure storage strategy suitable for your app type.
- On `401`, try token refresh once, then retry the original request.
- For file uploads, send all files under the same `files` field name.
- Analysis run is async; after triggering it, fetch dashboard or document data again after a short delay.
- Surface `warning.message` anywhere it appears, because medical outputs are explicitly non-diagnostic.

## Suggested Frontend Behavior

- Show a global auth-expired UX only after refresh retry fails.
- Add optimistic loading states for chat and analysis trigger actions.
- Render confidence values with clear labels (for example: low confidence if < 0.6).
- Always display citations and warning banners for medical outputs.
