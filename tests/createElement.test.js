"use strict";

import test from "node:test"
import assert from "node:assert/strict"
import { createElement } from "../MyReact/createElement.js"

test("createElement keeps key outside DOM props", () => {
    const element = createElement("li", { key: "task-1", className: "task" }, "Learn")

    assert.equal(element.key, "task-1")
    assert.equal(element.props.key, undefined)
    assert.equal(element.props.className, "task")
    assert.equal(element.props.children[0].props.nodeValue, "Learn")
})

test("createElement flattens nested children and ignores empty values", () => {
    const element = createElement("div", null, ["one", ["two", false, null]], "three")

    assert.deepEqual(
        element.props.children.map(child => child?.props.nodeValue ?? null),
        ["one", "two", null, null, "three"]
    )
})

test("createElement accepts function components and their props", () => {
    function Greeting() {}
    const element = createElement(Greeting, { name: "Ada" })

    assert.equal(element.type, Greeting)
    assert.equal(element.props.name, "Ada")
    assert.deepEqual(element.props.children, [])
})
