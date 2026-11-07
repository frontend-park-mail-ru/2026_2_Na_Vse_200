import type { Child, Props, StateSetter } from './types.js'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
let rootElement: Child = null
let rootContainer: HTMLElement | null = null
const hooksByPath = new Map<string, unknown[]>()
const componentOutputByPath = new Map<string, Child>()
const domByPath = new Map<string, Node>()
let currentPath = ''
let currentHookIndex = 0

/** Reconcile one root, preserving keyed DOM nodes and component state. Null unmounts it. */
export function render(element: Child, container: HTMLElement): void {
    const previousRootElement = rootElement
    rootElement = element
    rootContainer = container
    reconcile(element, domByPath.get('0') ?? container.firstChild, '0', previousRootElement, container)
}

/** Call hooks in the same order inside a mounted component. Initial functions are stored as values. */
export function useState<T>(initialValue: T): [T, StateSetter<T>] {
    const path = currentPath
    const hookIndex = currentHookIndex++
    const hooks = hooksByPath.get(path) ?? []
    if (!(hookIndex in hooks)) {
        hooks[hookIndex] = initialValue
        hooksByPath.set(path, hooks)
    }
    const setState: StateSetter<T> = nextValue => {
        const latestHooks = hooksByPath.get(path)
        if (!latestHooks || !rootContainer) return
        const previousValue = latestHooks[hookIndex] as T
        latestHooks[hookIndex] =
            typeof nextValue === 'function' ? (nextValue as (previous: T) => T)(previousValue) : nextValue
        render(rootElement, rootContainer)
    }
    return [hooks[hookIndex] as T, setState]
}

function reconcile(
    element: Child | undefined,
    dom: Node | null | undefined,
    path: string,
    previousElement: Child | undefined,
    parentDom: Node,
): Node | null {
    if (element === null || element === undefined) {
        if (dom) parentDom.removeChild(dom)
        clearPath(path)
        return null
    }
    if (typeof element.type === 'function' && previousElement && previousElement.type !== element.type) {
        if (dom) parentDom.removeChild(dom)
        clearPath(path)
        dom = null
        previousElement = null
    }
    if (typeof element.type === 'function') {
        const previousPath = currentPath
        const previousHookIndex = currentHookIndex
        currentPath = path
        currentHookIndex = 0
        const renderedElement = element.type(element.props)
        const result = reconcile(
            renderedElement,
            domByPath.get(`${path}.render`) ?? dom,
            `${path}.render`,
            componentOutputByPath.get(path) ?? null,
            parentDom,
        )
        componentOutputByPath.set(path, renderedElement)
        if (result) domByPath.set(path, result)
        else domByPath.delete(path)
        currentPath = previousPath
        currentHookIndex = previousHookIndex
        return result
    }
    const isText = element.type === 'TEXT_ELEMENT'
    const previousIsText = previousElement?.type === 'TEXT_ELEMENT'
    const sameType = dom && previousElement && element.type === previousElement.type
    if (!dom || (!sameType && !(isText && previousIsText))) {
        const parentElement = parentDom as Element
        const isSvg =
            element.type === 'svg' ||
            (parentElement.namespaceURI === SVG_NAMESPACE && parentElement.localName !== 'foreignObject')
        const replacement = isText
            ? document.createTextNode(String(element.props.nodeValue))
            : isSvg
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
        const text = String(element.props.nodeValue)
        if (dom.nodeValue !== text) dom.nodeValue = text
        return dom
    }
    updateProps(dom as HTMLElement | SVGElement, previousElement?.props ?? { children: [] }, element.props)
    const oldChildren = previousElement?.props.children ?? []
    const newChildren = element.props.children ?? []
    const nextDomChildren: Node[] = []
    const nextChildPaths = new Set<string>()
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
        const oldIndex = oldChildren.findIndex(
            (child, oldChildIndex) => getChildPath(path, child, oldChildIndex) === childPath,
        )
        const oldChild = oldIndex === -1 ? null : oldChildren[oldIndex]
        const nextChildDom = reconcile(newChild, domByPath.get(childPath) ?? null, childPath, oldChild, dom)
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

function getChildPath(parentPath: string, child: Child | undefined, index: number): string {
    if (child?.key !== null && child?.key !== undefined) {
        return `${parentPath}.key:${encodeURIComponent(String(child.key))}`
    }
    return `${parentPath}.index:${index}`
}

function clearPath(path: string): void {
    const prefix = `${path}.`
    for (const entries of [domByPath, hooksByPath, componentOutputByPath]) {
        for (const key of entries.keys()) {
            if (key === path || key.startsWith(prefix)) entries.delete(key)
        }
    }
}

function updateProps(dom: HTMLElement | SVGElement, previousProps: Props, nextProps: Props): void {
    const isSvg = dom.namespaceURI === SVG_NAMESPACE
    const names = new Set([...Object.keys(previousProps), ...Object.keys(nextProps)])
    for (const name of names) {
        if (name === 'children') continue
        const previousValue = previousProps[name]
        const nextValue = nextProps[name]
        const attributeName = name === 'className' ? 'class' : name
        if (previousValue === nextValue) continue
        if (name.startsWith('on') && typeof previousValue === 'function') {
            dom.removeEventListener(name.slice(2).toLowerCase(), previousValue as EventListener)
        }
        if (nextValue === null || nextValue === undefined || nextValue === false) {
            if (name === 'style') dom.removeAttribute('style')
            else if (!isSvg && name in dom && !name.startsWith('aria-') && !name.startsWith('data-')) {
                Reflect.set(dom, name, typeof Reflect.get(dom, name) === 'boolean' ? false : '')
            } else dom.removeAttribute(attributeName)
            continue
        }
        if (name.startsWith('on') && typeof nextValue === 'function') {
            dom.addEventListener(name.slice(2).toLowerCase(), nextValue as EventListener)
        } else if (name === 'style' && typeof nextValue === 'object') {
            for (const styleName of Object.keys(previousValue ?? {})) {
                if (!(styleName in nextValue)) Reflect.set(dom.style, styleName, '')
            }
            Object.assign(dom.style, nextValue)
        } else if (!isSvg && name in dom && !name.startsWith('aria-') && !name.startsWith('data-')) {
            Reflect.set(dom, name, nextValue)
        } else dom.setAttribute(attributeName, nextValue === true ? '' : String(nextValue))
    }
}
