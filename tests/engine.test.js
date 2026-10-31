import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement, useState } from '../index.ts'

test('normalizes nested children without losing zero or empty text', () => {
    const child = createElement('span', null, 'child')
    const tree = createElement('div', { key: 'row', id: 'row' }, [0, ['', [child]]], false, null)
    assert.equal(tree.key, 'row')
    assert.equal(tree.props.id, 'row')
    assert.equal('key' in tree.props, false)
    assert.deepEqual(
        tree.props.children.map(node => node?.props.nodeValue ?? node),
        ['0', '', child, null, null],
    )
})

test('keeps component identity and does not execute it during element creation', () => {
    let calls = 0
    const Component = ({ label }) => {
        calls++
        return createElement('p', null, label)
    }
    const node = createElement(Component, { label: 'Hello' })
    assert.equal(node.type, Component)
    assert.equal(calls, 0)
    assert.equal(node.type(node.props).props.children[0].props.nodeValue, 'Hello')
})

test('public entry point exports the state hook', () => {
    assert.equal(typeof useState, 'function')
})
