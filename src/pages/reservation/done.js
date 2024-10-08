import React from "react"
import Layout from "../../components/layout"
import Header from "../../components/header"
import NavBar from "../../components/navbar"

export default function ReserveDone() {
    return <>
        <Layout>
            <Header>
                <Header.Title>예약이 완료되었습니다</Header.Title>
                <Header.Subtitle>예약 현황 탭에서 예약을 확인해주세요.</Header.Subtitle>
            </Header>
        </Layout>
        <NavBar />
    </>
}