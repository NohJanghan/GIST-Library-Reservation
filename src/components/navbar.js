import { Link } from "gatsby"
import React from "react"
import Calendar from "../images/NavBar/Calendar.svg"
import ActiveCalendar from "../images/NavBar/active/Calendar.svg"
import List from "../images/NavBar/List.svg"
import ActiveList from "../images/NavBar/active/List.svg"
import Settings from "../images/NavBar/Settings.svg"
import ActiveSettings from "../images/NavBar/active/Settings.svg"

import * as style from "../styles/navbar.module.css"

export default function NavBar() {
    return (
        <footer className={style.navbar}>
            <Link className={style.tab} partiallyActive={true} activeClassName={style.activatedLink} to="/reservation" >
                <img alt="reservation" className={style.active} src={ActiveCalendar} />
                <img alt="reservation" className={style.inactive} src={Calendar} />

                <p>예약</p>
            </Link>
            <Link className={style.tab} partiallyActive={true} activeClassName={style.activatedLink} to="/myReservation">
                <img alt="myReservation" className={style.active} src={ActiveList} />
                <img alt="myReservation" className={style.inactive} src={List} />
                <p>예약 현황</p>
            </Link>
            <Link className={style.tab} partiallyActive={true} activeClassName={style.activatedLink} to="/settings">
                <img alt="settings" className={style.active} src={ActiveSettings} />
                <img alt="settings" className={style.inactive} src={Settings} />
                <p>설정</p>
            </Link>
        </footer>
    )
}