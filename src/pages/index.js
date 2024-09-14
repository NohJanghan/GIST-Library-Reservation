import * as React from "react"
import Layout from "../components/layout";
import Header from "../components/header"

const IndexPage = () => {
  return (
    <Layout now='home'>
      <Header>
        <Header.Title><strong>스터디룸 예약</strong>을<br/>더 쉽게 만들기</Header.Title>
        <Header.Subtitle>이제 비어있는 스터디룸을 찾는데<br/>시간을 쏟을 필요가 없습니다.</Header.Subtitle>
      </Header>
    </Layout>
  )
}

export const Head = () => <title>GIST Library Reservation</title>

export default IndexPage;