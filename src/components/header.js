import React from 'react'
import * as style from '../styles/header.module.css'


export default function Header({children}) {
    const title = React.Children.map(children, child => child.type.displayName === 'Title' ? child : null)
    const subtitle = React.Children.map(children, child => child.type.displayName === 'SubTitle' ? child : null)

    return <div className={style.header}>
    <div className={style.title}>
        {title}
    </div>
    <div className={style.subtitle}>
        {subtitle}
    </div>
    </div>
}

Header.Title = ({ children }) => children
Header.Title.displayName = 'Title'

Header.Subtitle = ({ children }) => children
Header.Subtitle.displayName = 'SubTitle'