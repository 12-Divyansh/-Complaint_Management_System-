# AI-Based Smart Complaint Management System

A full-stack MERN application that allows users to register complaints online with AI integration to classify complaint priority, generate automated responses, and recommend the concerned department.

## Project Structure

This project is organized as a monorepo containing both the frontend and backend:

- `/frontend`: React + Vite application (User Interface)
- `/backend`: Node.js + Express + MongoDB application (REST APIs)

## Features

- **User Authentication:** Secure JWT-based login and registration with bcrypt password hashing.
- **Complaint Registration:** Form to submit detailed complaints.
- **AI Analysis:** Uses Google Gemini AI to analyze the complaint description and suggest:
  - Priority (Low, Medium, High, Critical)
  - Relevant Department
  - Brief Summary
  - Automated Response Draft
- **Complaint Tracking:** View, search by location, and filter complaints by category.
- **Admin Controls:** Admins can update the status of complaints (Pending, In Progress, Resolved, Rejected).
- **Premium UI:** Custom, modern, glass-morphism design with responsive CSS variables.

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas Cluster URI
- Google Gemini API Key (or alternative AI API)

### Environment Variables

**Backend (`/backend/.env`):**
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

### Installation & Running Locally

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd ESE_FSD
   ```

2. **Start the Backend:**
   ```bash
   cd backend
   npm install
   node server.js
   ```

3. **Start the Frontend:**
   Open a new terminal window:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## Testing the AI Features

1. Login or create an account.
2. Click **+ New Complaint**.
3. Fill in the title, location, category, and a detailed description (e.g., "The water pipe near the market area is completely broken and flooding the street!").
4. Click **Analyze with AI**. The system will fetch suggestions (e.g., Priority: Critical, Department: Water Supply).
5. Submit the complaint.

## Deployment on Render

To deploy this project on Render:

1. **Database:** Ensure your MongoDB Atlas cluster allows network access from anywhere (`0.0.0.0/0`) or specific Render IPs.
2. **Backend Deployment (Web Service):**
   - Create a new Web Service on Render.
   - Set the Root Directory to `backend`.
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Add Environment Variables (`MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`).
3. **Frontend Deployment (Static Site):**
   - **Important:** First, update `vite.config.js` or `src/services/api.js` to point to your new Render Backend URL instead of `/api` or `localhost`.
   - Create a new Static Site on Render.
   - Set the Root Directory to `frontend`.
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register a user
- `POST /api/auth/login` - Authenticate a user

### Complaints
- `POST /api/complaints` - Create a complaint
- `GET /api/complaints` - Get complaints (supports `?category=` filter)
- `PUT /api/complaints/:id` - Update status
- `GET /api/complaints/search?location=` - Search by location

### AI Analysis
- `POST /api/ai/analyze` - Analyze text and return AI insights

---
*Developed for AI Driven Full Stack Development Examination.*
