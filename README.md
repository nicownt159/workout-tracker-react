# Workout Tracker

A small workout tracker built with React and Vite, ported from my vanilla JavaScript version to learn React fundamentals. It started out as a pure frontend app and has since grown into a small fullstack project: the React client talks to an Express API that stores the sessions in a SQLite database on the server.

## Features

- Sessions, exercises and sets in a nested structure: a session contains exercises, an exercise contains sets
- Add, delete and select on all three levels
- Selecting a session reveals its exercises, selecting an exercise reveals its sets
- Data is saved through the API, so sessions survive a page reload
- Rest timer with 60, 90 and 120 second presets and a stop button

## Project structure

```
workout-tracker-react/
├── client/   React frontend (Vite)
└── server/   Express API (Node, Express 5, ES modules)
```

- `client/` contains the React app. `App.jsx` holds the sessions state, loads it from the API with `GET /sessions` on mount and calls a dedicated route for every action (adding or deleting a session, exercise or set).
- `server/` contains `server.js`, a small Express API that stores sessions, exercises and sets in a SQLite database (`workout.db`) using better-sqlite3.

Frontend and server are separate projects with their own `package.json` and have to run at the same time.

## Tech stack

### Frontend

- React
- Vite
- Plain CSS

### Backend

- Node.js
- Express 5 (ES modules)
- cors
- SQLite with better-sqlite3

## How it works

- On startup the client fetches all sessions with `GET /sessions`
- Every handler in the client (adding or deleting a session, exercise or set) calls its own route and updates the React state once the server has answered
- When adding something, the client sends only the new values (`type`, `name` or `weight` and `reps`). The server assigns the `id` (and the `date` for sessions) and responds with the new object, which the client inserts into the state
- When deleting something, the server responds with `204 No Content` and the client removes the item from the state
- If the server answers with an error status, the client checks `response.ok`, shows the server's error message with `alert` and leaves the state unchanged. This applies to adding a session, exercise or set and to deleting an exercise or set. Deleting a session always gets a `204`, so that handler does not check the response
- The server writes every `POST` and `DELETE` directly to the SQLite database and reads the sessions from it on every `GET /sessions`, so nothing is kept in memory between requests

## API

The server runs on `http://localhost:3000`.

| Method | Route                                                    | Body                | Description                                                                  | Errors     |
| ------ | -------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------- | ---------- |
| GET    | `/`                                                      |                     | Returns a short text to check that the server is running                     |            |
| GET    | `/sessions`                                              |                     | Returns all sessions as a JSON array                                         |            |
| POST   | `/sessions`                                              | `{ type }`          | Creates a session, the server assigns `id` and `date`, returns the new session | `400`      |
| DELETE | `/sessions/:id`                                          |                     | Deletes a session, always responds with `204`                                |            |
| POST   | `/sessions/:sessionId/exercises`                         | `{ name }`          | Creates an exercise in the session, returns the new exercise                 | `400`, `404` |
| DELETE | `/sessions/:sessionId/exercises/:exerciseId`             |                     | Deletes an exercise, responds with `204`                                     | `404`      |
| POST   | `/sessions/:sessionId/exercises/:exerciseId/sets`        | `{ weight, reps }`  | Creates a set in the exercise, returns the new set                           | `400`, `404` |
| DELETE | `/sessions/:sessionId/exercises/:exerciseId/sets/:setId` |                     | Deletes a set, responds with `204`                                           | `404`      |

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

The data is stored in a SQLite database in `server/workout.db`. The server uses better-sqlite3 to access it. The file and the tables are created automatically on the first server start (`CREATE TABLE IF NOT EXISTS`), and `workout.db` is listed in `.gitignore`, so it is not committed. The server opens the file relative to its working directory, so start it from inside the `server` folder.

The database has three tables:

| Table       | Columns                               |
| ----------- | ------------------------------------- |
| `sessions`  | `id`, `type`, `date`                  |
| `exercises` | `id`, `session_id`, `name`            |
| `sets`      | `id`, `exercise_id`, `weight`, `reps` |

- `exercises.session_id` references `sessions.id` and `sets.exercise_id` references `exercises.id`. Both are foreign keys with `ON DELETE CASCADE`, so deleting a session also deletes its exercises, and deleting an exercise also deletes its sets
- `id` values are assigned by SQLite (`INTEGER PRIMARY KEY`). After an `INSERT` the server reads the new `id` from `lastInsertRowid` and returns it in the response
- `date` is the day the session was created in `YYYY-MM-DD` format
- `weight` is stored as `REAL` and `reps` as `INTEGER`. The server converts them with `Number()` before saving
- All queries are prepared statements with `?` placeholders, so values from the request are never inserted into the SQL string directly

`GET /sessions` reads the three tables and puts the nested structure back together: for every session it loads the exercises with that `session_id`, and for every exercise the sets with that `exercise_id`. The response looks like this:

```json
[
  {
    "id": 1,
    "type": "Push",
    "date": "2026-09-29",
    "exercises": [
      {
        "id": 1,
        "session_id": 1,
        "name": "Bench Press",
        "sets": [
          { "id": 1, "exercise_id": 1, "weight": 80, "reps": 8 }
        ]
      }
    ]
  }
]
```

Because the rows are read with `SELECT *`, exercises and sets in this response also contain their foreign key (`session_id` or `exercise_id`). The `POST` routes return the new object without it. The client does not use these fields.

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
- Foreign keys with `ON DELETE CASCADE`, so related rows are deleted automatically
- Putting nested data from several tables back together for a single API response

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

Start the frontend (port 5173) in a second terminal:

```bash
cd client
npm run dev
```

Vite prints the local URL, by default `http://localhost:5173`. The client expects the API at `http://localhost:3000`.
