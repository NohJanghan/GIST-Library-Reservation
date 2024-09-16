import React from "react"
import Header from "../components/header"
import Layout from "../components/layout"
import NavBar from "../components/navbar"

import * as styles from "../styles/elements.module.css"


export default function Settings() {
    let userName = 'USERNAME'
    return <>
    <Layout>
        <Header>
            <Header.Title><strong>{userName}</strong>님,<br />안녕하세요</Header.Title>
        </Header>
    </Layout>
    <NavBar />
    </>
}