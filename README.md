# portfolio-maker

Professional backend README — Portfolio Maker

Overview
--------
`portfolio-maker` is a Django-based backend for managing developer portfolios. It provides a REST API, content versioning, publishing workflows, and tools for exporting and sharing portfolio content.

This repository focuses on a robust, test-covered backend implementation suitable for self-hosted or managed deployments.

Key Components
--------------
- Django project entry: `manage.py`
- App: `portfolio` (models, serializers, services, tests)
- Database migrations: `portfolio/migrations/*`
- Seed management command: `portfolio/management/commands/seed.py`
- Requirements: `requirements.txt`
- Optional Redis for background tasks: used by Celery or async workers

Requirements
------------
- Python 3.10+ (match your environment)
- pip (for installing dependencies)
- SQLite for local development (or configure Postgres/MySQL in `settings.py`)
- Docker (optional, to run Redis locally)

Quick Setup (Windows / PowerShell)
--------------------------------
1. Create and activate a virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

2. Configure environment variables (example)

```powershell
$Env:DJANGO_SETTINGS_MODULE = "portfolioMaker.settings"
# Set DB and secret settings as needed
```

3. Apply migrations and seed development data

```powershell
python manage.py migrate
python manage.py loaddata initial_data || python manage.py seed
```

4. (Optional) Run Redis locally for background workers

```powershell
docker run -p 6379:6379 redis
```

5. Run tests and start the development server

```powershell
python manage.py test
python manage.py runserver
```

Notes on Migrations and Data Changes
-----------------------------------
- The project contains migrations that migrated legacy boolean visibility fields to a `status`/enum workflow. Review `portfolio/migrations/` for the migration that performs the data copy and field removal before deploying to production.
- For CI and reproducible test runs, use a clean database and run `python manage.py migrate` before tests.

Testing
-------
- Run the full Django test suite with `python manage.py test`.
- Tests cover models, services, serializers, and management commands. Keep tests green when making changes.

Deployment Guidance
------------------
- Use a production-ready database (Postgres recommended) and configure `ALLOWED_HOSTS`, `SECRET_KEY`, and other settings via environment variables.
- Use a WSGI server (Gunicorn/uvicorn with ASGI) behind a reverse proxy (Nginx) for production.
- If background tasks are added, run a Celery worker and a Redis or RabbitMQ broker.

Contributing
------------
- Follow existing code structure: keep domain logic in `portfolio/services.py`, keep API serialization in `portfolio/serializers.py`, and preserve model `TextChoices` in `portfolio/models.py`.
- Add tests for any new behavior and update migrations responsibly. Avoid manual DB schema edits outside of Django migrations.

Contact and Ownership
---------------------
This repository is maintained as a personal project. Open an issue or a pull request for suggested improvements.

License
-------
See `LICENSE` if present; otherwise assume source code is under the repository owner's default license.
