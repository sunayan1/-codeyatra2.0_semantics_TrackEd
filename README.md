# semantics_codeyatra
# TrackEd 

A backend system for managing subjects, assignments, and submissions for teachers and students, built with Node.js, Express, and Supabase.


## Project Overview

This is a backend API for managing educational workflows. Teachers can create subjects and assignments, and students can submit their work. The system enforces role-based access and integrates with Supabase Auth.

## Features

- Teacher and student roles with RLS enforcement
- CRUD for subjects and assignments
- Supabase authentication and authorization

## Tech Stack

- Node.js
- Express.js
- Supabase (PostgreSQL + Auth)
- Axios (for API requests)
- Nodemon (for development)

### Prerequisites

- Node.js 18+
- npm
- Supabase project with Auth and Database

## Environment Variables

Create a `.env` file in the root:
- SUPABASE_URL=https://your-project.supabase.co
- SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
- PORT=5000

