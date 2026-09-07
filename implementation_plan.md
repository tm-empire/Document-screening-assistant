# Implementation Plan: AI-Assisted 5-Layer Identity & Document Verification System MVP

A complete, production-grade MVP of an **AI-Assisted 5-Layer Identity & Document Verification System** built with a modern React + Vite + Tailwind CSS frontend, a modular Google Apps Script backend API, and Google Sheets as the database engine. 

The architecture enforces an **explainable evidence-based model** where 4 AI/analysis layers produce objective evidence metrics, passed to a deterministic **Layer 5 Rule-Based Risk Engine**, which outputs a risk assessment and recommendations to empower a human officer to make the final decision.

---

## User Review Required

> [!IMPORTANT]
> **Architecture & Storage Strategy**:
> 1. **Dual Execution Engine (Offline Mock + Apps Script Live)**: To ensure immediate out-of-the-box usability in local Vite dev mode, the frontend `api.js` layer will feature a smart dual-adapter design. It will seamlessly connect to a deployed Google Apps Script Web App when configured, or use an in-memory/localStorage mock backend with identical response schemas if the Apps Script Web App URL is not yet entered in `Settings`.
> 2. **Migration Readiness**: The React frontend will never interact directly with Google Sheets or Apps Script primitives. All calls funnel through `src/services/api.js`, allowing future migration to FastAPI + PostgreSQL + S3 without changing any React UI components.
> 3. **Google Sheets Database Design**: 10 dedicated sheets (`USERS`, `VERIFICATION_CASES`, `DOCUMENTS`, `OCR_RESULTS`, `FACE_RESULTS`, `FORENSIC_RESULTS`, `CONSISTENCY_RESULTS`, `ISSUER_RESULTS`, `RISK_RESULTS`, `AUDIT_LOGS`). An automated Apps Script initialization function (`setupDatabase()`) will populate headers and sample synthetic data automatically upon first run.

---

## 5-Layer Verification System Architecture

```
                               ┌────────────────────────────────────────────────┐
                               │             USER / OFFICER INPUT               │
                               └───────────────────────┬────────────────────────┘
                                                       │
                       ┌───────────────────────────────┴───────────────────────────────┐
                       ▼                                                               ▼
             [Identity Document]                                             [Live/Captured Face]
                       │                                                               │
        ┌──────────────┴──────────────┬──────────────────────────────┐                 │
        ▼                             ▼                              ▼                 │
┌──────────────┐              ┌──────────────┐               ┌──────────────┐          │
│   LAYER 1    │              │   LAYER 3    │               │   LAYER 4    │          │
│   Document   │              │   Document   │               │   Data &     │          │
│ Verification │              │  Forensics   │               │   Issuer     │          │
│  (OCR Field  │              │  (Tampering  │               │ Consistency  │          │
│ Extraction)  │              │ & ELA Check) │               │ & Mock Reg.) │          │
└──────┬───────┘              └──────┬───────┘               └──────┬───────┘          │
       │                             │                              │                  │
       └─────────────────────────────┼──────────────────────────────┴──────────┐       │
                                     │                                         │       │
                                     │                     ┌───────────────────┴───────┴┐
                                     │                     ▼                            │
                                     │              ┌──────────────┐                    │
                                     │              │   LAYER 2    │                    │
                                     │              │ Identity /   │                    │
                                     │              │    Face      │                    │
                                     │              │ Verification │                    │
                                     │              └──────┬───────┘                    │
                                     │                     │                            │
                                     └─────────────────────┼────────────────────────────┘
                                                           │
                                                           ▼
                                            ┌──────────────────────────────┐
                                            │           LAYER 5            │
                                            │       Rule-Based Risk        │
                                            │         Engine               │
                                            └──────────────┬───────────────┘
                                                           │ (Risk Score, Risk Level, Evidence & Reasons)
                                                           ▼
                                            ┌──────────────────────────────┐
                                            │        HUMAN OFFICER         │
                                            │      (Final Decision)        │
                                            └──────────────────────────────┘
```

---

## Proposed Technical Design

### 1. Frontend Stack & UI/UX (React + Vite + Tailwind CSS + Lucide + Recharts)
- **Theme & Aesthetics**: Dark/Light mode support with a sleek slate/indigo enterprise aesthetic, high-contrast badges (PASS, SUSPICIOUS, HIGH RISK, MANUAL REVIEW), clean metrics cards, animated verification step progressors, and interactive Error Level Analysis (ELA) canvas inspection.
- **Routing & Views**:
  - `/login`: Auth screen with Role switching (Admin, Officer, Supervisor) and credential entry.
  - `/dashboard`: Comprehensive operational overview with Recharts (Risk breakdown, verification trends, pending cases queue, quick actions).
  - `/new-verification`: 5-step wizard (1. Subject Info, 2. Doc Upload, 3. Face Upload/Webcam Capture, 4. Processing Animation, 5. Results).
  - `/verification/:id`: Deep-dive evidence report view with 5-layer cards, reason breakdown, recommended actions, and manual review decision modal.
  - `/cases`: Case management table with filters (Risk, Status, Date, Assigned Officer), search, and pagination.
  - `/high-risk`: Focused queue for Supervisors/Officers to audit high-risk and flagged cases.
  - `/analytics`: Detailed performance metrics, layer breakdown charts, and average processing times.
  - `/audit-logs`: Audit trail table with event filtering, timestamp range, user activity, and detail drawer.
  - `/users`: Admin user management view (Role assignment, user status toggles).
  - `/settings`: Backend API Configuration (Apps Script Web App URL test & save), AI Mode toggles, and Synthetic Issuer Database Editor.
  - `/report/:id`: Printable verification certificate report with official header and disclaimer.

### 2. Apps Script Backend Structure (`apps-script/`)
Modular Apps Script codebase structured for clean deployment:
- `Code.gs`: `doGet` and `doPost` routing dispatchers, standard response formatting.
- `config.gs`: Sheet names, Drive folder configuration, system constants, synthetic issuer dataset.
- `setupDatabase.gs`: Spreadsheet initialization function to create 10 sheets with headers and sample records.
- `auth.gs`: User verification, role-based checks, session token validation.
- `cases.gs`: Case CRUD operations, status updates, case filtering.
- `documents.gs`: File upload handler to Google Drive, returning file IDs and public/view URLs.
- `verification.gs`: Orchestration of Layers 1–4 analysis routines (OCR extraction, face comparison, ELA forensic analysis, consistency & synthetic issuer lookup).
- `riskEngine.gs`: Layer 5 deterministic rule engine with override logic and explainability generator.
- `audit.gs`: Log creation and retrieval for system auditing.
- `utils.gs`: Spreadsheet helper routines (UUID generator, row mapping, date formatting).

### 3. Google Sheets Schema Design
10 sheets inside one Google Spreadsheet:
1. `USERS`: `user_id`, `name`, `email`, `role`, `status`, `created_at`, `last_login`
2. `VERIFICATION_CASES`: `case_id`, `subject_name`, `created_by`, `assigned_to`, `status`, `risk_level`, `risk_score`, `created_at`, `updated_at`
3. `DOCUMENTS`: `document_id`, `case_id`, `document_type`, `drive_file_id`, `file_name`, `mime_type`, `uploaded_at`
4. `OCR_RESULTS`: `result_id`, `case_id`, `document_id`, `extracted_name`, `dob`, `document_number`, `issue_date`, `expiry_date`, `confidence`, `status`, `created_at`
5. `FACE_RESULTS`: `result_id`, `case_id`, `similarity_score`, `face_match`, `liveness_status`, `confidence`, `created_at`
6. `FORENSIC_RESULTS`: `result_id`, `case_id`, `tampering_score`, `status`, `explanation`, `suspicious_regions`, `created_at`
7. `CONSISTENCY_RESULTS`: `result_id`, `case_id`, `name_match`, `dob_match`, `document_number_match`, `date_valid`, `duplicate_detected`, `consistency_status`, `explanation`, `created_at`
8. `ISSUER_RESULTS`: `result_id`, `case_id`, `issuer_found`, `name_match`, `dob_match`, `document_status`, `issuer_name`, `created_at`
9. `RISK_RESULTS`: `result_id`, `case_id`, `risk_score`, `risk_level`, `decision`, `reasons`, `generated_at`
10. `AUDIT_LOGS`: `log_id`, `user_id`, `case_id`, `action`, `timestamp`, `details`

---

## File Component Breakdown

### Frontend Components (`src/`)
- `src/services/api.js`: Unified API service wrapper with seamless fallback to client-side mock service when Apps Script URL is unset.
- `src/services/mockBackend.js`: Realistic mock database engine (in-memory/localStorage) executing identical logic to Apps Script.
- `src/services/layer1_ocr.js`: Client-side OCR service simulator with Tesseract/pattern parser fallback.
- `src/services/layer2_face.js`: Canvas-based face feature extractor & similarity calculator.
- `src/services/layer3_forensics.js`: Canvas Error Level Analysis (ELA) & metadata compression anomaly analyzer.
- `src/services/layer4_consistency.js`: Field cross-checker & Synthetic Issuer Registry validator.
- `src/services/layer5_riskEngine.js`: Rule engine calculating score (0-100), level (LOW/MED/HIGH), decision, and reasons.
- `src/context/AuthContext.jsx`: Auth provider with RBAC helpers (`hasPermission`, `isRole`).
- `src/context/CaseContext.jsx`: Case state management, active workflow state, refresh functions.
- `src/components/layout/Sidebar.jsx`: Modern enterprise navigation bar with role-aware tabs.
- `src/components/layout/Header.jsx`: User dropdown, notification badge, search bar, backend connection status pill.
- `src/components/verification/LayerCard.jsx`: Reusable card component for rendering Layer 1–4 results with badges and metrics.
- `src/components/verification/ElaCanvas.jsx`: Interactive Error Level Analysis canvas visualizer.
- `src/components/verification/EvidenceSummary.jsx`: Explainable breakdown listing positive/negative indicators and override flags.
- `src/components/verification/DecisionModal.jsx`: Officer manual review modal to Approve, Reject, or Flag cases.

---

## Verification Plan

### Automated Verification & Testing
1. **Frontend Build**: Execute `npm run build` to verify standard React TypeScript/JS compilation with Vite without linting errors.
2. **Rule Engine Test Cases**: Unit test Layer 5 risk calculations with 5 canonical scenarios:
   - Case A (Clean document): All layers PASS -> Score 12/100, Level: LOW, Recommendation: AUTO_APPROVE / LOW_RISK.
   - Case B (Minor OCR anomaly): Layer 1 OCR confidence 0.72 -> Score 45/100, Level: MEDIUM, Recommendation: MANUAL_REVIEW.
   - Case C (Tampering detected): Layer 3 ELA anomaly -> Score 78/100, Level: HIGH, Recommendation: MANUAL_REVIEW_REQUIRED.
   - Case D (Face Mismatch): Layer 2 face score 0.35 -> Score 92/100, Level: HIGH, Override trigger: HIGH RISK.
   - Case E (Issuer Mismatch / Expired): Layer 4 issuer status EXPIRED -> Score 85/100, Level: HIGH.

### Manual Verification Workflow
1. Launch local development server (`npm run dev`).
2. Test full end-to-end user journey:
   - Login as Officer (`officer@sentinel.id`).
   - Create new verification case for "John Doe".
   - Upload sample identity document and face image.
   - Watch step-by-step progress animation across Layers 1 through 5.
   - Review complete Evidence Report and Risk Score.
   - Submit Officer decision ("APPROVED" or "REJECTED") with review notes.
   - Verify Audit Log captures case creation, analysis, and final decision.
   - Test PDF / Printable report generation.
3. Login as Admin (`admin@sentinel.id`) to verify User Management, Audit Logs, and Apps Script backend deployment guide.
