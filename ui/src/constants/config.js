export const api = `http://kist.jinong.co.kr:8081/common/v1/`
export const mqttApi = 'kist.jinong.co.kr:9001'

export const commonSpecIp = 'http://dev.jinong.co.kr:10010/v1/devspec'

export const daumMapApiKey = 'ac8f25e20e7cbd0abf0dc5b6fa4c9689'
export const openweathermapKey = '1c6b5c1190ada7c0060956e573ab474b'

export const cropCode = [
  {
    id: 1,
    name: '토마토'
  },
  {
    id: 2,
    name: '딸기'
  },
  {
    id: 3,
    name: '파프리카'
  },
  {
    id: 4,
    name: '포도'
  }
]

export const statusCode = {
  0: '대기',
  1: '에러',
  101: '교체 필요',
  102: '교정 필요',
  201: '작동중',
  301: '여는중',
  302: '닫는중',
  401: '준비중',
  402: '공급중',
  403: '정지중'
}

export const cmdCode = {
  retractable: {
    open: 301,
    close: 302,
    stop: 0,
    timedopen: 303,
    timedclose: 304,
    position: 305,
    config: 306
  },
  switch: {
    on: 201,
    off: 0,
    timedon: 202,
    directionalon: 203
  },
  nutrient: {
    on: 401,
    off: 0,
    param: 402,
    control: 403
  }
}
