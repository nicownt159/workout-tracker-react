function SetRow({ set, onDelete }) {
    return (
        <div className="set-row">
            <h4 className="set-label">{set.weight} kg x {set.reps}</h4>
            <button className="btn-delete" onClick={(e) => {
                e.stopPropagation();
                onDelete();
            }}>X</button>
        </div>
        
    )
}

export default SetRow;