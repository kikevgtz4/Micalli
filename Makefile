# Declare all targets as PHONY
.PHONY: dev redis-start redis-stop backend frontend help migrate makemigrations \
        superuser shell check collectstatic showmigrations dbshell stop kill-django \
        kill-frontend test install setup status clean docker-up docker-up-d docker-down \
        docker-clean docker-logs docker-ps docker-build docker-migrate docker-makemigrations \
        docker-superuser docker-shell docker-bash docker-test docker-dbshell docker-db-backup \
        switch-to-docker switch-to-local docker-fresh logs

# Default target
default: help

# ==================== Development Commands ====================

# Start everything for development
dev:
	@echo Starting development environment...
	@make redis-start
	@echo Opening Django backend in new terminal...
	@cmd /c start "Django Backend" cmd /k "cd backend && venv\Scripts\activate && python manage.py runserver"
	@echo Opening Next.js frontend in new terminal...
	@cmd /c start "Next.js Frontend" cmd /k "cd frontend && npm run dev"
	@echo Development environment started!
	@echo Redis: localhost:6379
	@echo Backend: http://localhost:8000
	@echo Frontend: http://localhost:3000

# Start services individually
redis-start:
	@echo Starting Redis...
	@docker-compose -f docker-compose.redis-only.yml up -d
	@echo Redis is running on localhost:6379

backend:
	@echo Starting Django backend...
	@cd backend && venv\Scripts\activate && python manage.py runserver

frontend:
	@echo Starting Next.js frontend...
	@cd frontend && npm run dev

# ==================== Stop/Cleanup Commands ====================

# Stop Redis
redis-stop:
	@echo Stopping Redis...
	@docker-compose -f docker-compose.redis-only.yml down

# Kill Django process on port 8000
kill-django:
	@echo Stopping Django on port 8000...
	@for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do @taskkill /PID %%a /F 2>nul || @echo No process found on port 8000

# Kill Next.js process on port 3000
kill-frontend:
	@echo Stopping Next.js on port 3000...
	@for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do @taskkill /PID %%a /F 2>nul || @echo No process found on port 3000

# Stop all development services
stop: redis-stop kill-django kill-frontend
	@echo [OK] All services stopped!

# ==================== Django Management Commands ====================

# Run migrations
migrate:
	@echo Running Django migrations...
	@cd backend && venv\Scripts\activate && python manage.py migrate
	@echo [DONE] Migrations complete!

# Make migrations
makemigrations:
	@echo Creating Django migrations...
	@cd backend && venv\Scripts\activate && python manage.py makemigrations
	@echo [DONE] Migrations created!

# Create superuser
superuser:
	@echo Creating Django superuser...
	@cd backend && venv\Scripts\activate && python manage.py createsuperuser

# Django shell
shell:
	@echo Opening Django shell...
	@cd backend && venv\Scripts\activate && python manage.py shell

# Django shell_plus (if django-extensions is installed)
shell-plus:
	@echo Opening Django shell_plus...
	@cd backend && venv\Scripts\activate && python manage.py shell_plus 2>nul || python manage.py shell

# Check for issues
check:
	@echo Running Django system checks...
	@cd backend && venv\Scripts\activate && python manage.py check

# Show migrations status
showmigrations:
	@echo Showing migration status...
	@cd backend && venv\Scripts\activate && python manage.py showmigrations

# Database shell
dbshell:
	@echo Opening database shell...
	@cd backend && venv\Scripts\activate && python manage.py dbshell

# ==================== Testing Commands ====================

# Run all tests
test:
	@echo Running Django tests...
	@cd backend && venv\Scripts\activate && python manage.py test
	@echo [DONE] Tests complete!

# Run specific app tests
test-app:
	@echo "Usage: make test-app app=accounts"
	@cd backend && venv\Scripts\activate && python manage.py test $(app)

# ==================== Setup Commands ====================

# Install dependencies
install:
	@echo Installing backend dependencies...
	@cd backend && pip install -r requirements.txt
	@echo Installing frontend dependencies...
	@cd frontend && npm install
	@echo [DONE] Dependencies installed!

# Initial setup for new developers
setup: install
	@echo Setting up development environment...
	@make migrate
	@echo "Creating superuser (optional - press Ctrl+C to skip)..."
	@cd backend && venv\Scripts\activate && python manage.py createsuperuser
	@echo [DONE] Setup complete!

# ==================== Utility Commands ====================

# Check status of all services
status:
	@echo Checking service status...
	@docker ps | findstr redis && echo Redis: Running || echo Redis: Not running
	@netstat -an | findstr :8000 > nul && echo Django: Running || echo Django: Not running
	@netstat -an | findstr :3000 > nul && echo Next.js: Running || echo Next.js: Not running

# View logs
logs:
	@echo "Showing Redis logs (Ctrl+C to exit)..."
	@docker-compose -f docker-compose.redis-only.yml logs -f

# Clean up cache and temporary files
clean:
	@echo Cleaning up...
	@cd backend && rmdir /s /q __pycache__ 2>nul || echo No Python cache to clean
	@cd frontend && rmdir /s /q .next 2>nul || echo No Next.js cache to clean
	@echo [DONE] Cleanup complete!

# ==================== Docker Commands ====================

# Run everything in Docker
docker-up:
	@echo Starting full Docker environment...
	@docker-compose up --build

# Run Docker in background
docker-up-d:
	@echo Starting Docker environment in background...
	@docker-compose up -d --build

# Stop Docker containers
docker-down:
	@echo Stopping Docker containers...
	@docker-compose down

# Stop Docker and remove volumes (full cleanup)
docker-clean:
	@echo Stopping Docker and removing volumes...
	@docker-compose down -v

# View Docker logs
docker-logs:
	@echo Showing Docker logs (Ctrl+C to exit)...
	@docker-compose logs -f

# Docker status
docker-ps:
	@echo Docker container status:
	@docker-compose ps

# Rebuild Docker images
docker-build:
	@echo Building Docker images...
	@docker-compose build --no-cache

# Django commands in Docker
docker-migrate:
	@echo Running migrations in Docker...
	@docker-compose exec backend python manage.py migrate

docker-makemigrations:
	@echo Creating migrations in Docker...
	@docker-compose exec backend python manage.py makemigrations

docker-superuser:
	@echo Creating superuser in Docker...
	@docker-compose exec backend python manage.py createsuperuser

docker-shell:
	@echo Opening Django shell in Docker...
	@docker-compose exec backend python manage.py shell

docker-bash:
	@echo Opening bash shell in backend container...
	@docker-compose exec backend bash

docker-test:
	@echo Running tests in Docker...
	@docker-compose exec backend python manage.py test

# Database operations in Docker
docker-dbshell:
	@echo Opening PostgreSQL shell in Docker...
	@docker-compose exec db psql -U postgres -d unihousing

docker-db-backup:
	@echo Backing up database...
	@docker-compose exec db pg_dump -U postgres unihousing > backup_$(shell powershell -Command "Get-Date -Format yyyyMMdd_HHmmss").sql
	@echo Database backed up to backup_*.sql

# Switch between local and Docker
switch-to-docker:
	@echo Switching to Docker environment...
	@make stop
	@copy backend\.env.docker backend\.env
	@copy frontend\.env.docker frontend\.env.local
	@echo Environment switched to Docker. Run 'make docker-up' to start.

switch-to-local:
	@echo Switching to local environment...
	@docker-compose down
	@copy backend\.env.local backend\.env
	@copy frontend\.env.local.bak frontend\.env.local
	@echo Environment switched to local. Run 'make dev' to start.

# Combined commands
docker-fresh:
	@echo Starting fresh Docker environment...
	@make docker-clean
	@make docker-build
	@make docker-up-d
	@echo Waiting for database...
	@timeout /t 10 /nobreak > nul
	@make docker-migrate
	@echo Fresh Docker environment ready!

# Keep for backwards compatibility (redirect to new command)
docker-full: docker-up

# ==================== Static Files ====================

# Collect static files
collectstatic:
	@echo Collecting static files...
	@cd backend && venv\Scripts\activate && python manage.py collectstatic --noinput

# ==================== Help ====================

# Show help
help:
	@echo Micalli Development Commands
	@echo ===============================
	@echo.
	@echo LOCAL DEVELOPMENT:
	@echo   make dev              - Start local dev environment (Redis + Django + Next.js)
	@echo   make redis-start      - Start only Redis
	@echo   make backend          - Start Django backend (current terminal)
	@echo   make frontend         - Start Next.js frontend (current terminal)
	@echo   make stop             - Stop all local services
	@echo   make status           - Check service status
	@echo.
	@echo DOCKER OPERATIONS:
	@echo   make docker-up        - Start Docker environment (with output)
	@echo   make docker-up-d      - Start Docker in background
	@echo   make docker-down      - Stop Docker containers
	@echo   make docker-clean     - Stop and remove all data
	@echo   make docker-logs      - View Docker logs
	@echo   make docker-ps        - Show container status
	@echo   make docker-build     - Rebuild Docker images
	@echo   make docker-fresh     - Fresh Docker install
	@echo.
	@echo DOCKER DJANGO COMMANDS:
	@echo   make docker-migrate   - Run migrations in Docker
	@echo   make docker-makemigrations - Create migrations in Docker
	@echo   make docker-superuser - Create superuser in Docker
	@echo   make docker-shell     - Django shell in Docker
	@echo   make docker-bash      - Bash shell in container
	@echo   make docker-test      - Run tests in Docker
	@echo   make docker-dbshell   - PostgreSQL shell in Docker
	@echo   make docker-db-backup - Backup database
	@echo.
	@echo ENVIRONMENT SWITCHING:
	@echo   make switch-to-docker - Switch to Docker setup
	@echo   make switch-to-local  - Switch to local setup
	@echo.
	@echo DJANGO COMMANDS (Local):
	@echo   make migrate          - Run migrations
	@echo   make makemigrations   - Create new migrations
	@echo   make superuser        - Create superuser
	@echo   make shell            - Open Django shell
	@echo   make check            - Run system checks
	@echo   make showmigrations   - Show migration status
	@echo   make dbshell          - Open database shell
	@echo.
	@echo TESTING:
	@echo   make test             - Run all tests (local)
	@echo   make test-app app=X   - Test specific app (local)
	@echo   make docker-test      - Run tests in Docker
	@echo.
	@echo SETUP & MAINTENANCE:
	@echo   make install          - Install all dependencies
	@echo   make setup            - Initial project setup
	@echo   make clean            - Clean cache files
	@echo   make collectstatic    - Collect static files
	@echo   make logs             - View Redis logs
	@echo.
	@echo For more details, see docs/LOCAL_DEVELOPMENT_GUIDE.md