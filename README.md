# farmosV2 : Farm Operating System V2

## 소개

FarmOS V2는 주식회사 지농에서 개발한 개방형 스마트팜 제어기 입니다. 기존에 개발되었던 Farmos(https://github.com/jinong-devteam/farmos) 의 문제점을 해결하고, 더 많은 연동장비를 지원합니다. 다양한 룰을 사용자가 직접 관리할 수 있어 유연한 스마트팜 구현이 가능합니다. 

[FarmOS소개](https://youtu.be/zRmVyKhXcp0) 동영상을 참고하세요.

## FarmOS의 비전
 * 현재 호환이 되지 않는 스마트팜 장비의 호환성을 높이고자 합니다. 
   FarmOS는 KS 표준 기자재 뿐만 아니라 TTA 표준 기자재를 지원하고 있습니다. 나아가 비 표준기자재도 손쉽게 FarmOS와 연동될 수 있습니다. 

 * 다양한 농업 생산을 지원할 수 있는 유연성을 갖고자 합니다. 
   FarmOS는 다양한 작동 규칙을 가지고 있어, 작동 규칙을 설정하는 것 만으로도 농업 생산이 가능합니다. 나아가 원하는 작동 규칙을 직접 만들어 넣을 수 있습니다. 

 * 데이터 농업이 가능한 환경을 만들고자 합니다.
   FarmOS에 저장된 데이터를 활용할 수 있는 인터페이스 구비되어 있습니다. 새로운 데이터를 생성하거나 시뮬레이션을 수행하는 외부 프로그램을 제작하여 활용이 가능합니다.

## 구성

FarmOS V2는 크게 3가지 모듈로 구성되어 있습니다. 

* fui
  웹기반 사용자 화면을 담당하는 모듈입니다. 사용방법과 관련해서는 [UI사용법문서](https://gitlab.com/JiNong_Public/farmosV2/-/blob/master/docs/FarmOS%20V2%20%EB%A7%A4%EB%89%B4%EC%96%BC%20v1.0.pdf)를 참고하세요.

* cvtgate
  장비와의 통신을 담당하는 모듈입니다. 표준 장비와 통신을 위해서 USB to RS485 컨버터를 사용하시는 경우 별도의 설정변경없이 사용이 가능합니다.  

* fcore
  스마트팜 운영을 위한 로직을 담당하는 모듈입니다. 다양한 로직이 이미 탑재되어 있습니다. 추가적으로 원하는 로직을 만들기위해서는 [작동규칙작성법](https://gitlab.com/JiNong_Public/farmosV2/blob/master/docs/Introduction%20to%20fcore%20rule.pdf)을 숙지하여야 합니다.

## 설치방법
 원하는 디렉토리로 이동후 다음의 명령을 입력합니다.
 ```
 git clone https://gitlab.com/JiNong_Public/farmosV2.git
 cd farmosV2/scripts
 sudo ./install.sh
 ```

## 실행방법
 설치가 오류없이 완료되면 자동으로 프로그램이 실행됩니다. 
 프로그램은 fui, cvtgate, fcore의 세부분으로 나뉘며 각각의 시작 및 중지는 아래와 같이 수행할 수 있습니다.

### 시작
 ```
 sudo /etc/init.d/fui start
 sudo /etc/init.d/cvtgate start
 sudo /etc/init.d/fcore start
 ```
### 중지
 ```
 sudo /etc/init.d/fui stop
 sudo /etc/init.d/cvtgate stop
 sudo /etc/init.d/fcore stop
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

* [python](http://python.org)
python은 인터프리트형 고수준 언어로 다양한 영역의 어플리케이션을 제작하는데 활용되고 있습니다. 일반적인 리눅스 배포판에 디폴트로 설치되어 나오기 때문에 별도로 설치할 필요는 없습니다. 다만, 필요한 패키지들을 설치할 필요는 있습니다. 

## 교육자료

* [FarmOs V2 소개](https://gitlab.com/JiNong_Public/farmosV2/-/blob/master/docs/Introduction%20to%20FarmOS%20V2.pdf)

* [FarmOs V2 Rule 생성](https://gitlab.com/JiNong_Public/farmosV2/-/blob/master/docs/How%20to%20make%20a%20rule%20for%20FarmOS%20V2.pdf)

* [FarmOs V2 설치](https://gitlab.com/JiNong_Public/farmosV2/-/blob/master/docs/FarmOs%20V2%20%EC%84%A4%EC%B9%98.pdf)

* [FarmOs V2 실습 장비](https://gitlab.com/JiNong_Public/farmosV2/-/blob/master/docs/FarmOS%20V2%20%EC%9E%A5%EB%B9%84%EC%A0%9C%EC%9E%91.pdf)

* [FarmOs V2 실습 ](https://gitlab.com/JiNong_Public/farmosV2/-/blob/master/docs/FarmOS%20V2%20%EC%8B%A4%EC%8A%B5.pdf)


## 개발자

* JoonYong (tombraid@snu.ac.kr)
* Lalafell (choys@jinong.co.kr)
* 까앙 (do@jinong.co.kr)

## 도움을 주신 기관
FarmOS V2 개발을 위해 많은 기관에서 도움을 주셨습니다.
 * 농업과학원 농업공학부 스마트팜개발과
 * 원예특작과학원 시설원예연구소
 * 한국전자통신연구원
 * 한국과학기술연구원 강릉분원

