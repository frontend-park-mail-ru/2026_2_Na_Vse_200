const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

let rootElement = null
let rootContainer = null
let hooksByPath = new Map()
let componentOutputByPath = new Map()
let domByPath = new Map()
let currentPath = ''
let currentHookIndex = 0

/**
 * Обновляет DOM по новому дереву, по возможности сохраняя существующие узлы.
 * Движок хранит один корень: его же обновляет setState.
 * @param {object|null} element Виртуальное дерево; null очищает его.
 * @param {HTMLElement} container Корневой контейнер приложения.
 * @returns {void}
 */
export function render(element, container) {
    const previousRootElement = rootElement
    rootElement = element
    rootContainer = container
    reconcile(element, domByPath.get('0') ?? container.firstChild, '0', previousRootElement, container)
}

/**
 * Хранит состояние по пути компонента и порядку вызова хука.
 * Вызывается внутри компонента, каждый раз в одном и том же порядке, без условий.
 * Начальное значение сохраняется как есть; функция-инициализатор не поддерживается.
 * @param {*} initialValue Начальное состояние компонента.
 * @returns {[*, function(*): void]} Значение и setState, который сразу обновляет всё дерево.
 */
export function useState(initialValue) {
    const path = currentPath
    const hookIndex = currentHookIndex++
    const hooks = hooksByPath.get(path) ?? []

    if (!(hookIndex in hooks)) {
        hooks[hookIndex] = initialValue
        hooksByPath.set(path, hooks)
    }

    /**
     * Меняет состояние и запускает отрисовку. Вызывать только пока компонент в дереве.
     * @param {*} nextValue Новое значение или функция от предыдущего значения.
     * @returns {void}
     */
    const setState = nextValue => {
        const latestHooks = hooksByPath.get(path)
        const previousValue = latestHooks[hookIndex]
        latestHooks[hookIndex] = typeof nextValue === 'function' ? nextValue(previousValue) : nextValue

        render(rootElement, rootContainer)
    }

    return [hooks[hookIndex], setState]
}

/**
 * Сравнивает старый и новый элементы: обновляет, заменяет или удаляет DOM-узел.
 * Для компонента сначала получает его дерево, затем рекурсивно обновляет потомков.
 * @param {object|null|undefined} element Новый виртуальный элемент.
 * @param {Node|null|undefined} dom Существующий DOM-узел.
 * @param {string} path Путь в дереве, по которому хранятся DOM-узлы и состояние.
 * @param {object|null|undefined} previousElement Предыдущий виртуальный элемент.
 * @param {Node} parentDom Родитель для вставки, замены и удаления узла.
 * @returns {Node|null} Обновлённый DOM-узел или null после удаления.
 */
function reconcile(element, dom, path, previousElement, parentDom) {
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
        const previousRenderedElement = componentOutputByPath.get(path) ?? null
        const result = reconcile(
            renderedElement,
            domByPath.get(`${path}.render`) ?? dom,
            `${path}.render`,
            previousRenderedElement,
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
        const isSvg =
            element.type === 'svg' ||
            (parentDom.namespaceURI === SVG_NAMESPACE && parentDom.localName !== 'foreignObject')
        const replacement = isText
            ? document.createTextNode(element.props.nodeValue)
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
        const oldIndex = oldChildren.findIndex(
            (child, oldChildIndex) => getChildPath(path, child, oldChildIndex) === childPath,
        )
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

/**
 * Строит путь по key, а если его нет — по индексу среди детей.
 * Стабильный key позволяет сохранить узел и состояние при перестановке.
 * @param {string} parentPath Путь родителя.
 * @param {object|null|undefined} child Дочерний элемент.
 * @param {number} index Позиция в массиве детей.
 * @returns {string} Путь дочернего элемента.
 */
function getChildPath(parentPath, child, index) {
    if (child?.key !== null && child?.key !== undefined) {
        return `${parentPath}.key:${encodeURIComponent(String(child.key))}`
    }
    return `${parentPath}.index:${index}`
}

/**
 * Удаляет сохранённые узлы, состояния и результаты компонентов для всей ветки.
 * Сам DOM здесь не меняется.
 * @param {string} path Путь удаляемой или заменяемой ветки.
 * @returns {void}
 */
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

/**
 * Обновляет свойства, атрибуты, стили и обработчики событий, убирает старые значения.
 * Дочерние элементы обрабатываются отдельно в reconcile.
 * @param {HTMLElement} dom Обновляемый DOM-элемент.
 * @param {object} previousProps Предыдущие свойства.
 * @param {object} nextProps Новые свойства.
 * @returns {void}
 */
function updateProps(dom, previousProps, nextProps) {
    const isSvg = dom.namespaceURI === SVG_NAMESPACE
    const names = new Set([...Object.keys(previousProps), ...Object.keys(nextProps)])

    for (const name of names) {
        if (name === 'children') continue

        const previousValue = previousProps[name]
        const nextValue = nextProps[name]
        const attributeName = name === 'className' ? 'class' : name

        if (previousValue === nextValue) continue

        if (name.startsWith('on') && typeof previousValue === 'function') {
            dom.removeEventListener(name.slice(2).toLowerCase(), previousValue)
        }

        if (nextValue === null || nextValue === undefined || nextValue === false) {
            if (name === 'style') dom.removeAttribute('style')
            else if (!isSvg && name in dom && !name.startsWith('aria-') && !name.startsWith('data-')) {
                dom[name] = typeof dom[name] === 'boolean' ? false : ''
            } else {
                dom.removeAttribute(attributeName)
            }
            continue
        }

        if (name.startsWith('on') && typeof nextValue === 'function') {
            dom.addEventListener(name.slice(2).toLowerCase(), nextValue)
        } else if (name === 'style' && typeof nextValue === 'object') {
            for (const styleName of Object.keys(previousValue ?? {})) {
                if (!(styleName in nextValue)) dom.style[styleName] = ''
            }
            Object.assign(dom.style, nextValue)
        } else if (!isSvg && name in dom && !name.startsWith('aria-') && !name.startsWith('data-')) {
            dom[name] = nextValue
        } else {
            dom.setAttribute(attributeName, nextValue === true ? '' : nextValue)
        }
    }
}
