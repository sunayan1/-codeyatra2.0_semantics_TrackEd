# semantics_codeyatra
# TrackEd 

A backend system for managing subjects, assignments, and submissions for teachers and students, built with Node.js, Express, and Supabase.

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

# Frontend

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
