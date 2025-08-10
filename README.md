# Enrollment System (Vue 3 + Express + MySQL)

This is a full‑stack student enrollment system with a Vue 3 frontend and an Express/MySQL backend.

## Prerequisites

- Node.js >= 16
- MySQL server

## Backend Setup

1) Create a backend `.env` file from the example:

```bash
cp backend/.env.example backend/.env
```

2) Edit `backend/.env` and set your DB credentials and JWT settings:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ncst_enrollment1
DB_PORT=3306

# Use a strong secret in production
JWT_SECRET=change_this_in_production
JWT_EXPIRES_IN=1d

PORT=5000
```

3) Install dependencies and start the backend:

```bash
cd backend
npm install
npm run dev    # or: npm start
```

## Frontend Setup

1) Install dependencies at the project root and start Vite:

```bash
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:5000/api` by default. You can override with `VITE_API_BASE_URL` in a `.env` file at the project root, e.g.:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

## One‑command Dev (optional)

From the project root, you can start both servers with:

```bash
npm run a
```

This uses `concurrently` to run `vite` and the backend server together.

## Notes

- Authentication tokens (JWT) are signed with the backend `JWT_SECRET` and honor `JWT_EXPIRES_IN`.
- Admin and Student areas are protected by route guards and backend middleware.
- For Room schedules, the UI accepts both 12‑hour (e.g., `1:00PM`) and 24‑hour (`13:00` or `13:00:00`) formats.
