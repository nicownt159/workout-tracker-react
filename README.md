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
- The server keeps the sessions in memory, writes them to `sessions.json` after every `POST` and `DELETE` and reads that file back in on startup

## API

The server runs on `http://localhost:3000`.

| Method | Route                                                    | Body                | Description                                                                  |
| ------ | -------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------- |
| GET    | `/`                                                      |                     | Returns a short text to check that the server is running                     |
| GET    | `/sessions`                                              |                     | Returns all sessions as a JSON array                                         |
| POST   | `/sessions`                                              | `{ type }`          | Creates a session, the server assigns `id` and `date`, returns the new session |
| DELETE | `/sessions/:id`                                          |                     | Deletes a session, responds with `204`                                       |
| POST   | `/sessions/:sessionId/exercises`                         | `{ name }`          | Creates an exercise in the session, returns the new exercise                 |
| DELETE | `/sessions/:sessionId/exercises/:exerciseId`             |                     | Deletes an exercise, responds with `204`                                     |
| POST   | `/sessions/:sessionId/exercises/:exerciseId/sets`        | `{ weight, reps }`  | Creates a set in the exercise, returns the new set                           |
| DELETE | `/sessions/:sessionId/exercises/:exerciseId/sets/:setId` |                     | Deletes a set, responds with `204`                                           |

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
          { "id": 1700000000002, "weight": "80", "reps": "8" }
        ]
      }
    ]
  }
]
```

- `id` values are timestamps from `Date.now()`
- `date` is the day the session was created in `YYYY-MM-DD` format
- `weight` and `reps` are stored as strings, exactly as typed into the inputs

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
