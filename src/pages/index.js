import React, { useState, useEffect } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Pagination } from "swiper/modules"

import Header from "../components/header"
import Layout from "../components/layout"

import "swiper/css";
import "swiper/css/pagination";
import { logInFormContainer } from "../styles/logInForm.module.css"
import { login } from "../scripts/libraryRequest"
import { navigate } from "gatsby"
import { useCookies } from "react-cookie"


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

  const [cookies, setCookie, removeCookie] = useCookies(['accessToken', 'refreshToken', 'tokenType', 'userId'])
  // 이전에 로그인 했다면 바로 예약 페이지로 감
  useEffect(() => {
    if(cookies.userId) {
      if(cookies.accessToken) {
        navigate('/reservation')
      }
    }
  }, [cookies])

  async function onClickLogin(e) {
    if(process.env.NODE_ENV === 'development')
      console.log('[Login] try to login')
    if(e.target.disabled) {
      alert("로그인중입니다.")
      return false
    }

    e.target.disabled = true
    // 로그인 처리
    const userId = userData.id
    await login(userData.id, userData.pw).then((res) => {
      if(res.status === 400 || res.status === 401) {
        alert("입력한 정보를 다시 확인해주세요.")
        e.target.disabled = false
      } else if(res.status === 200) {
        setCookie('accessToken', res.data['access_token'], {path: '/', maxAge: res.data['expires_in']})
        setCookie('refreshToken', res.data['refresh_token'])
        setCookie('tokenType', res.data['token_type'])
        setCookie('userId', userId)
        // 이후에 useEffect에 의해 페이지 변경이 일어남
      } else {
        throw new Error(res)
      }
    }).catch((err) => {
      alert('로그인에 실패했습니다. 다시 시도해주세요.')
      e.target.disabled = false
      console.error(err)
    })
  }
  return (
    <Swiper
      modules= {[Pagination]}  //스와이퍼 아래에 bullets를 표시하는 모듈
      pagination={{clickable: true}}  //bullet을 클릭하여 페이지를 이동할 수 있음.
      style={{
        height: "95dvh",
      }}
      className="preventScroll"
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
          <div className={logInFormContainer} style={{marginTop: "10dvh"}}>
            {/* TODO: 로그인 폼 디자인 필요함*/}
            <form>
                <div>
                  <input onChange={onInputChange} value={userData.id} placeholder="ID" type="text" name="id"/>
                </div>
                <div>
                  <input onChange={onInputChange} value={userData.pw} placeholder="Password" type="password" name="pw"/>
                </div>
                <button onClick={onClickLogin} type="button">Log in</button>
              </form>
          </div>
        </Layout>
      </SwiperSlide>

    </Swiper>
  )
}

export const Head = () => <title>GIST Library Reservation</title>

export default IndexPage;