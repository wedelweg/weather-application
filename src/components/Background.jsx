import React from "react";
import "../App.css";

export default function Background({ weather }) {
    let cls = "bg-default";

    if (weather) {
        const main = weather.weather?.[0]?.main.toLowerCase();
        const isDay = new Date().getHours() >= 6 && new Date().getHours() < 20;

        if (main.includes("clear")) cls = isDay ? "bg-clear-day" : "bg-clear-night";
        else if (main.includes("cloud")) cls = "bg-cloudy";
        else if (main.includes("rain")) cls = "bg-rain";
        else if (main.includes("snow")) cls = "bg-snow";
    }

    return <div className={`background ${cls}`} />;
}
