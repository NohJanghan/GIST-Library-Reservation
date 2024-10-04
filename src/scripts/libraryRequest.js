import axios, { AxiosError } from 'axios'

const requestUrl = process.env.GATSBY_PROXY_SERVER_URL

// 날짜를 YYYYMMDD로 변환
export function toYYYYMMDD(date) {
    return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2,'0')}`
}

function httpResponseHandler(res) {
    console.log(`[HttpRequest Done] ${res.status} | ${JSON.stringify(res.data)}`)
    // 예외처리는 실제로 데이터 처리하는 곳에서 하기로 함
    // if(res.status !== 200) {
    //     return {
    //         status: res.status,
    //         body: res.data
    //     }
    // } else {
    //     return res.data
    // }
    return res
}

function axiosErrorHandler(err) {
    if(err instanceof AxiosError && err.response) {
        //handle
        return {
            status: err.response.status,
            data: err.response.data
        }
    } else {
        console.error('❌ AxiosError: ' + err)
        throw err
    }
}

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
    await axios.post(requestUrl + "oauth/token", params, {headers: {"Content-Type": 'application/x-www-form-urlencoded'}}, {
        // withCredentials: true // HTTPonly Cookie 설정을 위함. but 도서관 서버에서 쿠키를 안씀.
    }).then(httpResponseHandler).then((res) => data = res).catch((err) => {
        data = axiosErrorHandler(err)
    })
    return data
}

export async function refresh(refresh_token) {
    let data = {}
    const params = {
        client_id: 'web',
        grant_type: 'refresh_token',
        refresh_token: refresh_token
    }
    // 포스트 요청에 param을 넘기기 위해서 data에 null을 전달해야함
    await axios.post(requestUrl + "oauth/token", params, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}, {
        // withCredentials: true // HTTPonly Cookie 설정을 위함. but 도서관 서버에서 쿠키를 안씀.
    }).then(httpResponseHandler).then((res) => data = res).catch((err) => {
        data = axiosErrorHandler(err)
    })
    return data
}

export async function getReservedDates(userId, startDate, endDate, roomId) {
    let data = {}
    const params = {
        START_DT: toYYYYMMDD(startDate),
        END_DT: toYYYYMMDD(endDate),
        ROOM_ID: roomId
    }
    await axios.get(requestUrl + "api/v1/mylibrary/facilityreservation/" + userId,{params: params}
    ).then(httpResponseHandler).then((res) => data = res).catch((err) => {
        data = axiosErrorHandler(err)
    })
    return data.result
}

export async function getUserInfo(userId, targetDate = undefined) {
    let data = {}
    const params = targetDate ? {RES_YYYYMMDD: toYYYYMMDD(targetDate)} : {}

    await axios.get(requestUrl + "api/v1/mylibrary/facilityreservation/info/" + userId, {params: params})
        .then(httpResponseHandler).then((res) => data = res).catch((err) => {
            data = axiosErrorHandler(err)
        })
    return data
}

// 방 정보 요청
export async function getRoomInfo(userId, roomId, date) {
    let data = {}
    const startDate = (() => {
        let t = new Date(date)
        t.setHours(0,0,0,0)
        t.setDate(1)
        return toYYYYMMDD(t)
    }) ()
    const endDate = (() => {
        let t = new Date(date)
        t.setHours(0,0,0,0)
        t.setDate(1)
        t.setMonth(t.getMonth() + 1)
        return toYYYYMMDD(t)
    }) ()
    const params = {
        ROOM_ID: roomId,
        RES_YYYYMMDD: toYYYYMMDD(date),
        // 아래는 뭐하는 파라미터인지 모르겠음.
        START_DT_YYYYMMDD: startDate,
        END_DT_YYYYMMDD: endDate
    }

    await axios.get(requestUrl + "api/v1/mylibrary/facilityreservation/room/" + userId, {params: params})
        .then(httpResponseHandler).then((res) => data = res).catch((err) => {
            data = axiosErrorHandler(err)
        })
    return data
}

// 예약 요청
export async function reserveRoom(userId, roomId, date, time, remark = '', isAdmin = 'N') {
    const params = {
        ADMIN_YN: isAdmin,
        CREATE_ID: userId,
        REMARK: remark,
        RES_HOUR: time,
        RES_YYYYMMDD: toYYYYMMDD(date),
        ROOM_ID: roomId
    }

    // post 요청시에는 data에 null을 전달해야함.
    await axios.post(requestUrl + "api/v1/mylibrary/facilityreservation/room/" + userId, null, {params: params}).then(httpResponseHandler)
    // no return
    return null
}

// 예약 취소 함수
// export async function cancelRoom(userId, roomId, resId)


// 블랙리스트 및 규정 위반 확인
// export async function isInnocent(userId)