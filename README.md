# Workout Tracker

A small workout tracker built with React and Vite, ported from my vanilla JavaScript version to learn React fundamentals. It started out as a pure frontend app and has since grown into a small fullstack project: the React client talks to an Express API that stores the sessions in a JSON file on the server.

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
- `server/` contains `server.js`, a small Express API that keeps the sessions in memory and writes them to `sessions.json`.

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

## How it works

- On startup the client fetches all sessions with `GET /sessions`
- Every handler in the client (adding or deleting a session, exercise or set) calls its own route and updates the React state once the server has answered
- When adding something, the client sends only the new values (`type`, `name` or `weight` and `reps`). The server assigns the `id` (and the `date` for sessions) and responds with the new object, which the client inserts into the state
- When deleting something, the server responds with `204 No Content` and the client removes the item from the state
- If the server answers with an error status, the client checks `response.ok`, shows the server's error message with `alert` and leaves the state unchanged. This applies to adding a session, exercise or set and to deleting an exercise or set. Deleting a session always gets a `204`, so that handler does not check the response
- The server keeps the sessions in memory, writes them to `sessions.json` after every `POST` and `DELETE` and reads that file back in on startup

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

The sessions are stored in `server/sessions.json`. The file is created automatically the first time a session is created, and it is listed in `server/.gitignore`, so it is not committed. The server reads and writes the file relative to its working directory, so start it from inside the `server` folder.

Data structure:

```json
[
  {
    "id": 1700000000000,
    "type": "Push",
    "date": "2026-09-29",
    "exercises": [
      {
        "id": 1700000000001,
        "name": "Bench Press",
        "sets": [
          { "id": 1700000000002, "weight": 80, "reps": 8 }
        ]
      }
    ]
  }
]
```

- `id` values are timestamps from `Date.now()`
- `date` is the day the session was created in `YYYY-MM-DD` format
- `weight` and `reps` are stored as numbers. The server converts them with `Number()` before saving

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
