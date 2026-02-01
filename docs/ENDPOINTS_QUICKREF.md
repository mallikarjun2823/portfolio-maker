# Endpoint Quick Reference

**Base URL:** `http://127.0.0.1:8000/`

> Quick note: these are the app's current endpoints. If you refactor paths later, update this doc and the Thunder Client collection.

---

## Authentication

- **POST** `http://127.0.0.1:8000/register/`
  - Headers: `Content-Type: application/json`
  - Body: `{ "username": "new_user", "email": "a@x.test", "password": "Password123!" }`

- **POST** `http://127.0.0.1:8000/login/`
  - Headers: `Content-Type: application/json`
  - Body: `{ "username": "existing_user", "password": "Password123!" }`
  - Response: `{ "token": "<jwt>", "username": "existing_user" }` — use `Authorization: Bearer <token>` for protected endpoints.

---

## Portfolios

- **GET** `http://127.0.0.1:8000/portfolios/` — list (public + own private)
- **POST** `http://127.0.0.1:8000/portfolios/` — create (auth)
  - Body example:
    ```json
    { "title": "My Portfolio", "summary": "Short summary", "status": "PUBLISHED" }
    ```
- **GET / PUT / DELETE** `http://127.0.0.1:8000/portfolios/<pk>/` — retrieve / update / delete (owner checks apply)

Notes: only one portfolio per user; public portfolios are represented by `status: "PUBLISHED"`.

---

## Projects (portfolio-scoped)

-- **GET** `http://127.0.0.1:8000/portfolio/<portfolio_id>/projects/` — list (non-owner sees only published)
-- **POST** `http://127.0.0.1:8000/portfolio/<portfolio_id>/projects/` — create (owner only)
  - Body example:
    ```json
    { "title": "Project X", "description": "Details...", "tech_stack": "Django, React", "project_url": "https://example.com", "status": "PUBLISHED" }
    ```
  - Validation: `title` >= 5 chars; `description` >= 10 chars; `project_url` must start with http/https.
-- **GET / PUT / DELETE** `http://127.0.0.1:8000/portfolio/<portfolio_id>/projects/<pk>/`

---

## Skills

  - Body example: `{ "name": "Python", "proficiency_level": "ADVANCED", "years_of_experience": 4 }`
**GET** `http://127.0.0.1:8000/portfolio/<portfolio_id>/skills/`
**POST** `http://127.0.0.1:8000/portfolio/<portfolio_id>/skills/` (owner)
  - Body example: `{ "name": "Python", "proficiency_level": "ADVANCED", "years_of_experience": 4 }`
**GET / PUT / DELETE** `http://127.0.0.1:8000/portfolio/<portfolio_id>/skills/<pk>/`

---

## Education

-- **GET** `http://127.0.0.1:8000/portfolio/<portfolio_id>/education/`
-- **POST** `http://127.0.0.1:8000/portfolio/<portfolio_id>/education/` — example:
  ```json
  { "institution": "Uni", "degree": "BSc", "start_year": 2014, "end_year": 2018 }
  ```
-- **GET / PUT / DELETE** `http://127.0.0.1:8000/portfolio/<portfolio_id>/education/<pk>/`

---

## Social Links

-- **GET** `http://127.0.0.1:8000/portfolio/<portfolio_id>/social-links/`
-- **POST** `http://127.0.0.1:8000/portfolio/<portfolio_id>/social-links/` — example:
  `{ "platform": "GitHub", "url": "https://github.com/user" }`
-- **GET / PUT / DELETE** `http://127.0.0.1:8000/portfolio/<portfolio_id>/social-links/<pk>/`

---

## Documents (upload)

- **GET** `http://127.0.0.1:8000/portfolios/<portfolio_id>/documents/`
- **POST** `http://127.0.0.1:8000/portfolios/<portfolio_id>/documents/` — multipart/form-data
  - Fields: `doc_type` (`resume` | `certificate` | `other`), `file` (binary)
  - Note: Only one resume per portfolio (enforced).
- **GET / PUT / DELETE** `http://127.0.0.1:8000/portfolios/<portfolio_id>/documents/<pk>/`

Example curl upload:
```
curl -X POST -H "Authorization: Bearer <token>" -F "doc_type=resume" -F "file=@resume.pdf" http://127.0.0.1:8000/portfolios/1/documents/
```

---

## Versions

-- **GET** `/portfolio/<portfolio_id>/versions/`
-- **POST** `/portfolio/<portfolio_id>/versions/` — create snapshot
  - Body: `{ "change_note": "manual snapshot", "is_draft": false }`
-- **GET** `/portfolio/<portfolio_id>/versions/<version_number>/`
-- **POST** `/portfolio/<portfolio_id>/versions/<version_number>/revert/` — revert (owner)

---

## Developer helper

- **GET** `/debug/queries/` — returns `{"query_count": <n>, "data": [...]}` (development only; active when `DEBUG=True`). Useful to detect N+1 queries.

---

## Quick cURL examples

- Register:
  ```bash
  curl -X POST -H "Content-Type: application/json" -d '{"username":"u","email":"u@example.test","password":"P@ssw0rd"}' http://127.0.0.1:8000/register/
  ```
- Login:
  ```bash
  curl -X POST -H "Content-Type: application/json" -d '{"username":"u","password":"P@ssw0rd"}' http://127.0.0.1:8000/login/
  ```
- Create portfolio:
  ```bash
  curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"title":"X","summary":"Y","status":"PUBLISHED"}' http://127.0.0.1:8000/portfolios/
  ```

---

## Notes & tips

- Use `Authorization: Bearer <token>` for authenticated routes. Login returns a JWT token.
- Seeded test account: `testuser` / `testpass123` (run `python manage.py seed`).
- After you refactor URLs, update this doc, `docs/api_endpoints.json`, and the Thunder Client collection.

---

Created for quick local testing and debugging.