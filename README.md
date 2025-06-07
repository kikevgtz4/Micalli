# UniHousing - Student Housing Platform

UniHousing is a comprehensive digital platform connecting students with housing options in Monterrey, Mexico. The platform features sophisticated roommate matching, property management, and university-centric search capabilities, addressing critical market challenges by helping students find suitable accommodations and compatible roommates near their universities while enabling property owners to market directly to their target student audience.

## 🚀 Current Features

### For Students
- **Property Search & Discovery**: Browse verified properties with university proximity data
- **Interactive Maps**: Mapbox-powered property visualization with distance calculations
- **Advanced Search & Filtering**: Filter by price, location, amenities, and university proximity
- **Roommate Matching System**: Sophisticated algorithm matching compatible roommates based on lifestyle, academic, and social factors
- **Roommate Profiles**: Comprehensive profiles with lifestyle preferences, study habits, and compatibility scoring
- **Messaging System**: Direct communication with property owners, roommates, and viewing requests
- **University Integration**: Find properties and roommates near specific universities in Monterrey
- **Profile Completion Tracking**: Progressive disclosure system encouraging complete profiles for better matches
- **User Profiles**: Complete profile management with academic information, preferences, and verification
- **Responsive Design**: Mobile-first approach for seamless browsing on any device

### For Property Owners
- **Property Management Dashboard**: Comprehensive dashboard for managing listings
- **Multi-Image Upload**: Upload and manage property photos with automatic optimization
- **Property Status Control**: Activate/deactivate listings with real-time visibility control
- **Tenant Communication**: Built-in messaging system for inquiries and viewing requests
- **Analytics & Insights**: Track property performance and viewing statistics
- **Profile Management**: Business verification and contact information management
- **Bulk Operations**: Activate multiple properties simultaneously

### Technical Features
- **Secure Authentication**: JWT-based authentication with automatic token refresh and role-based access control
- **Email Verification**: Complete email verification system for user accounts
- **Password Management**: Secure password reset and change functionality
- **Data Architecture**: Clean separation of concerns with User model holding academic data and RoommateProfile managing preferences
- **Sophisticated Matching Algorithm**: Multi-factor compatibility scoring with lifestyle, academic, and social considerations
- **Real-time Updates**: Live status updates and notifications
- **Case Conversion**: Automatic snake_case ↔ camelCase conversion between frontend/backend
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Image Optimization**: Advanced image handling with fallbacks and optimization
- **Profile Completion**: Weighted completion calculation encouraging comprehensive profiles

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Maps**: Mapbox GL JS for interactive property visualization
- **State Management**: React Context + hooks
- **HTTP Client**: Axios with automatic snake_case ↔ camelCase conversion
- **Image Handling**: Next.js Image optimization + custom PropertyImage component
- **UI Components**: Custom component library with Tailwind

### Backend
- **Framework**: Django 5.2.1 + Django REST Framework
- **Database**: PostgreSQL with spatial extensions
- **Authentication**: Django SimpleJWT with custom user model
- **File Storage**: Local storage (configurable for cloud deployment)
- **API Architecture**: RESTful API with automatic case conversion
- **Email System**: SMTP integration for notifications and verification

### Development Tools
- **Containerization**: Docker & Docker Compose
- **Code Quality**: ESLint + TypeScript strict mode
- **Version Control**: Git with conventional commits
- **Package Management**: npm for frontend, pip for backend

## 🚀 Getting Started

### Prerequisites
- **Docker & Docker Compose** (recommended for quick setup)
- **Node.js 18+** (for local frontend development)
- **Python 3.11+** (for local backend development)
- **PostgreSQL 15+** (for local database)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd unihousing
   ```

2. **Environment Setup**
   ```bash
   # Frontend environment
   cp frontend/.env.example frontend/.env.local
   
   # Backend environment
   cp backend/.env.example backend/.env
   ```

3. **Configure Environment Variables**
   
   **Frontend (`frontend/.env.local`):**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   NEXT_PUBLIC_MEDIA_URL=http://localhost:8000/media
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
   ```
   
   **Backend (`backend/.env`):**
   ```env
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   DATABASE_URL=postgres://postgres:postgres@db:5432/unihousing
   ALLOWED_HOSTS=localhost,127.0.0.1,backend
   EMAIL_HOST_USER=your_email@gmail.com
   EMAIL_HOST_PASSWORD=your_app_password
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the Application**
   ```bash
   docker-compose up --build
   ```

5. **Access the Application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000/api
   - **Admin Interface**: http://localhost:8000/admin

### Local Development Setup

#### Backend Setup

1. **Create Virtual Environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Database Setup**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

4. **Load Sample Data** (Optional)
   ```bash
   python manage.py loaddata universities/fixtures/initial_universities.json
   ```

5. **Start Development Server**
   ```bash
   python manage.py runserver
   ```

#### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

### Backend

```
backend/
├── accounts/              # User authentication and profile management
│   ├── models.py         # Custom User model with student/owner roles + academic data
│   ├── serializers.py    # User, auth, and profile serializers
│   ├── views.py          # Authentication and profile views
│   ├── urls.py           # Authentication endpoints
│   └── migrations/       # Database migrations for User model changes
├── properties/            # Property listings and management
│   ├── models.py         # Property, PropertyImage, Room, PropertyReview models
│   ├── serializers.py    # Property serializers with image handling
│   ├── views.py          # Property CRUD and dashboard APIs
│   ├── permissions.py    # Custom permission classes (IsOwnerOrReadOnly)
│   └── urls.py           # Property management endpoints
├── universities/          # University data and proximity calculations
│   ├── models.py         # University, UniversityPropertyProximity models
│   ├── serializers.py    # University data serializers
│   ├── views.py          # University listing endpoints
│   ├── utils.py          # Distance calculation utilities
│   └── fixtures/         # Initial university data
├── roommates/             # Roommate matching and profiles
│   ├── models.py         # RoommateProfile, RoommateMatch, MatchAnalytics models
│   ├── serializers.py    # Profile and matching serializers with completion tracking
│   ├── views.py          # Roommate matching logic and profile management
│   ├── matching.py       # Sophisticated compatibility scoring algorithm
│   ├── utils.py          # ProfileCompletionCalculator utility
│   ├── permissions.py    # Profile ownership permissions
│   ├── tasks.py          # Background tasks for matching
│   └── management/       # Custom management commands
│       └── commands/
│           └── test_matching.py # Testing roommate matching algorithm
├── messaging/             # User-to-user messaging system
│   ├── models.py         # Conversation, Message, ViewingRequest models
│   ├── serializers.py    # Messaging serializers
│   ├── views.py          # Messaging and viewing request APIs
│   └── urls.py           # Messaging endpoints
└── unihousing_backend/    # Core Django settings and configuration
    ├── settings.py       # Django configuration with spatial database support
    ├── urls.py           # Main URL configuration
    ├── wsgi.py           # WSGI configuration
    ├── asgi.py           # ASGI configuration
    └── db/               # Custom database backends
        └── backends/
            └── spatialite/ # SQLite spatial extensions support
```

### Frontend

```
frontend/
├── public/                # Static assets and images
│   ├── placeholder-property.jpg # Default property image
│   └── *.svg             # Icon assets
└── src/
    ├── app/
    │   ├── (auth)/        # Authentication route group
    │   │   ├── login/     # Login page
    │   │   ├── signup/    # Registration page
    │   │   ├── forgot-password/ # Password reset flow
    │   │   ├── reset-password/[uid]/[token]/ # Password reset confirmation
    │   │   └── verify-email/[token]/ # Email verification
    │   ├── (dashboard)/   # Property owner dashboard route group
    │   │   ├── layout.tsx # Dashboard layout wrapper
    │   │   └── dashboard/
    │   │       ├── page.tsx # Main dashboard
    │   │       ├── list-property/ # Add new property
    │   │       └── properties/
    │   │           ├── page.tsx # Property management list
    │   │           └── [id]/
    │   │               ├── edit/  # Edit property
    │   │               └── view/  # View property details
    │   └── (main)/        # Public routes group
    │       ├── properties/ # Property listings and details
    │       │   ├── page.tsx # Property search/listing
    │       │   └── [id]/
    │       │       ├── page.tsx # Property detail view
    │       │       ├── client.tsx # Client-side property logic
    │       │       └── not-found.tsx # 404 for properties
    │       ├── roommates/ # Roommate matching system
    │       │   ├── page.tsx # Roommate discovery
    │       │   └── profile/
    │       │       ├── [id]/     # View roommate profile
    │       │       ├── complete/ # Profile completion flow
    │       │       └── edit/     # Edit profile
    │       ├── universities/ # University listings
    │       ├── messages/   # User messaging interface
    │       │   ├── page.tsx # Conversation list
    │       │   └── [id]/   # Individual conversation
    │       └── profile/    # User profile management
    ├── components/        # Reusable React components
    │   ├── common/        # Shared components
    │   │   ├── PropertyImage.tsx # Optimized image component with fallbacks
    │   │   └── PasswordStrengthIndicator.tsx # Password validation UI
    │   ├── layout/        # Layout components
    │   │   ├── Header.tsx # Navigation with auth state
    │   │   ├── Footer.tsx # Site footer
    │   │   ├── HeroSection.tsx # Homepage hero
    │   │   └── MainLayout.tsx # Common layout wrapper
    │   ├── property/      # Property-specific components
    │   │   ├── PropertyCard.tsx # Property listing card
    │   │   ├── PropertyFiltersPanel.tsx # Search filters
    │   │   ├── PropertySortDropdown.tsx # Sorting options
    │   │   ├── PropertyAmenities.tsx # Amenities display
    │   │   ├── ViewingRequestForm.tsx # Viewing request form
    │   │   └── SavedSearchesDropdown.tsx # Saved searches
    │   ├── dashboard/     # Dashboard-specific components
    │   │   ├── DashboardSidebar.tsx # Navigation sidebar
    │   │   └── PropertyStatusBadge.tsx # Status indicators
    │   ├── roommates/     # Roommate matching components
    │   │   ├── RoommateProfileForm.tsx # Multi-step profile form
    │   │   ├── ProfileCompletionPrompt.tsx # Completion tracking
    │   │   ├── RoommateProfileTeaser.tsx # Limited profile view
    │   │   └── steps/     # Profile form steps
    │   │       ├── BasicInfoStep.tsx # Basic information
    │   │       ├── LifestyleStep.tsx # Lifestyle preferences
    │   │       ├── PreferencesStep.tsx # Housing preferences
    │   │       ├── RoommatePreferencesStep.tsx # Roommate criteria
    │   │       └── SocialStep.tsx # Social information
    │   ├── messaging/     # Messaging components
    │   │   ├── ConversationsList.tsx # Conversation list
    │   │   └── ConversationDetail.tsx # Message thread
    │   ├── profile/       # Profile management components
    │   │   ├── ProfileInformation.tsx # Profile editing
    │   │   ├── ProfilePicture.tsx # Avatar upload
    │   │   ├── AccountSettings.tsx # Account settings
    │   │   └── PasswordChange.tsx # Password change form
    │   ├── filters/       # Search filter components
    │   │   ├── PriceRangeSlider.tsx # Price filtering
    │   │   ├── AmenitiesFilter.tsx # Amenities selection
    │   │   └── DistanceFilter.tsx # University distance
    │   ├── map/           # Map components
    │   │   └── PropertyMap.tsx # Mapbox integration
    │   ├── university/    # University components
    │   │   └── UniversityCard.tsx # University display card
    │   └── ui/            # Base UI components
    │       ├── button.tsx # Button variants
    │       ├── input.tsx  # Input components
    │       ├── card.tsx   # Card layouts
    │       ├── badge.tsx  # Status badges
    │       ├── avatar.tsx # User avatars
    │       ├── alert.tsx  # Alert messages
    │       ├── select.tsx # Select dropdowns
    │       ├── textarea.tsx # Text areas
    │       ├── checkbox.tsx # Checkboxes
    │       ├── label.tsx  # Form labels
    │       ├── separator.tsx # Visual separators
    │       ├── sheet.tsx  # Mobile overlays
    │       └── dropdown-menu.tsx # Dropdown menus
    ├── contexts/          # React context providers
    │   ├── AuthContext.tsx # User authentication state management
    │   └── RoommateContext.tsx # Roommate profile state
    ├── lib/               # API services and utilities
    │   ├── api.ts         # API service with automatic case conversion
    │   ├── api-server.ts  # Server-side API utilities
    │   ├── auth.tsx       # Authentication utilities
    │   └── utils.ts       # General utilities
    ├── types/             # TypeScript type definitions
    │   ├── api.ts         # API response interfaces (camelCase)
    │   ├── filters.ts     # Property filter types
    │   └── roommates.ts   # Roommate-specific types
    ├── utils/             # Helper functions and utilities
    │   ├── caseConversion.ts # snake_case ↔ camelCase conversion
    │   ├── validation.ts     # Form validation utilities
    │   ├── formatters.ts     # Data formatting helpers
    │   ├── helpers.ts        # General utility functions
    │   ├── constants.ts      # Application constants
    │   ├── imageUrls.ts      # Image URL processing
    │   └── profileCompletion.ts # Profile completion logic
    ├── hooks/             # Custom React hooks
    │   ├── useApi.ts      # API call hooks
    │   ├── useForm.ts     # Form handling hooks
    │   ├── useProperties.ts # Property management hooks
    │   ├── usePropertyFilters.ts # Property filtering
    │   ├── useRoommateProfile.ts # Roommate profile hooks
    │   └── useDebounce.ts # Debouncing utility
    └── config/            # Configuration files
        └── index.ts       # Application configuration
```

### Key Files and Directories

#### Backend Key Files
- `accounts/models.py` - Custom User model with student/property_owner roles
- `properties/models.py` - Property, PropertyImage, Room, PropertyReview models
- `properties/views.py` - Property CRUD operations and dashboard APIs
- `properties/permissions.py` - IsOwnerOrReadOnly and other custom permissions
- `universities/models.py` - University data with location and proximity features
- `messaging/models.py` - Conversation, Message, and viewing request system

#### Frontend Key Files
- `src/lib/api.ts` - Complete API service with automatic case conversion
- `src/contexts/AuthContext.tsx` - User authentication state management
- `src/components/common/PropertyImage.tsx` - Optimized image component with fallbacks
- `src/app/(dashboard)/dashboard/` - Complete property owner management interface
- `src/types/api.ts` - TypeScript interfaces for API data (camelCase)
- `src/utils/caseConversion.ts` - Automatic snake_case ↔ camelCase conversion

## 🔧 Development Workflow

### Key Development Conventions

- **Case Conversion**: API automatically converts between snake_case (backend) and camelCase (frontend)
- **Authentication**: All protected routes require JWT token in Authorization header
- **Image Handling**: Always use the `PropertyImage` component for consistent image display
- **Routing**: Follow established route groups: `(auth)`, `(dashboard)`, `(main)`
- **State Management**: Use React Context for global state, local state for component-specific data

### Adding New Features

1. **Backend Development**
   ```bash
   # Create new Django app
   cd backend
   python manage.py startapp new_feature
   
   # Add to INSTALLED_APPS in settings.py
   # Create models, serializers, views
   # Register URLs in both app and main urls.py
   # Run migrations
   python manage.py makemigrations
   python manage.py migrate
   ```

2. **Frontend Development**
   ```bash
   # Create components in appropriate directories
   # Add API endpoints to lib/api.ts
   # Update TypeScript types in types/api.ts
   # Implement UI components with Tailwind CSS
   # Add routes following the established pattern
   ```

### Code Quality Standards

- **TypeScript**: Strict mode enabled, no `any` types allowed
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Performance**: React.memo, useMemo, and useCallback where appropriate
- **Accessibility**: Proper ARIA labels and semantic HTML
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## 🗄 Database Models

### Core Models

#### User Management
- **User**: Extended Django AbstractUser with student/property_owner roles
- **Email verification fields**: token, sent_at, verified status

#### Property System
- **Property**: Complete property listings with location, amenities, pricing
- **PropertyImage**: Multi-image support with main image designation
- **Room**: Individual room details within properties
- **PropertyReview**: User reviews with detailed ratings

#### University Integration
- **University**: University information with location data
- **UniversityProximity**: Distance calculations to properties

#### Communication
- **Conversation**: User-to-user messaging threads
- **Message**: Individual messages with read status
- **ViewingRequest**: Property viewing appointment system

#### Roommate Matching System
- **RoommateProfile**: Comprehensive student lifestyle preferences, study habits, and social information
- **RoommateRequest**: Public housing search requests with budget and location preferences
- **RoommateMatch**: Advanced compatibility matching with weighted scoring algorithm
- **MatchAnalytics**: Performance tracking and user feedback on match quality
- **Profile Completion**: Weighted calculation system encouraging comprehensive profiles

## 🌐 API Endpoints

### Authentication & User Management
- `POST /api/accounts/register/` - User registration with email verification
- `POST /api/accounts/token/` - Login (supports username or email)
- `POST /api/accounts/token/refresh/` - JWT token refresh
- `GET /api/accounts/profile/` - Get user profile
- `PATCH /api/accounts/profile/update/` - Update user profile
- `POST /api/accounts/profile/password/` - Change password
- `POST /api/accounts/profile/picture/` - Upload profile picture
- `POST /api/accounts/password-reset/` - Request password reset
- `POST /api/accounts/password-reset/confirm/` - Confirm password reset
- `POST /api/accounts/verify-email/` - Verify email address

### Properties
- `GET /api/properties/` - List all active properties (public)
- `POST /api/properties/` - Create new property (owners only)
- `GET /api/properties/{id}/` - Get property details (public)
- `GET /api/properties/{id}/?as_owner=true` - Get property details as owner
- `PATCH /api/properties/{id}/` - Update property (owner only)
- `DELETE /api/properties/{id}/` - Delete property (owner only)
- `PATCH /api/properties/{id}/toggle_active/` - Toggle property active status
- `GET /api/properties/owner_properties/` - Get owner's properties
- `POST /api/properties/{id}/images/` - Upload property images

### Universities
- `GET /api/universities/` - List all universities

### Messaging & Communication
- `GET /api/messages/conversations/` - Get user conversations
- `GET /api/messages/conversations/{id}/` - Get conversation details
- `POST /api/messages/conversations/start/` - Start new conversation
- `POST /api/messages/conversations/{id}/messages/` - Send message
- `POST /api/messages/viewings/` - Request property viewing

### Roommate Matching System
- `GET /api/roommates/profiles/` - List roommate profiles with filtering and completion-based access
- `POST /api/roommates/profiles/` - Create roommate profile
- `GET /api/roommates/profiles/{id}/` - Get detailed roommate profile
- `PATCH /api/roommates/profiles/{id}/` - Update roommate profile (owner only)
- `GET /api/roommates/my-profile/` - Get current user's roommate profile
- `GET /api/roommates/find-matches/` - Get compatible roommate matches with scoring
- `GET /api/roommates/requests/` - List public roommate requests
- `POST /api/roommates/requests/` - Create roommate request
- `POST /api/roommates/matches/` - Create roommate match/connection

## 🚢 Deployment

### Environment Configuration

**Production Environment Variables:**
```env
# Backend (.env)
SECRET_KEY=your-production-secret-key
DEBUG=False
DATABASE_URL=your-production-database-url
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
EMAIL_HOST_USER=your-production-email
EMAIL_HOST_PASSWORD=your-production-email-password
FRONTEND_URL=https://your-domain.com

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NEXT_PUBLIC_MEDIA_URL=https://api.your-domain.com/media
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-production-mapbox-token
```

### Production Build

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   npm start  # Test production build locally
   ```

2. **Prepare Backend**
   ```bash
   cd backend
   python manage.py collectstatic --noinput
   python manage.py migrate
   ```

3. **Docker Production**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 🧪 Testing

### Backend Testing
```bash
cd backend
python manage.py test

# Run specific app tests
python manage.py test accounts
python manage.py test properties
```

### Frontend Testing (Future Implementation)
```bash
cd frontend
npm test
npm run test:coverage
```

## 📝 Contributing

### Development Standards

1. **Code Style**
   - Use TypeScript for all frontend code
   - Follow Django conventions for backend
   - Use camelCase for frontend, snake_case for backend
   - Write descriptive commit messages following conventional commits

2. **Pull Request Process**
   ```bash
   # Create feature branch
   git checkout -b feature/your-feature-name
   
   # Make changes and commit
   git add .
   git commit -m "feat: add new feature description"
   
   # Push and create PR
   git push origin feature/your-feature-name
   ```

3. **Code Review Checklist**
   - [ ] TypeScript types are properly defined
   - [ ] Error handling is implemented
   - [ ] Mobile responsiveness is tested
   - [ ] API endpoints follow naming conventions
   - [ ] Authentication checks are in place
   - [ ] Case conversion is handled properly

## 🛣 Roadmap

### Phase 1: Core Platform ✅ (Completed)
- ✅ User authentication system with email verification
- ✅ Property listing and management with image uploads
- ✅ Property owner dashboard with status control
- ✅ Basic messaging system between users
- ✅ University proximity data and integration
- ✅ Responsive design and mobile optimization

### Phase 2: Enhanced Features ✅ (Recently Completed)
- ✅ Advanced property search and filtering
- ✅ Profile management system
- ✅ Property status management and bulk operations
- ✅ Roommate matching algorithm with multi-factor scoring
- ✅ Profile completion tracking with weighted calculation
- ✅ Data architecture refactor eliminating User/RoommateProfile duplication
- 🔄 Advanced analytics for property owners
- 🔄 Property review and rating system

### Phase 3: Growth Features 📋 (Planned)
- 📋 Payment integration for bookings and deposits
- 📋 Advanced messaging with file attachments
- 📋 Mobile app development (React Native)
- 📋 Multi-city expansion beyond Monterrey
- 📋 AI-powered property recommendations
- 📋 Integration with local services and utilities

### Phase 4: Scale & Analytics 📋 (Future)
- 📋 Advanced analytics dashboard
- 📋 Property management tools for large landlords
- 📋 API for third-party integrations
- 📋 Machine learning for fraud detection
- 📋 International expansion

## 🐛 Known Issues & Limitations

### Current Limitations
- Image optimization can be slow for large files (>5MB)
- Map performance needs optimization for 100+ properties
- Email delivery depends on SMTP configuration
- File storage is currently local (cloud storage planned)
- Roommate matching algorithm requires profile completion for optimal results

### Performance Considerations
- Large property datasets may impact initial load times
- Mobile map interactions could be improved
- Image loading needs progressive enhancement
- Profile completion calculation runs on every profile save (cached for 1 hour)

### Browser Compatibility
- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- Internet Explorer not supported
- Mobile browsers fully supported

### Data Migration Notes
- Recent architecture refactor requires running data migrations to move duplicate fields from RoommateProfile to User model
- Profile completion percentages will be recalculated after migration
- Backward compatibility maintained during transition period

## 📞 Support & Documentation

### Getting Help
- **Development Issues**: Create GitHub issue with detailed description
- **Setup Problems**: Check environment variables and Docker logs
- **Feature Requests**: Use GitHub discussions for feature proposals

### Useful Commands
```bash
# Reset database (development only)
python manage.py flush
python manage.py migrate

# Create new superuser
python manage.py createsuperuser

# Generate and apply migrations (after model changes)
python manage.py makemigrations
python manage.py migrate

# Test roommate matching algorithm
python manage.py test_matching

# Check API endpoints
python manage.py show_urls

# Frontend type checking
npm run type-check

# Build and analyze bundle
npm run build
npm run analyze
```

## 📄 License

This project is proprietary software. All rights reserved.

**© 2024 UniHousing Platform. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.**

---

## 🙏 Acknowledgments

**Built with ❤️ for the student community in Monterrey, Mexico**

Special thanks to the open-source community and the following technologies that made this platform possible:
- Django & Django REST Framework
- Next.js & React
- Tailwind CSS
- Mapbox
- PostgreSQL