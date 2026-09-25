"use strict";

/**
 * JSX factory for the project's own template engine (no React runtime).
 * @param {string|Function} type HTML tag or component.
 * @param {object|null} props Element properties.
 * @param {...*} children Nested elements and text.
 * @returns {object} Virtual element.
 */
export function createElement(type, props, ...children) {
    const { key = null, ...elementProps } = props ?? {}

    return {
        type,
        key,

        props: {
            ...elementProps,

            children: children
                .flat(Infinity)
                .map(normalizeChild)
        }
    }
}

function normalizeChild(child) {
    if (child === null || child === undefined || typeof child === "boolean") {
        return null
    }

    if (
        typeof child === "object" &&
        child !== null
    ) {
        return child
    }

    return createTextElement(child)
}

function createTextElement(text) {
    return {
        type: "TEXT_ELEMENT",

        props: {
            nodeValue: String(text),
            children: []
        }
    }
}
