A Django web app that guides oncology patients through a digital literacy assessment. Patients complete a technology usage survey and a timed interaction test; clinicians view results and can authorize retakes from a staff dashboard.

---

## What this is

Therahub  helps clinicians understand how comfortable a patient is using everyday technology — phones, computers, apps. The patient sits down at a tablet or laptop and is walked through two short steps:

1. **A survey** — quick questions about which devices they own, how they get help when stuck, and how often they use technology.
2. **An interactive test** — a series of small on-screen tasks (tapping buttons, dragging items, typing) that quietly measures speed, accuracy, and steadiness.

Behind the scenes the app combines both into a single **digital literacy score (0–100)** and groups the patient into a Low / Medium / High tier. A clinician then logs into the staff dashboard, looks up the patient by birth number, and sees the score plus a list of recommended apps appropriate for that tier. Recommendations for higher-complexity tools are filtered out for patients in lower tiers.

The patient never logs in with a username or password. They register once with their name, date of birth, and birth number; that's enough to track results across visits. Staff identify themselves by email each time they open a record so every dashboard view is logged.

### Who uses it

- **Patients** — register, take the survey and test, then see a confirmation page. They can also export or delete their data on `/account/`.
- **Clinicians** — log in on `/staff/login/`, look up a patient, review results, and authorize a retake if the patient wants to try again.
- **Site administrators** — manage everything via `/admin/` (Django admin).

A site-wide password gate sits in front of every page except the gate itself, the privacy policy, and the admin login, so the app can be deployed publicly without exposing patient data to anyone without the shared password.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Django 6.0.2, Python |
| Database | PostgreSQL (psycopg3) |
| Auth | Session-based only — no Django auth user |
| Static files | WhiteNoise |
| Deployment | Render |

---

## Get Started

1. Create `therahub/.env` and ask Lukas for the variable values (never commit this file).
2. Create and activate a venv, then install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up PostgreSQL locally, then run migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
4. Start the dev server:
   ```bash
   python manage.py runserver
   ```

### Environment variables

| Variable | Description |
|---|---|
| `DJANGO_KEY` | Django `SECRET_KEY` |
| `DJANGO_DEBUG` | Set to `"true"` for debug mode, anything else for production |
| `SITE_PASSWORD` | Shared password shown on the gate page (`/`) |
| `PGDATABASE` | PostgreSQL database name |
| `PGUSER` | PostgreSQL username |
| `PGPASSWORD` | PostgreSQL password |
| `PGHOST` | PostgreSQL host |
| `PGPORT` | PostgreSQL port |
| `RENDER_EXTERNAL_HOSTNAME` | Set automatically by Render; added to `ALLOWED_HOSTS` |
| `SECRET_BIRTH_NUMBER_KEY` | HMAC key for birth number pseudonymisation — **required**, server won't start without it |
| `GDPR_DATA_RETENTION_DAYS` | Days to retain patient records before purge (default: 730) |

---

## URL Routes

### Patient flow

| URL | View | Description |
|---|---|---|
| `/` | `SitePasswordGateView` | Site-wide password gate — must pass before accessing anything |
| `/landing/` | `LandingView` | Landing page shown after gate authentication |
| `/signup/` | `SignupView` | Patient registration (birth number + name + DOB) |
| `/survey/` | `SurveyView` | Technology usage survey (must complete before test) |
| `/survey/submit/` | `SubmitSurveyView` | JSON API — survey.js POSTs here |
| `/test/` | `TestView` | Digital literacy test (requires completed survey) |
| `/test/submit/` | `SubmitResultsView` | JSON API — test.js POSTs here |
| `/complete/` | `AllTasksCompleteView` | Confirmation page shown when both tasks are done |
| `/logout/` | `SessionLogoutView` | Clears patient session, redirects to signup |
| `/privacy/` | `PrivacyPolicyView` | Privacy policy (accessible without gate auth) |
| `/account/` | `PatientDataSettingsView` | Patient self-service hub for export and deletion |
| `/account/export/` | `PatientDataExportView` | GDPR Art. 20 — downloads patient data as JSON |
| `/account/delete/` | `PatientDeleteAccountView` | GDPR Art. 17 — permanently deletes patient account |

### Staff flow

| URL | View | Description |
|---|---|---|
| `/staff/login/` | `MedicalStaffLoginView` | Staff login via email + patient birth number |
| `/staff/dashboard/` | `MedicalStaffDashboardView` | Patient results, literacy score, app recommendations |
| `/staff/start-retake/` | `MedicalStaffStartRetakeView` | Creates retake audit record, resets test session |
| `/staff/switch-patient/` | `MedicalStaffSwitchPatientView` | Clears selected patient, returns to staff login |
| `/staff/logout/` | `MedicalStaffLogoutView` | Clears full staff session |

---

## Architecture

```
therahub/           Django project config
  settings.py       Env-based config; SitePasswordGate in middleware stack
  middleware.py     SitePasswordGate — blocks all routes except /, /admin/, /privacy/ until authenticated
  urls.py           Route definitions

digitaltest/        Main app
  models.py         User, MedicalStaff, TestResults, SurveyResults,
                    RetakeEvent, ConsentRecord, StaffAccessLog
  views.py          All views; calculate_final_test_score() composite scorer
  forms.py          SignupForm, MedicalStaffLoginForm
  scoring.py        compute_literacy_score(), tier_for_score(), recommend_apps()
  admin.py          Django admin registrations
  management/commands/
    purge_expired_data.py   GDPR retention cleanup (run on a schedule)
  templates/        gate, landing, signup, survey, test, all_tasks_complete,
                    privacy_policy, data_settings, delete_account_confirm,
                    staff_login, staff_dashboard
  static/
    css/test.css    Test UI styles
    js/test.js      Test logic, i18n (EN/CS), task runner, result submission
    js/survey.js    Survey logic, i18n (EN/CS), response collection, submission
    js/signup.js    Signup form helpers, error message translations
static/digitaltest/js/
  lang-toggle.js    Shared EN/CS i18n for staff and gate pages
```

### Patient flow

```
/ (gate) → /landing/ → /signup/ → /survey/ → /test/ → /complete/
```

Session flags control forward progress — each view checks the previous step's flag before rendering:

- `site_password_authenticated` — set by `SitePasswordGateView`
- `patient_user_id` — set on signup (or by staff login)
- `survey_completed` — set by `SubmitSurveyView`
- `test_completed` — set by `SubmitResultsView`

### Staff flow

```
/staff/login/ → /staff/dashboard/ → (start retake) → /test/ → /staff/dashboard/
```

Staff session keys: `staff_user_id`, `staff_first`, `staff_last`, `staff_email`, `staff_patient_user_id`.

### Scoring

**Test score (0–100):** Weighted composite of task accuracy (65%), speed (15%), click precision (10%), typing speed (5%), typing accuracy (5%). Computed in `calculate_final_test_score()` in `views.py`.

**Digital literacy score (0–100):** Combines the test score with four survey dimensions via the formula in `scoring.py`:

```
raw = motor_score × tech_breadth × L_factor × resource_quality − access_penalty
```

App recommendations are filtered by the patient's resulting tier (Low / Medium / High).

---

## Data model

| Model | Key fields | Notes |
|---|---|---|
| `User` | `birth_number_hmac` (unique), `first`, `last`, `dob`, `diagnosis` | No Django auth. Raw birth number is never stored — it's HMAC-SHA256'd with `SECRET_BIRTH_NUMBER_KEY` and only the digest is persisted. All lookups use the digest. |
| `MedicalStaff` | `email` (unique), `first`, `last`, `date_first_seen`, `date_last_seen` | Upserted by email on each staff login |
| `TestResults` | `user` + `test_name` (unique together), `result`, `speed`, `avg_misclick_distance`, `typing_duration`, `typing_accuracy` | One row per patient per test; retakes overwrite |
| `SurveyResults` | `user` + `survey_name` (unique together), `responses` (JSON) | Same one-row pattern as TestResults |
| `RetakeEvent` | `patient`, `staff`, `triggered_at` | Append-only audit log; does not modify TestResults |
| `ConsentRecord` | `user` (one-to-one), `given_at`, `ip_address`, `privacy_policy_version`, `withdrawn_at` | GDPR Art. 7 — proof of explicit consent at signup |
| `StaffAccessLog` | `staff`, `patient`, `accessed_at`, `action` | GDPR Art. 5(2) — every staff dashboard view is logged |

---

## GDPR & data retention

The app is designed for an EU clinical setting and bakes the obligations into the data layer:

- **Pseudonymisation** — birth numbers are HMAC'd before storage. Even with full DB access, the original birth number can't be recovered without `SECRET_BIRTH_NUMBER_KEY`.
- **Right to access / portability** (Art. 15 & 20) — patients can download all their data as JSON from `/account/export/`.
- **Right to erasure** (Art. 17) — patients can delete themselves from `/account/delete/`. Cascade deletes remove all related results, consent, and retake history.
- **Consent record** (Art. 7) — `ConsentRecord` captures the moment a patient agreed, which IP it came from, and which version of the policy was in effect.
- **Access logging** (Art. 5(2)) — `StaffAccessLog` records every staff view of patient data.
- **Retention** — patient records older than `GDPR_DATA_RETENTION_DAYS` (default 730) and access logs older than 90 days are purged by:
  ```bash
  python manage.py purge_expired_data           # delete
  python manage.py purge_expired_data --dry-run # preview only
  ```
  Schedule this on the host (e.g. Render cron job) so retention is enforced automatically.

---

## Development

1. Always push changes to your own branch first.
2. Create a PR, get a review, then squash and merge into main.
3. **Never commit or push directly to `main`.**
4. Update `requirements.txt` if you add new dependencies.
