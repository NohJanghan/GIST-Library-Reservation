import React from 'React'

import { layout } from '../styles/layout.module.css'


export default function Layout ({children}) {
    return (
        <div className={layout}>
        <div>{children}</div>
        {/* <nav /> */}
        </div>
    )
}