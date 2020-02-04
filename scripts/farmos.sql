-- 
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 루트 비밀번호 변경
UPDATE mysql.user SET authentication_string=PASSWORD('farmosv2@') WHERE user='root'; 

-- 데이터베이스 생성
CREATE database farmos;

-- 사용자 생성
CREATE USER 'farmos'@'localhost' IDENTIFIED BY 'farmosv2@';
GRANT ALL PRIVILEGES ON farmos.* TO 'farmos'@'localhost';
FLUSH PRIVILEGES; 

USE farmos;

-- ----------------------------
-- Table structure for configuration
-- ----------------------------
DROP TABLE IF EXISTS `configuration`;
CREATE TABLE `configuration` (
  `lastupdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `configuration` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- ----------------------------
-- Table structure for farm
-- ----------------------------
DROP TABLE IF EXISTS `farm`;
CREATE TABLE `farm` (
  `id` int(11) NOT NULL,
  `name` text NOT NULL,
  `info` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of farm
-- ----------------------------
BEGIN;
INSERT INTO `farm` VALUES (1, '기본 농장', '{\"telephone\":\"0313601970\",\"gps\":\"37.397962970070104,126.93206214966011\",\"address\":\"경기 안양시 동안구 관악대로 69\",\"postcode\":\"13956\"}');
COMMIT;

-- ----------------------------
-- Table structure for fields
-- ----------------------------
DROP TABLE IF EXISTS `fields`;
CREATE TABLE `fields` (
  `id` int(11) NOT NULL,
  `farm_id` int(11) NOT NULL,
  `name` text NOT NULL,
  `fieldtype` text NOT NULL,
  `uiinfo` text,
  `deleted` int(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_fields_farm_1` (`farm_id`),
  CONSTRAINT `fk_fields_farm_1` FOREIGN KEY (`farm_id`) REFERENCES `farm` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of fields
-- ----------------------------
BEGIN;
INSERT INTO `fields` VALUES (0, 1, '온실외부', 'local', '{\"index\":{\"local\":{\"isFull\":true,\"idfmt\":{\"device\":\"\",\"data\":\"\"},\"max\":\"max\",\"device\":{},\"data\":[]},\"greenhouse\":{\"isFull\":true,\"idfmt\":{\"device\":\"\",\"data\":\"\"},\"max\":\"max\",\"device\":{},\"data\":[]},\"actuator\":{\"isFull\":true,\"idfmt\":{\"device\":\"\",\"data\":\"\"},\"max\":\"max\",\"device\":{},\"data\":[]}},\"dashboard\":{\"temp\":{\"idfmt\":{\"device\":\"1[0-9][0-9][0-9][0-9][0-9][0-9]1\",\"data\":\"\"},\"max\":2,\"device\":{},\"data\":[],\"isFull\":false},\"ventilation\":{\"idfmt\":{\"device\":\"\",\"data\":\"\"},\"max\":1,\"device\":{},\"data\":[],\"isFull\":false},\"heating\":{\"idfmt\":{\"device\":\"\",\"data\":\"\"},\"max\":1,\"device\":{},\"data\":[],\"isFull\":false},\"retractable\":{\"max\":5,\"idfmt\":{\"device\":\"1[0-9][0-9][0-9][0-9][0-9][0-9]2\",\"data\":\"\"},\"device\":{\"14\":[],\"18\":[]},\"data\":[],\"isFull\":false},\"switch\":{\"max\":5,\"idfmt\":{\"device\":\"1[0-9][0-9][0-9][0-9][0-9][0-9]4\",\"data\":\"\"},\"device\":{\"22\":[]},\"data\":[],\"isFull\":false}}}', 0);
COMMIT;


-- ----------------------------
-- Table structure for core_rule_applied
-- ----------------------------
DROP TABLE IF EXISTS `core_rule_applied`;
CREATE TABLE `core_rule_applied` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `updated` timestamp NULL DEFAULT NULL,
  `field_id` int(11) DEFAULT NULL,
  `used` int(1) DEFAULT NULL,
  `deleted` int(1) NOT NULL DEFAULT '0',
  `constraints` text,
  `configurations` text,
  `inputs` text,
  `controllers` text,
  `outputs` text,
  `autoapplying` int(1) NOT NULL DEFAULT '0',
  `groupname` varchar(255) DEFAULT NULL,
  `template_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_core_rule_applied_fields_1` (`field_id`),
  CONSTRAINT `fk_core_rule_applied_fields_1` FOREIGN KEY (`field_id`) REFERENCES `fields` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for core_rule_template
-- ----------------------------
DROP TABLE IF EXISTS `core_rule_template`;
CREATE TABLE `core_rule_template` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `autoapplying` int(1) DEFAULT NULL,
  `constraints` text,
  `configurations` text,
  `controllers` text,
  `outputs` text,
  `groupname` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of core_rule_template
-- ----------------------------
BEGIN;
INSERT INTO `core_rule_template` VALUES (1, '내외부온도차', 0, '{\"target\":\"field\",\"devices\":[{\"class\":\"sensor\",\"type\":\"temperature-sensor\",\"desc\":\"내부온도센서를 선택해주세요.\",\"inputs\":{\"key\":\"#intemp\",\"codes\":[0,1]},\"name\":\"내부온도센서\"},{\"class\":\"sensor\",\"type\":\"temperature-sensor\",\"desc\":\"외부온도센서를 선택해주세요.\",\"inputs\":{\"key\":\"#outtemp\",\"codes\":[0,1]},\"name\":\"외부온도센서\"}]}', '{\"basic\":[],\"advanced\":[{\"key\":\"priority\",\"name\":\"우선순위\",\"value\":2,\"minmax\":[0,5],\"description\":\"룰의 우선순위\"},{\"key\":\"period\",\"name\":\"기간\",\"value\":180,\"description\":\"룰의 작동주기\"}],\"timespan\":{\"id\":0,\"used\":[true]}}', '{\"trigger\":{\"type\":\"eq\",\"eq\":\"intemp0 == 0 and outtemp0 == 0\"},\"processors\":[{\"type\":\"eq\",\"eq\":\"intemp1 - outtemp1\",\"outputs\":[\"#inoutdiff\"]}]}', '{\"data\":[{\"name\":\"내외부온도차\",\"outputs\":\"#inoutdiff\",\"outcode\":21,\"unit\":\"℃\"}]}', '주요지표');
INSERT INTO `core_rule_template` VALUES (2, '난방부하', 0, '{\"target\":\"field\",\"devices\":[{\"class\":\"sensor\",\"type\":\"temperature-sensor\",\"desc\":\"내부온도센서를 선택해주세요.\",\"inputs\":{\"key\":\"#intemp\",\"codes\":[0,1]},\"name\":\"내부온도센서\"}],\"data\":[{\"key\":\"#inoutdiff\",\"name\":\"내외부온도차\",\"desc\":\"내외부온도차를 선택해주세요.\",\"idfmt\":\"3[0-9][0-9][0-9][0-9][0-9]21\"}]}', '{\"basic\":[{\"key\":\"#KpH\",\"name\":\"난방온도비례상수\",\"value\":[-5,-5,-5,-5,-5,-5],\"type\":\"ts_float\",\"description\":\"난방온도에 대한 비례상수\"},{\"key\":\"#KdH\",\"name\":\"난방온도미분상수\",\"value\":[-3,-3,-3,-3,-3,-3],\"type\":\"ts_float\",\"description\":\"난방온도에 대한 미분상수\"},{\"key\":\"#KpO\",\"name\":\"내외부온도차비례상수\",\"value\":[-1,-1,-1,-1,-1,-1],\"type\":\"ts_float\",\"description\":\"내외부온도차에 대한 비례상수\"}],\"advanced\":[{\"key\":\"priority\",\"name\":\"우선순위\",\"value\":3,\"minmax\":[0,5],\"description\":\"룰의 우선순위\"},{\"key\":\"period\",\"name\":\"기간\",\"value\":60,\"description\":\"룰의 작동주기\"}],\"timespan\":{\"id\":1,\"used\":[true,true,true,true,true,true]}}', '{\"trigger\":{\"type\":\"eq\",\"eq\":\"intemp0 == 0\"},\"processors\":[{\"type\":\"mod\",\"mod\":\"welgro.heatload\",\"outputs\":[\"#heatload\"]}]}', '{\"data\":[{\"name\":\"난방부하\",\"outputs\":\"#heatload\",\"outcode\":25}]}', '특수지표');
INSERT INTO `core_rule_template` VALUES (3, '작물정식', 1, '{\"target\":\"field\",\"devices\":[],\"data\":[{\"key\":\"#crop\",\"name\":\"작물\",\"desc\":\"작물을 선택해주세요.\",\"idfmt\":\"[0-9][0-9]00003\"},{\"key\":\"#plantdate\",\"name\":\"정식일\",\"desc\":\"정식일을 선택해주세요.\",\"idfmt\":\"[0-9][0-9]00004\"}]}', '{\"basic\":[],\"advanced\":[{\"key\":\"priority\",\"name\":\"우선순위\",\"value\":2,\"minmax\":[0,5],\"description\":\"룰의 우선순위\"},{\"key\":\"period\",\"name\":\"기간\",\"value\":60,\"description\":\"룰의 작동주기\"}],\"timespan\":{\"id\":0,\"used\":[true]}}', '{\"processors\":[{\"type\":\"mod\",\"mod\":\"farmos_basic.crop\",\"outputs\":[\"#stage\",\"#period\"]}]}', '{\"data\":[{\"name\":\"생육단계\",\"outputs\":\"#stage\",\"outcode\":80},{\"name\":\"정식후일수\",\"outputs\":\"#period\",\"outcode\":81}]}', '기본지표');
INSERT INTO `core_rule_template` VALUES (4, '이동평균', 0, '{\"target\":\"field\",\"devices\":[{\"class\":\"sensor\",\"type\":null,\"desc\":\"센서를 선택해주세요.\",\"inputs\":{\"key\":\"#sensor\",\"codes\":[0,1]},\"name\":\"센서\"}],\"data\":[]}', '{\"basic\":[{\"key\":\"#number\",\"name\":\"개수\",\"value\":3,\"description\":\"이동평균낼 값의 수\"}],\"advanced\":[{\"key\":\"priority\",\"name\":\"우선순위\",\"value\":1,\"minmax\":[0,5],\"description\":\"룰의 우선순위\"},{\"key\":\"period\",\"name\":\"기간\",\"value\":60,\"description\":\"룰의 작동주기\"}],\"timespan\":{\"id\":0,\"used\":[true]}}', '{\"processors\":[{\"type\":\"mod\",\"mod\":\"farmos_filter.movingaverage\",\"outputs\":[\"#value\"]}]}', '{\"data\":[{\"name\":\"#1 이동평균\",\"outputs\":\"#value\",\"outcode\":1}]}', '필터');
INSERT INTO `core_rule_template` VALUES (5, '기본환기제어', 0, '{\"target\":\"field\",\"devices\":[{\"class\":\"sensor\",\"type\":\"temperature-sensor\",\"desc\":\"내부온도센서를 선택해주세요.\",\"inputs\":{\"key\":\"#intemp\",\"codes\":[0,1]},\"name\":\"내부온도센서\"},{\"class\":\"actuator\",\"type\":\"retractable/level1\",\"outputs\":\"#win1act\",\"optional\":false,\"desc\":\"창을 선택해주세요.\"},{\"class\":\"actuator\",\"type\":\"retractable/level1\",\"outputs\":\"#win2act\",\"optional\":true,\"desc\":\"창을 선택해주세요.\"},{\"class\":\"actuator\",\"type\":\"retractable/level1\",\"outputs\":\"#win3act\",\"optional\":true,\"desc\":\"창을 선택해주세요.\"},{\"class\":\"actuator\",\"type\":\"retractable/level1\",\"outputs\":\"#win4act\",\"optional\":true,\"desc\":\"창을 선택해주세요.\"},{\"class\":\"actuator\",\"type\":\"retractable/level1\",\"outputs\":\"#win5act\",\"optional\":true,\"desc\":\"창을 선택해주세요.\"},{\"class\":\"actuator\",\"type\":\"retractable/level1\",\"outputs\":\"#win6act\",\"optional\":true,\"desc\":\"창을 선택해주세요.\"}],\"data\":[]}', '{\"basic\":[{\"key\":\"#worktime\",\"name\":\"작동시간값\",\"value\":30,\"description\":\"작동시간값\"}],\"advanced\":[{\"key\":\"priority\",\"name\":\"우선순위\",\"value\":2,\"minmax\":[0,5],\"description\":\"룰의 우선순위\"},{\"key\":\"period\",\"name\":\"기간\",\"value\":180,\"description\":\"룰의 작동주기\"}],\"timespan\":{\"id\":1,\"used\":[true,true,true,true,true,true]}}', '{\"trigger\":{\"type\":\"eq\",\"eq\":\"intemp0 == 0\"},\"processors\":[{\"type\":\"eq\",\"eq\":\"303 if intemp1 > vtemp else 304 \",\"outputs\":[\"#cmd\"]},{\"type\":\"eq\",\"eq\":\"(intemp1 - vtemp) * worktime\",\"outputs\":[\"#time\"]}]}', '{\"req\":[{\"cmd\":\"#cmd\",\"pnames\":[\"time\"],\"params\":[\"#time\"],\"targets\":[\"#win1act\"]}]}', '창제어');
INSERT INTO `core_rule_template` VALUES (6, '온도보상', 0, '{\"target\":\"field\",\"devices\":[{\"class\":\"sensor\",\"type\":\"temperature-sensor\",\"desc\":\"내부온도센서를 선택해주세요.\",\"inputs\":{\"key\":\"#intemp\",\"codes\":[0,1]},\"name\":\"내부온도센서\"}],\"data\":[{\"key\":\"#stdtemp\",\"name\":\"기준온도\",\"desc\":\"기준온도를 선택해주세요.\",\"idfmt\":\"3[0-9][0-9][0-9][0-9][0-9]32\"}]}', '{\"basic\":[],\"advanced\":[{\"key\":\"priority\",\"name\":\"우선순위\",\"value\":2,\"minmax\":[0,5],\"description\":\"룰의 우선순위\"},{\"key\":\"period\",\"name\":\"기간\",\"value\":60,\"description\":\"룰의 작동주기\"}],\"timespan\":{\"id\":0,\"used\":[true]}}', '{\"processors\":[{\"type\":\"mod\",\"mod\":\"welgro.temperature_compensation\",\"outputs\":[\"#tctoday\",\"#tc1day\",\"#tc2day\",\"#tc3day\"]}]}', '{\"data\":[{\"name\":\"당일온도보상\",\"outputs\":\"#tctoday\",\"outcode\":1},{\"name\":\"온도보상(1일)\",\"outputs\":\"#tc1day\",\"outcode\":27},{\"name\":\"온도보상(2일)\",\"outputs\":\"#tc2day\",\"outcode\":28},{\"name\":\"온도보상(3일)\",\"outputs\":\"#tc3day\",\"outcode\":29}]}', '특수지표');
INSERT INTO `core_rule_template` VALUES (7, '수분부족분', 0, '{\"target\":\"field\",\"devices\":[{\"class\":\"sensor\",\"type\":\"temperature-sensor\",\"desc\":\"내부온도센서를 선택해주세요.\",\"inputs\":{\"key\":\"#intemp\",\"codes\":[0,1]},\"name\":\"내부온도센서\"},{\"class\":\"sensor\",\"type\":\"humidity-sensor\",\"desc\":\"내부습도센서를 선택해주세요.\",\"inputs\":{\"key\":\"#inhum\",\"codes\":[0,1]},\"name\":\"내부습도센서\"}],\"data\":[]}', '{\"basic\":[],\"advanced\":[{\"key\":\"#pwvA\",\"name\":\"A계수\",\"value\":8.07131,\"description\":\"PWV 계산을 위한 A 계수\"},{\"key\":\"#pwvB\",\"name\":\"B계수\",\"value\":1730.63,\"description\":\"PWV 계산을 위한 B 계수\"},{\"key\":\"#pwvC\",\"name\":\"C계수\",\"value\":233.426,\"description\":\"PWV 계산을 위한 C 계수\"},{\"key\":\"priority\",\"name\":\"우선순위\",\"value\":2,\"minmax\":[0,5],\"description\":\"룰의 우선순위\"},{\"key\":\"period\",\"name\":\"기간\",\"value\":60,\"description\":\"룰의 작동주기\"}],\"timespan\":{\"id\":0,\"used\":[true]}}', '{\"processors\":[{\"type\":\"eq\",\"eq\":\"10 ** ( pwvA - pwvB / ( pwvC + intemp1 ))\",\"outputs\":[\"#PWV\"]},{\"type\":\"eq\",\"eq\":\"PWV - ( inhum1 * PWV / 100 )\",\"outputs\":[\"#HD\"]}]}', '{\"data\":[{\"name\":\"PWV\",\"outputs\":\"#PWV\",\"outcode\":22},{\"name\":\"수분부족분\",\"outputs\":\"#HD\",\"outcode\":23}]}', '특수지표');
INSERT INTO `core_rule_template` VALUES (8, '지수가중이동평균', 0, '{\"target\":\"field\",\"devices\":[{\"class\":\"sensor\",\"type\":null,\"desc\":\"센서를 선택해주세요.\",\"inputs\":{\"key\":\"#sensor\",\"codes\":[0,1]},\"name\":\"센서\"}],\"data\":[]}', '{\"basic\":[{\"key\":\"#weight\",\"name\":\"가중치\",\"value\":0.5,\"description\":\"가중치의 범위는 0~1 입니다.\"}],\"advanced\":[{\"key\":\"priority\",\"name\":\"우선순위\",\"value\":1,\"minmax\":[0,5],\"description\":\"룰의 우선순위\"},{\"key\":\"period\",\"name\":\"기간\",\"value\":60,\"description\":\"룰의 작동주기\"}],\"timespan\":{\"id\":0,\"used\":[true]}}', '{\"processors\":[{\"type\":\"mod\",\"mod\":\"farmos_filter.lowpassfilter\",\"outputs\":[\"#value\"]}]}', '{\"data\":[{\"name\":\"#1 지수가중이동평균\",\"outputs\":\"#value\",\"outcode\":1}]}', '필터');
INSERT INTO `core_rule_template` VALUES (9, '온실 온도 가이드', 1, '{\"target\":\"field\",\"devices\":[],\"data\":[]}', '{\"basic\":[],\"advanced\":[{\"key\":\"priority\",\"name\":\"우선순위\",\"value\":2,\"minmax\":[0,5],\"description\":\"룰의 우선순위\"},{\"key\":\"period\",\"name\":\"기간\",\"value\":180,\"description\":\"룰의 작동주기\"}],\"timespan\":{\"id\":1,\"used\":[true,true,true,true,true,true]}}', '{\"processors\":[{\"type\":\"mod\",\"mod\":\"farmos_filter.temperatureguide\",\"outputs\":[\"#venttemp\",\"#heattemp\",\"#stdtemp\"]}]}', '{\"data\":[{\"name\":\"환기온도\",\"outputs\":\"#venttemp\",\"outcode\":30,\"unit\":\"℃\"},{\"name\":\"난방온도\",\"outputs\":\"#heattemp\",\"outcode\":31,\"unit\":\"℃\"},{\"name\":\"온실기준온도\",\"outputs\":\"#stdtemp\",\"outcode\":32,\"unit\":\"℃\"}]}', '기본지표');
INSERT INTO `core_rule_template` VALUES (10, '누적일사', 0, '{\"target\":\"farm\",\"devices\":[{\"class\":\"sensor\",\"type\":\"radiation-sensor\",\"desc\":\"외부일사센서를 선택해주세요.\",\"inputs\":{\"key\":\"#outrad\",\"codes\":[0,1]},\"name\":\"외부일사센서\"}]}', '{\"basic\":[],\"advanced\":[{\"key\":\"priority\",\"name\":\"우선순위\",\"value\":1,\"minmax\":[0,5],\"description\":\"룰의 우선순위\"},{\"key\":\"period\",\"name\":\"기간\",\"value\":60,\"description\":\"룰의 작동주기\"}],\"timespan\":{\"id\":0,\"used\":[true]}}', '{\"processors\":[{\"type\":\"mod\",\"mod\":\"farmos_filter.radaccumulate\",\"outputs\":[\"#accrad\"]}]}', '{\"data\":[{\"name\":\"누적일사\",\"outputs\":\"#accrad\",\"outcode\":1,\"unit\":\"J/cm²\"}]}', '주요지표');
INSERT INTO `core_rule_template` VALUES (11, '환기부하', 0, '{\"target\":\"field\",\"devices\":[{\"class\":\"sensor\",\"type\":\"temperature-sensor\",\"desc\":\"내부온도센서를 선택해주세요.\",\"inputs\":{\"key\":\"#intemp\",\"codes\":[0,1]},\"name\":\"내부온도센서\"}],\"data\":[{\"key\":\"#inoutdiff\",\"name\":\"내외부온도차\",\"desc\":\"내외부온도차를 선택해주세요.\",\"idfmt\":\"3[0-9][0-9][0-9][0-9][0-9]21\"}]}', '{\"basic\":[{\"key\":\"#KpV\",\"name\":\"환기온도비례상수\",\"value\":[5,5,5,5,5,5],\"type\":\"ts_float\",\"description\":\"환기온도에 대한 비례상수\"},{\"key\":\"#KdV\",\"name\":\"환기온도미분상수\",\"value\":[3,3,3,3,3,3],\"type\":\"ts_float\",\"description\":\"환기온도에 대한 미분상수\"},{\"key\":\"#KiV\",\"name\":\"환기온도적분상수\",\"value\":[3,3,3,3,3,3],\"type\":\"ts_float\",\"description\":\"환기온도에 대한 미분상수\"},{\"key\":\"#KpO\",\"name\":\"내외부온도차비례상수\",\"value\":[1,1,1,1,1,1],\"type\":\"ts_float\",\"description\":\"내외부온도차에 대한 비례상수\"},{\"key\":\"#KdO\",\"name\":\"내외부온도차미분상수\",\"value\":[1,1,1,1,1,1],\"type\":\"ts_float\",\"description\":\"내외부온도차에 대한 미분상수\"}],\"advanced\":[{\"key\":\"priority\",\"name\":\"우선순위\",\"value\":3,\"minmax\":[0,5],\"description\":\"룰의 우선순위\"},{\"key\":\"period\",\"name\":\"기간\",\"value\":60,\"description\":\"룰의 작동주기\"}],\"timespan\":{\"id\":1,\"used\":[true,true,true,true,true,true]}}', '{\"trigger\":{\"type\":\"eq\",\"eq\":\"intemp0 == 0\"},\"processors\":[{\"type\":\"mod\",\"mod\":\"welgro.ventload\",\"outputs\":[\"#ventload\"]}]}', '{\"data\":[{\"name\":\"환기부하\",\"outputs\":\"#ventload\",\"outcode\":26}]}', '특수지표');
INSERT INTO `core_rule_template` VALUES (12, '풍상풍하', 0, '{\"target\":\"farm\",\"devices\":[{\"class\":\"sensor\",\"type\":\"winddirection-sensor\",\"desc\":\"외부풍향센서를 선택해주세요.\",\"inputs\":{\"key\":\"#wdir\",\"codes\":[0,1]},\"name\":\"외부풍향센서\"}]}', '{\"basic\":[{\"key\":\"#ghdir\",\"name\":\"온실방향각\",\"value\":0,\"description\":\"온실의 방향각(북쪽을 기준으로 길이방향 각도)\"}],\"advanced\":[{\"key\":\"priority\",\"name\":\"우선순위\",\"value\":1,\"minmax\":[0,5],\"description\":\"룰의 우선순위\"},{\"key\":\"period\",\"name\":\"기간\",\"value\":60,\"description\":\"룰의 작동주기\"}],\"timespan\":{\"id\":0,\"used\":[true]}}', '{\"trigger\":{\"type\":\"eq\",\"eq\":\"wdir0 == 0\"},\"processors\":[{\"type\":\"mod\",\"mod\":\"farmos_basic.windlet\",\"outputs\":[\"#rightwind\",\"#leftwind\"]}]}', '{\"data\":[{\"name\":\"우측바람\",\"outputs\":\"#rightwind\",\"outcode\":33},{\"name\":\"좌측바람\",\"outputs\":\"#leftwind\",\"outcode\":34}]}', '주요지표');
INSERT INTO `core_rule_template` VALUES (13, '옆온추정', 0, '{\"target\":\"field\",\"devices\":[{\"class\":\"sensor\",\"type\":\"temperature-sensor\",\"desc\":\"내부온도센서를 선택해주세요.\",\"inputs\":{\"key\":\"#intemp\",\"codes\":[0,1]},\"name\":\"내부온도센서\"},{\"class\":\"sensor\",\"type\":\"temperature-sensor\",\"desc\":\"외부온도센서를 선택해주세요.\",\"inputs\":{\"key\":\"#outtemp\",\"codes\":[0,1]},\"name\":\"외부온도센서\"}]}', '{\"basic\":[],\"advanced\":[{\"key\":\"priority\",\"name\":\"우선순위\",\"value\":2,\"minmax\":[0,5],\"description\":\"룰의 우선순위\"},{\"key\":\"period\",\"name\":\"기간\",\"value\":180,\"description\":\"룰의 작동주기\"}],\"timespan\":{\"id\":0,\"used\":[true]}}', '{\"trigger\":{\"type\":\"eq\",\"eq\":\"intemp0 == 0 and outtemp0 == 0\"},\"processors\":[{\"type\":\"eq\",\"eq\":\"(intemp1 + outtemp1) / 2\",\"outputs\":[\"#leaftemp\"]}]}', '{\"data\":[{\"name\":\"옆온\",\"outputs\":\"#leaftemp\",\"outcode\":91,\"unit\":\"℃\"}]}', '주요지표');
INSERT INTO `core_rule_template` VALUES (14, '작물활성도', 0, '{\"target\":\"field\",\"devices\":[{\"class\":\"sensor\",\"type\":\"temperature-sensor\",\"desc\":\"내부온도센서를 선택해주세요.\",\"inputs\":{\"key\":\"#intemp\",\"codes\":[0,1]},\"name\":\"내부온도센서\"},{\"class\":\"sensor\",\"type\":\"pyranometer-sensor\",\"desc\":\"일사량센서를 선택해주세요.\",\"inputs\":{\"key\":\"#rad\",\"codes\":[0,1]},\"name\":\"일사센서\"}],\"data\":[{\"key\":\"#tleaf\",\"name\":\"엽온\",\"desc\":\"엽온추정치를 선택해주세요.\",\"idfmt\":\"3[0-9][0-9][0-9][0-9][0-9]91\"},{\"key\":\"#HD\",\"name\":\"수분부족분\",\"desc\":\"수분부족분를 선택해주세요.\",\"idfmt\":\"3[0-9][0-9][0-9][0-9][0-9]23\"}]}', '{\"basic\":[],\"advanced\":[{\"key\":\"#A\",\"name\":\"A계수\",\"value\":4.545455,\"description\":\"작물활성도 계산을 위한 A 계수\"},{\"key\":\"#B\",\"name\":\"B계수\",\"value\":0.0166667,\"description\":\"작물활성도 계산을 위한 B 계수\"},{\"key\":\"#C\",\"name\":\"C계수\",\"value\":15,\"description\":\"작물활성도 계산을 위한 C 계수\"},{\"key\":\"#D\",\"name\":\"D계수\",\"value\":5.15,\"description\":\"작물활성도 계산을 위한 D 계수\"},{\"key\":\"priority\",\"name\":\"우선순위\",\"value\":2,\"minmax\":[0,5],\"description\":\"룰의 우선순위\"},{\"key\":\"period\",\"name\":\"기간\",\"value\":60,\"description\":\"룰의 작동주기\"}],\"timespan\":{\"id\":2,\"used\":[true,true,true,true,true]}}', '{\"processors\":[{\"type\":\"eq\",\"eq\":\"A * (intemp1 - tleaf) + B * rad1 + C * exp((HD - 8)/D)\",\"outputs\":[\"#CAI\"]}]}', '{\"data\":[{\"name\":\"작물활성도\",\"outputs\":\"#CAI\",\"outcode\":24}]}', '특수지표');
INSERT INTO `core_rule_template` VALUES (15, '환기부하창제어', 0, '{\"target\":\"field\",\"devices\":[{\"class\":\"actuator\",\"type\":\"retractable/level1\",\"outputs\":\"#leftwin\",\"desc\":\"좌측 창을 선택해주세요.\"},{\"class\":\"actuator\",\"type\":\"retractable/level1\",\"outputs\":\"#rightwin\",\"desc\":\"우측 창을 선택해주세요.\"}],\"data\":[{\"key\":\"#ventload\",\"name\":\"환기부하\",\"desc\":\"환기부하를 선택해주세요.\",\"idfmt\":\"3[0-9][0-9][0-9][0-9][0-9]26\"},{\"key\":\"#rightwind\",\"name\":\"우측바람\",\"desc\":\"우측바람여부를 선택해주세요.\",\"idfmt\":\"3[0-9][0-9][0-9][0-9][0-9]33\"},{\"key\":\"#leftwind\",\"name\":\"좌측바람\",\"desc\":\"좌측바람여부를 선택해주세요.\",\"idfmt\":\"3[0-9][0-9][0-9][0-9][0-9]34\"}]}', '{\"basic\":[],\"advanced\":[{\"key\":\"priority\",\"name\":\"우선순위\",\"value\":4,\"minmax\":[0,5],\"description\":\"룰의 우선순위\"},{\"key\":\"period\",\"name\":\"기간\",\"value\":180,\"description\":\"룰의 작동주기\"}],\"timespan\":{\"id\":1,\"used\":[true,true,true,true,true,true]}}', '{\"processors\":[{\"type\":\"mod\",\"mod\":\"welgro.ventloadcontrol\",\"outputs\":[\"#leftcmd\",\"#leftpos\",\"#rightcmd\",\"#rightpos\"]}]}', '{\"req\":[{\"cmd\":\"#leftcmd\",\"pnames\":[\"position\"],\"params\":[\"#leftpos\"],\"targets\":[\"#leftwin\"]},{\"cmd\":\"#rightcmd\",\"pnames\":[\"position\"],\"params\":[\"#rightpos\"],\"targets\":[\"#rightwin\"]}]}', '창제어');
INSERT INTO `core_rule_template` VALUES (16, '작물활성도제어', 0, '{\"target\":\"field\",\"devices\":[{\"class\":\"actuator\",\"type\":\"switch/level1\",\"outputs\":\"#fan\",\"desc\":\"유동팬을 선택해주세요.\"}],\"data\":[{\"key\":\"#cai\",\"name\":\"작물활성도\",\"desc\":\"작물활성도를 선택해주세요.\",\"idfmt\":\"3[0-9][0-9][0-9][0-9][0-9]24\"}]}', '{\"basic\":[],\"advanced\":[{\"key\":\"priority\",\"name\":\"우선순위\",\"value\":4,\"minmax\":[0,5],\"description\":\"룰의 우선순위\"},{\"key\":\"period\",\"name\":\"기간\",\"value\":180,\"description\":\"룰의 작동주기\"}],\"timespan\":{\"id\":1,\"used\":[false,true,true,true,false,false]}}', '{\"trigger\":{\"type\":\"eq\",\"eq\":\"cai > 90\"},\"processors\":[{\"type\":\"eq\",\"eq\":\"202\",\"outputs\":[\"#cmd\"]},{\"type\":\"eq\",\"eq\":\"180\",\"outputs\":[\"#time\"]}]}', '{\"req\":[{\"cmd\":\"#cmd\",\"params\":[\"#time\"],\"targets\":[\"#fan\"]}]}', '스위치제어');
INSERT INTO `core_rule_template` VALUES (17, ' 유동팬제어', 0, '{\"target\":\"field\",\"devices\":[{\"class\":\"sensor\",\"type\":\"temperature-sensor\",\"desc\":\"내부온도센서를 선택해주세요.\",\"inputs\":{\"key\":\"#intemp\",\"codes\":[0,1]},\"name\":\"내부온도센서\"},{\"class\":\"sensor\",\"type\":\"humidity-sensor\",\"desc\":\"습도센서를 선택해주세요.\",\"inputs\":{\"key\":\"#inhum\",\"codes\":[0,1]},\"name\":\"내부습도센서\"},{\"class\":\"actuator\",\"type\":\"switch/level1\",\"outputs\":\"#fan\",\"optional\":false,\"desc\":\"유동팬을 선택해주세요.\"}],\"data\":[]}', '{\"basic\":[{\"key\":\"#ctemp\",\"name\":\"설정온도값\",\"value\":[25,25,25,25,25,25],\"type\":\"ts_float\",\"description\":\"설정온도이상이면 작동\"},{\"key\":\"#chum\",\"name\":\"설정습도값\",\"value\":[90,90,90,90,90,90],\"type\":\"ts_float\",\"description\":\"설정습도이상이면 작동\"}],\"advanced\":[{\"key\":\"priority\",\"name\":\"우선순위\",\"value\":2,\"minmax\":[0,5],\"description\":\"룰의 우선순위\"},{\"key\":\"period\",\"name\":\"기간\",\"value\":1200,\"description\":\"룰의 작동주기\"}],\"timespan\":{\"id\":1,\"used\":[false,false,true,true,false,false]}}', '{\"trigger\":{\"type\":\"eq\",\"eq\":\"intemp0 == 0\"},\"processors\":[{\"type\":\"eq\",\"eq\":\"201 if intemp1 > ctemp or inhum1 > chum else 0 \",\"outputs\":[\"#cmd\"]},{\"type\":\"eq\",\"eq\":\"600\",\"outputs\":[\"#tm\"]}]}', '{\"req\":[{\"cmd\":\"#cmd\",\"pnames\":[\"time\"],\"params\":[\"#tm\"],\"targets\":[\"#fan\"]}]}', '스위치제어');
INSERT INTO `core_rule_template` VALUES (18, '차광커튼제어', 0, '{\"target\":\"field\",\"devices\":[{\"class\":\"sensor\",\"type\":\"pyranometer-sensor\",\"desc\":\"일사센서를 선택해주세요.\",\"inputs\":{\"key\":\"#sol\",\"codes\":[0,1]},\"name\":\"일사센서\"},{\"class\":\"actuator\",\"type\":\"retractable/level2\",\"outputs\":\"#curtain\",\"name\":\"차광커튼\",\"desc\":\"차광커튼을 선택해주세요.\"}]}', '{\"basic\":[{\"key\":\"#high\",\"name\":\"상한값\",\"value\":[90,90,90,90,90,90],\"type\":\"ts_float\",\"description\":\"상한 개폐율\"},{\"key\":\"#low\",\"name\":\"하한값\",\"value\":[50,50,50,50,50,50],\"type\":\"ts_float\",\"description\":\"하한 개폐율\"},{\"key\":\"#csol\",\"name\":\"작동 일사량\",\"value\":[500,500,500,500,500,500],\"type\":\"ts_float\",\"description\":\"작동 일사량 이상일 경우에만 차광커튼이 작동합니다.\"},{\"key\":\"#ratio\",\"name\":\"비율\",\"value\":[10,10,10,10,10,10],\"type\":\"ts_float\",\"description\":\"설정값당 1%의 개폐율입니다.\"}],\"advanced\":[{\"key\":\"priority\",\"name\":\"우선순위\",\"value\":2,\"minmax\":[0,5],\"description\":\"룰의 우선순위\"},{\"key\":\"period\",\"name\":\"기간\",\"value\":1200,\"description\":\"룰의 작동주기\"}],\"timespan\":{\"id\":1,\"used\":[false,false,true,true,false,false]}}', '{\"trigger\":{\"type\":\"eq\",\"eq\":\"sol0 == 0\"},\"processors\":[{\"type\":\"eq\",\"eq\":\"0 if sol1 < csol else 305\",\"outputs\":[\"#cmd\"]},{\"type\":\"eq\",\"eq\":\"high if low + (sol1 - csol) / ratio > high else low if (sol1 - csol) / ratio < 0 else low + (sol1 - csol) / ratio \",\"outputs\":[\"#pos\"]}]}', '{\"req\":[{\"cmd\":\"#cmd\",\"pnames\":[\"position\"],\"params\":[\"#pos\"],\"targets\":[\"#curtain\"]}]}', '창제어');
INSERT INTO `core_rule_template` VALUES (19, '보온커튼제어', 0, '{\"target\":\"field\",\"devices\":[{\"class\":\"sensor\",\"type\":\"temperature-sensor\",\"desc\":\"외부온도센서를 선택해주세요.\",\"inputs\":{\"key\":\"#temp\",\"codes\":[0,1]},\"name\":\"외부온도센서\"},{\"class\":\"actuator\",\"type\":\"retractable/level2\",\"outputs\":\"#curtain\",\"name\":\"보온커튼\",\"desc\":\"보온커튼을 선택해주세요.\"}]}', '{\"basic\":[{\"key\":\"#high\",\"name\":\"상한값\",\"value\":[90,90,90,90,90,90],\"type\":\"ts_float\",\"description\":\"상한 개폐율\"},{\"key\":\"#low\",\"name\":\"하한값\",\"value\":[50,50,50,50,50,50],\"type\":\"ts_float\",\"description\":\"하한 개폐율\"},{\"key\":\"#ctemp\",\"name\":\"작동온도\",\"value\":[-1,-1,-1,-1,-1,-1],\"type\":\"ts_float\",\"description\":\"작동온도 미만일 경우에만 보온커튼이 작동합니다.\"},{\"key\":\"#ratio\",\"name\":\"비율\",\"value\":[0.2,0.2,0.2,0.2,0.2,0.2],\"type\":\"ts_float\",\"description\":\"설정값당 1%의 개폐율입니다.\"}],\"advanced\":[{\"key\":\"priority\",\"name\":\"우선순위\",\"value\":2,\"minmax\":[0,5],\"description\":\"룰의 우선순위\"},{\"key\":\"period\",\"name\":\"기간\",\"value\":1200,\"description\":\"룰의 작동주기\"}],\"timespan\":{\"id\":1,\"used\":[false,false,true,true,false,false]}}', '{\"trigger\":{\"type\":\"eq\",\"eq\":\"temp0 == 0\"},\"processors\":[{\"type\":\"eq\",\"eq\":\"0 if temp1 > ctemp else 305\",\"outputs\":[\"#cmd\"]},{\"type\":\"eq\",\"eq\":\"low if high - (ctemp - temp1) / ratio < low else high if (ctemp - temp1) / ratio < 0 else high - (ctemp - temp1) / ratio \",\"outputs\":[\"#pos\"]}]}', '{\"req\":[{\"cmd\":\"#cmd\",\"pnames\":[\"position\"],\"params\":[\"#pos\"],\"targets\":[\"#curtain\"]}]}', '창제어');
INSERT INTO `core_rule_template` VALUES (20, '이슬점추정', 0, '{\"target\":\"field\",\"devices\":[{\"class\":\"sensor\",\"type\":\"temperature-sensor\",\"desc\":\"내부온도센서를 선택해주세요.\",\"inputs\":{\"key\":\"#intemp\",\"codes\":[0,1]},\"name\":\"내부온도센서\"},{\"class\":\"sensor\",\"type\":\"humidity-sensor\",\"desc\":\"내부습도센서를 선택해주세요.\",\"inputs\":{\"key\":\"#inhum\",\"codes\":[0,1]},\"name\":\"내부습도센서\"}]}', '{\"basic\":[],\"advanced\":[{\"key\":\"priority\",\"name\":\"우선순위\",\"value\":2,\"minmax\":[0,5],\"description\":\"룰의 우선순위\"},{\"key\":\"period\",\"name\":\"기간\",\"value\":60,\"description\":\"룰의 작동주기\"}],\"timespan\":{\"id\":0,\"used\":[true]}}', '{\"trigger\":{\"type\":\"eq\",\"eq\":\"intemp0 == 0 and inhum0 == 0\"},\"processors\":[{\"type\":\"eq\",\"eq\":\"(243.12 * (17.62 * intemp1 /(243.12 + intemp1) + log(inhum1 / 100.0))) / (17.62 - (17.62 * intemp1 /(243.12 + intemp1)) + log(inhum1 / 100.0))\",\"outputs\":[\"#dewpoint\"]}]}', '{\"data\":[{\"name\":\"이슬점\",\"outputs\":\"#dewpoint\",\"outcode\":35,\"unit\":\"℃\"}]}', '특수지표');
COMMIT;

-- ----------------------------
-- Table structure for core_timespan
-- ----------------------------
DROP TABLE IF EXISTS `core_timespan`;
CREATE TABLE `core_timespan` (
  `id` int(11) NOT NULL,
  `field_id` int(11) NOT NULL,
  `timespan` text,
  `name` varchar(50) NOT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`,`field_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of core_timespan
-- ----------------------------
BEGIN;
INSERT INTO `core_timespan` VALUES (1, -1, '{\"configuration\":{\"timing\":\"sun\",\"longitude\":128.856632,\"latitude\":37.798953},\"parts\":[{\"id\":\"span-1\",\"name\":\"P-1\",\"to\":\"14400\",\"value\":\"14400\",\"type\":\"\"},{\"id\":\"span-2\",\"name\":\"P-2\",\"to\":\"rise+1000\",\"value\":\"1000\",\"type\":\"rise+\"},{\"id\":\"span-3\",\"name\":\"P-3\",\"to\":\"rise+10800\",\"value\":\"10800\",\"type\":\"rise+\"},{\"id\":\"span-4\",\"name\":\"P-4\",\"to\":\"set-10800\",\"value\":\"10800\",\"type\":\"set-\"},{\"id\":\"span-5\",\"name\":\"P-5\",\"to\":\"set+10000\",\"value\":\"10000\",\"type\":\"set+\"},{\"id\":\"span-6\",\"name\":\"P-6\",\"to\":\"86400\",\"value\":\"86400\",\"type\":\"\"}],\"data\":[],\"threshold\":[{\"id\":\"vtemp\",\"name\":\"환기온도\",\"linetype\":\"monotone\",\"unit\":\"℃\",\"timeoption\":[{\"span\":\"span-1\",\"to\":15},{\"span\":\"span-2\",\"to\":-4},{\"span\":\"span-3\",\"to\":22},{\"span\":\"span-4\",\"to\":25},{\"span\":\"span-5\",\"to\":23},{\"span\":\"span-6\",\"to\":15}],\"opacity\":0,\"xValue\":1047,\"yValue\":107.28692626953125},{\"id\":\"htemp\",\"name\":\"난방온도\",\"linetype\":\"monotone\",\"unit\":\"℃\",\"timeoption\":[{\"span\":\"span-1\",\"to\":8},{\"span\":\"span-2\",\"to\":10},{\"span\":\"span-3\",\"to\":18},{\"span\":\"span-4\",\"to\":20},{\"span\":\"span-5\",\"to\":18},{\"span\":\"span-6\",\"to\":10}],\"opacity\":0,\"xValue\":1047,\"yValue\":138.88693237304688}]}', '시간대별 환기/난방온도기준', '2019-09-06 16:22:59');
INSERT INTO `core_timespan` VALUES (1, 0, '{\"configuration\":{\"timing\":\"sun\",\"longitude\":128.856632,\"latitude\":37.798953},\"parts\":[{\"id\":\"span-1\",\"name\":\"P-1\",\"to\":\"14400\",\"value\":\"14400\",\"type\":\"\"},{\"id\":\"span-2\",\"name\":\"P-2\",\"to\":\"rise+1000\",\"value\":\"1000\",\"type\":\"rise+\"},{\"id\":\"span-3\",\"name\":\"P-3\",\"to\":\"rise+10800\",\"value\":\"10800\",\"type\":\"rise+\"},{\"id\":\"span-4\",\"name\":\"P-4\",\"to\":\"set-10800\",\"value\":\"10800\",\"type\":\"set-\"},{\"id\":\"span-5\",\"name\":\"P-5\",\"to\":\"set+10000\",\"value\":\"10000\",\"type\":\"set+\"},{\"id\":\"span-6\",\"name\":\"P-6\",\"to\":\"86400\",\"value\":\"86400\",\"type\":\"\"}],\"data\":[],\"threshold\":[{\"id\":\"vtemp\",\"name\":\"환기온도\",\"linetype\":\"monotone\",\"unit\":\"℃\",\"timeoption\":[{\"span\":\"span-1\",\"to\":15},{\"span\":\"span-2\",\"to\":-4},{\"span\":\"span-3\",\"to\":22},{\"span\":\"span-4\",\"to\":25},{\"span\":\"span-5\",\"to\":23},{\"span\":\"span-6\",\"to\":15}],\"opacity\":0,\"xValue\":1047,\"yValue\":107.28692626953125},{\"id\":\"htemp\",\"name\":\"난방온도\",\"linetype\":\"monotone\",\"unit\":\"℃\",\"timeoption\":[{\"span\":\"span-1\",\"to\":8},{\"span\":\"span-2\",\"to\":10},{\"span\":\"span-3\",\"to\":18},{\"span\":\"span-4\",\"to\":20},{\"span\":\"span-5\",\"to\":18},{\"span\":\"span-6\",\"to\":10}],\"opacity\":0,\"xValue\":1047,\"yValue\":138.88693237304688}]}', '시간대별 환기/난방온도기준', '2019-09-06 16:22:59');
INSERT INTO `core_timespan` VALUES (2, -1, '{\"configuration\":{\"timing\":\"sun\",\"longitude\":128.856632,\"latitude\":37.798953},\"parts\":[{\"id\":\"span-1\",\"name\":\"P1\",\"to\":\"32400\",\"value\":\"32400\",\"type\":\"\"},{\"id\":\"span-2\",\"name\":\"P2\",\"to\":\"39600\",\"value\":\"39600\",\"type\":\"\"},{\"id\":\"span-3\",\"name\":\"P3\",\"to\":\"54000\",\"value\":\"54000\",\"type\":\"\"},{\"id\":\"span-4\",\"name\":\"P4\",\"to\":\"61200\",\"value\":\"61200\",\"type\":\"\"},{\"id\":\"span-5\",\"name\":\"P5\",\"to\":\"86400\",\"value\":\"86400\",\"type\":\"\"}],\"data\":[],\"threshold\":[{\"id\":\"highcai\",\"name\":\"작물활성도최대치\",\"linetype\":\"monotone\",\"unit\":\"\",\"timeoption\":[{\"span\":\"span-1\",\"to\":30},{\"span\":\"span-2\",\"to\":70},{\"span\":\"span-3\",\"to\":70},{\"span\":\"span-4\",\"to\":30},{\"span\":\"span-5\",\"to\":30}],\"opacity\":0,\"xValue\":1047,\"yValue\":107.28692626953125},{\"id\":\"lowcai\",\"name\":\"작물활성도최소치\",\"linetype\":\"monotone\",\"unit\":\"\",\"timeoption\":[{\"span\":\"span-1\",\"to\":0},{\"span\":\"span-2\",\"to\":40},{\"span\":\"span-3\",\"to\":40},{\"span\":\"span-4\",\"to\":0},{\"span\":\"span-5\",\"to\":0}],\"opacity\":0,\"xValue\":1047,\"yValue\":138.88693237304688}]}', '시간대별 작물활성도 기준', '2019-07-29 13:08:31');
INSERT INTO `core_timespan` VALUES (2, 0, '{\"configuration\":{\"timing\":\"sun\",\"longitude\":128.856632,\"latitude\":37.798953},\"parts\":[{\"id\":\"span-1\",\"name\":\"P1\",\"to\":\"32400\",\"value\":\"32400\",\"type\":\"\"},{\"id\":\"span-2\",\"name\":\"P2\",\"to\":\"39600\",\"value\":\"39600\",\"type\":\"\"},{\"id\":\"span-3\",\"name\":\"P3\",\"to\":\"54000\",\"value\":\"54000\",\"type\":\"\"},{\"id\":\"span-4\",\"name\":\"P4\",\"to\":\"61200\",\"value\":\"61200\",\"type\":\"\"},{\"id\":\"span-5\",\"name\":\"P5\",\"to\":\"86400\",\"value\":\"86400\",\"type\":\"\"}],\"data\":[],\"threshold\":[{\"id\":\"highcai\",\"name\":\"작물활성도최대치\",\"linetype\":\"monotone\",\"unit\":\"\",\"timeoption\":[{\"span\":\"span-1\",\"to\":30},{\"span\":\"span-2\",\"to\":70},{\"span\":\"span-3\",\"to\":70},{\"span\":\"span-4\",\"to\":30},{\"span\":\"span-5\",\"to\":30}],\"opacity\":0,\"xValue\":1047,\"yValue\":107.28692626953125},{\"id\":\"lowcai\",\"name\":\"작물활성도최소치\",\"linetype\":\"monotone\",\"unit\":\"\",\"timeoption\":[{\"span\":\"span-1\",\"to\":0},{\"span\":\"span-2\",\"to\":40},{\"span\":\"span-3\",\"to\":40},{\"span\":\"span-4\",\"to\":0},{\"span\":\"span-5\",\"to\":0}],\"opacity\":0,\"xValue\":1047,\"yValue\":138.88693237304688}]}', '시간대별 작물활성도 기준', '2019-07-29 13:08:31');
COMMIT;


-- ----------------------------
-- Table structure for dataindexes
-- ----------------------------
DROP TABLE IF EXISTS `dataindexes`;
CREATE TABLE `dataindexes` (
  `id` int(11) NOT NULL,
  `rule_id` int(11) DEFAULT NULL,
  `name` varchar(50) NOT NULL,
  `unit` varchar(10) DEFAULT NULL,
  `sigdigit` int(11) DEFAULT '0',
  `device_id` int(11) DEFAULT NULL,
  `field_id` int(11) DEFAULT NULL,
  `deleted` int(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of dataindexes
-- ----------------------------
BEGIN;
INSERT INTO `dataindexes` VALUES (1, NULL, '위도', '', 0, NULL, 0, 0);
INSERT INTO `dataindexes` VALUES (2, NULL, '경도', '', 0, NULL, 0, 0);
COMMIT;

-- ----------------------------
-- Table structure for current_observations
-- ----------------------------
DROP TABLE IF EXISTS `current_observations`;
CREATE TABLE `current_observations` (
  `data_id` int(11) NOT NULL,
  `obs_time` datetime NOT NULL,
  `nvalue` double DEFAULT NULL,
  `modified_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`data_id`) USING BTREE,
  CONSTRAINT `fk_current_observations_dataindexes` FOREIGN KEY (`data_id`) REFERENCES `dataindexes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of current_observations
-- ----------------------------
BEGIN;
INSERT INTO `current_observations` VALUES (1, '2019-08-22 16:39:11', 37.7091842052891, '2019-09-06 17:49:02');
INSERT INTO `current_observations` VALUES (2, '2019-08-22 16:39:11', 126.448555072944, '2019-08-22 16:39:11');
COMMIT;

-- ----------------------------
-- Table structure for devices
-- ----------------------------
DROP TABLE IF EXISTS `devices`;
CREATE TABLE `devices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `spec` text NOT NULL,
  `gateid` varchar(255) NOT NULL,
  `coupleid` varchar(255) NOT NULL,
  `nodeid` int(11) NOT NULL,
  `compcode` int(11) NOT NULL,
  `devcode` int(11) DEFAULT NULL,
  `devindex` int(11) DEFAULT NULL,
  `deleted` int(1) DEFAULT '0',
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for device_field
-- ----------------------------
DROP TABLE IF EXISTS `device_field`;
CREATE TABLE `device_field` (
  `device_id` int(11) NOT NULL,
  `field_id` int(11) NOT NULL,
  `sort_no` int(11) DEFAULT NULL,
  PRIMARY KEY (`device_id`,`field_id`),
  KEY `FK_device_field_field_id_fields_id` (`field_id`),
  CONSTRAINT `FK_device_field_device_id_devices_id` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`),
  CONSTRAINT `FK_device_field_field_id_fields_id` FOREIGN KEY (`field_id`) REFERENCES `fields` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- ----------------------------
-- Table structure for farmos_user
-- ----------------------------
DROP TABLE IF EXISTS `farmos_user`;
CREATE TABLE `farmos_user` (
  `userid` varchar(50) NOT NULL,
  `passwd` varchar(50) NOT NULL,
  `privilege` varchar(50) NOT NULL,
  `basicinfo` text,
  `appinfo` text,
  `loginip` varchar(50) DEFAULT NULL,
  `lastupdated` datetime NOT NULL,
  PRIMARY KEY (`userid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of farmos_user
-- ----------------------------
BEGIN;
INSERT INTO `farmos_user` VALUES ('farmos', PASSWORD('farmosv2@'), 'user', '{\"name\" :\"관리자\"}', NULL, NULL, '2019-09-02 15:36:00');
COMMIT;


-- ----------------------------
-- Table structure for gate_info
-- ----------------------------
DROP TABLE IF EXISTS `gate_info`;
CREATE TABLE `gate_info` (
  `uuid` varchar(255) NOT NULL,
  `couple` varchar(255) NOT NULL,
  `detect` text,
  PRIMARY KEY (`uuid`,`couple`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of gate_info
-- ----------------------------
BEGIN;
INSERT INTO `gate_info` VALUES ('c315cb82-0f6c-4ed6-b8cc-b00331789494', '4157859e-df55-48e5-b3ac-8e6288f2165e', '{}');
COMMIT;

-- ----------------------------
-- Table structure for observations
-- ----------------------------
DROP TABLE IF EXISTS `observations`;
CREATE TABLE `observations` (
  `data_id` int(11) NOT NULL,
  `obs_time` datetime NOT NULL,
  `nvalue` double DEFAULT NULL,
  PRIMARY KEY (`data_id`,`obs_time`),
  CONSTRAINT `fk_observations_dataindexes_1` FOREIGN KEY (`data_id`) REFERENCES `dataindexes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for requests
-- ----------------------------
DROP TABLE IF EXISTS `requests`;
CREATE TABLE `requests` (
  `opid` int(11) NOT NULL,
  `device_id` int(11) NOT NULL,
  `command` int(11) NOT NULL,
  `params` text NOT NULL,
  `sentcnt` int(11) NOT NULL DEFAULT '1',
  `senttime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `exectime` timestamp NULL DEFAULT NULL,
  `finishtime` timestamp NULL DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


SET FOREIGN_KEY_CHECKS = 1;
