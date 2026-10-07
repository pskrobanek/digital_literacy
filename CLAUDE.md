# Therahub Nicosia — Claude Code Guide

For the full project overview, plain-language summary, URL routes, data model, scoring, and GDPR notes, read `README.md` first. This file only adds working conventions for Claude Code that aren't in the README.

## Stack snapshot

- **Backend**: Django 6.0.2 + Python, PostgreSQL via psycopg3
- **Auth**: Session-based only — no Django auth user. Patients are identified by an HMAC of their birth number (`User.birth_number_hmac`); staff are identified by email.
- **Static files**: WhiteNoise
- **Hosting**: Render

## Setup

```bash
# 1. Create therahub/.env (ask Lukas — see README env-vars table)
# 2. Activate a venv, then:
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

`SECRET_BIRTH_NUMBER_KEY` must be set or the server will refuse to start.

## Key conventions

- `TestResults` and `SurveyResults` are unique per `(user, test_name)` / `(user, survey_name)` — retakes overwrite via `update_or_create`.
- `SurveyResults.responses` is a JSON-encoded string keyed by question id.
- Patients without a session are redirected to `signup` (not a login page) by `PatientSessionMixin`.
- Sessions expire at browser close or after 1 hour.
- The site-wide password gate (`therahub/middleware.py`) blocks every path except `/`, `/admin/`, and `/privacy/` until the visitor authenticates.
- i18n is client-side only. Server-rendered error strings are translated by `signup.js` (signup) and `static/digitaltest/js/lang-toggle.js` (gate, staff, dashboard) — when adding a new error message, add its Czech translation to the matching error map.
- Never commit `therahub/.env`.

## Development workflow

1. Push to your own branch first.
2. Open a PR, get review, squash-merge into `main`.
3. **Never commit or push directly to `main`.**
4. If you add a dependency, update `requirements.txt`.

## Before committing

- Verify any new routes/links exist and file extensions match (e.g. `.md` vs `.mdx`) before deploying.
- Don't add navigation links to routes you haven't confirmed.
- If you change a model, ship the migration in the same commit.
- If you add or rename a server-side error string, add its Czech translation alongside.

## Scope discipline

- Implement only what was requested. No bonus features (timers, shimmer effects, decorative elements, refactors) unless asked.
- Prefer the simplest solution first.
