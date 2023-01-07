const OSmapService = require("../services/osmap.service");
const OSmapServiceClass = new OSmapService();
class DriverHelper {
    createDriverModel = async (data) => {
        let { activeMobile, exUser, exDriver } = data;
        if (exUser && exUser.status) {
            return { status: 0, message: 'This email address has been already assigned to another user.' };
        }
        if (exDriver && exDriver.status) {
            return { status: 0, message: 'This email address has been already assigned to another driver.' };
        }
        let address = {}, latLon;
        for (const key in data) {
            if (key == "streetaddress" || key == "city" || key == "state" || key == "zip" || key == "country" || key == "countryCode") {
                address[key] = data[key]
            }
        }
        latLon = await this.getLatLonFromObj(address)
        if (latLon.status) {
            address.lat = latLon.data.data.results[0].geometry.location.lat
            address.lon = latLon.data.data.results[0].geometry.location.lng
        }
        return {
            status: 1,
            message: 'Success',
            data: {
                carrier: data.carrierId ? data.carrierId : null,
                equipment: data.equipmentId,
                asset: data.assetId ? data.assetId : null,
                shift: data.shiftId,
                depo: data.depotId ? data.depotId : null,

                type: data.type ? data.type : "Own Operator",
                eqType: data.eqType ? data.eqType : null,
                status: data.status ? data.status : null,
                startTime: data.startTime ? data.startTime : null,
                endTime: data.endTime ? data.endTime : null,

                fname: data.fname,
                lname: data.lname,
                email: data.email,
                address: address,

                phone: data.phone  ? data.phone : null,

                rate: data.rate ? data.rate : null,
                hourlyRate: data.hourlyRate ? data.hourlyRate : null,
                perMileRate: data.perMileRate ? data.perMileRate : null,
                percentRate: data.percentRate ? data.percentRate : null,
                bonuses: data.bonuses ? data.bonuses : null,
                fuelsurcharge: data.fuelsurcharge ? data.fuelsurcharge : null,
                detention: data.detention ? data.detention : null,

                dob: data.dob ? data.dob : null,
                hdate: data.dob ? data.dob : null,

                easypass: data.easypass ? data.easypass : 0,
                ex_rev_per_mile: data.ex_rev_per_mile ? data.ex_rev_per_mile : 0,
                ex_rev_goal_week: data.ex_rev_goal_week ? data.ex_rev_goal_week :0 ,
                lengthofhaul_min: data.lengthofhaul_min ? data.lengthofhaul_min : 0,
                lengthofhaul_max: data.lengthofhaul_min ? data.lengthofhaul_min : 0,
                use_sleeper_b_p: data.use_sleeper_b_p ? data.use_sleeper_b_p : 0,
                drivinglicence: data.drivinglicence ? data.drivinglicence : null,
                throughStates: data.throughStates ? data.throughStates : 0,
                pickupDeliveryStates: data.pickupDeliveryStates ? data.pickupDeliveryStates : null,
                prefTruckStops: data.prefTruckStops ? data.prefTruckStops : null,
                tollRoutes: data.tollRoutes ? data.tollRoutes : null,
                routeNumber: data.routeNumber ? data.routeNumber : null
            }
        };
    };

    getLatLonFromObj = async (data) => {
        let addr = "";
        for (const key in data) {
            if (data[key]) {
                addr += data[key];
            }
            addr += "+"
        }
        let latlon = await OSmapServiceClass.GeoLoc({query: addr});
        return {status: latlon.status, message: latlon.msg, data: latlon.data}
    };

    getActiveDrivers = async (data) => {
        let { loadStartTime, drivers } = data, arrDrivers = [];
        let weekDay = await this.getWeekDay(loadStartTime);
        let startDay = loadStartTime.split("T")[0];
        for (const driver of drivers) {
            let schedule = driver._doc.schedule._doc[weekDay];
            if (schedule && schedule.from) {
                let driverTime = schedule.from.split("T")[1];
                arrDrivers.push({
                    Id: driver._doc._id,
                    startTime: `${startDay}T${driverTime}`
                });
            }
        }
        return arrDrivers;

    }
}
module.exports = DriverHelper;