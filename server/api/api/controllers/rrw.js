/**
 * @fileoverview farmos api for farmos
 * @author joonyong.jinong@gmail.com
 * @version 1.0.0
 * @since 2017.07.25
 */

/*jshint esversion: 6 */

/**
 * notice
 * swagger-node 에서 controller 에 대한 initalize 와 finalize를
 * 별도로 지원하지 않는것으로 보인다.
 * farmos.js 의 경우 initialize 는 여러번 호출해도 상관없기 때문에
 * 모든 작업 시작전에 initialize 를 호출한다.
 * finalize 의 경우 디비와의 연결을 종료하는 것인데, 프로세스 종료시
 * 자동으로 될 것으로 간주한다.
 **/
// var jsonfile = require('jsonfile');
// var conffile = '../../common_api/conf/hasg.json';
// var _config = jsonfile.readFileSync(conffile);

// var configfile = __dirname + '/farmos-server.ini';


// var rrw = require('rrw.js')(_config);
// var _modulename = 'rrw api for farmos';
// var fs = require("fs");


var rrw = require('rrw.js');
var _modulename = 'rrw api for farmos';
var fs = require("fs");

var rrw_api = function () {
    /**
     * @method getAllMashingInfo
     * @description 막걸리 전체 담금 보고서 정보를 조회한다
     */
    var getAllMashingInfo = async function (req, res) {
        console.log(_modulename, 'getAllMashingInfo');
        try {            
            const result = await rrw.getAllMashingInfo();                                    
            result.length > 0 ? res.json(result) : res.json({});         
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }        
    };

    /**
     * @method setMashingBasicInfo
     * @description 막걸리 담금 보고서 기본정보를 저장한다
     */
    var setMashingBasicInfo = async function (req, res) {
        console.log(_modulename, 'setMashingBasicInfo');
        var basic_info = req.swagger.params.body.value
        try {            
            await rrw.setMashingBasicInfo(basic_info);                                    
            await rrw.setEpochTime(basic_info);                                                
            res.json("success");
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }        
    };

    /**
     * @method getMashingInfo
     * @description 막걸리 개별 담금 보고서 정보를 조회한다
     */
    var getMashingInfo = async function (req, res) {
        console.log(_modulename, 'getMashingInfo');        
        var mashing_id = req.swagger.params.mashing_id.value;
        var obj = {};
        var element_obj = {}
        
        try {            
            const result1 = await rrw.getMashingInfo(mashing_id);                        
            const result2 = await rrw.getTankList(mashing_id);                        
            const result3 = await rrw.getMoringTemp(mashing_id);                        
            const result4 = await rrw.getAfterNoonTemp(mashing_id);                        
            const result5 = await rrw.getWaterTemp(mashing_id);                        
            const result6 = await rrw.getManulaTemp(mashing_id);                        
            const result7 = await rrw.getAci(mashing_id); 
            const result8 = await rrw.getAlc(mashing_id); 
            const result9 = await rrw.getBrix(mashing_id); 
            const result10 = await rrw.getInput(mashing_id); 
            const result11 = await rrw.getInput2(mashing_id); 
            
            obj.mashing_id = result1[0].mashing_id
            obj.start_dt = result1[0].start_dt
            obj.end_dt = result1[0].end_dt
            obj.name = result1[0].name             
            obj.step_day = result1[0].step_day             
            obj.tank_list = result2
            obj.moring_temp_list = result3
            obj.afternoon_temp_list = result4
            obj.water_temp_list = result5

            element_obj.manual_temp_list = result6
            element_obj.aci_list = result7
            element_obj.alc_list = result8
            element_obj.brix_list = result9
            obj.element_list = element_obj

            if(result10.length != 0){
                obj.input_list = result10    
            }else{
                obj.input_list = result11    
            }

            res.json(obj);
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }        
    };

    /**
     * @method getMashingChartInfo
     * @description 막걸리 개별 담금 보고서 차트 정보를 조회한다
     */
    var getMashingChartInfo = async function (req, res) {
        console.log(_modulename, 'getMashingChartInfo');        
        var mashing_id = req.swagger.params.mashing_id.value;        
        var obj = {};
        try {            
            const result1 = await rrw.getMashingInfo(mashing_id);                        
            const result2 = await rrw.getTankList(mashing_id);                        
            const result3 = await rrw.getMashingChartInfo(mashing_id);                                    

            obj.mashing_id = result1[0].mashing_id
            obj.start_dt = result1[0].start_dt
            obj.end_dt = result1[0].end_dt
            obj.name = result1[0].name             
            obj.tank_list = result2
            obj.temp_list = result3

            res.json(obj);
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }        
    };

    /**
     * @method setMashingInfo
     * @description 막걸리 개별 담금 보고서 차트 정보를 저장한다
     */
    var setMashingInfo = async function (req, res) {
        console.log(_modulename, 'setMashingInfo');        
        var mashing_id = req.swagger.params.mashing_id.value;        
        var set_info = req.swagger.params.body.value

        try {            
            await rrw.setMoringTemp(set_info);                                    
            await rrw.setAfterNoonTemp(set_info);                                    
            await rrw.setWaterTemp(set_info);                                    
            await rrw.setManulaTemp(set_info);                                    
            await rrw.setAci(set_info);                                    
            await rrw.setAlc(set_info);                                    
            await rrw.setBrix(set_info);                                    
            await rrw.setInput(mashing_id, set_info);                                    
            res.json("success");
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }        
    };

    /**
     * @method getMashingStepInfo
     * @description 막걸리 담금단계를 조회한다(기준 - 오늘날짜)
     */
    var getMashingStepInfo = async function (req, res) {
        console.log(_modulename, 'getMashingStepInfo');
        var step_list = [];
        try {            
            const result = await rrw.getMashingStepInfo();                                                            
            result.length > 0 ? res.json(result) : res.json({});                     
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }        
    };

    /**
     * @method getMashingCurrentObservation
     * @description 막걸리 담금탱크 최근 데이터를 가져온다
     */
    var getMashingCurrentObservation = async function (req, res) {
        console.log(_modulename, 'getMashingCurrentObservation');
        var step_list = [];
        try {            
            const result = await rrw.getMashingCurrentObservation();                                                            
            result.length > 0 ? res.json(result) : res.json({});                     
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }        
    };

    /**
     * @method getMashingDashboardChartInfo 
     * @description 막걸리 개별 담금 보고서 대시보드 차트 정보를 조회한다
     */
    var getMashingDashboardChartInfo = async function (req, res) {
        console.log(_modulename, 'getMashingDashboardChartInfo');        
        var mashing_id = req.swagger.params.mashing_id.value;        
        var obj = {};
        try {            
            const result1 = await rrw.getMashingInfo(mashing_id);                        
            const result2 = await rrw.getTankList(mashing_id);                        
            const result3 = await rrw.getDashboardTempChartInfo(mashing_id);                                    
            const result4 = await rrw.getDashboardAlcholeChartInfo(mashing_id);                                    
            const result5 = await rrw.getDashboardPhChartInfo(mashing_id);                                    

            obj.mashing_id = result1[0].mashing_id
            obj.start_dt = result1[0].start_dt
            obj.end_dt = result1[0].end_dt
            obj.name = result1[0].name             
            obj.tank_list = result2
            obj.temp_list = result3
            obj.alchole_list = result4
            obj.ph_list =result5
            
            res.json(obj);
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }        
    };

    /**
     * @method deleteMashingInfo 
     * @description 막걸리 개별 담금 보고서정보를 삭제한다
     */
    var deleteMashingInfo = async function (req, res) {
        console.log(_modulename, 'deleteMashingInfo');        
        var mashing_id = req.swagger.params.mashing_id.value;        
        var basic_info = req.swagger.params.body.value  
        try {                        
            if(basic_info.mashing_id === 0){                
                await rrw.deleteMashing(mashing_id);                        
                await rrw.deleteMashingMap(mashing_id);                                    
                await rrw.deleteEpochTime(basic_info);                                    
            }
            

            if(basic_info.mashing_id !== 0){                
                console.log("basic_info.mashing_id=" + basic_info.mashing_id)
                console.log("basic_info.mashing_id=" + basic_info.company)
                const result3 = await rrw.deleteMorningTemp(basic_info.start_dt, basic_info.end_dt, basic_info.company);                                                
                const result4 = await rrw.deleteAfternoonTemp(basic_info.start_dt, basic_info.end_dt, basic_info.company);                                                
            }            

            const result5 = await rrw.deleteWaterInfo(basic_info.tank_list, basic_info.start_dt, basic_info.end_dt);                                                
            const result6 = await rrw.deleteManualTempInfo(basic_info.tank_list, basic_info.start_dt, basic_info.end_dt);                                                            
            const result7 = await rrw.deleteAciInfo(basic_info.tank_list, basic_info.start_dt, basic_info.end_dt);                                                            
            const result8 = await rrw.deleteAlcholeInfo(basic_info.tank_list, basic_info.start_dt, basic_info.end_dt);                                                            
            const result9 = await rrw.deleteBrixInfo(basic_info.tank_list, basic_info.start_dt, basic_info.end_dt);                                                            
            const result10 = await rrw.deleteKojiInfo(mashing_id);                                                            
            res.json("success");            
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }        
    };

    /**
     * @method getMashingSetting
     * @description 막걸리 담금 자동제어 셋팅정보를 조회한다.
     */
    var getMashingSetting = async function (req, res) {      
        console.log(_modulename, 'getMashingSetting');        
        var id = req.swagger.params.id.value;        
        var gubun = req.swagger.params.gubun.value;        
        const configList = []
        const stirringList = []        
        const mashingList = []        

        try {            
            if(gubun == 0){ // 고급, 탱크
                const result = await rrw.getMashingSetting1(id);                                                            
                result.length > 0 ? res.json(result) : res.json({});                         
            }else{ // 담금                       
                const result_id = await rrw.getMashingSetting2(id);                                                   
                for(var i=0; i<result_id.length; i++){                    
                    const result = await rrw.getMashingSetting1(result_id[i].field_id);                                                                                                                                            
                    for(var ii in result){                                                
                        if(result[ii].name.indexOf('교반') !== -1){                            
                            stirringList.push(result[ii].configurations)                            
                        }else{                            
                            configList.push(result[ii].configurations)
                        }
                    }                    
                }
                
                var gubun = "same"
                var mashing_conf = ""
                var stirring_conf = ""


                if(configList.length == 1){
                    
                    var stirring_conf = stirringList
                    var mashing_conf = configList

                    var temp1 = {}
                    temp1.configurations = mashing_conf

                    var temp2 = {}
                    temp2.configurations = stirring_conf

                    mashingList.push("same")
                    mashingList.push(result_id)                        
                    mashingList.push(temp1)
                    mashingList.push(temp2)                        
                    

                    mashingList.push(JSON.parse(stirring_conf))                                            
                    res.json(mashingList)

                }else if(configList.length > 1){

                    for(var j=0; j<configList.length; j++){
                        for(var jj=0; jj<configList.length; jj++){                            
                            if(configList[j] !== configList[jj]){
                                gubun = "different"                                
                            }else{
                                mashing_conf = configList[jj]
                            }
                        }
                    }


                    for(var k=0; k<stirringList.length; k++){
                        for(var kk=0; kk<stirringList.length; kk++){
                            if(stirringList[k] !== stirringList[kk]){
                                gubun = "different"
                            }else{
                                stirring_conf = stirringList[kk]
                            }
                        }
                    }                    

                    
                    if(gubun === "same"){
                                                
                        var temp1 = {}
                        temp1.configurations = mashing_conf

                        var temp2 = {}
                        temp2.configurations = stirring_conf

                        mashingList.push("same")
                        mashingList.push(result_id)                        
                        mashingList.push(temp1)
                        mashingList.push(temp2)                        
                        

                        mashingList.push(JSON.parse(stirring_conf))                                            
                        res.json(mashingList)

                    }else{
                        mashingList.push("differnet")
                        mashingList.push(result_id)
                        res.json(mashingList)
                    }
                }                
            }            

        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }        
    };

    /**
     * @method setMashingSetting
     * @description 막걸리 담금 자동제어 셋팅정보를 수정한다
     */
    var setMashingSetting = async function (req, res) {
        console.log(_modulename, 'setMashingSetting');
        var basic_info = req.swagger.params.body.value
        try {      
            if(basic_info.gubun == 0){ // 고급, 탱크
                const result = await rrw.getMashingSetting1(basic_info.id);                                                   
                const s_result = await rrw.getStirringSetting(basic_info.id);                                                   

                var configuration = JSON.parse(result[0].configurations)     
                var s_configuration = JSON.parse(s_result[0].configurations) 
                
                var obj = {}                
                configuration.basic[0].value = basic_info.alarmTemp1
                configuration.basic[1].value = basic_info.controlTemp1
                configuration.basic[2].value = basic_info.alarmTemp2
                configuration.basic[3].value = basic_info.controlTemp2
                configuration.basic[4].value = basic_info.controAlchole1
                configuration.basic[5].value = basic_info.controCool1
                configuration.basic[6].value = basic_info.controAlchole2
                configuration.basic[7].value = basic_info.controCool2
                configuration.basic[8].value = basic_info.controAlchole3
                configuration.basic[9].value = basic_info.controCool3
                obj.basic = configuration.basic
                obj.advanced = configuration.advanced
                obj.timespan = configuration.timespan
                var s_obj1 =   JSON.stringify(obj)

                var obj2 = {}                
                s_configuration.basic[0].value = basic_info.controlHour1
                s_configuration.basic[1].value = basic_info.controlMinute1
                s_configuration.basic[2].value = basic_info.controlHour2
                s_configuration.basic[3].value = basic_info.controlMinute2                
                obj2.basic = s_configuration.basic
                obj2.advanced = s_configuration.advanced
                obj2.timespan = s_configuration.timespan
                var s_obj2 =   JSON.stringify(obj2)    

                await rrw.setSettingInfo1(basic_info.id, s_obj1);                                                             
                await rrw.setSettingInfo2(basic_info.id, s_obj2);                                                             

            }else{ // 기본
                const result_id = await rrw.getMashingSetting2(basic_info.id);                                                   
                const result = await rrw.getMashingSetting1(result_id[0].field_id);    
                const s_result = await rrw.getStirringSetting(result_id[0].field_id);                                                                                                           
                
                var configuration = JSON.parse(result[0].configurations)     
                var s_configuration = JSON.parse(s_result[0].configurations)     

                var obj = {}                
                configuration.basic[0].value = basic_info.alarmTemp1
                configuration.basic[1].value = basic_info.controlTemp1
                configuration.basic[2].value = basic_info.alarmTemp2
                configuration.basic[3].value = basic_info.controlTemp2
                configuration.basic[4].value = basic_info.controAlchole1
                configuration.basic[5].value = basic_info.controCool1
                configuration.basic[6].value = basic_info.controAlchole2
                configuration.basic[7].value = basic_info.controCool2
                configuration.basic[8].value = basic_info.controAlchole3
                configuration.basic[9].value = basic_info.controCool3
                obj.basic = configuration.basic
                obj.advanced = configuration.advanced
                obj.timespan = configuration.timespan                

                var obj2 = {}                
                s_configuration.basic[0].value = basic_info.controlHour1
                s_configuration.basic[1].value = basic_info.controlMinute1
                s_configuration.basic[2].value = basic_info.controlHour2
                s_configuration.basic[3].value = basic_info.controlMinute2
                obj2.basic = s_configuration.basic
                obj2.advanced = s_configuration.advanced
                obj2.timespan = s_configuration.timespan

                var s_obj1 = JSON.stringify(obj)
                var s_obj2 = JSON.stringify(obj2)

                for(var i=0; i<result_id.length; i++){                    
                    await rrw.setSettingInfo1(result_id[i].field_id, s_obj1);                                                             
                    await rrw.setSettingInfo2(result_id[i].field_id, s_obj2);                                                             
                }
            }                  
            res.json("success");
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }        
    };

    /**
     * @method getMMSInfo
     * @description 막걸리 이상발생 내역 수신자 정보를 조회한다
     */
    var getMMSInfo = async function (req, res) {
        console.log(_modulename, 'getMMSInfo');
        try {            
            const result = await rrw.getMMSInfo();                                    
            result.length > 0 ? res.json(result) : res.json({});         
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }        
    };

    /**
     * @method setMMSInfo
     * @description 막걸리 이상발생 내역 수신자 정보를 저장한다.
     */
    var setMMSInfo = async function (req, res) {
        console.log(_modulename, 'setMMSInfo');
        var basic_info = req.swagger.params.body.value
        try {            
            await rrw.setMMSInfo(basic_info);                                                
            res.json("success");
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }        
    };

    /**
     * @method deleteMMSInfo
     * @description 막걸리 이상발생 내역 수신자 정보를 삭제한다
     */
    var deleteMMSInfo = async function (req, res) {
        console.log(_modulename, 'deleteMMSInfo');
        var basic_info = req.swagger.params.body.value
        try {            
            await rrw.deleteMMSInfo(basic_info);                                                
            res.json("success");
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }        
    };

    /**
     * @method updateMMSInfo
     * @description 막걸리 이상발생 내역 수신자 정보를 수정한다
     */
    var updateMMSInfo = async function (req, res) {
        console.log(_modulename, 'updateMMSInfo');
        var basic_info = req.swagger.params.body.value
        try {            
            await rrw.updateMMSInfo(basic_info);                                                
            res.json("success");
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }        
    };

    /**
     * @method getMMSList
     * @description 막걸리 알람 이상내역 리스트를 조회한다
     */
    var getMMSAlarmList = async function (req, res) {
        console.log(_modulename, 'getMMSAlarmList');
        var company_gubun = req.swagger.params.company.value;                
        try {            
            const result = await rrw.getMMSList(company_gubun);                                    
            result.length > 0 ? res.json(result) : res.json({});         
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }        
    };

    /**
     * @method gertInterval
     * @description DB 주기적 호출
     */
    var gertInterval = async function (req, res) {
        console.log(_modulename, 'gertInterval');        
        try {            
            const result = await rrw.gertInterval();                                    
            result.length > 0 ? res.json(result) : res.json({});         
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }        
    };

    
    return {
        getAllMashingInfo: getAllMashingInfo,    
        setMashingBasicInfo : setMashingBasicInfo,
        getMashingInfo : getMashingInfo,        
        getMashingChartInfo : getMashingChartInfo,        
        setMashingInfo : setMashingInfo,
        getMashingStepInfo : getMashingStepInfo, 
        getMashingCurrentObservation: getMashingCurrentObservation,       
        getMashingDashboardChartInfo : getMashingDashboardChartInfo,        
        deleteMashingInfo : deleteMashingInfo,
        getMashingSetting : getMashingSetting,
        setMashingSetting : setMashingSetting,
        getMMSInfo : getMMSInfo,
        setMMSInfo : setMMSInfo,
        deleteMMSInfo : deleteMMSInfo,
        updateMMSInfo : updateMMSInfo,
        getMMSAlarmList : getMMSAlarmList,
        gertInterval : gertInterval
    };
};

module.exports = rrw_api();
