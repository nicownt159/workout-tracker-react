import ExerciseCard from './ExerciseCard';
import { useState } from 'react';



function SessionCard({ session, isActive, onDelete, onSelect ,onAddExercise, onDeleteExercise, onSelectExercise, currentExerciseId, onAddSet, onDeleteSet }) {
    const [exerciseInput, setExerciseInput] = useState("");

    function handleAddExercise() {
        if (exerciseInput.trim() === "") {
            return
        }
        onAddExercise(session.id, exerciseInput)
        setExerciseInput("");
    }

    return (
        <div className={isActive ? "session-card active" : "session-card"} onClick={() => onSelect(session.id)}>
            <h3 className="card-title">{session.type} - {session.date}</h3>
            <button className="btn-delete" onClick={(e) => {
                e.stopPropagation();
                onDelete(session.id);
                }}>X</button>
            {isActive && (
                <>
                    <h3 className="section-title">Exercises</h3>
                    {session.exercises.map(exercise => (
                        <ExerciseCard
                            key={exercise.id}
                            exercise={exercise}
                            onDelete={() => onDeleteExercise(session.id, exercise.id)}
                            isActive={exercise.id === currentExerciseId}
                            onSelect={() => onSelectExercise(exercise.id)}
                            onAddSet={onAddSet}
                            onDeleteSet={onDeleteSet}
                        />
                    ))}
                    <input className="field" placeholder="Exercise name" value={exerciseInput} onChange={e => setExerciseInput(e.target.value)} />
                    <button className="btn btn-add" onClick={(e) => {
                        e.stopPropagation();
                        handleAddExercise();
                    }}>Add Exercise</button>
                </>
            )}
        </div>
    )
}

export default SessionCard;