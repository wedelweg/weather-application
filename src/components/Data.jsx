// src/components/Data.jsx
import React, { useRef, useState } from "react";

const API_KEY = import.meta.env.VITE_OW_KEY; // ключ в .env → VITE_OW_KEY=...

// конвертеры
const hPaToMm = (hpa) => Math.round(hpa * 0.75006);
const mToKm   = (m)   => (m / 1000).toFixed(0);

export default function Data() {
    const [city, setCity] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [weather, setWeather] = useState(null);
    const [error, setError] = useState("");

    const typingTimer = useRef(null);
    const suggestCache = useRef({}); // {queryLower: {ts, data}}
    const SUGGEST_TTL = 120_000;     // 2 минуты

    // --- запрос погоды по координатам ---
    const fetchWeatherByCoords = async (lat, lon) => {
        try {
            setError("");
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=ru&appid=${API_KEY}`;
            const r = await fetch(url);
            if (!r.ok) throw new Error("Ошибка запроса погоды");
            setWeather(await r.json());
        } catch (e) { setError(e.message); }
    };

    // --- запрос погоды по строке (названию города) ---
    const fetchWeatherByCity = async (q) => {
        try {
            setError("");
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&units=metric&lang=ru&appid=${API_KEY}`;
            const r = await fetch(url);
            if (!r.ok) throw new Error("Город не найден");
            setWeather(await r.json());
        } catch (e) { setError(e.message); }
    };

    // --- подсказки городов ---
    const loadSuggestions = async (q) => {
        const key = q.toLowerCase().trim();
        if (key.length < 2) { setSuggestions([]); return; }

        const cached = suggestCache.current[key];
        const now = Date.now();
        if (cached && now - cached.ts < SUGGEST_TTL) {
            setSuggestions(cached.data);
            return;
        }

        try {
            const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${API_KEY}&lang=ru`;
            const r = await fetch(url);
            if (!r.ok) throw new Error();
            const data = await r.json();

            const cleaned = data.map(it => ({
                display: `${it.local_names?.ru || it.name}${it.state ? ", " + it.state : ""}, ${it.country}`,
                lat: it.lat,
                lon: it.lon,
            }));

            setSuggestions(cleaned);
            suggestCache.current[key] = { ts: now, data: cleaned };
        } catch { /* молча */ }
    };

    const onChange = (e) => {
        const val = e.target.value;
        setCity(val);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => loadSuggestions(val), 300);
    };

    const onSubmit = (e) => {
        e.preventDefault();
        if (city.trim()) fetchWeatherByCity(city.trim());
    };

    const selectSuggestion = (s) => {
        setCity(s.display);     // при выборе вставляем название в input
        setSuggestions([]);     // убираем подсказки
        fetchWeatherByCoords(s.lat, s.lon);
    };

    return (
        <>
            <form className="searchRow" onSubmit={onSubmit}>
                <div className="searchBox">
                    <input
                        type="text"
                        placeholder="Введите город..."
                        value={city}
                        onChange={onChange}
                        aria-label="Город"
                    />
                    {suggestions.length > 0 && (
                        <ul className="citySuggest">
                            {suggestions.map((s, i) => (
                                <li
                                    key={`${s.display}-${i}`}
                                    className="citySuggest__item"
                                    onClick={() => selectSuggestion(s)}
                                >
                                    {s.display}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <button type="submit">Показать</button>
            </form>

            {error && <div className="error">{error}</div>}

            {weather && (
                <div className="weatherCard">
                    <div className="weatherCard__header">
                        <h2>
                            {weather.name}, {weather.sys?.country}
                        </h2>
                        <div className="weatherCard__tempRow">
                            <span className="dot" />
                            <span className="temp">{Math.round(weather.main.temp)}°C</span>
                        </div>
                        <div className="desc">{weather.weather?.[0]?.description}</div>
                    </div>

                    <ul className="stats">
                        <li>Ощущается как: {Math.round(weather.main.feels_like)}°C</li>
                        <li>Влажность: {weather.main.humidity}%</li>
                        <li>Давление: {hPaToMm(weather.main.pressure)} мм рт. ст.</li>
                        <li>Ветер: {weather.wind?.speed?.toFixed(2)} м/с</li>
                        <li>Облачность: {weather.clouds?.all ?? 0}%</li>
                        <li>Видимость: {mToKm(weather.visibility ?? 0)} км</li>
                    </ul>
                </div>
            )}
        </>
    );
}
