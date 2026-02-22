# TrackEd MVP Backend

This is the Node.js backend for the TrackEd MVP, implementing end-to-end workflows for teachers and students using Express and Supabase.

## Setup Instructions

### 1. Database Setup (Supabase)
1. Since the `TrackEd1` MCP server could not be located to automate this, you must run the provided SQL scripts manually in your Supabase SQL Editor.
2. Execute the `supabase/schema.sql` file in your Supabase project's SQL editor to create the necessary tables.
3. Once the tables are created, you can execute the `supabase/seed.sql` file (after adding valid user UUIDs from the Auth table) to populate sample test data.

### 2. Environment Setup
1. Open the `.env` file in the root directory.
2. Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_SERVICE_ROLE_KEY` with your actual Supabase project credentials. 
*(Note: Since we are bypassing row-level-security externally and enforcing role-based access in this Node.js API, the Service Role key can be used, or the Anon key combined with proper RLS).*

### 3. Running the Server
Install dependencies and start the backend:
```bash
npm install
npm run dev
```
*(You may need to add `"dev": "nodemon server.js"` to your `package.json` scripts if not automatically added, or simply run `npx nodemon server.js`)*

## API Endpoints Overview
- **Auth**: `GET /api/auth/profile`
- **Subjects**: `GET /api/subjects`, `POST /api/subjects` (Teacher only)
- **Notes**: `GET /api/notes/subject/:subjectId`, `POST /api/notes` (Teacher only), `POST /api/notes/:noteId/student-notes` (Student only)
- **Assignments**: `GET /api/assignments/subject/:subjectId`, `POST /api/assignments` (Teacher only), `POST /api/assignments/:assignmentId/submissions` (Student only), `PUT /api/assignments/submissions/:submissionId/grade` (Teacher only)

**Authentication:** Pass the Supabase Auth JWT in the `Authorization: Bearer <token>` header for all requests.
