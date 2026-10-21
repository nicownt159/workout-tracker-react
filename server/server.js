import express from "express";
import fs from "fs";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

app.post("/sessions", (req, res) => {
    if (typeof req.body.type !== "string" || req.body.type.trim() === "") {
        return res.status(400).json({ error: "Type is required" });
    }
    const newSession = {
        id: Date.now(),
        type: req.body.type,
        date: new Date().toISOString().slice(0, 10),
        exercises: []
    }
    sessions.push(newSession);
    fs.writeFileSync("sessions.json", JSON.stringify(sessions, null, 2))
    res.json(newSession);
});

app.delete("/sessions/:id", (req, res) => {
    const id = Number(req.params.id);
    sessions = sessions.filter(s => s.id !== id);
    fs.writeFileSync("sessions.json", JSON.stringify(sessions, null, 2))
    res.sendStatus(204);
});

app.post("/sessions/:sessionId/exercises", (req, res) => {
    const sessionId = Number(req.params.sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
        return res.status(404).json({ error: "Session not found" })
    }
    if(typeof req.body.name !== "string" || req.body.name.trim() === "") {
        return res.status(400).json({ error: "Name is required" });
    }
    const newExercise = {
        id: Date.now(),
        name: req.body.name,
        sets: []
    }
    session.exercises.push(newExercise);
    fs.writeFileSync("sessions.json", JSON.stringify(sessions, null, 2));
    res.json(newExercise);
});

app.delete("/sessions/:sessionId/exercises/:exerciseId", (req, res) => {
    const sessionId = Number(req.params.sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
        return res.status(404).json({ error: "Session not found" })
    }
    const exerciseId = Number(req.params.exerciseId);
    session.exercises = session.exercises.filter(e => e.id !== exerciseId);
    fs.writeFileSync("sessions.json", JSON.stringify(sessions, null, 2))
    res.sendStatus(204)
});

app.post("/sessions/:sessionId/exercises/:exerciseId/sets", (req, res) => {
    const sessionId = Number(req.params.sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
        return res.status(404).json({ error: "Session not found" })
    }
    const exerciseId = Number(req.params.exerciseId);
    const exercise = session.exercises.find(e => e.id === exerciseId);
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
    const newSet = {
        id: Date.now(),
        weight,
        reps
    }
    exercise.sets.push(newSet);
    fs.writeFileSync("sessions.json", JSON.stringify(sessions, null, 2));
    res.json(newSet);
});

app.delete("/sessions/:sessionId/exercises/:exerciseId/sets/:setId", (req, res) => {
    const sessionId = Number(req.params.sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
        return res.status(404).json({ error: "Session not found" })
    }
    const exerciseId = Number(req.params.exerciseId);
    const exercise = session.exercises.find(e => e.id === exerciseId);
    if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" })
    }
    const setId = Number(req.params.setId);
    exercise.sets = exercise.sets.filter(set => set.id !== setId);
    fs.writeFileSync("sessions.json", JSON.stringify(sessions, null, 2))
    res.sendStatus(204)
})

let sessions = [];
if (fs.existsSync("sessions.json")) {
    sessions = JSON.parse(fs.readFileSync("sessions.json", "utf8"));
}

app.get("/", (req, res) => {
    res.send("Workout Tracker API");
});

app.get("/sessions", (req, res) => {
    res.json(sessions)
})

app.listen(PORT, () => {
    console.log(`Server running on localhost:${PORT}`);
});