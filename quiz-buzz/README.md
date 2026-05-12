# QuizBuzz

QuizBuzz is a quiz platform with authenticated quiz creation, quiz play, attempt results, dashboards, and leaderboards.

## Tech Stack

- Next.js 16 with the App Router
- Clerk authentication
- Tailwind CSS
- Sonner toast notifications
- QuizBuzz API backend in `quiz-buzz-api`

## Prerequisites

- Node.js 22 or newer
- A running MongoDB instance for the backend
- Clerk application keys

## Environment Variables

Create or update `quiz-buzz/.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
CLERK_SECRET_KEY=sk_test_your_secret_key
QUIZ_BUZZ_API_ORIGIN=http://localhost:8040
```

Create or update `quiz-buzz-api/.env`:

```env
MONGODB_URI=mongodb+srv://your-mongodb-uri
PORT=8040
CLERK_JWKS_URL=https://your-clerk-domain.clerk.accounts.dev/.well-known/jwks.json
CORS_ORIGIN=http://localhost:3000
```

## Install

Install dependencies in both app folders:

```bash
cd quiz-buzz-api
npm install

cd ../quiz-buzz
npm install
```

## Run Locally

Start the backend first:

```bash
cd quiz-buzz-api
npm run dev
```

Then start the frontend in a separate terminal:

```bash
cd quiz-buzz
npm run dev
```

Open these URLs:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8040
- API docs: http://localhost:8040/api/v1/_docs

## Available Pages

- `/` - Home
- `/quizzes` - Browse quizzes
- `/quizzes/create` - Create a quiz
- `/quizzes/[id]` - Play a quiz
- `/quizzes/[id]/results` - Attempt results
- `/dashboard` - User dashboard
- `/leaderboard/[id]` - Quiz leaderboard

## Build

```bash
npm run build
```

## Notes

- The frontend uses `QUIZ_BUZZ_API_ORIGIN` for server-side API requests.
- Toast notifications are powered by Sonner.
- Loading states and error states are implemented for the main quiz flows.
