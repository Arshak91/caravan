const Helpers = require("../FTLClasses/helpersFTL");
const axios = require("axios");
const env = process.env.SERVER == "local" ? require("../config/env.local") : require("../config/env");

module.exports = class osmapClass {
    constructor(params, helper) {
        this.data = params.data;
        this.helper = helper;
    }
    async GeoLoc(){
        let { query } = this.data, status = 1, message = "Success";
        const loc = await axios.get(encodeURI(`https://maps.googleapis.com/maps/api/geocode/json?key=${env.mapKey}&address=${query}`)).catch(async err => {
            console.log("GeoLoc Error: ", err.message);
            status = 0;
            message = `GeoLoc Error: ${err.message}`;
        });
        if (loc.status == "ZERO_RESULTS") {
            status = 0;
            message = `Wrong Address!!`;
        }
        return await this.helper.getResponse(status, message, loc);
    }
};
