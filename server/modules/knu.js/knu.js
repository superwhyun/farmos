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
     * @method getKnuObservations1
     * @description 경북대 수질관리(습도)정보를 조회한다
     */
    var getKnuObservations1 = async function () {        

        _query = 'select data_id, date_format(obs_time, "%Y-%m-%d %H:%i") as obs_time, round(nvalue,2) as nvalue '        							
        _query += 'from '
        _query += 'observations '
        _query += 'where data_id in (10003201) '        
        _query += 'and date_format(obs_time, "%Y-%m-%d") = "2019-08-27" '        
        _query += 'order by obs_time asc '        

        const [rows] = await _pool.query(_query);        
        return rows        
    };

    /**
     * @method getKnuObservations2
     * @description 경북대 수질관리(pH)정보를 조회한다
     */
    var getKnuObservations2 = async function () {        

        _query = 'select data_id, date_format(obs_time, "%Y-%m-%d %H:%i") as obs_time, round(nvalue,2) as nvalue '        							
        _query += 'from '
        _query += 'observations '
        _query += 'where data_id in (10003301) '        
        _query += 'and date_format(obs_time, "%Y-%m-%d") = "2019-08-27" '        
        _query += 'order by obs_time asc '        

        const [rows] = await _pool.query(_query);        
        return rows        
    };

    /**
     * @method getKnuCurrentObservations1
     * @description 경북대 수질관리(습도) 최근 정보를 조회한다
     */
    var getKnuCurrentObservations1 = async function () {        

        _query = 'select data_id, date_format(obs_time, "%Y-%m-%d %H:%i") as obs_time, round(nvalue,2) as nvalue '        							
        _query += 'from '
        _query += 'current_observations '
        _query += 'where data_id in (10003201) '        
        _query += 'and date_format(obs_time, "%Y-%m-%d") = "2019-08-27" '        
        _query += 'order by obs_time asc '        

        const [rows] = await _pool.query(_query);        
        return rows        
    };

    /**
     * @method getKnuCurrentObservations2
     * @description 경북대 수질관리(pH) 최근 정보를 조회한다
     */
    var getKnuCurrentObservations2 = async function () {        

        _query = 'select data_id, date_format(obs_time, "%Y-%m-%d %H:%i") as obs_time, round(nvalue,2) as nvalue '        							
        _query += 'from '
        _query += 'current_observations '
        _query += 'where data_id in (10003301) '        
        _query += 'and date_format(obs_time, "%Y-%m-%d") = "2019-08-27" '        
        _query += 'order by obs_time asc '        

        const [rows] = await _pool.query(_query);        
        return rows        
    };

    /**
     * @method getKnuDownload
     * @description 경북대 수질관리 정보를 다운로드한다
     */
    var getKnuDownload = async function () {        

        _query = 'select aa.obs_time as "측정시간", '        							
        _query += 'case when bb.data_id = "10003201" then ifnull(bb.nvalue,0) end as "수분", '
        _query += 'case when cc.data_id = "10003301" then ifnull(cc.nvalue,0) end as "pH"  '
        _query += 'from '
        _query += '(select date_format(obs_time, "%Y-%m-%d %H:%i") as obs_time '        
        _query += 'from observations '        
        _query += 'where data_id in (10003201) '        
        _query += 'and date_format(obs_time, "%Y-%m-%d") = "2019-08-27" '        
        _query += 'group by date_format(obs_time, "%Y-%m-%d %H:%i") '        
        _query += 'order by obs_time desc) aa, '        
        _query += '(select date_format(obs_time, "%Y-%m-%d %H:%i") as obs_time, round(nvalue,2) as nvalue, data_id '        
        _query += 'from observations  '        
        _query += 'where data_id in (10003201)  '        
        _query += 'and date_format(obs_time, "%Y-%m-%d") = "2019-08-27"  '        
        _query += 'group by date_format(obs_time, "%Y-%m-%d %H:%i"), data_id, nvalue '        
        _query += 'order by obs_time desc) bb, '        
        _query += '(select date_format(obs_time, "%Y-%m-%d %H:%i") as obs_time, round(nvalue,2) as nvalue, data_id '        
        _query += 'from observations  '        
        _query += 'where data_id in (10003301)  '        
        _query += 'and date_format(obs_time, "%Y-%m-%d") = "2019-08-27" '        
        _query += 'group by date_format(obs_time, "%Y-%m-%d %H:%i"), data_id, nvalue '        
        _query += 'order by obs_time desc) cc '        
        _query += 'where aa.obs_time = bb.obs_time '        
        _query += 'and bb.obs_time = cc.obs_time '                        

        const [rows] = await _pool.query(_query);        
        return rows        
    };
    

    
    return {
        getKnuObservations1: getKnuObservations1,
        getKnuObservations2: getKnuObservations2,
        getKnuCurrentObservations1 : getKnuCurrentObservations1,
        getKnuCurrentObservations2 : getKnuCurrentObservations2,
        getKnuDownload : getKnuDownload
    };
};

module.exports = rrw_api();
