# Workout Tracker

A small workout tracker built with React and Vite, ported from my vanilla JavaScript version to learn React fundamentals. It started out as a pure frontend app and has since grown into a small fullstack project: the React client talks to an Express API that stores the sessions in a SQLite database hosted on Turso.

Live: [https://workout-tracker-11n5.onrender.com](https://workout-tracker-11n5.onrender.com)

## Features

- Sessions, exercises and sets in a nested structure: a session contains exercises, an exercise contains sets
- Add, delete and select on all three levels
- Selecting a session reveals its exercises, selecting an exercise reveals its sets
- Data is saved through the API, so sessions survive a page reload
- Rest timer with 60, 90 and 120 second presets and a stop button

## Project structure

```
workout-tracker-react/
├── package.json   Build and start scripts for the deployment
├── client/        React frontend (Vite)
└── server/        Express API (Node, Express 5, ES modules)
```

- `client/` contains the React app. `App.jsx` holds the sessions state, loads it from the API with `GET /sessions` on mount and calls a dedicated route for every action (adding or deleting a session, exercise or set). All requests use relative URLs like `/sessions`. `vite.config.js` sets up a proxy that forwards `/sessions` to `http://localhost:3000` during local development.
- `server/` contains `server.js`, a small Express API that stores sessions, exercises and sets in a SQLite database using `@libsql/client`. In production the database is hosted on Turso, locally the server falls back to the file `server/workout.db`. The server also serves the built frontend from `client/dist`.
- The `package.json` in the root has two scripts: `build` installs and builds the client and installs the server dependencies, `start` runs `node server/server.js`. Render uses these two scripts (see [Deployment](#deployment)). It also sets `engines` to Node `22.x`.

Frontend and server are separate projects with their own `package.json`. During local development they run at the same time, in production the Express server delivers both the API and the built frontend.

## Tech stack

### Frontend

- React
- Vite
- Plain CSS

### Backend

- Node.js
- Express 5 (ES modules)
- SQLite with `@libsql/client`
- Turso as hosted database

### Deployment

- Render (web service)
- Turso (database)

## How it works

- On startup the client fetches all sessions with `GET /sessions`
- Every handler in the client (adding or deleting a session, exercise or set) calls its own route and updates the React state once the server has answered
- When adding something, the client sends only the new values (`type`, `name` or `weight` and `reps`). The server assigns the `id` (and the `date` for sessions) and responds with the new object, which the client inserts into the state
- When deleting something, the server responds with `204 No Content` and the client removes the item from the state
- If the server answers with an error status, the client checks `response.ok`, shows the server's error message with `alert` and leaves the state unchanged. This applies to adding a session, exercise or set and to deleting an exercise or set. Deleting a session always gets a `204`, so that handler does not check the response
- All routes are `async`, because every database call with `@libsql/client` returns a Promise that the server waits for with `await`
- The server writes every `POST` and `DELETE` directly to the database and reads the sessions from it on every `GET /sessions`, so nothing is kept in memory between requests
- The client uses relative URLs, so the same code works locally and in production. Locally the Vite proxy forwards the requests to the server on port 3000, in production the frontend is served by the same Express server as the API, so no CORS setup is needed
- Express serves the built frontend from `client/dist` with `express.static`. Requests for files that exist in that folder are answered with those files, so `/` returns `index.html`. Other paths that are neither an API route nor an existing file respond with `404`

## API

Locally the server runs on `http://localhost:3000`, the port comes from `process.env.PORT` if it is set. In production the API runs under the same URL as the frontend.

| Method | Route                                                    | Body               | Description                                                                    | Errors       |
| ------ | -------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------ | ------------ |
| GET    | `/sessions`                                              |                    | Returns all sessions as a JSON array                                           |              |
| POST   | `/sessions`                                              | `{ type }`         | Creates a session, the server assigns `id` and `date`, returns the new session | `400`        |
| DELETE | `/sessions/:id`                                          |                    | Deletes a session with its exercises and sets, always responds with `204`      |              |
| POST   | `/sessions/:sessionId/exercises`                         | `{ name }`         | Creates an exercise in the session, returns the new exercise                   | `400`, `404` |
| DELETE | `/sessions/:sessionId/exercises/:exerciseId`             |                    | Deletes an exercise with its sets, responds with `204`                         | `404`        |
| POST   | `/sessions/:sessionId/exercises/:exerciseId/sets`        | `{ weight, reps }` | Creates a set in the exercise, returns the new set                             | `400`, `404` |
| DELETE | `/sessions/:sessionId/exercises/:exerciseId/sets/:setId` |                    | Deletes a set, responds with `204`                                             | `404`        |

- `400 Bad Request`: the body is invalid (see [Validation](#validation))
- `404 Not Found`: the session or exercise in the route does not exist. The item that is being deleted itself is not checked, so deleting an exercise or set that does not exist still responds with `204`. `DELETE /sessions/:id` never responds with `404`

Error responses are JSON in the format:

```json
{ "error": "Session not found" }
```

## Validation

The server does the actual validation. Every `POST` route checks the body before anything is saved:

- `POST /sessions`: `type` must not be missing or empty, otherwise `400` with `Type is required`
- `POST /sessions/:sessionId/exercises`: `name` must not be missing or empty, otherwise `400` with `Name is required`
- `POST .../sets`: `weight` must be a positive number and `reps` a positive whole number, otherwise `400` with `Weight must be a positive number` or `Reps must be a positive whole number`. Both are converted with `Number()` and stored as numbers

Routes with a `sessionId` or `exerciseId` check first that the session or exercise exists and respond with `404` if not.

In the frontend, weight and reps are `number` inputs (`min="0.5"`/`step="0.5"` for weight, `min="1"`/`step="1"` for reps), and empty inputs are not sent at all. This is only for convenience: the inputs can still be bypassed, so the server does not rely on them.

## Data storage

The server accesses the database with `@libsql/client`. Which database it uses depends on two environment variables:

- If `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set, the server connects to the hosted database on Turso. This is the case in production
- Without these variables the server uses the local file `server/workout.db` through a `file:` URL. The path is built with `import.meta.dirname`, so it is relative to `server.js` and not to the working directory. The server can therefore be started from any folder

The tables are created automatically on the first server start (`CREATE TABLE IF NOT EXISTS`). The local file is created as well if it does not exist yet, and `workout.db` is listed in `.gitignore`, so it is not committed.

The database has three tables:

| Table       | Columns                               |
| ----------- | ------------------------------------- |
| `sessions`  | `id`, `type`, `date`                  |
| `exercises` | `id`, `session_id`, `name`            |
| `sets`      | `id`, `exercise_id`, `weight`, `reps` |

- `exercises.session_id` references `sessions.id` and `sets.exercise_id` references `exercises.id`. Both are declared as foreign keys with `ON DELETE CASCADE` in the schema, but the server does not rely on them, because Turso does not enforce foreign keys by default. Instead the delete routes remove the related rows themselves (see below)
- `id` values are assigned by SQLite (`INTEGER PRIMARY KEY`). After an `INSERT` the server reads the new `id` from `lastInsertRowid`. libSQL returns it as a `BigInt`, so the server converts it with `Number()` before returning it in the response
- `date` is the day the session was created in `YYYY-MM-DD` format
- `weight` is stored as `REAL` and `reps` as `INTEGER`. The server converts them with `Number()` before saving
- All queries use `?` placeholders and pass the values separately in `args`, so values from the request are never inserted into the SQL string directly

Deleting is done with `db.batch`, which runs several statements together:

- `DELETE /sessions/:id` first deletes the sets of all exercises in the session (with an `IN` subquery on `exercises`), then the exercises, then the session itself
- `DELETE /sessions/:sessionId/exercises/:exerciseId` first deletes the sets of the exercise, then the exercise

The order matters: the sets are deleted while the exercises still exist, because the subquery needs them to find the right sets.

`GET /sessions` loads all three tables with three queries and puts the nested structure back together in JavaScript: for every session it filters the exercises by `session_id`, and for every exercise the sets by `exercise_id`. Only the fields the client needs are copied into the response, so it contains no `session_id` or `exercise_id`. It looks like this:

```json
[
  {
    "id": 1,
    "type": "Push",
    "date": "2026-09-29",
    "exercises": [
      {
        "id": 1,
        "name": "Bench Press",
        "sets": [{ "id": 1, "weight": 80, "reps": 8 }]
      }
    ]
  }
]
```

The objects have the same shape as the ones returned by the `POST` routes.

## Deployment

The app is live at [https://workout-tracker-11n5.onrender.com](https://workout-tracker-11n5.onrender.com).

### Server on Render

- Free Web Service, region Frankfurt
- Build Command: `npm run build`
- Start Command: `npm start`
- Auto-Deploy on every push to `main`
- Environment variables: `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. Render also sets `PORT`, which the server reads from `process.env.PORT`

Free services go to sleep after 15 minutes without requests. The first request after that takes a few seconds until the server is running again.

### Database on Turso

- Free Plan, region AWS EU West (Ireland)
- The database URL and an auth token are created in Turso and set as environment variables on Render

## What I learned

- Components, props and callback props
- useState and controlled inputs
- Lifting state up
- Immutable updates of nested state
- Event propagation and stopPropagation
- useEffect with cleanup (interval-based timer)
- Fetching data in useEffect and updating the state with the server's response
- Designing REST routes with route parameters (`req.params`), HTTP methods (GET, POST, DELETE) and status codes (`204 No Content`)
- Debugging requests in the Network tab of the browser DevTools
- Setting up a small Express API with JSON body parsing, CORS and file-based persistence
- Validating input on the server instead of trusting the frontend
- Responding with the right HTTP status codes for errors: `400 Bad Request` for invalid input, `404 Not Found` for missing resources
- Checking `response.ok` in the client, because `fetch` does not throw on error status codes
- SQL basics: `CREATE TABLE`, `INSERT`, `SELECT`, `WHERE`, `AND` and `DELETE`
- Prepared statements with `?` placeholders to protect against SQL injection
- Foreign keys with `ON DELETE CASCADE`, and why a database might not enforce them
- Putting nested data from several tables back together for a single API response
- Deploying a fullstack app on Render with a build and a start command
- Configuring the app with environment variables through `process.env` instead of hardcoded values
- Using a hosted database (Turso) instead of a local file
- Async database access with `async`/`await` in Express routes
- Running several related statements together with `batch`
- Building file paths relative to the file with `import.meta.dirname` instead of relying on the working directory
- Using a Vite proxy during local development, so the client can use relative URLs

## How to run locally

Frontend and server have to run at the same time, so you need two terminals.

Install the dependencies in both folders:

```bash
cd server
npm install

cd ../client
npm install
```

Start the server (port 3000):

```bash
cd server
node --watch server.js
```

Without environment variables the server uses the local database file `server/workout.db`.

Start the frontend (port 5173) in a second terminal:

```bash
cd client
npm run dev
```

Vite prints the local URL, by default `http://localhost:5173`. The Vite proxy forwards all requests to `/sessions` to the server on `http://localhost:3000`.

To work with the Turso database instead of the local file, set the two environment variables in front of the server command:

```bash
cd server
TURSO_DATABASE_URL=libsql://your-database.turso.io TURSO_AUTH_TOKEN=your-token node --watch server.js
```
