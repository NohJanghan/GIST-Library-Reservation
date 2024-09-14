import React from "react"
import Header from "../components/header"
import Layout from "../components/layout"
import NavBar from "../components/navbar"

export default function reservation() {
    return <>
    <Layout>
        <Header>
            <Header.Title><strong>예약 날짜</strong>를<br/> 선택해주세요.</Header.Title>
        </Header>
        <p>Hello world</p>
    </Layout>
    <NavBar />
    </>
}