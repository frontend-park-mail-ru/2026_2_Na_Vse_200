class FakeNode {
    constructor() {
        this.childNodes = []
        this.parentNode = null
    }

    get isConnected() {
        return this.tagName === 'ROOT' || Boolean(this.parentNode?.isConnected)
    }

    get firstChild() {
        return this.childNodes[0] ?? null
    }

    appendChild(node) {
        if (node.parentNode) node.parentNode.removeChild(node)
        this.childNodes.push(node)
        node.parentNode = this
        return node
    }

    insertBefore(node, reference) {
        if (node === reference) return node
        if (node.parentNode) node.parentNode.removeChild(node)
        const index = reference ? this.childNodes.indexOf(reference) : -1
        if (index === -1) this.childNodes.push(node)
        else this.childNodes.splice(index, 0, node)
        node.parentNode = this
        return node
    }

    removeChild(node) {
        const index = this.childNodes.indexOf(node)
        if (index === -1) throw new Error('Node is not a child')
        this.childNodes.splice(index, 1)
        node.parentNode = null
        return node
    }

    replaceChild(next, previous) {
        const index = this.childNodes.indexOf(previous)
        if (index === -1) throw new Error('Node is not a child')
        if (next.parentNode) next.parentNode.removeChild(next)
        this.childNodes[index] = next
        next.parentNode = this
        previous.parentNode = null
        return previous
    }

    replaceChildren(...nodes) {
        for (const child of [...this.childNodes]) this.removeChild(child)
        nodes.forEach(node => this.appendChild(node))
    }
}

export class FakeElement extends FakeNode {
    constructor(tagName) {
        super()
        this.tagName = tagName.toUpperCase()
        this.attributes = new Map()
        this.style = {}
        this.dataset = {}
        this.listeners = new Map()
        this.value = ''
        this.disabled = false
        this.name = ''
        this.id = ''
    }

    setAttribute(name, value) {
        this.attributes.set(name, String(value))
    }
    removeAttribute(name) {
        this.attributes.delete(name)
    }
    addEventListener(name, callback) {
        this.listeners.set(name, callback)
    }
    removeEventListener(name, callback) {
        if (this.listeners.get(name) === callback) this.listeners.delete(name)
    }
    focus() {
        globalThis.document.activeElement = this
    }
    get form() {
        return this.tagName === 'FORM' ? this : this.parentNode?.form
    }
    get elements() {
        return { namedItem: name => this.find(node => node.name === name) }
    }
    find(predicate) {
        if (predicate(this)) return this
        for (const child of this.childNodes) {
            const found = child.find?.(predicate)
            if (found) return found
        }
    }
}

class FakeText extends FakeNode {
    constructor(value) {
        super()
        this.nodeValue = value
    }
}

globalThis.document = {
    createElement: tagName => new FakeElement(tagName),
    createTextNode: value => new FakeText(value),
}
