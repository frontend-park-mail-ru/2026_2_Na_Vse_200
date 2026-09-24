"use strict";

import { createElement } from "../../../MyReact/index.js"

const glyphs = {
    home: ["M3 10.8 12 3l9 7.8", "M5.5 9.5v10h13v-10", "M9.5 19.5v-6h5v6"],
    search: ["M10.8 18a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4Z", "m16 16 5 5"],
    library: ["M4 4v16", "M9 4v16", "M14 5v14", "M18 5v14"],
    plus: ["M12 5v14", "M5 12h14"],
    heart: ["M20.8 8.8c0 4.4-8.8 10.2-8.8 10.2S3.2 13.2 3.2 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z"],
    history: ["M3 12a9 9 0 1 0 2.6-6.4L3 8", "M3 3v5h5", "M12 7v5l3.5 2"],
    star: ["m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"],
    sun: ["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z", "M12 2v2", "M12 20v2", "m4.9 4.9 1.4 1.4", "m17.7 17.7 1.4 1.4", "M2 12h2", "M20 12h2", "m4.9 19.1 1.4-1.4", "m17.7 6.3 1.4-1.4"],
    repeat: ["m17 2 4 4-4 4", "M3 11V9a3 3 0 0 1 3-3h15", "m7 22-4-4 4-4", "M21 13v2a3 3 0 0 1-3 3H3"],
    moon: ["M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z"],
    sparkle: ["m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z", "m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"],
    play: ["m8 5 11 7-11 7V5Z"],
    pause: ["M8 5h3v14H8z", "M15 5h3v14h-3z"],
    previous: ["M6 5v14", "m19 5-10 7 10 7V5Z"],
    next: ["M18 5v14", "m5 5 10 7-10 7V5Z"],
    more: ["M5 12h.01", "M12 12h.01", "M19 12h.01"],
    music: ["M9 18V5l12-2v13", "M9 18a3 3 0 1 1-3-3c1.7 0 3 .9 3 2Z", "M21 16a3 3 0 1 1-3-3c1.7 0 3 .9 3 2Z"],
    artist: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M4 21a8 8 0 0 1 16 0"],
    queue: ["M4 6h16", "M4 12h10", "M4 18h10", "m17 15 4 3-4 3"],
    volume: ["M4 10v4h4l5 4V6l-5 4H4Z", "M17 9a5 5 0 0 1 0 6", "M19 5a10 10 0 0 1 0 14"],
    arrowRight: ["M5 12h14", "m13 6 6 6-6 6"],
    arrowUpRight: ["M7 17 17 7", "M8 7h9v9"],
    check: ["m5 12 4 4L19 6"]
}

export function Icon({ name, size = 20, className = "", label }) {
    const paths = glyphs[name] ?? glyphs.sparkle

    return <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden={label ? undefined : "true"}
        aria-label={label}
        role={label ? "img" : undefined}
        focusable="false"
    >
        {paths.map((path, index) => <path d={path} key={`${name}-${index}`} />)}
    </svg>
}