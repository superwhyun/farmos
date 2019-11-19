/**
 * @fileoverview farmos api for farmos
 * @author joonyong.jinong@gmail.com
 * @version 1.0.0
 * @since 2017.07.25
 */

var rrw = require('knu.js');
var _modulename = 'knu api for farmos';
var fs = require("fs");

var knu_api = function () {

    /**
     * @method getKnuObservations
     * @description 경북대 사료정보(수분, pH)정보를 조회한다
     */
    var getKnuObservations = async function (req, res) {
        console.log(_modulename, 'getKnuObservations');
        var obj = {};
        try {            
            const result1 = await rrw.getKnuObservations1();                                    
            const result2 = await rrw.getKnuObservations2();                                    
            obj.humidityChart = result1
            obj.pHChart = result2
            res.json(obj);            
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }        
    };

    /**
     * @method getKnuCurrentObservations
     * @description 경북대 사료정보(수분, pH) 최근 정보를 조회한다
     */
    var getKnuCurrentObservations = async function (req, res) {
        console.log(_modulename, 'getKnuCurrentObservations');
        var obj = {};
        try {            
            const result1 = await rrw.getKnuCurrentObservations1();                                    
            const result2 = await rrw.getKnuCurrentObservations2();                                    
            obj.humidityChart = result1
            obj.pHChart = result2
            res.json(obj);            
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }        
    };

    /**
     * @method getKnuDownload
     * @description 경북대 사료정보(수분, pH) 다운로드
     */
    var getKnuDownload = async function (req, res) {
        console.log(_modulename, 'getKnuDownload');
        var obj = {};
        try {            
            const result = await rrw.getKnuDownload();   
            var data = "";
            if(result.length > 0){
                var key = Object.keys(result[0]);
                data = key.map(function(k){ return k; }).join(',') + "\n";
                for (var i in result) {
                    var row = result[i];
                    data += key.map(function(k){ return row[k]; }).join(',') + "\n";
                }
                
            }
            res.setHeader('Content-disposition', 'attachment;filename=feed.csv');
            res.set('Content-Type', 'text/csv');
            res.send(data);            
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }        
    };

    return {
        getKnuObservations: getKnuObservations,
        getKnuCurrentObservations : getKnuCurrentObservations,
        getKnuDownload : getKnuDownload
    };
};

module.exports = knu_api();
