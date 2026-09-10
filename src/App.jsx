import { useState, useEffect } from 'react';
import SessionCard from './SessionCard';
import RestTimer from './RestTimer';

function App() {
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem("sessions");
    if (saved === null) {
      return []
    }
    return JSON.parse(saved);
  })

  const [typeInput, setTypeInput] = useState("");

  const [currentSessionId, setCurrentSessionId] = useState(null);

  const [currentExerciseId, setCurrentExerciseId] = useState(null);

  useEffect(() => {
    localStorage.setItem("sessions", JSON.stringify(sessions));
  }, [sessions]);

  function handleAddSession() {
    if (typeInput.trim() === "") {
      return
    }
    const newSession = {
      id: Date.now(),
      type: typeInput,
      date: new Date().toISOString().slice(0, 10),
      exercises: []
    };
    setSessions([...sessions, newSession]);
    setTypeInput("");
  }

  function handleDeleteSession(id) {
    setSessions(sessions.filter(s => s.id !== id));
  }

  function handleSelectSession(id) {
    setCurrentSessionId(id)
  }

  function handleAddExercise(sessionId, name) {
    const newExercise = { id: Date.now(), name: name, sets: [] };
    setSessions(sessions.map(session =>
      session.id === sessionId
        ? {...session, exercises: [...session.exercises, newExercise] }
        : session
    ));
  }

  function handleDeleteExercise(sessionId, exerciseId) {
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
