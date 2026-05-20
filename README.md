# QuizBuzz

QuizBuzz is a full-stack quiz platform for creating, playing, and reviewing quizzes with authentication, leaderboards, timers, optional question images, and MongoDB-backed persistence.

## Stack

- Frontend: Next.js 16, React 19, Tailwind CSS
- Backend: Fastify + ARC + MongoKit
- Database: MongoDB
- Auth: Clerk
- Media uploads: ImageKit

## Repo Structure

```text
Quiz-App/
|- quiz-buzz/      # Next.js frontend
|- quiz-buzz-api/  # Fastify + ARC backend
|- DEPLOYMENT.md
```

## Features

- Authenticated quiz creation
- Multi-question quizzes
- Multiple correct answers per question
- Timer-based quiz flow
- Optional question image uploads with ImageKit
- Attempt scoring and answer review
- Dashboard for created quizzes and recent attempts
- Quiz leaderboard pages

## Prerequisites

- Node.js 22+
- npm
- MongoDB database
- Clerk project
- ImageKit account for question image uploads

## Environment Variables

### Frontend

Create `quiz-buzz/.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
QUIZ_BUZZ_API_ORIGIN=http://localhost:8040
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=
```

### Backend

Create `quiz-buzz-api/.env`:

```env
MONGODB_URI=
PORT=8040
CLERK_JWKS_URL=
CORS_ORIGIN=http://localhost:3000
```

## Install

```bash
cd quiz-buzz-api
npm install

cd ../quiz-buzz
npm install
```

## Run Locally

Start the backend:

```bash
cd quiz-buzz-api
npm run dev
```

Start the frontend in another terminal:

```bash
cd quiz-buzz
npm run dev
```

Open:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8040`
- API docs: `http://localhost:8040/api/v1/docs`

## Build

Backend:

```bash
cd quiz-buzz-api
npm run build
```

Frontend:

```bash
cd quiz-buzz
npm run build
```

## Main Routes

- `/` - Home
- `/quizzes` - Browse quizzes
- `/quizzes/create` - Create a quiz
- `/quizzes/[id]` - Play a quiz
- `/quizzes/[id]/results` - Review attempt results
- `/dashboard` - User dashboard
- `/leaderboard` - Browse leaderboards
- `/leaderboard/[id]` - Quiz leaderboard

## Notes

- The frontend proxies `/api/v1/*` requests to `QUIZ_BUZZ_API_ORIGIN`.
- The backend uses ARC resources and MongoKit repositories.
- ImageKit is used only for optional question images.
- Keep `.env.local` and `.env` out of source control.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment guidance.
