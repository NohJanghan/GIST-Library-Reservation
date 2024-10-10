import React from 'react'

import { layout } from '../styles/layout.module.css'


export default function Layout ({style = null, children}) {
    return (
        <div className={layout} style={style}>
            {children}
        </div>
    )
}