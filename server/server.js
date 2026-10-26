import express from "express";
import Database from "better-sqlite3";
import path from "path";

const app = express();
const db = new Database(process.env.DB_PATH || path.join(import.meta.dirname, "workout.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL,
    date TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL
  )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS sets (
    id INTEGER PRIMARY KEY,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    weight REAL NOT NULL,
    reps INTEGER NOT NULL
    )
`);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(import.meta.dirname, "../client/dist")));

app.post("/sessions", (req, res) => {
    if (typeof req.body.type !== "string" || req.body.type.trim() === "") {
        return res.status(400).json({ error: "Type is required" });
    }
    const date = new Date().toISOString().slice(0, 10);
    const result = db.prepare("INSERT INTO sessions (type, date) VALUES (?, ?)").run(req.body.type, date);
    const newSession = {
        id: result.lastInsertRowid,
        type: req.body.type,
        date,
        exercises: []
    }
    res.json(newSession);
});

app.delete("/sessions/:id", (req, res) => {
    const id = Number(req.params.id);
    db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
    res.sendStatus(204);
});

app.post("/sessions/:sessionId/exercises", (req, res) => {
    const sessionId = Number(req.params.sessionId);
    const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId);
    if (!session) {
        return res.status(404).json({ error: "Session not found" })
    }
    if(typeof req.body.name !== "string" || req.body.name.trim() === "") {
        return res.status(400).json({ error: "Name is required" });
    }
    const result = db.prepare("INSERT INTO exercises (session_id, name) VALUES (?, ?)").run(sessionId, req.body.name)
    const newExercise = {
        id: result.lastInsertRowid,
        name: req.body.name,
        sets: []
    }
    res.json(newExercise);
});

app.delete("/sessions/:sessionId/exercises/:exerciseId", (req, res) => {
    const sessionId = Number(req.params.sessionId);
    const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId);
    if (!session) {
        return res.status(404).json({ error: "Session not found" })
    }
    const exerciseId = Number(req.params.exerciseId);
    db.prepare("DELETE FROM exercises WHERE id = ? AND session_id = ?").run(exerciseId, sessionId);
    res.sendStatus(204)
});

app.post("/sessions/:sessionId/exercises/:exerciseId/sets", (req, res) => {
    const sessionId = Number(req.params.sessionId);
    const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId);
    if (!session) {
        return res.status(404).json({ error: "Session not found" })
    }
    const exerciseId = Number(req.params.exerciseId);
    const exercise = db.prepare("SELECT * FROM exercises WHERE id = ? AND session_id = ?").get(exerciseId, sessionId);
    if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" })
    }
    const weight = Number(req.body.weight);
    const reps = Number(req.body.reps);
    if(Number.isNaN(weight) || weight <= 0) {
        return res.status(400).json({ error: "Weight must be a positive number" });
    }
    if(!Number.isInteger(reps) || reps <= 0) {
        return res.status(400).json({ error: "Reps must be a positive whole number" });
    }
    const result = db.prepare("INSERT INTO sets (exercise_id, weight, reps) VALUES (?, ?, ?)").run(exerciseId, weight, reps);
    const newSet = {
        id: result.lastInsertRowid,
        weight,
        reps
    }
    res.json(newSet);
});

app.delete("/sessions/:sessionId/exercises/:exerciseId/sets/:setId", (req, res) => {
    const sessionId = Number(req.params.sessionId);
    const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId);
    if (!session) {
        return res.status(404).json({ error: "Session not found" })
    }
    const exerciseId = Number(req.params.exerciseId);
    const exercise = db.prepare("SELECT * FROM exercises WHERE id = ? AND session_id = ?").get(exerciseId, sessionId);
    if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" })
    }
    const setId = Number(req.params.setId);
    db.prepare("DELETE FROM sets WHERE id = ? AND exercise_id = ?").run(setId, exerciseId)
    res.sendStatus(204)
})

app.get("/sessions", (req, res) => {
    const sessionRows = db.prepare("SELECT * FROM sessions").all();
    const fullSessions = sessionRows.map(session => ({
        ...session,
        exercises: db.prepare("SELECT * FROM exercises WHERE session_id = ?").all(session.id).map(exercise => ({
            ...exercise,
            sets: db.prepare("SELECT * FROM sets WHERE exercise_id = ?").all(exercise.id)
        }))
    }));
    res.json(fullSessions);
})

app.listen(PORT, () => {
    console.log(`Server running on localhost:${PORT}`);
});