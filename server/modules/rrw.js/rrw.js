/**
 * @fileoverview FARMOS_BETA Javascript API
 * @author joonyong.jinong@gmail.com
 * @version 1.0.0
 * @since 2017.07.04
 */

var util = require('util');
var rrw_api = function () {        
    
    var _pool = pool // 상기 내용으로 인하여 golbal pool 사용 .. 추후 다른 방법 생각 (윈도우전용)
    // var _pool = require('database.js')(); // 소스 push 할때 사용(리눅스전용 commit할때는 이걸로 올려야함)
    var _query = "";    
    
    /**
     * @method getAllMashingInfo
     * @description 막걸리 전체 담금 보고서 정보를 조회한다
     */
    var getAllMashingInfo = async function () {        

        _query = 'select aa.mashing_id, aa.mashing_name, aa.start_dt, aa.end_dt, aa.gubun '
        _query += 'from '
        _query += '(select a.mashing_id, a.mashing_name, DATE_FORMAT(a.start_dt, "%Y-%m-%d") as start_dt, DATE_FORMAT(a.end_dt, "%Y-%m-%d") as end_dt, b.field_id, '
        _query += 'case when b.field_id in (1,2) then "우리술" '
        _query += 'when b.field_id in (3,4) then "우리도가" '
        _query += 'end as gubun '
        _query += 'from mashing a, mashingmap b '
        _query += 'where a.mashing_id = b.mashing_id) aa '
        _query += 'group by aa.mashing_id, aa.mashing_name, aa.start_dt, aa.end_dt, aa.gubun '

        const [rows] = await _pool.query(_query);        
        return rows        
    };

    /**
     * @method setMashingBasicInfo
     * @description 막걸리 담금 보고서 기본정보를 저장한다(gos_mahing)
     */
    var setMashingBasicInfo = async function (basic_info) {

        var tank_list = basic_info.tank_list

        _query = "insert into mashing "
        _query += '(mashing_id,start_dt,end_dt,mashing_name,save_time, second_dt) '
        _query += 'values '
        _query += '((select max(ifnull(a.mashing_id,0))+1 from mashing a),?,?,?,DATE_FORMAT(now(), "%Y-%m-%d %H:%i:%s"), DATE_FORMAT(?, "%Y-%m-%d")) '
        await _pool.query(_query, [basic_info.start_dt, basic_info.end_dt, basic_info.name, basic_info.second_dt]);

        for(var i in tank_list){
            setMashingMap(tank_list[i]);
        }
    };

    /**
     * @method setMashingMap
     * @description 막걸리 담금 보고서 기본정보를 저장한다(gos_mahingmap)
     */
    var setMashingMap = async function (tank_obj) {
        _query = "insert into mashingmap "
        _query += '(mashing_id, ml_blooean, field_id, rice) '
        _query += 'values '
        _query += '((select max(ifnull(a.mashing_id,0)) from mashing a), "true", ?, ?) '
        await _pool.query(_query, [tank_obj.tank_id, tank_obj.rice]);        
    };

    /**
     * @method getMashingInfo
     * @description 막걸리 개별 담금 보고서 기본정보를 조회한다
     */
    var getMashingInfo = async function (mashing_id) {
        _query = 'select mashing_id, mashing_name as name, DATE_FORMAT(start_dt, "%Y-%m-%d") as start_dt, DATE_FORMAT(end_dt, "%Y-%m-%d") as end_dt, TIMESTAMPDIFF(DAY, date_format(second_dt, "%Y-%m-%d"), date_format(now(), "%Y-%m-%d")) as step_day  '
        _query += 'from mashing '
        _query += 'where mashing_id = ? '        

        const [rows] = await _pool.query(_query, [mashing_id]);
        return rows
    };

    /**
     * @method getTankList
     * @description 막걸리 개별 담금 보고서 탱크정보를 조회한다
     */
    var getTankList = async function (mashing_id) {
        _query = 'select b.id as tank_id, b.name, ifnull(a.rice, "2") as rice '
        _query += 'from mashingmap a, fields b '
        _query += 'where a.mashing_id=? '
        _query += 'and a.field_id = b.id '
        _query += 'order by b.id asc '        

        const [rows] = await _pool.query(_query, [mashing_id]);
        return rows
    };

    /**
     * @method getMoringTemp
     * @description 막걸리 개별 담금 보고서 오전온도 정보를 조회한다
     */
    var getMoringTemp = async function (mashing_id) {
        _query = 'select DATE_FORMAT(bb.obs_time, "%Y-%m-%d") as measure_dt, bb.nvalue as value, "40000001" as code '
        _query += 'from '
        _query += '(select start_dt, DATE_ADD(start_dt, INTERVAL +9 DAY) as end_dt '
        _query += 'from mashing '
        _query += 'where mashing_id =?) aa, observations bb '        
        _query += 'where date_format(bb.obs_time, "%Y-%m-%d") between aa.start_dt and aa.end_dt '        
        _query += 'and bb.data_id = "40000001" '        
        _query += 'order by bb.obs_time asc '        

        const [rows] = await _pool.query(_query, [mashing_id]);
        return rows
    };

    /**
     * @method getAfterNoonTemp
     * @description 막걸리 개별 담금 보고서 오후온도 정보를 조회한다
     */
    var getAfterNoonTemp = async function (mashing_id) {
        _query = 'select DATE_FORMAT(bb.obs_time, "%Y-%m-%d") as measure_dt, bb.nvalue as value, "40000002" as code '
        _query += 'from '
        _query += '(select start_dt, DATE_ADD(start_dt, INTERVAL +9 DAY) as end_dt '
        _query += 'from mashing '
        _query += 'where mashing_id =?) aa, observations bb '        
        _query += 'where date_format(bb.obs_time, "%Y-%m-%d") between aa.start_dt and aa.end_dt '        
        _query += 'and bb.data_id = "40000002" '        
        _query += 'order by bb.obs_time asc '        

        const [rows] = await _pool.query(_query, [mashing_id]);
        return rows
    };


    /**
     * @method getWaterTemp
     * @description 막걸리 개별 담금 보고서 수온정보를 조회한다
     */
    var getWaterTemp = async function (mashing_id) {
        _query = 'select aa.field_id as tank_id,DATE_FORMAT(bb.obs_time, "%Y-%m-%d") as measure_dt, bb.nvalue as value '
        _query += 'from '
        _query += '(select b.field_id , start_dt, DATE_ADD(start_dt, INTERVAL +9 DAY) as end_dt '
        _query += 'from mashing a, mashingmap b '
        _query += 'where a.mashing_id = b.mashing_id '        
        _query += 'and a.mashing_id = ?) aa, observations bb '        
        _query += 'where substring(bb.data_id, 2, 2) = aa.field_id '                
        _query += 'and substring(data_id, 7, 2) = "04" '        
        _query += 'and bb.obs_time between aa.start_dt and aa.end_dt '        
        _query += 'order by bb.obs_time asc '       

        const [rows] = await _pool.query(_query, [mashing_id]);
        return rows
    };

        /**
     * @method getManulaTemp
     * @description 막걸리 개별 담금 보고서 수동측정온도 정보를 조회한다
     */
    var getManulaTemp = async function (mashing_id) {
        _query = 'select aa.field_id as tank_id,DATE_FORMAT(bb.obs_time, "%Y-%m-%d") as measure_dt, bb.nvalue as value '
        _query += 'from '
        _query += '(select b.field_id , start_dt, DATE_ADD(start_dt, INTERVAL +9 DAY) as end_dt '
        _query += 'from mashing a, mashingmap b '
        _query += 'where a.mashing_id = b.mashing_id '        
        _query += 'and a.mashing_id = ?) aa, observations bb '        
        _query += 'where substring(bb.data_id, 2, 2) = aa.field_id '                
        _query += 'and substring(data_id, 7, 2) = "03" '        
        _query += 'and bb.obs_time between aa.start_dt and aa.end_dt '        
        _query += 'order by bb.obs_time asc '       

        const [rows] = await _pool.query(_query, [mashing_id]);
        return rows
    };

    /**
     * @method getAci
     * @description 막걸리 개별 담금 보고서 산도정보를 조회한다
     */
    var getAci = async function (mashing_id) {
        _query = 'select aa.field_id as tank_id,DATE_FORMAT(bb.obs_time, "%Y-%m-%d") as measure_dt, bb.nvalue as value '
        _query += 'from '
        _query += '(select b.field_id , start_dt, DATE_ADD(start_dt, INTERVAL +9 DAY) as end_dt '
        _query += 'from mashing a, mashingmap b '
        _query += 'where a.mashing_id = b.mashing_id '        
        _query += 'and a.mashing_id = ?) aa, observations bb '        
        _query += 'where substring(bb.data_id, 2, 2) = aa.field_id '                
        _query += 'and substring(data_id, 7, 2) = "05" '        
        _query += 'and bb.obs_time between aa.start_dt and aa.end_dt '        
        _query += 'order by bb.obs_time asc '       

        const [rows] = await _pool.query(_query, [mashing_id]);
        return rows
    };

    /**
     * @method getAlc
     * @description 막걸리 개별 담금 보고서 알콜정보를 조회한다
     */
    var getAlc = async function (mashing_id) {
        _query = 'select aa.field_id as tank_id,DATE_FORMAT(bb.obs_time, "%Y-%m-%d") as measure_dt, bb.nvalue as value '
        _query += 'from '
        _query += '(select b.field_id , start_dt, DATE_ADD(start_dt, INTERVAL +9 DAY) as end_dt '
        _query += 'from mashing a, mashingmap b '
        _query += 'where a.mashing_id = b.mashing_id '        
        _query += 'and a.mashing_id = ?) aa, observations bb '        
        _query += 'where substring(bb.data_id, 2, 2) = aa.field_id '                
        _query += 'and substring(data_id, 7, 2) = "06" '        
        _query += 'and bb.obs_time between aa.start_dt and aa.end_dt '        
        _query += 'order by bb.obs_time asc '       

        const [rows] = await _pool.query(_query, [mashing_id]);
        return rows
    };
    

    /**    
     * @method getBrix
     * @description 막걸리 개별 담금 보고서 당도정보를 조회한다
     */
    var getBrix = async function (mashing_id) {
        _query = 'select aa.field_id as tank_id,DATE_FORMAT(bb.obs_time, "%Y-%m-%d") as measure_dt, bb.nvalue as value '
        _query += 'from '
        _query += '(select b.field_id , start_dt, DATE_ADD(start_dt, INTERVAL +9 DAY) as end_dt '
        _query += 'from mashing a, mashingmap b '
        _query += 'where a.mashing_id = b.mashing_id '        
        _query += 'and a.mashing_id = ?) aa, observations bb '        
        _query += 'where substring(bb.data_id, 2, 2) = aa.field_id '                
        _query += 'and substring(data_id, 7, 2) = "07" '        
        _query += 'and bb.obs_time between aa.start_dt and aa.end_dt '        
        _query += 'order by bb.obs_time asc '       

        const [rows] = await _pool.query(_query, [mashing_id]);
        return rows
    };
    
    /**    
     * @method getInput
     * @description 막걸리 개별 담금 보고서 입국정보를 조회한다
     */
    var getInput = async function (mashing_id) {
        _query = 'select input_id, input_name, date_format(make_dt, "%Y-%m-%d") as make_dt, amount_value, titer_value, aci_value, moisture_value '
        _query += 'from input_material '
        _query += 'where mashing_id = ? '
        
        const [rows] = await _pool.query(_query, [mashing_id]);
        return rows
    };    

    /**    
     * @method getInput2
     * @description 막걸리 개별 담금 보고서 입국정보를 조회한다
     */
    var getInput2 = async function (mashing_id) {
        _query = 'select input_id, input_name, date_format(make_dt, "%Y-%m-%d") as make_dt, amount_value, titer_value, aci_value, moisture_value '
        _query += 'from input_material '
        _query += 'order by save_time desc '
        _query += 'limit 1 '
        
        const [rows] = await _pool.query(_query);
        return rows
    };    

    /**    
     * @method getMashingChartInfo
     * @description 막걸리 개별 담금 보고서 차트정보를 조회한다
     */
    var getMashingChartInfo = async function (mashing_id) {
        
        _query = 'select aa.mashing_id, aa.tank_id, aa.tank_name, aa.rice, aa.measure_dt, round(avg(aa.value),1) as value, aa.tank_id as code '
        _query += 'from '   
        _query += '(select aa.mashing_id, aa.field_id as tank_id, aa.name as tank_name, aa.rice, date_format(bb.obs_time, "%Y-%m-%d %H:%i") as measure_dt, round(bb.nvalue,1) as value, '
        _query += 'date_format(aa.start_dt, "%Y-%m-%d") as start_dt, date_format(aa.end_dt, "%Y-%m-%d") as end_dt '
        _query += 'from '
        _query += '(select a.mashing_id, b.field_id, c.name, b.rice, d.id as data_id, a.start_dt, a.end_dt, d.id  '                
        _query += 'from mashing a, mashingmap b, fields c, dataindexes d '
        _query += 'where a.mashing_id = b.mashing_id '
        _query += 'and a.mashing_id = ? '
        _query += 'and b.field_id = c.id '
        _query += 'and d.field_id = c.id '
        _query += 'and right(d.id, 1) = "1" '
        _query += 'and substring(d.id, 5, 2) in (12,13,14,22,23,24,32,33,34,42,43,44)) aa, observations bb '
        _query += 'where aa.data_id = bb.data_id) aa '
        _query += 'where aa.measure_dt >= aa.start_dt   '
        _query += 'and aa.measure_dt <= aa.end_dt   '
        _query += 'group by aa.mashing_id, aa.tank_id, aa.tank_name, aa.rice, aa.measure_dt '
        _query += 'order by aa.tank_id , aa.measure_dt asc  '
        
        const [rows] = await _pool.query(_query, [mashing_id]);
        return rows
    };    

    /**    
     * @method setMoringTemp
     * @description 막걸리 개별 담금 보고서 오전온도 정보를 저장한다
     */
    var setMoringTemp = async function (set_info) {

        var moring_temp_list = set_info.moring_temp_list        
        _query = 'insert into observations (data_id, obs_time, nvalue) values (?, date_format(?, "%Y-%m-%d 10:00:00"), ?) '                        
        
        for(var i in moring_temp_list){            
            if(moring_temp_list[i].value === ""){
                moring_temp_list[i].value = null
            }
            await _pool.query(_query, [moring_temp_list[i].code, moring_temp_list[i].measure_dt, moring_temp_list[i].value]);        
        }
    };    

    /**    
     * @method setAfterNoonTemp
     * @description 막걸리 개별 담금 보고서 오후온도 정보를 저장한다
     */
    var setAfterNoonTemp = async function (set_info) {

        var afternoon_temp_list = set_info.afternoon_temp_list        
        _query = 'insert into observations (data_id, obs_time, nvalue) values (?, date_format(?, "%Y-%m-%d 15:00:00"), ?) '                
        
        for(var i in afternoon_temp_list){
            if(afternoon_temp_list[i].value === ""){
                afternoon_temp_list[i].value = null                
            }            

            console.log(afternoon_temp_list[i].code)
            console.log(afternoon_temp_list[i].value)
            await _pool.query(_query, [afternoon_temp_list[i].code, afternoon_temp_list[i].measure_dt, afternoon_temp_list[i].value]);        
        }        
    };

    /**    
     * @method setWaterTemp
     * @description 막걸리 개별 담금 보고서 수온정보를 정보를 저장한다
     */
    var setWaterTemp = async function (set_info) {
        var water_temp_list = set_info.water_temp_list                

        _query = 'insert into observations (data_id, obs_time, nvalue) values (?, date_format(?, "%Y-%m-%d %H:%i:%s"), ?) '                
        
        for(var i in water_temp_list){            
            if(water_temp_list[i].value === ""){
                water_temp_list[i].value = null
            }            
            await _pool.query(_query, [water_temp_list[i].code, water_temp_list[i].measure_dt, water_temp_list[i].value]);        
        }        
    };

    /**    
     * @method setManulaTemp
     * @description 막걸리 개별 담금 보고서 수동측정 온도 정보를 저장한다
     */
    var setManulaTemp = async function (set_info) {
        var manual_temp_list = set_info.element_list.manual_temp_list                

        _query = 'insert into observations (data_id, obs_time, nvalue) values (?, date_format(?, "%Y-%m-%d %H:%i:%s"), ?) '                
        
        for(var i in manual_temp_list){              
            if(manual_temp_list[i].value === ""){
                manual_temp_list[i].value = null
            }            
            await _pool.query(_query, [manual_temp_list[i].code, manual_temp_list[i].measure_dt, manual_temp_list[i].value]);        
        }        
    };

    /**    
     * @method setAci
     * @description 막걸리 개별 담금 보고서 산도측정 정보를 저장한다
     */
    var setAci = async function (set_info) {
        var aci_list = set_info.element_list.aci_list                

        _query = 'insert into observations (data_id, obs_time, nvalue) values (?, date_format(?, "%Y-%m-%d %H:%i:%s"), ?) '                
        
        for(var i in aci_list){       
            if(aci_list[i].value === ""){
                aci_list[i].value = null
            }                 
            await _pool.query(_query, [aci_list[i].code, aci_list[i].measure_dt, aci_list[i].value]);        
        }        
    };

    /**    
     * @method setAlc
     * @description 막걸리 개별 담금 보고서 알콜측정 정보를 저장한다
     */
    var setAlc = async function (set_info) {
        var alc_list = set_info.element_list.alc_list                

        _query = 'insert into observations (data_id, obs_time, nvalue) values (?, date_format(?, "%Y-%m-%d %H:%i:%s"), ?) '                
        
        for(var i in alc_list){            
            if(alc_list[i].value === ""){
                alc_list[i].value = null
            }                 
            await _pool.query(_query, [alc_list[i].code, alc_list[i].measure_dt, alc_list[i].value]);        
        }        
    };

    /**    
     * @method setBrix
     * @description 막걸리 개별 담금 보고서 당도측정 정보를 저장한다
     */
    var setBrix = async function (set_info) {
        var brix_list = set_info.element_list.brix_list                

        _query = 'insert into observations (data_id, obs_time, nvalue) values (?, date_format(?, "%Y-%m-%d %H:%i:%s"), ?) '                
        
        for(var i in brix_list){       
            if(brix_list[i].value === ""){
                brix_list[i].value = null
            }                      
            await _pool.query(_query, [brix_list[i].code, brix_list[i].measure_dt, brix_list[i].value]);        
        }        
    };

    /**    
     * @method setInput
     * @description 막걸리 개별 담금 보고서 입국정보를 저장한다
     */
    var setInput = async function (mashing_id, set_info) {
        var input_list = set_info.input_list        

        _query = 'insert into input_material '                
        _query += '(input_id, mashing_id, input_name, make_dt, amount_value, titer_value, aci_value, moisture_value) '                
        _query += 'values '                
        _query += '((select ifnull(max(a.input_id),0)+1 from input_material a),?,?,date_format(?, "%Y-%m-%d"),?,?,?,?) '                
        
        for(var i in input_list){                 
            await _pool.query(_query, [mashing_id, input_list[i].input_name, input_list[i].make_dt, input_list[i].amount_value, input_list[i].titer_value, input_list[i].aci_value, input_list[i].moisture_value]);        
        }        
    };

    /**    
     * @method getMashingStepInfo
     * @description 막걸리 담금단계를 조회한다(기준-오늘날짜)
     */
    var getMashingStepInfo = async function () {    
        
        _query = 'select a.mashing_id, a.mashing_name, DATE_FORMAT(a.start_dt, "%Y-%m-%d") as start_dt, DATE_FORMAT(a.end_dt, "%Y-%m-%d") as end_dt, TIMESTAMPDIFF(DAY, date_format(a.start_dt, "%Y-%m-%d"), date_format(now(), "%Y-%m-%d")) as step_day, c.id as tank_id, c.name as tank_name, '
        _query += 'case when c.id=1 then "우리술" when c.id=2 then "우리술" when c.id=3 then "우리도가" when c.id=4 then "우리도가" end as gubun '     
        _query += 'from mashing a, mashingmap b, fields c '
        _query += 'where a.mashing_id = b.mashing_id '
        _query += 'and b.field_id = c.id '
        _query += 'and date_format(now(), "%Y-%m-%d") <= date_format(a.end_dt, "%Y-%m-%d") '
        _query += 'order by b.field_id asc  '
        
        const [rows] = await _pool.query(_query);        
        return rows        
    };

    /**    
     * @method getMashingCurrentObservation
     * @description 막걸리 담금탱크 최근 데이터를 가져온다
     */
    var getMashingCurrentObservation = async function () {    
        
        _query = 'select data_id, DATE_FORMAT(obs_time, "%Y-%m-%d %H:%i:%m") as obs_time, round(nvalue,2) as nvalue '
        _query += 'from current_observations '
        _query += 'where DATE_FORMAT(obs_time, "%Y-%m-%d") = DATE_FORMAT(now(), "%Y-%m-%d") '
        _query += 'and data_id in (10001201, 10001301, 10001401, 10002201, 10002301, 10002401, 10003201, 10003301, 10003401, 10004201, 10004301, 10004401, 10001801, 10001901) '
        _query += 'order by data_id asc '        
        
        const [rows] = await _pool.query(_query);        
        return rows        
    };


    /**    
     * @method getDashboardTempChartInfo
     * @description 막걸리 대시보드 온도정보를 조회한다
     */
    var getDashboardTempChartInfo = async function (mashing_id) {
        
        _query = 'select aa.mashing_id, aa.tank_id, aa.tank_name, aa.rice, aa.measure_dt2 as measure_dt, round(avg(aa.value),1) as value, aa.tank_id as code '
        _query += 'from '   
        _query += '(select aa.mashing_id, aa.field_id as tank_id, aa.name as tank_name, aa.rice, date_format(bb.obs_time, "%Y-%m-%d %H:%i") as measure_dt, round(bb.nvalue,1) as value, '
        _query += 'date_format(aa.start_dt, "%Y-%m-%d") as start_dt, date_format(aa.end_dt, "%Y-%m-%d") as end_dt, aa.data_id, date_format(bb.obs_time, "%Y-%m-%d") as measure_dt2 '
        _query += 'from '
        _query += '(select a.mashing_id, b.field_id, c.name, b.rice, d.id as data_id, a.start_dt, a.end_dt, d.id '                
        _query += 'from mashing a, mashingmap b, fields c, dataindexes d '
        _query += 'where a.mashing_id = b.mashing_id '
        _query += 'and a.mashing_id = ? '
        _query += 'and b.field_id = c.id '
        _query += 'and d.field_id = c.id '
        _query += 'and right(d.id, 1) = "1" '
        _query += 'and substring(d.id, 6,1) in (2,3,4)) aa, observations bb '
        _query += 'where aa.data_id = bb.data_id) aa '
        _query += 'where date_format(aa.measure_dt, "%Y-%m-%d") >= date_format(aa.start_dt, "%Y-%m-%d") '
        _query += 'and date_format(aa.measure_dt, "%Y-%m-%d") <= date_format(aa.end_dt, "%Y-%m-%d") '
        _query += 'group by aa.mashing_id, aa.tank_id, aa.tank_name, aa.rice, aa.measure_dt2  '
        
        const [rows] = await _pool.query(_query, [mashing_id]);
        return rows
    };    

    /**    
     * @method getDashboardAlcholeChartInfo
     * @description 막걸리 대시보드 알콜정보를 조회한다
     */
    var getDashboardAlcholeChartInfo = async function (mashing_id) {
        
        _query = 'select aa.mashing_id, aa.tank_id, aa.tank_name, aa.rice, aa.measure_dt2 as measure_dt, round(avg(aa.value),1) as value, aa.tank_id as code '
        _query += 'from '   
        _query += '(select aa.mashing_id, aa.field_id as tank_id, aa.name as tank_name, aa.rice, date_format(bb.obs_time, "%Y-%m-%d %H:%i") as measure_dt, round(bb.nvalue,1) as value, '
        _query += 'date_format(aa.start_dt, "%Y-%m-%d") as start_dt, date_format(aa.end_dt, "%Y-%m-%d") as end_dt, aa.data_id, date_format(bb.obs_time, "%Y-%m-%d") as measure_dt2 '
        _query += 'from '
        _query += '(select a.mashing_id, b.field_id, c.name, b.rice, d.id as data_id, a.start_dt, a.end_dt, d.id '                
        _query += 'from mashing a, mashingmap b, fields c, dataindexes d '
        _query += 'where a.mashing_id = b.mashing_id '
        _query += 'and a.mashing_id = ? '
        _query += 'and b.field_id = c.id '
        _query += 'and d.field_id = c.id '
        _query += 'and right(d.id, 1) = "1" '
        _query += 'and substring(d.id, 6,1) in (9)) aa, observations bb '
        _query += 'where aa.data_id = bb.data_id) aa '
        _query += 'where date_format(aa.measure_dt, "%Y-%m-%d") >= date_format(aa.start_dt, "%Y-%m-%d") '
        _query += 'and date_format(aa.measure_dt, "%Y-%m-%d") <= date_format(aa.end_dt, "%Y-%m-%d") '
        _query += 'group by aa.mashing_id, aa.tank_id, aa.tank_name, aa.rice, aa.measure_dt2  '
        
        const [rows] = await _pool.query(_query, [mashing_id]);
        return rows
    };   

        /**    
     * @method getDashboardPhChartInfo
     * @description 막걸리 대시보드 pH정보를 조회한다
     */
    var getDashboardPhChartInfo = async function (mashing_id) {
        
        _query = 'select aa.mashing_id, aa.tank_id, aa.tank_name, aa.rice, aa.measure_dt2 as measure_dt, round(avg(aa.value),1) as value, aa.tank_id as code '
        _query += 'from '   
        _query += '(select aa.mashing_id, aa.field_id as tank_id, aa.name as tank_name, aa.rice, date_format(bb.obs_time, "%Y-%m-%d %H:%i") as measure_dt, round(bb.nvalue,1) as value, '
        _query += 'date_format(aa.start_dt, "%Y-%m-%d") as start_dt, date_format(aa.end_dt, "%Y-%m-%d") as end_dt, aa.data_id, date_format(bb.obs_time, "%Y-%m-%d") as measure_dt2 '
        _query += 'from '
        _query += '(select a.mashing_id, b.field_id, c.name, b.rice, d.id as data_id, a.start_dt, a.end_dt, d.id '                
        _query += 'from mashing a, mashingmap b, fields c, dataindexes d '
        _query += 'where a.mashing_id = b.mashing_id '
        _query += 'and a.mashing_id = ? '
        _query += 'and b.field_id = c.id '
        _query += 'and d.field_id = c.id '
        _query += 'and right(d.id, 1) = "1" '
        _query += 'and substring(d.id, 6,1) in (8)) aa, observations bb '
        _query += 'where aa.data_id = bb.data_id) aa '
        _query += 'where date_format(aa.measure_dt, "%Y-%m-%d") >= date_format(aa.start_dt, "%Y-%m-%d") '
        _query += 'and date_format(aa.measure_dt, "%Y-%m-%d") <= date_format(aa.end_dt, "%Y-%m-%d") '
        _query += 'group by aa.mashing_id, aa.tank_id, aa.tank_name, aa.rice, aa.measure_dt2  '
        
        const [rows] = await _pool.query(_query, [mashing_id]);
        return rows
    };     

    /**    
     * @method deleteMashing
     * @description 막걸리 담금정보를 삭제한다
     */
    var deleteMashing = async function (mashing_id) {        
        _query = "delete from mashing where mashing_id= ? "        
        await _pool.query(_query, [mashing_id]);        
    };

    /**    
     * @method deleteMashingMap
     * @description 막걸리 담금 상세정보를 삭제한다
     */
    var deleteMashingMap = async function (mashing_id) {        
        _query = "delete from mashingmap where mashing_id= ? "        
        await _pool.query(_query, [mashing_id]);        
    };

    /**    
     * @method deleteWaterInfo
     * @description 막걸리 담금 수온정보를 삭제한다
     */
    var deleteWaterInfo = async function (tank_list, start_dt, end_dt) {                
        for(var i=0; i<tank_list.length; i++){
            var data_id = 4 * 10000000 + tank_list[i].tank_id * 100000 + 4            
            _query = 'delete from observations where data_id=' + data_id + ' and date_format(obs_time, "%Y-%m-%d") >= date_format(?, "%Y-%m-%d") and date_format(obs_time, "%Y-%m-%d") <= date_format(?, "%Y-%m-%d") '        
            await _pool.query(_query, [start_dt, end_dt]);        
        }
    };    

    /**    
     * @method deleteManualTempInfo
     * @description 막걸리 담금 수동측정 온도정보를 삭제한다
     */
    var deleteManualTempInfo = async function (tank_list, start_dt, end_dt) {                
        for(var i=0; i<tank_list.length; i++){            
            var data_id = 4 * 10000000 + tank_list[i].tank_id * 100000 + 3            
            _query = 'delete from observations where data_id=' + data_id + ' and date_format(obs_time, "%Y-%m-%d") >= date_format(?, "%Y-%m-%d") and date_format(obs_time, "%Y-%m-%d") <= date_format(date_add(?,INTERVAL 9 DAY), "%Y-%m-%d") '        
            await _pool.query(_query, [start_dt, end_dt]);        
        }
    };

    /**    
     * @method deleteAlcholeInfo
     * @description 막걸리 담금 알콜정보를 삭제한다
     */
    var deleteAlcholeInfo = async function (tank_list, start_dt, end_dt) {                
        for(var i=0; i<tank_list.length; i++){            
            var data_id = 4 * 10000000 + tank_list[i].tank_id * 100000 + 6
            _query = 'delete from observations where data_id=' + data_id + ' and date_format(obs_time, "%Y-%m-%d") >= date_format(?, "%Y-%m-%d")  and date_format(obs_time, "%Y-%m-%d") <= date_format(date_add(?,INTERVAL 9 DAY), "%Y-%m-%d") '        
            await _pool.query(_query, [start_dt, end_dt]);        
        }
    };

    /**    
     * @method deleteAciInfo
     * @description 막걸리 담금 산도정보를 삭제한다
     */
    var deleteAciInfo = async function (tank_list, start_dt, end_dt) {                
        for(var i=0; i<tank_list.length; i++){    
            var data_id = 4 * 10000000 + tank_list[i].tank_id * 100000 + 5        
            _query = 'delete from observations where data_id=' + data_id + ' and date_format(obs_time, "%Y-%m-%d") >= date_format(?, "%Y-%m-%d")  and date_format(obs_time, "%Y-%m-%d") <= date_format(date_add(?,INTERVAL 9 DAY), "%Y-%m-%d") '        
            await _pool.query(_query, [start_dt, end_dt]);        
        }
    };

    /**    
     * @method deleteBrixInfo
     * @description 막걸리 담금 당도정보를 삭제한다
     */
    var deleteBrixInfo = async function (tank_list, start_dt, end_dt) {                
        for(var i=0; i<tank_list.length; i++){            
            var data_id = 4 * 10000000 + tank_list[i].tank_id * 100000 + 7                    
            _query = 'delete from observations where data_id=' + data_id + ' and date_format(obs_time, "%Y-%m-%d") >= date_format(?, "%Y-%m-%d")  and date_format(obs_time, "%Y-%m-%d") <= date_format(date_add(?,INTERVAL 9 DAY), "%Y-%m-%d") '        
            await _pool.query(_query, [start_dt, end_dt]);        
        }
    };

    /**    
     * @method deleteMorningTemp
     * @description 막걸리 담금 오전정보를 삭제한다.
     */
    var deleteMorningTemp = async function (start_dt, end_dt, company) {                
        if(company == '0'){
            _query = 'delete from observations where data_id = "40000001" and date_format(obs_time, "%Y-%m-%d") >= date_format(?, "%Y-%m-%d")  and date_format(obs_time, "%Y-%m-%d") <= date_format(date_add(?,INTERVAL 9 DAY), "%Y-%m-%d") '        
        }else{
            _query = 'delete from observations where data_id = "40010001" and date_format(obs_time, "%Y-%m-%d") >= date_format(?, "%Y-%m-%d")  and date_format(obs_time, "%Y-%m-%d") <= date_format(date_add(?,INTERVAL 9 DAY), "%Y-%m-%d") '        
        }
        
        await _pool.query(_query, [start_dt, end_dt]);        
    };

    /**    
     * @method deleteAfternoonTemp
     * @description 막걸리 담금 오후정보를 삭제한다.
     */
    var deleteAfternoonTemp = async function (start_dt, end_dt, company) {                
        if(company == '0'){
            console.log("2323232323")
            _query = 'delete from observations where data_id = "40000002" and date_format(obs_time, "%Y-%m-%d") >= date_format(?, "%Y-%m-%d")  and date_format(obs_time, "%Y-%m-%d") <= date_format(date_add(?,INTERVAL 9 DAY), "%Y-%m-%d") '        
        }else{
            _query = 'delete from observations where data_id = "40010002" and date_format(obs_time, "%Y-%m-%d") >= date_format(?, "%Y-%m-%d")  and date_format(obs_time, "%Y-%m-%d") <= date_format(date_add(?,INTERVAL 9 DAY), "%Y-%m-%d") '        
        }        
        await _pool.query(_query, [start_dt, end_dt]);        
    };

    /**    
     * @method deleteKojiInfo
     * @description 막걸리 담금 입국정보를 삭제한다
     */
    var deleteKojiInfo = async function (mashing_id) {                
        _query = 'delete from input_material where mashing_id = ? '        
        await _pool.query(_query, [mashing_id]);        
    };

    /**
     * @method getMashingSetting1
     * @description 막걸리 담금 자동제어 셋팅정보를 조회한다
     */
    var getMashingSetting1 = async function (id) {        

        _query = 'select id, name, updated, field_id, used, constraints, configurations, inputs, controllers '
        _query += 'from core_rule_applied '
        _query += 'where field_id = ? '        

        const [rows] = await _pool.query(_query, [id]);        
        return rows        
    };

    /**
     * @method getMashingSetting2
     * @description 막걸리 담금 자동제어 셋팅정보를 조회한다
     */
    var getMashingSetting2 = async function (id) {        

        _query = 'select b.mashing_id, b.field_id  '
        _query += 'from mashing a, mashingmap b '
        _query += 'where a.mashing_id = b.mashing_id '
        _query += 'and a.mashing_id = ?'        

        const [rows] = await _pool.query(_query, [id]);        
        return rows        
    };
    
    /**    
     * @method setSettingInfo1
     * @description 막걸리 담금 자동제어 셋팅정보를 저장한다.
     */
    var setSettingInfo1 = async function (field_id, obj) {        

        _query = 'update core_rule_applied set configurations = ? where field_id = ? and name  NOT LIKE  "%교반%" '                        
                
        await _pool.query(_query, [obj, field_id]);                
    };

    /**    
     * @method setSettingInfo2
     * @description 막걸리 담금 자동교반제어 셋팅정보를 저장한다.
     */
    var setSettingInfo2 = async function (field_id, obj) {        

        _query = 'update core_rule_applied set configurations = ? where field_id = ? and name  LIKE  "%교반%" '                        
                
        await _pool.query(_query, [obj, field_id]);                
    };

    /**
     * @method getStirringSetting
     * @description 막걸리 담금 교반자동제어 셋팅정보를 조회한다
     */
    var getStirringSetting = async function (id) {        

        _query = 'select id, name, updated, field_id, used, constraints, configurations, inputs, controllers '
        _query += 'from core_rule_applied '
        _query += 'where field_id = ? '        
        _query += 'and name  LIKE "%교반%" '                

        const [rows] = await _pool.query(_query, [id]);        
        return rows        
    };
        
    /**    
     * @method setEpochStartTime
     * @description 막걸리 담금 시작일자 / 2단담금일자 -> epochtime 저장
     */
    var setEpochTime = async function (basic_info) {        

        var tank_list = basic_info.tank_list
        var start_dt = basic_info.start_dt
        var second_dt = basic_info.second_dt
        
        console.log(start_dt)
        console.log(second_dt)

        // 탱크1번
        _query1_1 = 'update current_observations set nvalue = UNIX_TIMESTAMP(date_format(?, "%Y-%m-%d")), modified_time = now(), obs_time = now() where data_id = 100081 '                        
        _query1_2 = 'update current_observations set nvalue = UNIX_TIMESTAMP(date_format(?, "%Y-%m-%d")), modified_time = now(), obs_time = now() where data_id = 100082 '                        

        // 탱크2번
        _query2_1 = 'update current_observations set nvalue = UNIX_TIMESTAMP(date_format(?, "%Y-%m-%d")), modified_time = now(), obs_time = now() where data_id = 200081 '                        
        _query2_2 = 'update current_observations set nvalue = UNIX_TIMESTAMP(date_format(?, "%Y-%m-%d")), modified_time = now(), obs_time = now() where data_id = 200082 '                        

        // 탱크3번
        _query3_1 = 'update current_observations set nvalue = UNIX_TIMESTAMP(date_format(?, "%Y-%m-%d")), modified_time = now(), obs_time = now() where data_id = 300081 '                        
        _query3_2 = 'update current_observations set nvalue = UNIX_TIMESTAMP(date_format(?, "%Y-%m-%d")), modified_time = now(), obs_time = now() where data_id = 300082 '                        

        // 탱크4번
        _query4_1 = 'update current_observations set nvalue = UNIX_TIMESTAMP(date_format(?, "%Y-%m-%d")), modified_time = now(), obs_time = now() where data_id = 400081 '                        
        _query4_2 = 'update current_observations set nvalue = UNIX_TIMESTAMP(date_format(?, "%Y-%m-%d")), modified_time = now(), obs_time = now() where data_id = 400082 '                        

        
        for(var i in tank_list){

            switch (tank_list[i].tank_id){
                case 1:                    
                    await _pool.query(_query1_1, [start_dt]);      
                    await _pool.query(_query1_2, [second_dt]);      
                break;
                case 2:
                    await _pool.query(_query2_1, [start_dt]);      
                    await _pool.query(_query2_2, [second_dt]);
                break;
                case 3:
                    await _pool.query(_query3_1, [start_dt]);      
                    await _pool.query(_query3_2, [second_dt]);
                break;
                case 4:
                    await _pool.query(_query4_1, [start_dt]);      
                    await _pool.query(_query4_2, [second_dt]);
                break;
            }
        }
    };

        /**    
     * @method deleteEpochTime
     * @description 막걸리 담금 시작일자 / 2단담금일자 -> epochtime 삭제
     */
    var deleteEpochTime = async function (basic_info) {        

        var tank_list = basic_info.tank_list        
        // 탱크1번
        _query1_1 = 'update current_observations set nvalue = 0, modified_time = now(), obs_time = now() where data_id = 100081 '                        
        _query1_2 = 'update current_observations set nvalue = 0, modified_time = now(), obs_time = now() where data_id = 100082 '                        

        // 탱크2번
        _query2_1 = 'update current_observations set nvalue = 0, modified_time = now(), obs_time = now() where data_id = 200081 '                        
        _query2_2 = 'update current_observations set nvalue = 0, modified_time = now(), obs_time = now() where data_id = 200082 '                        

        // 탱크3번
        _query3_1 = 'update current_observations set nvalue = 0, modified_time = now(), obs_time = now() where data_id = 300081 '                        
        _query3_2 = 'update current_observations set nvalue = 0, modified_time = now(), obs_time = now() where data_id = 300082 '                        

        // 탱크4번
        _query4_1 = 'update current_observations set nvalue = 0, modified_time = now(), obs_time = now() where data_id = 400081 '                        
        _query4_2 = 'update current_observations set nvalue = 0, modified_time = now(), obs_time = now() where data_id = 400082 '                        

        
        for(var i in tank_list){

            switch (tank_list[i].tank_id){
                case 1:                    
                    await _pool.query(_query1_1);      
                    await _pool.query(_query1_2);      
                break;
                case 2:
                    await _pool.query(_query2_1);      
                    await _pool.query(_query2_2);
                break;
                case 3:
                    await _pool.query(_query3_1);      
                    await _pool.query(_query3_2);
                break;
                case 4:
                    await _pool.query(_query4_1);      
                    await _pool.query(_query4_2);
                break;
            }
        }
    };

    /**
     * @method getMMSInfo
     * @description 막걸리 이살 발생 내역 수신자 정보를 조회한다
     */
    var getMMSInfo = async function () {        

        _query = 'select id,name,phone_number, memo, "true" as disabled, "수정" as text '
        _query += 'from alarm_person '        
        _query += 'order by name asc '        

        const [rows] = await _pool.query(_query);        
        return rows        
    };

    /**
     * @method setMMSInfo
     * @description 막걸리 이살 발생 내역 수신자 정보를 저장한다
     */
    var setMMSInfo = async function (basic_info) {

        _query = "insert into alarm_person "
        _query += '(id,name,phone_number,memo, company_gubun) '
        _query += 'values '
        _query += '((select max(ifnull(a.id,0))+1 from alarm_person a), ?, ?, ?, ?) '
        await _pool.query(_query, [basic_info.name, basic_info.phone_number, basic_info.memo, basic_info.company_gubun]);
    };

    /**
     * @method deleteMMSInfo
     * @description 막걸리 이살 발생 내역 수신자 정보를 삭제한다
     */
    var deleteMMSInfo = async function (basic_info) {
        _query = 'delete from alarm_person where id = ? '
        await _pool.query(_query, [basic_info.id]);
    };

    /**
     * @method updateMMSInfo
     * @description 막걸리 이살 발생 내역 수신자 정보를 수정한다
     */
    var updateMMSInfo = async function (basic_info) {

        _query = 'update alarm_person set name = ?, phone_number = ?, memo = ? where id = ?'        
        
        await _pool.query(_query, [basic_info.name, basic_info.phone_number,  basic_info.memo, basic_info.id]);
    };

    /**
     * @method getMMSList
     * @description 막걸리 알람 이상내역 리스트를 조회한다
     */
    var getMMSList = async function (company_gubun) {               
        if(company_gubun == 0){ // 우리술
            _query = 'select data_id, date_format(obs_time, "%Y-%m-%d %H:%i") as obs_time, nvalue  '
            _query += 'from observations '
            _query += 'where data_id in (30010001, 30020001) '
            _query += 'order by obs_time desc '        
        }else{ // 우리도가
            _query = 'select data_id, date_format(obs_time, "%Y-%m-%d %H:%i") as obs_time, nvalue  '
            _query += 'from observations '
            _query += 'where data_id in (30030001, 30040001) '
            _query += 'order by obs_time desc '        
        }
        const [rows] = await _pool.query(_query);        
        return rows        
    };

    /**
     * @method gertInterval
     * @description DB 주기적 호출
     */
    var gertInterval = async function () {                       
        _query = 'select 1 '            
        const [rows] = await _pool.query(_query);        
        return rows        
    };
    
    return {
        getAllMashingInfo: getAllMashingInfo,
        setMashingBasicInfo: setMashingBasicInfo,
        setMashingMap : setMashingMap,
        getMashingInfo : getMashingInfo,
        getTankList : getTankList,        
        getMoringTemp : getMoringTemp,
        getAfterNoonTemp : getAfterNoonTemp,
        getWaterTemp : getWaterTemp,
        getManulaTemp : getManulaTemp,
        getAci : getAci,
        getAlc : getAlc,
        getBrix : getBrix,
        getInput : getInput,
        getInput2 : getInput2,
        getMashingChartInfo : getMashingChartInfo,
        setMoringTemp : setMoringTemp,
        setAfterNoonTemp : setAfterNoonTemp,
        setWaterTemp : setWaterTemp,
        setManulaTemp : setManulaTemp,
        setAci : setAci,
        setAlc : setAlc,
        setBrix : setBrix,
        setInput : setInput,
        getMashingStepInfo : getMashingStepInfo,        
        getMashingCurrentObservation : getMashingCurrentObservation,
        getDashboardTempChartInfo : getDashboardTempChartInfo,
        getDashboardAlcholeChartInfo : getDashboardAlcholeChartInfo,
        getDashboardPhChartInfo : getDashboardPhChartInfo,
        deleteMashing : deleteMashing,
        deleteMashingMap : deleteMashingMap,
        deleteWaterInfo : deleteWaterInfo,
        deleteManualTempInfo : deleteManualTempInfo,                
        deleteAlcholeInfo : deleteAlcholeInfo,                
        deleteAciInfo : deleteAciInfo,
        deleteBrixInfo : deleteBrixInfo,
        deleteKojiInfo : deleteKojiInfo,
        deleteMorningTemp : deleteMorningTemp,
        deleteAfternoonTemp : deleteAfternoonTemp,
        getMashingSetting1 : getMashingSetting1,
        getMashingSetting2 : getMashingSetting2,        
        setSettingInfo1 : setSettingInfo1,
        setSettingInfo2 : setSettingInfo2,        
        getStirringSetting : getStirringSetting,
        setEpochTime : setEpochTime,        
        deleteEpochTime : deleteEpochTime,
        getMMSInfo : getMMSInfo,
        setMMSInfo : setMMSInfo,
        deleteMMSInfo : deleteMMSInfo,
        updateMMSInfo : updateMMSInfo,
        getMMSList : getMMSList,
        gertInterval : gertInterval
    };
};

module.exports = rrw_api();
