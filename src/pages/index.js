import React, { useState, useEffect, useRef } from "react"
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
  const pwRef = useRef()

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
    e.preventDefault()
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
        pwRef.current.focus()
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

  const handleIdKeyDown = (e) => {
    if(e.key === 'Enter') {
      e.preventDefault()
      pwRef.current.focus()
    }
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
            <Header.Title><strong>G.lib</strong>에 오신 것을 환영합니다</Header.Title>
            <Header.Subtitle>G.lib은 도서관 시설 예약을 더 쉽게 만들어주는 비공식 웹 서비스입니다.<br/><br/>지루한 도서관 예약을 간단히 끝내세요!</Header.Subtitle>
          </Header>
        </Layout>
      </SwiperSlide>
      <SwiperSlide>
        <Layout>
          <Header>
            <Header.Title><strong>앱처럼 빠르게</strong> 이용하세요</Header.Title>
            <Header.Subtitle>화면 하단의 <strong>공유 {'>'} 홈화면에 추가</strong>를 눌러 더 빠르게 이용할 수 있어요.
            <br/><br/>홈 화면에 추가하지 않더라도 웹에서 모든 기능을 이용할 수 있습니다.</Header.Subtitle>
          </Header>
        </Layout>
      </SwiperSlide>
      <SwiperSlide>
        <Layout style={{position: "relative"}}>
          <Header>
            <Header.Title><strong>GIST 도서관</strong>으로 로그인 해주세요</Header.Title>
          </Header>
          <div className={logInFormContainer}>
            <form autoComplete="off">
                <div>
                  <input onChange={onInputChange} enterKeyHint="next" value={userData.id} placeholder="ID" type="text" name="id" onKeyDown={handleIdKeyDown} inputMode="numeric"/>
                </div>
                <div>
                  <input onChange={onInputChange} enterKeyHint="done" value={userData.pw} placeholder="Password" type="password" name="pw" ref={pwRef}/>
                </div>
                <button onClick={onClickLogin} type="submit">Log in</button>
              </form>
          </div>
        </Layout>
      </SwiperSlide>

    </Swiper>
  )
}

export const Head = () => <title>GIST Library Reservation</title>

export default IndexPage;