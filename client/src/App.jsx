import { useState, useEffect } from 'react';
import SessionCard from './SessionCard';
import RestTimer from './RestTimer';

function App() {
  const [sessions, setSessions] = useState([])

  const [typeInput, setTypeInput] = useState("");

  const [currentSessionId, setCurrentSessionId] = useState(null);

  const [currentExerciseId, setCurrentExerciseId] = useState(null);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadSessions() {
      const response = await fetch("http://localhost:3000/sessions");
      const data = await response.json();

      setSessions(data);
      setIsLoaded(true);
    }
    loadSessions();
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    async function saveSessions() {
      await fetch("http://localhost:3000/sessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessions)
      });
    }
    saveSessions();
  }, [sessions, isLoaded]);

  async function handleAddSession() {
    if (typeInput.trim() === "") {
      return
    }
    const response = await fetch("http://localhost:3000/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({type: typeInput})
    });
    const newSession = await response.json()
    setSessions([...sessions, newSession]);
    setTypeInput("");
  }

  async function handleDeleteSession(id) {
    await fetch(`http://localhost:3000/sessions/${id}`, {
      method: "DELETE"
    })
    setSessions(sessions.filter(s => s.id !== id));
  }

  function handleSelectSession(id) {
    setCurrentSessionId(id)
  }

  async function handleAddExercise(sessionId, name) {
    const response = await fetch(`http://localhost:3000/sessions/${sessionId}/exercises`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name })
    })
    const newExercise = await response.json();
    setSessions(sessions.map(session =>
      session.id === sessionId
        ? {...session, exercises: [...session.exercises, newExercise] }
        : session
    ));
  }

  async function handleDeleteExercise(sessionId, exerciseId) {
    await fetch(`http://localhost:3000/sessions/${sessionId}/exercises/${exerciseId}`, {
      method: "DELETE"
    });
    const targetSession = sessions.find(s => s.id === sessionId);
    const remainingExercises = targetSession.exercises.filter(exercise => exercise.id !== exerciseId)
    setSessions(sessions.map(session => 
      session.id === sessionId
      ? {...session, exercises: remainingExercises}
      : session
    ))
  }

  function handleSelectExercise(id) {
    setCurrentExerciseId(id);
  }

  function handleAddSet(exerciseId, weight, reps) {
    const targetSession = sessions.find(s => s.id === currentSessionId);
    const newSet = { id: Date.now(), weight, reps};
    const updatedExercises = targetSession.exercises.map(exercise =>
      exercise.id === exerciseId
        ? { ...exercise, sets: [...exercise.sets, newSet] }
        : exercise
    )
    setSessions(sessions.map(s =>
      s.id === currentSessionId
      ? {...s, exercises: updatedExercises}
      : s
    ))
  }

  function handleDeleteSet(exerciseId, setId) {
    const targetSession = sessions.find(s => s.id === currentSessionId);
    const updatedExercises = targetSession.exercises.map(e => 
      e.id === exerciseId
       ? {...e,sets: e.sets.filter(set => set.id !== setId)}
       : e
    )
    setSessions(sessions.map(s =>
      s.id === currentSessionId
      ? {...s, exercises: updatedExercises}
      : s
    ))
  }

  return (
    <>
      <h1>Workout Tracker</h1>
      {sessions.map(session => (
        <SessionCard 
          key={session.id}
          session={session}
          isActive={session.id === currentSessionId}
          onDelete={handleDeleteSession}
          onSelect={handleSelectSession}
          onAddExercise={handleAddExercise}
          onDeleteExercise={handleDeleteExercise}
          onSelectExercise={handleSelectExercise}
          currentExerciseId={currentExerciseId}
          onAddSet={handleAddSet}
          onDeleteSet={handleDeleteSet}
        />
      ))}
      <input className="field" placeholder="Session type" value={typeInput} onChange={e => setTypeInput(e.target.value)} />
      <button className="btn btn-add" onClick={handleAddSession}>Add Session</button>
      <RestTimer />
    </>
  )
}

export default App
