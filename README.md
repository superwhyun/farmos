# farmosV2 : Farm Operating System V2

## 소개

FarmOS V2는 주식회사 지농에서 개발한 개방형 스마트팜 제어기 입니다. 기존에 개발되었던 Farmos(https://github.com/jinong-devteam/farmos) 의 문제점을 해결하고, 더 많은 연동장비를 지원합니다. 다양한 룰을 사용자가 직접 관리할 수 있어 유연한 스마트팜 구현이 가능합니다. 

## 특징

* 사용법이 간단합니다.
* 스마트 온실 KS 표준을 준수합니다. 
* 스마트팜 운영을 위해 다양한 설정이 가능합니다.
* 모든 소스코드가 공개되어 사용자가 직접 코드를 수정할 수 있습니다.

## 설치방법
 원하는 디렉토리로 이동후 다음의 명령을 입력합니다.
 ```
 git clone https://gitlab.com/JiNong_Public/farmosV2.git
 cd farmosV2/scripts
 sudo ./install.sh
 ```

## 의존성
FarmOSV2의 구동을 위해서는 다음의 환경이 필요합니다. 
* [mysql](https://www.mysql.com)
mysql 은 대표적인 오픈소스 데이터베이스 입니다. 사용하는 OS에 따라 적절히 설치하면 됩니다. debian 계열의 Ubuntu나 Rasibian 등을 사용하는 경우에는 다음과 같이 설치할 수 있습니다.
```
sudo apt install -y mysql-server
```
* [mosquitto](https://mosquitto.org)
mosquitto 는 대표적인 오픈소스 MQTT 메세지 브로커입니다. 사용하는 OS에 따라 적절히 설치하면 됩니다. debian 계열의 Ubuntu나 Rasibian 등을 사용하는 경우에는 다음과 같이 설치할 수 있습니다.
```
sudo apt install -y mosquitto
```
* [nodejs](https://nodejs.org)
nodejs는 Chrome V8 JavaScript 엔진으로 빌드된 JavaScript 런타임입니다. [여기](https://nodejs.org/ko/download/package-manager/)에서 개별 패키지 설치방법을 확인할 수 있습니다. debian 계열의 Ubuntu 등에서는 다음과 같이 설치 가능합니다
```
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt install -y nodejs
```

* 기타패키지
위의 3가지 패키지 이외에도 다음과 같은 패키지 들이 필요합니다.

## 개발자

* Croft (joonyong@jinong.co.kr)
* Lalafell (cho@jinong.co.kr)
* 까앙 (do@jinong.co.kr)
