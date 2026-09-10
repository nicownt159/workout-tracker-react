# Workout Tracker

A small workout tracker built with React and Vite, ported from my vanilla JavaScript version to learn React fundamentals.

## Features

- Sessions, exercises and sets in a nested structure: a session contains exercises, an exercise contains sets
- Add, delete and select on all three levels
- Selecting a session reveals its exercises, selecting an exercise reveals its sets
- Data is persisted in localStorage, so sessions survive a page reload
- Rest timer with 60, 90 and 120 second presets and a stop button

## Tech stack

- React
- Vite
- Plain CSS

## What I learned

- Components, props and callback props
- useState and controlled inputs
- Lifting state up
- Immutable updates of nested state
- Event propagation and stopPropagation
- useEffect with cleanup (interval-based timer)
- Lazy state initialization from localStorage

## How to run locally

```bash
npm install
npm run dev
```

Vite prints the local URL, by default `http://localhost:5173`.
