import React from "react";

/** Маппинг OpenWeather icon/main -> тип нашей анимации */
const mapOWToType = (code, main = "") => {
    const m = (main || "").toLowerCase();
    const c = (code || "").toLowerCase();
    if (c.startsWith("01") && c.endsWith("d")) return "clear-day";
    if (c.startsWith("01") && c.endsWith("n")) return "clear-night";
    if (c.startsWith("02") || c.startsWith("03") || c.startsWith("04") || m === "clouds") return "clouds";
    if (c.startsWith("09") || m === "drizzle") return "drizzle";
    if (c.startsWith("10")) return "rain";
    if (c.startsWith("11") || m === "thunderstorm") return "thunder";
    if (c.startsWith("13") || m === "snow") return "snow";
    if (c.startsWith("50") || ["mist","fog","haze","smoke"].includes(m)) return "mist";
    return "clouds";
};

export default function AnimatedWeatherIcon({ code, main, size = 96, className = "" }) {
    const type = mapOWToType(code, main);

    // ⬇️ добавили "type" как отдельный класс (например, "clear-day")
    const commonProps = {
        className: `awi ${className} ${type} awi-${type}`,
        width: size,
        height: size,
        viewBox: "0 0 100 100",
        role: "img",
        "aria-label": main || type
    };

    // Базовые элементы
    const Sun = () => (
        <g className="sun">
            <circle cx="50" cy="50" r="18" />
            {[...Array(8)].map((_, i) => {
                const angle = (i * 45) * Math.PI / 180;
                const x1 = 50 + Math.cos(angle) * 28;
                const y1 = 50 + Math.sin(angle) * 28;
                const x2 = 50 + Math.cos(angle) * 38;
                const y2 = 50 + Math.sin(angle) * 38;
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
            })}
        </g>
    );

    const Cloud = ({ x = 0, y = 0, scale = 1 }) => (
        <g transform={`translate(${x} ${y}) scale(${scale})`} className="cloud">
            <circle cx="36" cy="54" r="12" />
            <circle cx="48" cy="48" r="16" />
            <circle cx="62" cy="54" r="14" />
            <rect x="30" y="54" width="38" height="10" rx="5" />
        </g>
    );

    const Raindrops = () => (
        <g className="rain">
            <path className="drop d1" d="M40 70 q3 -6 6 0 q-3 6 -6 0z" />
            <path className="drop d2" d="M52 70 q3 -6 6 0 q-3 6 -6 0z" />
            <path className="drop d3" d="M64 70 q3 -6 6 0 q-3 6 -6 0z" />
        </g>
    );

    const Snow = () => (
        <g className="snow">
            <g className="fl fl1"><circle cx="46" cy="72" r="2.5"/></g>
            <g className="fl fl2"><circle cx="56" cy="74" r="2.5"/></g>
            <g className="fl fl3"><circle cx="66" cy="72" r="2.5"/></g>
        </g>
    );

    const Thunder = () => (
        <g className="thunder">
            <polygon points="54,66 48,84 58,84 52,98 70,78 58,78 64,66" />
        </g>
    );

    const Stars = () => (
        <g className="stars">
            <circle className="st s1" cx="25" cy="30" r="1.6" />
            <circle className="st s2" cx="35" cy="22" r="1.2" />
            <circle className="st s3" cx="20" cy="20" r="1" />
        </g>
    );

    const Moon = () => (
        <g className="moon">
            <circle cx="30" cy="30" r="12" />
            <circle cx="35" cy="27" r="12" fill="var(--bg2, #1f3a5a)" />
        </g>
    );

    const Mist = () => (
        <g className="mist">
            <rect x="32" y="66" width="48" height="3" rx="2"/>
            <rect x="26" y="72" width="52" height="3" rx="2"/>
            <rect x="34" y="78" width="46" height="3" rx="2"/>
        </g>
    );

    // Разные сцены
    const renderByType = () => {
        switch (type) {
            case "clear-day":   return <Sun />;
            case "clear-night": return (<><Moon /><Stars /></>);
            case "clouds":      return (<><Cloud x={-4} y={-6} scale={1.05} /><Cloud x={8} y={0} scale={0.85} /></>);
            case "drizzle":     return (<><Cloud x={-6} y={-6} scale={1.05} /><Raindrops /></>);
            case "rain":        return (<><Cloud x={-6} y={-6} scale={1.05} /><Raindrops /></>);
            case "snow":        return (<><Cloud x={-6} y={-6} scale={1.05} /><Snow /></>);
            case "thunder":     return (<><Cloud x={-6} y={-6} scale={1.05} /><Thunder /></>);
            case "mist":        return (<><Cloud x={-6} y={-6} scale={1.05} /><Mist /></>);
            default:            return <Cloud />;
        }
    };

    return <svg {...commonProps}>{renderByType()}</svg>;
}
