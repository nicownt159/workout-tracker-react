import express from "express";
import { createClient } from "@libsql/client";
import path from "path";

const app = express();
const db = createClient({
    url: process.env.TURSO_DATABASE_URL || `file:${path.join(import.meta.dirname, "workout.db")}`,
    authToken: process.env.TURSO_AUTH_TOKEN
});

await db.execute(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL,
    date TEXT NOT NULL
  )
`);

await db.execute(`
  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL
  )
`);

await db.execute(`
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

app.post("/sessions", async (req, res) => {
    if (typeof req.body.type !== "string" || req.body.type.trim() === "") {
        return res.status(400).json({ error: "Type is required" });
    }
    const date = new Date().toISOString().slice(0, 10);
    const result = await db.execute({
        sql: "INSERT INTO sessions (type, date) VALUES (?, ?)",
        args: [req.body.type, date]
    });
    const newSession = {
        id: Number(result.lastInsertRowid),
        type: req.body.type,
        date,
        exercises: []
    }
    res.json(newSession);
});

app.delete("/sessions/:id", async (req, res) => {
    const id = Number(req.params.id);
    await db.batch([
        { sql: "DELETE FROM sets WHERE exercise_id IN (SELECT id FROM exercises WHERE session_id = ?)", args: [id] },
        { sql: "DELETE FROM exercises WHERE session_id = ?", args: [id] },
        { sql: "DELETE FROM sessions WHERE id = ?", args: [id] }
    ]);
    res.sendStatus(204);
});

app.post("/sessions/:sessionId/exercises", async (req, res) => {
    const sessionId = Number(req.params.sessionId);
    const sessionResult = await db.execute({
        sql: "SELECT * FROM sessions WHERE id = ?",
        args: [sessionId]
    });
    const session = sessionResult.rows[0];
    if (!session) {
        return res.status(404).json({ error: "Session not found" });
    }
    if (typeof req.body.name !== "string" || req.body.name.trim() === "") {
        return res.status(400).json({ error: "Name is required" });
    }
    const result = await db.execute({
        sql: "INSERT INTO exercises (session_id, name) VALUES (?, ?)",
        args: [sessionId, req.body.name]
    });
    const newExercise = {
        id: Number(result.lastInsertRowid),
        name: req.body.name,
        sets: []
    };
    res.json(newExercise);
});

app.delete("/sessions/:sessionId/exercises/:exerciseId", async (req, res) => {
    const sessionId = Number(req.params.sessionId);
    const sessionResult = await db.execute({
        sql: "SELECT * FROM sessions WHERE id = ?",
        args: [sessionId]
    });
    const session = sessionResult.rows[0];
    if (!session) {
        return res.status(404).json({ error: "Session not found" });
    }
    const exerciseId = Number(req.params.exerciseId);
    await db.batch([
        { sql: "DELETE FROM sets WHERE exercise_id IN (SELECT id FROM exercises WHERE id = ? AND session_id = ?)", args: [exerciseId, sessionId] },
        { sql: "DELETE FROM exercises WHERE id = ? AND session_id = ?", args: [exerciseId, sessionId] }
    ]);
    res.sendStatus(204);
});

app.post("/sessions/:sessionId/exercises/:exerciseId/sets", async (req, res) => {
    const sessionId = Number(req.params.sessionId);
    const sessionResult = await db.execute({
        sql: "SELECT * FROM sessions WHERE id = ?",
        args: [sessionId]
    });
    const session = sessionResult.rows[0];
    if (!session) {
        return res.status(404).json({ error: "Session not found" });
    }
    const exerciseId = Number(req.params.exerciseId);
    const exerciseResult = await db.execute({
        sql: "SELECT * FROM exercises WHERE id = ? AND session_id = ?",
        args: [exerciseId, sessionId]
    });
    const exercise = exerciseResult.rows[0];
    if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" });
    }
    const weight = Number(req.body.weight);
    const reps = Number(req.body.reps);
    if (Number.isNaN(weight) || weight <= 0) {
        return res.status(400).json({ error: "Weight must be a positive number" });
    }
    if (!Number.isInteger(reps) || reps <= 0) {
        return res.status(400).json({ error: "Reps must be a positive whole number" });
    }
    const result = await db.execute({
        sql: "INSERT INTO sets (exercise_id, weight, reps) VALUES (?, ?, ?)",
        args: [exerciseId, weight, reps]
    });
    const newSet = {
        id: Number(result.lastInsertRowid),
        weight,
        reps
    };
    res.json(newSet);
});

app.delete("/sessions/:sessionId/exercises/:exerciseId/sets/:setId", async (req, res) => {
    const sessionId = Number(req.params.sessionId);
    const sessionResult = await db.execute({
        sql: "SELECT * FROM sessions WHERE id = ?",
        args: [sessionId]
    });
    const session = sessionResult.rows[0];
    if (!session) {
        return res.status(404).json({ error: "Session not found" });
    }
    const exerciseId = Number(req.params.exerciseId);
    const exerciseResult = await db.execute({
        sql: "SELECT * FROM exercises WHERE id = ? AND session_id = ?",
        args: [exerciseId, sessionId]
    });
    const exercise = exerciseResult.rows[0];
    if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" });
    }
    const setId = Number(req.params.setId);
    await db.execute({
        sql: "DELETE FROM sets WHERE id = ? AND exercise_id = ?",
        args: [setId, exerciseId]
    });
    res.sendStatus(204);
});

app.get("/sessions", async (req, res) => {
    const sessionResult = await db.execute("SELECT * FROM sessions");
    const exerciseResult = await db.execute("SELECT * FROM exercises");
    const setResult = await db.execute("SELECT * FROM sets");
    const fullSessions = sessionResult.rows.map(session => ({
        id: session.id,
        type: session.type,
        date: session.date,
        exercises: exerciseResult.rows
            .filter(exercise => exercise.session_id === session.id)
            .map(exercise => ({
                id: exercise.id,
                name: exercise.name,
                sets: setResult.rows
                    .filter(set => set.exercise_id === exercise.id)
                    .map(set => ({ id: set.id, weight: set.weight, reps: set.reps }))
            }))
    }));
    res.json(fullSessions);
});

app.listen(PORT, () => {
    console.log(`Server running on localhost:${PORT}`);
});