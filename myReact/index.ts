/**
 * @module
 * Общая точка импорта движка: создание элементов, отрисовка и состояние компонентов.
 */

export { createElement } from './createElement.ts'

export { render, useState } from './render.ts'

export type { Child, Component, ElementRef, Key, Props, VNode, StateSetter, StateUpdate } from './types.ts'
