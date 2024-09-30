import React, { useEffect, useState } from "react"
import { DayPicker } from "react-day-picker"
import Header from "../../components/header"
import Layout from "../../components/layout"
import NavBar from "../../components/navbar"

import "react-day-picker/style.css";
import * as styles from "../../styles/elements.module.css"
import { navigate } from "gatsby"
import { getUserInfo } from "../../scripts/libraryRequest"
import { useCookies } from "react-cookie"


export default function Reservation() {
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [userData, setUserData] = useState({})

    function nextMonth(date) {
        date.setMonth(date.getMonth() + 1)
        return date
    }

    // 마운트 될때 한 번만 실행
    const [cookies, , removeCookie] = useCookies(['userId'])
    useEffect(() => {
        console.log('[useEffect]')
        if(!cookies.userId) {
            navigate('../')
            return
        }
        let userId = cookies['userId']

        // 사용가능한 방들의 데이터, 휴관일 데이터, 사용자 정보를 가져옴.
        // 이번달과 다음달의 infocount를 요청하기 위해서 Promise.all 사용
        const today = new Date()
        const nextMonthDate = (() => {
            let a = new Date()
            a.setMonth(a.getMonth() + 1)
            return a
        }) ()
        Promise.all([getUserInfo(userId, today), getUserInfo(userId, nextMonthDate)]).then(([res1, res2]) => {
            if(res1.status === 200 && res1.data.info[0].USER_ID === userId.toString() && res2.status === 200 && res2.data.info[0].USER_ID === userId.toString()) {
                let dataTmp = {...res1.data}
                dataTmp.infoCount = [dataTmp.infoCount]
                dataTmp.infoCount.push(res2.data.infoCount)
                console.log('[dataTmp]' + JSON.stringify(dataTmp))
                setUserData(dataTmp)
            } else {
                throw Error('Failed: Cannot update userData')
            }
        }).catch(() => removeCookie('userId')) // 오류라면 쿠키를 삭제하여 로그인 페이지로 넘김
    }, [cookies, removeCookie])
    

    // 선택할 수 없는 날짜 정하는 함수
    // date를 받아서 이 날짜가 선택할 수 없으면 true
    // date는 한국 시간으로 00시임.
    function disabledDateMatcher(date) {
        function isSameDate(a, b) {
            if(a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getb() === b.getDate()) {
                return true
            }
            else {
                return false
            }
        }
        let today = new Date()
        today.setHours(0,0,0,0) // 대한민국 시간 기준 자정(GMT+9)
        let endDate = new Date(today)
        endDate.setMonth(endDate.getMonth() + 1)

        // 날짜가 앞으로 한달 이내에 없으면 false return
        if(date < today || endDate <= date) {
            return true
        }

        // 날짜가 휴관일이면 true 리턴
        if(userData.notAvailableRoomDays) {
            for(const data of userData.notAvailableRoomDays) {
                // data 예시 테스트 안해봄
                // {
                //     "OFF_DT": 1726498800000,
                //     "REMARK": "대출휴관일데이터",
                //     "CREATE_ID": "lib13",
                //     "CREATE_DT": 1556515709530
                // }
                if(isSameDate(date, new Date(data.OFF_DT))) {
                    return true
                }
            }
        }
        return false
    }
    function goNext(e) {
        // 날짜를 받아서 다음 페이지로 넘어가기
        // 유효성 검사 필요
        const infoCountIndex = selectedDate.getMonth() - new Date().getMonth()
        console.log(userData)

        // 예약 할 수 있는 시간이 얼마나 남았는지 체크
        // 여기서 넘겨도 나중에 다시 체크해야함
        const remainCount = userData.info[0].FAC_DUR5 - userData.infoCount[infoCountIndex]
        if(remainCount<= 0) {
            alert('해당 달에는 더이상 예약할 수 없습니다.')
            return
        }
        console.log('[Remain Reserve Count] ' + remainCount)
        console.log("Selected Date: " + selectedDate)
        navigate('/reservation/select', {state: {selectedDate: selectedDate, userData: {...userData, infoCount: userData.infoCount[infoCountIndex]}}})

    }
    
    return <>
    <Layout>
        <Header>
            <Header.Title><strong>예약 날짜</strong>를<br/> 선택해주세요.</Header.Title>
        </Header>
        <DayPicker 
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            startMonth={new Date()}
            endMonth={nextMonth(new Date())}
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