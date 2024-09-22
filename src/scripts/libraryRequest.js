import axios from 'axios'

const requestUrl = 'https://n1ba6bpzj7.execute-api.ap-northeast-2.amazonaws.com/default/'

// Access Token 요청
// 방 예약에 필요 없음
export async function login(id, pw) {
    let data = {}
    const params = {
        client_id: 'web',
        grant_type: 'password',
        username: id,
        password: pw
    }
    // 포스트 요청에 param을 넘기기 위해서 data에 null을 전달해야함
    await axios.post(requestUrl + "oauth/token", null, {params: params}, {
        // withCredentials: true // HTTPonly Cookie 설정을 위함. but 도서관 서버에서 쿠키를 안씀.
    }).then((res) => {
        console.log(res)
        data = res
    }).catch(console.error)
    return data.data
}

export async function refresh(refresh_token) {
    let data = {}
    const params = {
        client_id: 'web',
        grant_type: 'refresh_token',
        refresh_token: refresh_token
    }
    // 포스트 요청에 param을 넘기기 위해서 data에 null을 전달해야함
    await axios.post(requestUrl + "oauth/token", null, {params: params}, {
        // withCredentials: true // HTTPonly Cookie 설정을 위함. but 도서관 서버에서 쿠키를 안씀.
    }).then((res) => {
        console.log(res)
        data = res
    }).catch(console.error)
    return data.data
}

export async function getReservedDates(userId, startDate, endDate, roomId) {
    let data = {}
    const params = {
        START_DT: startDate,
        END_DT: endDate,
        ROOM_ID: roomId
    }
    await axios.get(requestUrl + "api/v1/mylibrary/facilityreservation/" + userId,{params: params}
    ).then((res) => {
        data = res
    }).catch(console.error)
    return data.data.result
}

export async function getUserInfo(userId, targetDate) {
    let data = {}
    const params = targetDate ? {RES_YYYYMMDD: targetDate} : {}

    data = await axios.get(requestUrl + "api/v1/mylibrary/facilityreservation/info/" + userId, {params: params})
    
    return data.data
}

// 방 정보 요청
export async function getRoomInfo(userId, roomId, date) {
    const params = {
        ROOM_ID: roomId,
        RES_YYYYMMDD: date
        // 아래는 뭐하는 파라미터인지 모르겠음.
        // START_DT_YYYYMMDD
        // END_DT_YYYYMMDD
    }

    return await axios.get(requestUrl + "api/v1/mylibrary/facilityreservation/room/" + userId, {params: params}).then((res) => res.data)
}

// 예약 요청
export async function reserveRoom(userId, roomId, date, time, remark = '', isAdmin = 'N') {
    const params = {
        ADMIN_YN: isAdmin,
        CREATE_ID: userId,
        REMARK: remark,
        RES_HOUR: time,
        RES_YYYYMMDD: date,
        ROOM_ID: roomId
    }

    // post 요청시에는 data에 null을 전달해야함.
    await axios.post(requestUrl + "api/v1/mylibrary/facilityreservation/room/" + userId, null, {params: params})
    // no return
    return null
}

// 예약 취소 함수
// export async function cancelRoom(userId, roomId, resId)


// 블랙리스트 및 규정 위반 확인
// export async function isInnocent(userId)