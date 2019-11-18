# fcore

## Introduction

fcore는 주식회사 지농과 서울대 생물환경시스템연구실에서 개발하는 오픈소스기반 스마트팜 제어기의 룰을 처리하는 룰엔진이다.  farmos 에서 관리하는 데이터를 룰에 맞게 해석하여 새로운 데이터를 만들어내거나 제어명령을 생성할 수 있다. 

## 개발 환경
* python 2.7을 사용한다.
* 다음의 패키지들이 필요하다.
  * paho.mqtt
  * simpleeval
  * subprocess32
* 다음의 명령으로 설치가 가능하다.
```
sudo pip install paho.mqtt simpleeval subprocess32
```

## 작동 방법

fcore 는 faroms의 데이터베이스에서 룰을 읽어 해당 룰을 해석하고, 룰에 맞는 작업을 처리하는 방식으로 작동한다. 
룰을 처리한 결과물은 다음의 2가지 이다.

* 새로운 데이터
 * 센서 정보를 활용하여 통계치 정보 혹은 수치적 정보를 얻는데 사용될 수 있다. 대표적인 예로는 누적 일사가 될 수 있으며, 건구 습구 온도를 이용하여 계산가능한 상대습도 좋은 예가 될 수 있다.
* 제어 명령
 * 특정 상황에서 필요한 제어명령을 만들어내는데 사용될 수 있다.

## 동작 설정
fcore는 conf/fcore.conf 파일을 기본 설정 파일로 한다. 설정파일의 형식은 json 이며, 다음과 같은 내용을 담고 있다. 

```
{
  "db": {
    "host": "localhost",
    "user": "farmos",
    "password": "farmosv2@",
    "db": "farmos"
  },
  "mqtt": {
    "host": "localhost",
    "port": 1883,
    "keepalive": 60,
    "svc" : "cvtgate"
  },
  "sleep" : 1
}
```

