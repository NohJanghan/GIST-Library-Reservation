import { Link } from "gatsby"
import React, { useState } from "react"
import Calendar from "../images/NavBar/Calendar.svg"
import ActiveCalendar from "../images/NavBar/active/Calendar.svg"
import List from "../images/NavBar/List.svg"
import ActiveList from "../images/NavBar/active/List.svg"
import Settings from "../images/NavBar/Settings.svg"
import ActiveSettings from "../images/NavBar/active/Settings.svg"

import * as style from "../styles/navbar.module.css"

export default function NavBar() {
    const [inReservation, setInReservation] = useState(false)
    const [inMyReservation, setInMyReservation] = useState(false)
    const [inSettings, setInSettings] = useState(false)
    return (
        <footer className={style.navbar}>
            <Link className={style.tab} getProps={({ isCurrent }) => isCurrent && (setInReservation(true) || { className: style.activatedLink + ' ' +  style.tab})} to="/reservation" >
                <img alt="reservation" src={inReservation ? ActiveCalendar : Calendar} />
                <p>예약</p>
            </Link>
            <Link className={style.tab} getProps={({ isCurrent }) => isCurrent && (setInMyReservation(true) || { className: style.activatedLink + ' ' +  style.tab})} to="/myReservation">
                <img alt="my reservation" src={inMyReservation ? ActiveList : List} />
                <p>예약 현황</p>
            </Link>
            <Link className={style.tab} getProps={({ isCurrent }) => isCurrent && (setInSettings(true) || { className: style.activatedLink + ' ' +  style.tab})} to="/settings">
                <img alt="settings" src={inSettings ? ActiveSettings : Settings} />
                <p>설정</p>
            </Link>
        </footer>
    )
}