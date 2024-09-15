import React, { useState } from "react"
import { DayPicker } from "react-day-picker"
import Header from "../components/header"
import Layout from "../components/layout"
import NavBar from "../components/navbar"

import "react-day-picker/style.css";
import * as styles from "../styles/elements.module.css"


export default function Reservation() {
    const [date, setDate] = useState(new Date())
    let endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)
    endDate.setDate(endDate.getDate() - 1)

    const disabledDateMatcher = {
        after: new Date(endDate),
        before: new Date(),
        // TODO: 지스트 홈페이지 구현에 따라 수정이 필요
    }
    function goNext(e) {
        // TODO: 날짜를 받아서 다음 페이지로 넘어가기
        // 유효성 검사 필요?
        console.log("Selected Date: " + date)
    }
    return <>
    <Layout>
        <Header>
            <Header.Title><strong>예약 날짜</strong>를<br/> 선택해주세요.</Header.Title>
        </Header>
        <DayPicker 
            mode="single"
            selected={date}
            onSelect={setDate}
            startMonth={new Date()}
            endMonth={endDate}
            required
            disabled={disabledDateMatcher}
            // TODO: 테마에 맞게 스타일 수정 필요

            style={{marginTop: "3rem"}}
        />
        <div className={styles.buttonContainer}>
            <button type="button" onClick={goNext}>
                다음
            </button>
        </div>
    </Layout>
    <NavBar />
    </>
}