# UniHousing Project

UniHousing is a specialized digital platform connecting students with housing options in Monterrey, Mexico. The platform addresses critical market challenges by helping students find suitable accommodations near their universities and enabling property owners to market directly to their target student audience.

## Features

- Property listings with university proximity data
- Student and property owner verification
- Roommate matching system
- Bilingual support (English/Spanish)
- Interactive maps and location-based search
- Messaging system for inquiries and communication
- Reviews and ratings for properties and roommates

## Development Setup

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- PostgreSQL (for local development without Docker)

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://your-repository-url/unihousing.git
   cd unihousing
   ```

2. Create environment files:

   For the frontend:
   ```bash
   cp frontend/.env.example frontend/.env.local
   ```

   For the backend:
   ```bash
   cp backend/.env.example backend/.env
   ```

3. Update the environment variables in both files with your actual values.

### Running with Docker

Start all services:
```bash
docker-compose up
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- Admin Interface: http://localhost:8000/admin

### Running Locally (Without Docker)

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

6. Start the development server:
   ```bash
   python manage.py runserver
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Backend Development

1. Create new models in appropriate Django apps:
   ```bash
   python manage.py startapp new_app
   ```

2. Register models in admin.py
3. Create serializers in serializers.py
4. Create views in views.py
5. Register URLs in urls.py
6. Run migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

### Frontend Development

1. Create components in `src/components`
2. Add pages in `src/app`
3. Update API connections in `src/lib/api.ts`
4. Add CSS styles in `src/styles`

## Project Structure

### Backend

```
backend/
├── accounts/          # User authentication and profiles
├── properties/        # Property listings and related features
├── universities/      # University data and proximity calculations
├── roommates/         # Roommate matching and profiles
├── messaging/         # User-to-user messaging system
└── unihousing_backend/  # Core settings and configuration
```

### Frontend

```
frontend/
├── public/            # Static assets
└── src/
    ├── app/           # Next.js pages and routes
    ├── components/    # React components
    ├── lib/           # Utilities and API connections
    ├── hooks/         # Custom React hooks
    ├── styles/        # CSS and styling
    └── types/         # TypeScript type definitions
```

## Deployment

### Production Build

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Collect static files for the backend:
   ```bash
   cd backend
   python manage.py collectstatic
   ```

3. Use the production Docker Compose configuration:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Contributing

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:
   ```bash
   git commit -m "Add your feature"
   ```

3. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a pull request against the main branch.