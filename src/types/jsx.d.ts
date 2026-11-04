import type { Child, Key, VNode } from '../../types.ts'

// Native browser events, not React SyntheticEvent.
interface DOMProps {
    children?: Child
    key?: Key
    id?: string
    className?: string
    title?: string
    role?: string
    tabIndex?: number
    style?: Partial<CSSStyleDeclaration>
    onClick?: (event: MouseEvent) => void
    onInput?: (event: Event) => void
    onBlur?: (event: FocusEvent) => void
    onError?: (event: Event) => void
    onSubmit?: (event: SubmitEvent) => void
    [name: `aria-${string}`]: string | boolean | undefined
    [name: `data-${string}`]: string | boolean | undefined
}
interface InputProps extends DOMProps {
    name?: string
    type?: 'text' | 'email' | 'password' | 'range'
    placeholder?: string
    autoComplete?: string
    required?: boolean
    disabled?: boolean
    value?: string | number
    min?: string | number
    max?: string | number
}
interface SVGProps extends DOMProps {
    width?: number | string
    height?: number | string
    viewBox?: string
    fill?: string
    stroke?: string
    transform?: string
    focusable?: 'true' | 'false'
    d?: string
    cx?: number | string
    cy?: number | string
    r?: number | string
    x?: number | string
    y?: number | string
    x1?: number | string
    x2?: number | string
    y1?: number | string
    y2?: number | string
    rx?: number | string
    ry?: number | string
    points?: string
    'stroke-width'?: string | number
    'stroke-linecap'?: string
    'stroke-linejoin'?: string
}
declare global {
    namespace JSX {
        type Element = VNode
        interface ElementChildrenAttribute {
            children: unknown
        }
        interface IntrinsicAttributes {
            key?: Key
        }
        interface IntrinsicElements {
            div: DOMProps
            span: DOMProps
            p: DOMProps
            main: DOMProps
            header: DOMProps
            footer: DOMProps
            aside: DOMProps
            nav: DOMProps
            section: DOMProps
            article: DOMProps
            h1: DOMProps
            h2: DOMProps
            strong: DOMProps
            small: DOMProps
            ol: DOMProps
            li: DOMProps
            br: DOMProps
            a: DOMProps & { href?: string; target?: string; download?: string | boolean }
            label: DOMProps & { htmlFor?: string }
            input: InputProps
            button: DOMProps & { type?: 'button' | 'submit' | 'reset'; disabled?: boolean }
            form: DOMProps & { noValidate?: boolean }
            img: DOMProps & { src?: string; alt?: string; loading?: 'lazy' | 'eager' }
            svg: SVGProps
            g: SVGProps
            path: SVGProps
            circle: SVGProps
            ellipse: SVGProps
            rect: SVGProps
            line: SVGProps
            polyline: SVGProps
            polygon: SVGProps
        }
    }
}
