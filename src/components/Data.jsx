import React, { useRef, useState } from "react";
import ForecastHours from "./ForecastHours.jsx";
import ForecastWeek from "./ForecastWeek.jsx";
import AnimatedWeatherIcon from "./AnimatedWeatherIcon.jsx";

const API_KEY = import.meta.env.VITE_OW_KEY;

// --- helpers ---
const hPaToMm = (hpa) => Math.round(hpa * 0.75006);
const mToKm = (m) => (m / 1000).toFixed(0);

/** Получить дату с учётом tz (секунды) */
const localDate = (unix, tz = 0) => {
    // unix в секундах; tz в секундах; Date() ожидает мс
    const utc = unix * 1000;
    return new Date(utc + tz * 1000);
};

export default function Data({ onWeatherChange }) {
    const [city, setCity] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [weather, setWeather] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [error, setError] = useState("");

    const typingTimer = useRef(null);
    const suggestCache = useRef({});
    const SUGGEST_TTL = 120_000;

    // --- API calls ---
    const fetchWeatherByCoords = async (lat, lon) => {
        try {
            setError("");
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=ru&appid=${API_KEY}`;
            const r = await fetch(url);
            if (!r.ok) throw new Error("Ошибка запроса погоды");
            const w = await r.json();
            setWeather(w);
            onWeatherChange?.(w);
            await fetchForecast(lat, lon);
        } catch (e) {
            setError(e.message);
        }
    };

    const fetchWeatherByCity = async (q) => {
        try {
            setError("");
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
                q
            )}&units=metric&lang=ru&appid=${API_KEY}`;
            const r = await fetch(url);
            if (!r.ok) throw new Error("Город не найден");
            const w = await r.json();
            setWeather(w);
            onWeatherChange?.(w);
            await fetchForecast(w.coord.lat, w.coord.lon);
        } catch (e) {
            setError(e.message);
        }
    };

    const fetchForecast = async (lat, lon) => {
        try {
            const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=ru&appid=${API_KEY}`;
            const r = await fetch(url);
            if (!r.ok) throw new Error("Ошибка прогноза");
            setForecast(await r.json());
        } catch (e) {
            setError(e.message);
        }
    };

    // --- Autocomplete ---
    const loadSuggestions = async (q) => {
        const key = q.toLowerCase().trim();
        if (key.length < 2) {
            setSuggestions([]);
            return;
        }

        const cached = suggestCache.current[key];
        const now = Date.now();
        if (cached && now - cached.ts < SUGGEST_TTL) {
            setSuggestions(cached.data);
            return;
        }

        try {
            const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
                q
            )}&limit=5&appid=${API_KEY}`;
            const r = await fetch(url);
            if (!r.ok) throw new Error();
            const data = await r.json();

            const cleaned = data.map((it) => ({
                display: `${it.local_names?.ru || it.name}${
                    it.state ? ", " + it.state : ""
                }, ${it.country}`,
                lat: it.lat,
                lon: it.lon,
            }));

            setSuggestions(cleaned);
            suggestCache.current[key] = { ts: now, data: cleaned };
        } catch {
            /* silence */
        }
    };

    // --- handlers ---
    const onChange = (e) => {
        const val = e.target.value;
        setCity(val);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => loadSuggestions(val), 250);
    };

    const onSubmit = (e) => {
        e.preventDefault();
        if (city.trim()) fetchWeatherByCity(city.trim());
    };

    const selectSuggestion = (s) => {
        setCity(s.display);
        setSuggestions([]);
        fetchWeatherByCoords(s.lat, s.lon);
    };

    // --- render ---
    const tz = forecast?.city?.timezone ?? 0;
    const sunrise =
        weather && localDate(weather.sys.sunrise, weather.timezone).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const sunset =
        weather && localDate(weather.sys.sunset, weather.timezone).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

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
                <div className="currentPanel">
                    <div className="cp-left">
                        <AnimatedWeatherIcon
                            code={weather.weather?.[0]?.icon}
                            main={weather.weather?.[0]?.main}
                            size={128}
                            className="cp-icon"
                        />
                    </div>

                    <div className="cp-center">
                        <h2 className="cp-city">
                            {weather.name}, {weather.sys?.country}
                        </h2>
                        <div className="cp-temp">{Math.round(weather.main.temp)}°C</div>
                        <div className="cp-desc">{weather.weather?.[0]?.description}</div>
                        <div className="cp-updated">
                            Обновлено:{" "}
                            {new Date().toLocaleTimeString("ru-RU", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </div>
                    </div>

                    <div className="cp-right">
                        <div className="cp-grid">
                            <div className="cp-item">
                                <span className="cp-label">Ощущается</span>
                                <span className="cp-val">{Math.round(weather.main.feels_like)}°C</span>
                            </div>
                            <div className="cp-item">
                                <span className="cp-label">Влажность</span>
                                <span className="cp-val">{weather.main.humidity}%</span>
                            </div>
                            <div className="cp-item">
                                <span className="cp-label">Давление</span>
                                <span className="cp-val">{hPaToMm(weather.main.pressure)} мм</span>
                            </div>
                            <div className="cp-item">
                                <span className="cp-label">Ветер</span>
                                <span className="cp-val">{weather.wind?.speed?.toFixed(1)} м/с</span>
                            </div>
                            <div className="cp-item">
                                <span className="cp-label">Облачность</span>
                                <span className="cp-val">{weather.clouds?.all ?? 0}%</span>
                            </div>
                            <div className="cp-item">
                                <span className="cp-label">Видимость</span>
                                <span className="cp-val">{mToKm(weather.visibility ?? 0)} км</span>
                            </div>
                            <div className="cp-item">
                                <span className="cp-label">Восход</span>
                                <span className="cp-val">{sunrise}</span>
                            </div>
                            <div className="cp-item">
                                <span className="cp-label">Закат</span>
                                <span className="cp-val">{sunset}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {forecast && (
                <>
                    <ForecastHours list={forecast.list} timezone={tz} />
                    <ForecastWeek list={forecast.list} timezone={tz} />
                </>
            )}
        </>
    );
}
