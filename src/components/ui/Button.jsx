'use strict'

import { createElement } from '../../../index.js'
import './Button.css'

export function Button({ children, className = '', ...props }) {
    const classes = ['button', className].filter(Boolean).join(' ')
    return (
        <button className={classes} {...props}>
            {children}
        </button>
    )
}
