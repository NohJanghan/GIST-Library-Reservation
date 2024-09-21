import axios from 'axios'

const requestUrl = 'https://n1ba6bpzj7.execute-api.ap-northeast-2.amazonaws.com/default'

export async function login(id, pw) {
    let data = {}
    const params = {
        client_id: 'web',
        grant_type: 'password',
        username: id,
        password: pw
    }
    await axios.post(requestUrl + "/oauth/token", null, {params: params}, {
        // withCredentials: true // HTTPonly Cookie 설정을 위함. but 도서관 서버에서 쿠키를 안씀.
    }).then((res) => {
        console.log(res)
        data = res
    })

    return data
}
