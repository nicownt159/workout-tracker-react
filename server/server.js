import express from "express";
import fs from "fs";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

app.put("/sessions", (req, res) => {
    sessions = req.body;
    fs.writeFileSync("sessions.json", JSON.stringify(sessions, null, 2));
    res.json(sessions);
})

app.post("/sessions", (req, res) => {
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