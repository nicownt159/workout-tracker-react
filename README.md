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

- `client/` contains the React app. `App.jsx` holds the sessions state, loads it from the API on mount and sends it back whenever it changes.
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
- Every change to the sessions state (adding or deleting a session, exercise or set) sends the complete array back with `PUT /sessions`
- The save effect only runs after the initial load has finished (`isLoaded` flag), so the empty initial state never overwrites the stored data
- The server keeps the sessions in memory, writes them to `sessions.json` on every `PUT` and reads that file back in on startup

## API

The server runs on `http://localhost:3000`.

| Method | Route       | Description                                                                 |
| ------ | ----------- | --------------------------------------------------------------------------- |
| GET    | `/`         | Returns a short text to check that the server is running                    |
| GET    | `/sessions` | Returns all sessions as a JSON array                                        |
| PUT    | `/sessions` | Replaces the complete sessions array with the JSON request body and returns it |

## Data storage

The sessions are stored in `server/sessions.json`. The file is created automatically the first time the client saves, and it is listed in `server/.gitignore`, so it is not committed. The server reads and writes the file relative to its working directory, so start it from inside the `server` folder.

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
- Fetching data in useEffect and syncing state back to a server
- Guarding the save effect with a loaded flag so the initial empty state does not overwrite the stored data
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
