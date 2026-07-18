# Lakbay Intramuros

A comprehensive tourism web application focused on planning and managing visits within the historic walled city of Intramuros, Manila. The platform connects tourists with professional tour guides, offering features for itinerary planning, guide booking, real-time tour tracking, payments, and ratings.

## Features

### For Tourists
- **Landmark Exploration**: Interactive map-based exploration of Intramuros landmarks and attractions
- **Smart Itinerary Creation**: Build custom itineraries with AI-assisted recommendations
- **Guide Selection**: Browse and book professional tour guides with availability management
- **Real-time Booking**: Request, modify, and track tour bookings with live status updates
- **Secure Payments**: Integrated payment processing for tour bookings
- **Tour Progress Tracking**: Real-time progress tracking during guided tours with route visualization
- **Guide Ratings**: Rate and review guides after completed tours
- **Profile Management**: Manage personal information and booking history

### For Tour Guides
- **Dashboard Management**: Comprehensive dashboard for managing bookings and availability
- **Booking Requests**: Accept, reject, or modify booking requests from tourists
- **Availability Management**: Set available dates and time slots for tours
- **Ongoing Tour Tracking**: Real-time tour progress tracking with persisted state
- **Earnings Tracking**: View earnings, payment history, and request cash-outs
- **Profile Management**: Update guide profile, photos, and tour information

### For Administrators
- **User Management**: Manage tourist and guide accounts
- **Guide Verification**: Approve and verify tour guide applications
- **Booking Reports**: Generate detailed booking reports with filtering
- **Payment Oversight**: Monitor payment transactions and guide payouts
- **System Analytics**: View platform usage and performance metrics

## Tech Stack

### Backend
- **Runtime**: Node.js with ES modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with bcryptjs for password hashing
- **Real-time Communication**: Socket.IO for live updates
- **Rate Limiting**: Upstash Redis-based rate limiting
- **API**: RESTful API design
- **CORS**: Configured for development and production origins

### Frontend
- **Framework**: React 19 with Vite
- **Routing**: React Router v7
- **Styling**: TailwindCSS with DaisyUI components
- **Icons**: Lucide React
- **Maps**: Google Maps API (@react-google-maps/api)
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Real-time**: Socket.IO client
- **State Management**: React Context API

## Project Structure

```
lakbay-intramuros/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app entry point
│   │   ├── config/
│   │   │   ├── db.js           # MongoDB connection
│   │   │   └── socket.js       # Socket.IO configuration
│   │   ├── controllers/        # Route controllers
│   │   │   ├── adminController.js
│   │   │   ├── authController.js
│   │   │   ├── bookingController.js
│   │   │   ├── itineraryController.js
│   │   │   ├── paymentController.js
│   │   │   ├── ratingController.js
│   │   │   └── travelController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── rateLimiter.js
│   │   ├── models/             # Mongoose models
│   │   │   ├── Booking.js
│   │   │   ├── Itinerary.js
│   │   │   ├── Payment.js
│   │   │   ├── TourGuide.js
│   │   │   ├── Travel.js
│   │   │   └── User.js
│   │   ├── routes/             # API routes
│   │   │   ├── adminRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── bookingRoutes.js
│   │   │   ├── itineraryRoutes.js
│   │   │   ├── paymentRoutes.js
│   │   │   ├── ratingRoutes.js
│   │   │   ├── travelRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── services/
│   │   └── utils/              # Utility functions
│   ├── .env                    # Environment variables (not in git)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main React app
│   │   ├── main.jsx            # React entry point
│   │   ├── components/         # Reusable components
│   │   ├── context/            # React context providers
│   │   ├── data/               # Static data
│   │   ├── lib/                # Utility functions
│   │   └── pages/              # Page components
│   │       ├── admin/
│   │       ├── auth/
│   │       ├── guide/
│   │       ├── BookingPage.jsx
│   │       ├── CreatePage.jsx
│   │       ├── HomePage.jsx
│   │       ├── ItineraryBuilderPage.jsx
│   │       ├── LandingPage.jsx
│   │       ├── ProfilePage.jsx
│   │       └── TravelDetailPage.jsx
│   ├── public/                 # Static assets
│   ├── .env                    # Environment variables (not in git)
│   └── package.json
├── package.json                # Root package.json for monorepo scripts
└── README.md
```

## Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local instance or MongoDB Atlas connection string)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ceravnos/lakbay-intramuros.git
   cd lakbay-intramuros
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create `.env` files in both `backend/` and `frontend/` directories:

   **Backend `.env`**:
   ```env
   PORT=4000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   
   # Upstash Redis (for rate limiting)
   UPSTASH_REDIS_REST_URL=your_upstash_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
   
   # Email (for password reset - optional)
   RESEND_API_KEY=your_resend_api_key
   EMAIL_FROM=noreply@yourdomain.com
   ```

   **Frontend `.env`**:
   ```env
   VITE_API_URL=http://localhost:4000
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. **Build the frontend**
   ```bash
   npm run build
   ```

## Running the Application

### Development Mode
Run both backend and frontend concurrently:
```bash
npm run dev
```
This will start:
- Backend server on `http://localhost:4000`
- Frontend dev server on `http://localhost:5173`

### Individual Services

**Backend only**:
```bash
cd backend
npm run dev
```

**Frontend only**:
```bash
cd frontend
npm run dev
```

### Production Mode
1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the backend (serves both API and static frontend):
   ```bash
   npm start
   ```

The application will be available at the configured PORT (default: 4000).

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/verify-otp` - Verify OTP for password reset
- `POST /api/auth/reset-password` - Reset password with OTP
- `GET /api/auth/me` - Get current user info

### Bookings
- `GET /api/bookings/my-bookings` - Get user's bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `GET /api/bookings/guide-dashboard` - Get guide dashboard data
- `PUT /api/bookings/:id/progress` - Update tour progress
- `POST /api/bookings/:id/complete` - Complete booking

### Itineraries
- `GET /api/itineraries/:id` - Get itinerary by ID
- `POST /api/itineraries` - Create new itinerary
- `PUT /api/itineraries/:id` - Update itinerary
- `DELETE /api/itineraries/:id` - Delete itinerary
- `GET /api/itineraries/context/:id` - Get itinerary context

### Travel/Landmarks
- `GET /api/travel` - Get all landmarks
- `GET /api/travel/:id` - Get landmark by ID

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/apply-guide` - Apply to become a guide

### Ratings
- `POST /api/ratings` - Submit a rating
- `GET /api/ratings/guide/:guideId` - Get guide ratings

### Payments
- `POST /api/payments/create` - Create payment
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/guide-cashout-sandbox` - Guide cash-out (sandbox)

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/guide-applications` - Get guide applications
- `PUT /api/admin/guide-applications/:id` - Process guide application
- `GET /api/admin/booking-reports` - Get booking reports

## Environment Variables Reference

### Backend
- `PORT` - Server port (default: 4000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token generation
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS
- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL for rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token
- `RESEND_API_KEY` - Resend API key for email (optional)
- `EMAIL_FROM` - From email address for password reset (optional)

### Frontend
- `VITE_API_URL` - Backend API URL
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps JavaScript API key

## Key Features Implementation Details

### Real-time Updates
The application uses Socket.IO for real-time communication:
- Booking status updates
- Guide availability changes
- Tour progress tracking
- Live notifications

### Authentication
- JWT-based authentication with secure password hashing
- Role-based access control (tourist, guide, admin)
- Protected routes with middleware

### Rate Limiting
Upstash Redis-based rate limiting to prevent API abuse

### Performance Optimizations
- Lean MongoDB queries for dashboard endpoints
- Indexed database fields for faster lookups
- Parallel data fetching in frontend
- Optimized re-renders with React context

## Deployment

### Backend Deployment
The backend is configured for production deployment:
- Serves static frontend files from `frontend/dist`
- CORS configured for production origins
- Environment-based configuration

### Frontend Deployment
Build the frontend before deployment:
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/` and served by the backend in production.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Repository

https://github.com/Ceravnos/lakbay-intramuros

## Support

For issues and questions, please open an issue on the GitHub repository.
