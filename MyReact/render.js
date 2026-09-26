"use strict";

let rootElement = null
let rootContainer = null
let hooksByPath = new Map()
let componentOutputByPath = new Map()
let domByPath = new Map()
let currentPath = ""
let currentHookIndex = 0
const SVG_NAMESPACE = "http://www.w3.org/2000/svg"

export function render(element, container) {
    const previousRootElement = rootElement
    rootElement = element
    rootContainer = container
    reconcile(
        element,
        domByPath.get("0") ?? container.firstChild,
        "0",
        previousRootElement,
        container
    )
}

export function useState(initialValue) {
    const path = currentPath
    const hookIndex = currentHookIndex++
    const hooks = hooksByPath.get(path) ?? []

    if (!(hookIndex in hooks)) {
        hooks[hookIndex] = initialValue
        hooksByPath.set(path, hooks)
    }

    const setState = (nextValue) => {
        const latestHooks = hooksByPath.get(path)
        const previousValue = latestHooks[hookIndex]
        latestHooks[hookIndex] = typeof nextValue === "function"
            ? nextValue(previousValue)
            : nextValue

        render(rootElement, rootContainer)
    }

    return [hooks[hookIndex], setState]
}

function reconcile(element, dom, path, previousElement, parentDom) {
    if (element === null || element === undefined) {
        if (dom) parentDom.removeChild(dom)
        clearPath(path)
        return null
    }

    if (
        typeof element.type === "function" &&
        previousElement &&
        previousElement.type !== element.type
    ) {
        if (dom) parentDom.removeChild(dom)
        clearPath(path)
        dom = null
        previousElement = null
    }

    if (typeof element.type === "function") {
        const previousPath = currentPath
        const previousHookIndex = currentHookIndex
        currentPath = path
        currentHookIndex = 0

        const renderedElement = element.type(element.props)
        const previousRenderedElement = componentOutputByPath.get(path) ?? null
        const result = reconcile(
            renderedElement,
            domByPath.get(`${path}.render`) ?? dom,
            `${path}.render`,
            previousRenderedElement,
            parentDom
        )

        componentOutputByPath.set(path, renderedElement)
        if (result) domByPath.set(path, result)
        else domByPath.delete(path)
        currentPath = previousPath
        currentHookIndex = previousHookIndex
        return result
    }

    const isText = element.type === "TEXT_ELEMENT"
    const previousIsText = previousElement?.type === "TEXT_ELEMENT"
    const sameType = dom && previousElement && element.type === previousElement.type

    if (!dom || (!sameType && !(isText && previousIsText))) {
        const isSvgElement = element.type === "svg" || parentDom.namespaceURI === SVG_NAMESPACE
        const replacement = isText
            ? document.createTextNode(element.props.nodeValue)
            : isSvgElement
                ? document.createElementNS(SVG_NAMESPACE, element.type)
                : document.createElement(element.type)
        if (dom) parentDom.replaceChild(replacement, dom)
        else parentDom.appendChild(replacement)
        clearPath(path)
        dom = replacement
        previousElement = null
    }

    domByPath.set(path, dom)

    if (isText) {
        if (dom.nodeValue !== element.props.nodeValue) {
            dom.nodeValue = element.props.nodeValue
        }
        return dom
    }

    updateProps(dom, previousElement?.props ?? {}, element.props)

    const oldChildren = previousElement?.props.children ?? []
    const newChildren = element.props.children ?? []
    const nextDomChildren = []
    const nextChildPaths = new Set()

    for (let index = 0; index < newChildren.length; index++) {
        nextChildPaths.add(getChildPath(path, newChildren[index], index))
    }

    for (let index = 0; index < oldChildren.length; index++) {
        const oldChildPath = getChildPath(path, oldChildren[index], index)
        if (!nextChildPaths.has(oldChildPath)) {
            reconcile(null, domByPath.get(oldChildPath) ?? null, oldChildPath, oldChildren[index], dom)
        }
    }

    for (let index = 0; index < newChildren.length; index++) {
        const newChild = newChildren[index] ?? null
        const childPath = getChildPath(path, newChild, index)
        const oldIndex = oldChildren.findIndex((child, oldChildIndex) => (
            getChildPath(path, child, oldChildIndex) === childPath
        ))
        const oldChild = oldIndex === -1 ? null : oldChildren[oldIndex]
        const childDom = domByPath.get(childPath) ?? null
        const nextChildDom = reconcile(newChild, childDom, childPath, oldChild, dom)
        if (nextChildDom) nextDomChildren.push(nextChildDom)
    }

    nextDomChildren.forEach((childDom, index) => {
        const currentAtIndex = dom.childNodes[index] ?? null
        if (currentAtIndex !== childDom) dom.insertBefore(childDom, currentAtIndex)
    })

    for (const child of Array.from(dom.childNodes)) {
        if (!nextDomChildren.includes(child)) dom.removeChild(child)
    }

    return dom
}

function getChildPath(parentPath, child, index) {
    if (child?.key !== null && child?.key !== undefined) {
        return `${parentPath}.key:${encodeURIComponent(String(child.key))}`
    }
    return `${parentPath}.index:${index}`
}

function clearPath(path) {
    const prefix = `${path}.`
    for (const key of domByPath.keys()) {
        if (key === path || key.startsWith(prefix)) domByPath.delete(key)
    }
    for (const key of hooksByPath.keys()) {
        if (key === path || key.startsWith(prefix)) hooksByPath.delete(key)
    }
    for (const key of componentOutputByPath.keys()) {
        if (key === path || key.startsWith(prefix)) componentOutputByPath.delete(key)
    }
}

function updateProps(dom, previousProps, nextProps) {
    const isSvgElement = dom.namespaceURI === SVG_NAMESPACE
    const names = new Set([
        ...Object.keys(previousProps),
        ...Object.keys(nextProps)
    ])

    for (const name of names) {
        if (name === "children") continue

        const previousValue = previousProps[name]
        const nextValue = nextProps[name]

        if (previousValue === nextValue) continue

        if (name.startsWith("on") && typeof previousValue === "function") {
            dom.removeEventListener(name.slice(2).toLowerCase(), previousValue)
        }

        if (nextValue === null || nextValue === undefined || nextValue === false) {
            if (name === "style") dom.removeAttribute("style")
            else if (name === "className") dom.removeAttribute("class")
            else if (!isSvgElement && name in dom && !name.startsWith("aria-") && !name.startsWith("data-")) {
                dom[name] = typeof dom[name] === "boolean" ? false : ""
            } else {
                dom.removeAttribute(name === "className" ? "class" : name)
            }
            continue
        }

        if (name.startsWith("on") && typeof nextValue === "function") {
            dom.addEventListener(name.slice(2).toLowerCase(), nextValue)
        } else if (name === "style" && typeof nextValue === "object") {
            for (const styleName of Object.keys(previousValue ?? {})) {
                if (!(styleName in nextValue)) dom.style[styleName] = ""
            }
            Object.assign(dom.style, nextValue)
        } else if (!isSvgElement && name in dom && !name.startsWith("aria-") && !name.startsWith("data-")) {
            dom[name] = nextValue
        } else {
            dom.setAttribute(name === "className" ? "class" : name, nextValue === true ? "" : nextValue)
        }
    }
}
