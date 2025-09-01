import React from "react";
import AnimatedWeatherIcon from "./AnimatedWeatherIcon.jsx";

/** Возвращает ключ дня YYYY-MM-DD по таймзоне (секунды) */
const dayKey = (dt, tz) => {
    const d = new Date((dt + tz) * 1000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
};

/** Имя дня недели на русском */
const weekdayRU = (dt, tz) =>
    new Date((dt + tz) * 1000).toLocaleDateString("ru-RU", { weekday: "long" });

export default function ForecastWeek({ list, timezone = 0 }) {
    // Группируем прогноз в дни и считаем min/max. Иконку берём ближайшую к полудню.
    const map = {};
    list.forEach((it) => {
        const key = dayKey(it.dt, timezone);
        if (!map[key]) {
            map[key] = {
                items: [],
                min: +Infinity,
                max: -Infinity,
                iconAtNoon: it, // временно
            };
        }
        map[key].items.push(it);
        map[key].min = Math.min(map[key].min, it.main.temp_min ?? it.main.temp);
        map[key].max = Math.max(map[key].max, it.main.temp_max ?? it.main.temp);

        // выбираем запись, ближайшую к 12:00
        const hour = new Date((it.dt + timezone) * 1000).getUTCHours();
        const curHour = new Date((map[key].iconAtNoon.dt + timezone) * 1000).getUTCHours();
        if (Math.abs(hour - 12) < Math.abs(curHour - 12)) {
            map[key].iconAtNoon = it;
        }
    });

    const days = Object.entries(map)
        .slice(0, 7) // максимум неделя
        .map(([k, v]) => ({
            key: k,
            min: Math.round(v.min),
            max: Math.round(v.max),
            icon: v.iconAtNoon.weather[0].icon,
            desc: v.iconAtNoon.weather[0].description,
            dt: v.iconAtNoon.dt,
        }));

    return (
        <section className="section">
            <h3 className="section-title">Прогноз на неделю</h3>
            <div className="days no-scrollbar">
                {days.map((d) => (
                    <div className="day-card" key={d.key} title={d.desc}>
                        <div className="d-name">{weekdayRU(d.dt, timezone)}</div>
                        <AnimatedWeatherIcon
                            code={d.icon}
                            main={d.desc}
                            size={58}
                            className="d-icon"
                        />
                        <div className="d-temps">
                            <span className="t-max">{d.max}°</span>
                            <span className="t-min">{d.min}°</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
