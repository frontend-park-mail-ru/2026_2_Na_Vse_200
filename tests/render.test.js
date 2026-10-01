'use strict'

import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from '../createElement.js'
import { render } from '../render.js'

class FakeNode {
    constructor() {
        this.childNodes = []
        this.parentNode = null
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

class FakeElement extends FakeNode {
    constructor(tagName) {
        super()
        this.tagName = tagName.toUpperCase()
        this.attributes = new Map()
        this.style = {}
    }

    setAttribute(name, value) {
        this.attributes.set(name, String(value))
    }
    removeAttribute(name) {
        this.attributes.delete(name)
    }
    addEventListener() {}
    removeEventListener() {}
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

test('keyed children keep their DOM nodes when their order changes', () => {
    const container = new FakeElement('root')
    const list = items =>
        createElement(
            'ul',
            null,
            items.map(item => createElement('li', { key: item.id }, item.label)),
        )

    render(
        list([
            { id: 'a', label: 'Alpha' },
            { id: 'b', label: 'Beta' },
            { id: 'c', label: 'Gamma' },
        ]),
        container,
    )

    const originalNodes = new Map(container.firstChild.childNodes.map(node => [node.firstChild.nodeValue, node]))

    render(
        list([
            { id: 'c', label: 'Gamma' },
            { id: 'a', label: 'Alpha' },
            { id: 'b', label: 'Beta' },
        ]),
        container,
    )

    const reorderedNodes = container.firstChild.childNodes
    assert.deepEqual(
        reorderedNodes.map(node => node.firstChild.nodeValue),
        ['Gamma', 'Alpha', 'Beta'],
    )
    assert.equal(reorderedNodes[0], originalNodes.get('Gamma'))
    assert.equal(reorderedNodes[1], originalNodes.get('Alpha'))
    assert.equal(reorderedNodes[2], originalNodes.get('Beta'))

    const nestedView = showList =>
        createElement(
            'main',
            null,
            showList
                ? createElement(
                      'div',
                      null,
                      createElement('ul', null, createElement('li', { key: 'stale' }, 'Old list item')),
                  )
                : createElement('button', null, 'Different branch'),
        )

    render(nestedView(true), container)
    render(nestedView(false), container)
    assert.equal(container.firstChild.firstChild.tagName, 'BUTTON')
    render(nestedView(true), container)
    assert.equal(container.firstChild.firstChild.firstChild.firstChild.firstChild.nodeValue, 'Old list item')
})
