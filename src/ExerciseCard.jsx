import { useState } from "react";
import SetRow from "./SetRow";

function ExerciseCard({ exercise, onDelete, isActive, onSelect, onAddSet, onDeleteSet }) {
    const [weightInput, setWeightInput] = useState("");
    const [repInput, setRepInput] = useState("");

    function handleAddSet() {
        if (weightInput.trim() === "") {
            return
        }
        if (repInput.trim() === "") {
            return
        }
        onAddSet(exercise.id, weightInput, repInput)
        setWeightInput("");
        setRepInput("");
    }

    return (
        <div className={isActive ? "exercise-card active" : "exercise-card"} onClick={() => onSelect(exercise.id)}>
            <h4 className="card-title">{exercise.name}</h4>
            <button className="btn-delete" onClick={(e) => {
                e.stopPropagation();
                onDelete();
            }}>X</button>
            {isActive && (
                <>
                    <h3 className="section-title">Sets</h3>
                    {exercise.sets.map(set => (
                        <SetRow
                            key={set.id}
                            set={set}
                            onDelete={() => onDeleteSet(exercise.id, set.id)}
                        />
                    ))}
                    <input className="field" placeholder="Weight (kg)" value={weightInput} onChange={e => setWeightInput(e.target.value)} />
                    <input className="field" placeholder="Reps" value={repInput} onChange={e => setRepInput(e.target.value)} />
                    <button className="btn btn-add" onClick={(e) => {
                        e.stopPropagation();
                        handleAddSet();
                    }}>Add Set</button>
                </>
            )}
        </div>
    )
}

export default ExerciseCard;