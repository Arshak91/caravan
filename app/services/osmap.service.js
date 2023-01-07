const axios = require("axios");
const request  = require("request-promise");
const BaseService = require("../main_classes/base.service");
const env = process.env.SERVER == "local" ? require("../config/env.local") : require("../config/env");

class OSmapService extends BaseService {
    constructor() {
        super();
    }
    GeoLoc = async (data) => {
        let { query } = data, status = 1, message = "Success";
        const loc = await axios.get(encodeURI(`https://maps.googleapis.com/maps/api/geocode/json?key=${env.mapKey}&address=${query}`)).catch(async err => {
            console.log("GeoLoc Error: ", err.message);
            status = 0;
            message = `GeoLoc Error: ${err.message}`;
        });
        if (loc.data.status == "ZERO_RESULTS") {
            status = 0;
            message = `Wrong Address!!`;
        }
        return this.getResponse(status, message, loc);
    };
    
    GetDistDur = async (points) => {
        let mapUrl = env.mapHost + env.mapPort +  env.mapUri;
        let newStr = points, arrLatLon = [], status = 1, message = "";
        if (newStr.slice(-1) == ";") {
            newStr = newStr.slice(0, -1);
        }
        let data = {
            distance: 0,
            duration: 0,
            legs: [],
        };
        let result, matrix = "annotations=distance,duration&generate_hints=false&exclude=ferry";
        let statusCode;
        result = await request(mapUrl + newStr + "?overview=false&exclude=ferry", { json: true }, (err, res, body) => {
            if (err) {
                console.log(err);
                status = 0;
                message = err.message;
            }
            statusCode = res.statusCode ? res.statusCode : 1;
            message = res.statusMessage ? res.statusMessage : 'Ok';
        });
        if (statusCode == 400) {
            status = 0;
        } else {
            // let distance = 0;
            // let duration = 0;
            // let legs =[];
            // for (let i = 0, len = result.distances.length - 1; i < len; i++) {
            //   distance += result.distances[i][i + 1];
            //   duration += result.durations[i][i + 1];
            //   legs[i] = { distance: result.distances[i][i + 1], duration:result.durations[i][i + 1]};
            // }
            data = {
                distance: result.routes[0].distance,
                duration: result.routes[0].duration,
                legs: result.routes[0].legs,
            };
            message = "Success"
        }
        return this.getResponse(status, message, data)
    };

    GetDistDurMapBox = async (points) => {
        let mapInfo = env.mapBox;
        let mapUrl = mapInfo.host;
        let newStr = points;
        let arrLatLon = [], status = 1, message;
        if (newStr.slice(-1) == ";") {
            newStr = newStr.slice(0, -1);
        }
        let pointsArray = newStr.split(";");
        let newPoints = "";
        pointsArray.forEach(point => {
            let latlon = point.split(",");
            let lat = parseFloat(latlon[1]).toFixed(7);
            let lon = parseFloat(latlon[0]).toFixed(7);
            arrLatLon.push({
            lat,
            lon
            });
            newPoints += lon + "," + lat + ";";
        });
        newPoints = newPoints.slice(0, -1);
        let newLegs;
        newLegs = await this.groupMapLegs(newPoints);
        const result = newLegs.result;
        let data;
        if (!result) {
            status = 0;
            message = "map Error";
            // return {
            //     distDur: [],
            //     arrLatLon,
            //     status,
            //     code: "Error",
            //     msg: "map Error"
            // };
        } else {
            data = {
                distance: result.routes[0].distance,
                duration: result.routes[0].duration,
                legs: result.routes[0].legs,
            };
            message = result.message;
            // return {
            //     distDur: data,
            //     arrLatLon,
            //     status,
            //     code: result.code,
            //     msg: result.message
            // };
        }
        return this.getResponse(status, message, data)
    };
    groupMapLegs = async (str) => {
        // let mapUrl = env.mapHost + env.mapPort +  env.mapUri;
        let mapInfo = env.mapBox;
        let mapUrl = mapInfo.host;
        let arrLatLon = str.split(";"), results = [], latLonStr = "", mapResponse, finalResponse = {};
        if (arrLatLon.length < 2) {
            return {
                result: 0
            };
        }
        let bool = 0;
        for (const [i, item] of arrLatLon.entries()) {
            latLonStr += `${item};`;
            if ((i+1)%25 == 0 && bool == 0) {
                bool = 1;
                latLonStr = latLonStr.slice(0, -1);
                mapResponse = await request(mapUrl + latLonStr + mapInfo.linkParams, { json: true }, (err, res, body) => {
                  if (err) { return { msg: err.message, result: 0 }; }
                });
                results.push(mapResponse);
                latLonStr = "";
                latLonStr += `${item};`;
            }
            if ((i+1)%24 == 0 && bool == 1) {
              latLonStr = latLonStr.slice(0, -1);
              mapResponse = await request(mapUrl + latLonStr + mapInfo.linkParams, { json: true }, (err, res, body) => {
                  if (err) { return { msg: err.message, result: 0 }; }
              });
              results.push(mapResponse);
              latLonStr = "";
              latLonStr += `${item};`;
            }
        }
        latLonStr = latLonStr.slice(0, -1);
        let latLons = latLonStr.split(";"), mapResponseEnd;
        if (latLons.length >= 2) {
          mapResponseEnd = await request(mapUrl + latLonStr + mapInfo.linkParams, { json: true }, (err, res, body) => {
              if (err) { console.log(err.message); }
          });
        }
        if (mapResponseEnd && mapResponseEnd.code == "Ok") {
            results.push(mapResponseEnd);
        }
        finalResponse.routes = [{
          weight_name: "",
          weight: 0,
          duration: 0,
          distance: 0,
          legs: []
        }];
        for (const item of results) {
            finalResponse.routes[0].weight_name = item.routes[0].weight_name;
            finalResponse.routes[0].weight += item.routes[0].weight;
            finalResponse.routes[0].duration += item.routes[0].duration;
            finalResponse.routes[0].distance += item.routes[0].distance;
            finalResponse.routes[0].legs = finalResponse.routes[0].legs.concat(item.routes[0].legs);
            finalResponse.code = item.code;
        }
        return {
            result: finalResponse
        };
      
      };
};

module.exports = OSmapService;