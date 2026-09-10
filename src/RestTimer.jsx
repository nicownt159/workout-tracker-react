import { useState, useEffect } from "react";

function RestTimer() {
    const [secondsLeft, setSecondsLeft] = useState(0);
    useEffect(() => {
        if (secondsLeft === 0) {
            return;
        }

        const intervalId = setInterval(() => {
            setSecondsLeft(s => s - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [secondsLeft]);

    return (
        <div className="rest-timer">
            <h3 className="rest-timer-display">{secondsLeft} s</h3>
            <button className="btn btn-preset" onClick={() => setSecondsLeft(60)}>60s</button>
            <button className="btn btn-preset" onClick={() => setSecondsLeft(90)}>90s</button>
            <button className="btn btn-preset" onClick={() => setSecondsLeft(120)}>120s</button>
            <button className="btn btn-stop" onClick={() => setSecondsLeft(0)}>Stop</button>
        </div>
    )
}

export default RestTimer;