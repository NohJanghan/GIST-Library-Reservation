import React, {useState, useEffect} from 'react'
import Header from '../../components/header'
import Layout from '../../components/layout'
import TimeSelector from '../../components/reservation/timeSelector'
import { navigate } from 'gatsby'
import { getRoomInfo } from '../../scripts/libraryRequest'
import pAll from 'p-all'

export default function Select({ location }) {
    const [selectedTimeRange, setSelectedTimeRange] = useState([])
    const requestConcurrency = 4
    const requestBaseDelay = 50
    const requestMaxTrial = 4
    let possibleTimeRange = [0, 24]

    const userData = location.state.userData
    const selectedDate = location.state.selectedDate

    const [facilityData, setFacilityData] = useState({facilityGroups: [], reserveCount: {}})

    const remainCountInDay = userData.info[0].FAC_DUR4 - facilityData.reserveCount.DayReservationCount
    const remainCountInMonth = userData.info[0].FAC_DUR5 - facilityData.reserveCount.MonthReservationCount
    const maxRange = Math.min(remainCountInDay, remainCountInMonth)
    if(remainCountInMonth <= 0) {
        alert('이번 달에는 더이상 예약할 수 없습니다')
        navigate('../')
    } else if(remainCountInDay <= 0) {
        alert('오늘은 더 이상 예약할 수 없습니다')
        navigate('../')
    }

    // 처음 마운트되면, 예약 가능한 모든 방의 정보를 가져옴
    useEffect(() => {
        const dataPromises = []
        for(const elem of userData.facility) {
            // elem : {
            //     ROOM_ID,
            //     FLOOR,
            //     FAC_NM,
            //     ROOM_NO,
            //     ROOM_GROUP
            // }
            if(elem.ROOM_GROUP !== -1) {
                // 실패할 경우 exponential backoff 이용하여 재시도
                const requestData = async (trial = 1) => {
                    const res = await getRoomInfo(userData.info[0].USER_ID, elem.ROOM_ID, selectedDate)

                    if(res.status === 503) {
                        if(trial < requestMaxTrial) {
                            if(process.env.NODE_ENV === "development") {
                                console.warn(`[HTTP Error 503] (in GetRoomInfo) trial: ${trial}, roomId: ${elem.ROOM_ID}`)
                            }
                            const delay = requestBaseDelay * Math.pow(2, trial)
                            await new Promise((resolve) => setTimeout(resolve, delay))
                            return requestData(trial + 1)
                        } else {
                            throw new Error(`[HTTP Error 503] (in GetRoomInfo) Exceeded maxTrial(trial: ${trial}), roomId: ${elem.ROOM_ID}`)
                        }
                    } else if(res.status >= 200 && res.status < 300) {
                        return res
                    } else {
                        throw Error(`[HTTP Error ${res.status}]`)
                    }
                }
                dataPromises.push(requestData)
            }
        }

        pAll(dataPromises, {concurrency: requestConcurrency}).then((resArr) => {
            let newFacilityData = {facilityGroups: [], reserveCount: {}}
            for(const res of resArr) {
                for(const roomGroup of res.data.normalRoomGroupDates) {
                    // 새로운 그룹의 방이면 그룹 정보를 가져옴
                    if(!newFacilityData.facilityGroups.map(x => x.groupId).includes(roomGroup)) {
                        const newGroup = {}
                        newGroup.id = roomGroup.ROOM_GROUP
                        newGroup.displayName = roomGroup.FAC_NM
                        newGroup.floor = roomGroup.FLOOR
                        newGroup.timeRange = [roomGroup.FROM_TIME, roomGroup.TO_TIME]
                        newGroup.room= []
                        newFacilityData.facilityGroups.push(newGroup)
                    }
                    
                    // 그룹에 해당 룸의 ID를 포함시킴
                    const newRoomData = {
                        id: roomGroup.ROOM_ID,
                        disabledTimes: [],
                        userReservedTimes: []
                    }
                    // 내가 예약한 시간을 newRoomData.userReservedTimes에 넣음
                    for(const myReservation of res.data.room) {
                        newRoomData.userReservedTimes.push(myReservation.RES_HOUR)
                    }
                    // 다른 사람이 예약한 내역을 ~.disabledTimes에 넣음
                    for(const otherReservation of res.data.roomOther) {
                        newRoomData.disabledTimes.push(otherReservation.RES_HOUR)
                    }
                    // 예약 불가능한 시간을 ~.disabledTimes에 넣음
                    for(const disabledTime of res.data.notAvailableRoomDates) {
                        const from = disabledTime.FROM_TIME
                        const to = disabledTime.TO_TIME === 0 ? 24 : disabledTime.TO_TIME
                        for(let i = from; i < to; i++) {
                            if(!newRoomData.userReservedTimes.includes(i) && !newRoomData.disabledTimes.includes(i)) {
                                newRoomData.disabledTimes.push(i)
                            }
                        }
                    }
                    newFacilityData.facilityGroups.find(group => group.id === roomGroup.ROOM_GROUP).room.push(newRoomData)
                }

                // 내가 예약한 시간
                newFacilityData.reserveCount.DayReservationCount = res.data.infoCountDay
                newFacilityData.reserveCount.MonthReservationCount = res.data.infoCount
            }

            setFacilityData(newFacilityData)
        })
    }, [selectedDate, userData])

    return (<>
        <Layout>
            <Header>
                <Header.Title>
                    <strong>예약 시간</strong>을<br/> 선택해주세요
                </Header.Title>
            </Header>
            <TimeSelector 
                selectedRange={selectedTimeRange}
                onRangeSelected={setSelectedTimeRange}
                timeRange={possibleTimeRange}
                maxRange={maxRange}
            />

        </Layout>
    </>)
}