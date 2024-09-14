import React, { useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Pagination } from "swiper/modules"

import Layout from "../components/layout"
import Header from "../components/header"

import "swiper/css";
import "swiper/css/pagination";
import { logInFormContainer } from "../styles/logInForm.module.css"


const IndexPage = () => {
  const [userData, setUserData] = useState({
    id: '',
    pw: ''
  })

  function onInputChange(e) {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value
    })
  }

  function login(e) {
    console.log('try to login')
    e.target.disabled = true
    // await login(userData)
    // TODO: 로그인 함수 구현 필요
    e.target.disabled = false
  }
  return (
    <Swiper
      modules= {[Pagination]}  //스와이퍼 아래에 bullets를 표시하는 모듈
      pagination={{clickable: true}}  //bullet을 클릭하여 페이지를 이동할 수 있음.
    >
      <SwiperSlide>
        <Layout>
          <Header>
            <Header.Title><strong>스터디룸 예약</strong>을<br/>더 쉽게 만들기</Header.Title>
            <Header.Subtitle>이제 비어있는 스터디룸을 찾는데<br/>시간을 쏟을 필요가 없습니다.</Header.Subtitle>
          </Header>
        </Layout>
      </SwiperSlide>
      <SwiperSlide>
        <Layout>
          <Header>
            <Header.Title><strong>웹 페이지</strong>를<br/>앱처럼 이용하기</Header.Title>
            <Header.Subtitle>화면 하단의 <strong>공유 {'>'} 홈화면에 추가</strong>를 눌러<br/>서비스를 더 빠르게 이용할 수 있습니다.
            <br/><br/>홈 화면에 추가하지 않더라도<br/>웹에서 모든 기능을 이용할 수 있습니다.</Header.Subtitle>
          </Header>
        </Layout>
      </SwiperSlide>
      <SwiperSlide>
        <Layout>
          <Header>
            <Header.Title><strong>GIST 도서관</strong>에<br/>로그인 해주세요</Header.Title>
          </Header>
          <div className={logInFormContainer} style={{marginTop: "20dvh"}}>
            {/* TODO: 로그인 폼 디자인 필요함*/}
            <form>
                <div>
                  <input onChange={onInputChange} value={userData.id} placeholder="ID" type="text" name="id"/>
                </div>
                <div>
                  <input onChange={onInputChange} value={userData.pw} placeholder="Password" type="password" name="pw"/>
                </div>
                <button onClick={login} type="button">Log in</button>
              </form>
          </div>
        </Layout>
      </SwiperSlide>

    </Swiper>
  )
}

export const Head = () => <title>GIST Library Reservation</title>

export default IndexPage;