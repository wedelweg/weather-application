import React, { useState } from "react";
import "./App.css";
import Info from "./components/Info.jsx";
import Data from "./components/Data.jsx";
import Background from "./components/Background.jsx";

const App = () => {
    const [weather, setWeather] = useState(null);

    return (
        <div className="wrapper">
            <Background weather={weather} />
            <div className="main">
                <section className="info">
                    <Info />
                </section>
                <section className="form">
                    <Data onWeatherChange={setWeather} />
                </section>
            </div>
        </div>
    );
};

export default App;
