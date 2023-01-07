const moment = require("moment");

class CheckService {
    newTimeWindow = async (body) => {
        try {
            let { pickupdateFrom, pickupdateTo, deliverydateFrom, deliverydateTo, companyName } = body,
            pickupTimeWindows = [], deliveryTimeWindows = [];

            let pickupFrom = moment.utc(pickupdateFrom), pickupTo = moment.utc(pickupdateTo);
            let deliveryFrom = moment.utc(deliverydateFrom), deliveryTo = moment.utc(deliverydateTo);
            let pickupCount = pickupTo.diff(pickupFrom, "days"), pFrom = pickupFrom.format("HH:mm:ss.SSS"), pTo = pickupTo.format("HH:mm:ss.SSS"), pDate, pDateTo;
            let deliveryCount = deliveryTo.diff(deliveryFrom, "days"), dFrom = deliveryFrom.format("HH:mm:ss.SSS"), dTo = deliveryTo.format("HH:mm:ss.SSS"), dDate, dDateTo;
            if (pickupCount > 0 && (companyName == "uniqlo" || companyName == "tuniqlo")) {
                for (let i = 0; i <= pickupCount; i++) {
                    pDate = pickupFrom.format("YYYY-MM-DD");
                    pickupTimeWindows.push({
                        "From": `${pDate}T${pFrom}Z`,
                        "To": `${pDate}T${pTo}Z`,
                    });
                    pickupFrom.add(1, "days");
                }
            } else {
                pDate = pickupFrom.format("YYYY-MM-DD");
                pDateTo = pickupTo.format("YYYY-MM-DD");
                pickupTimeWindows.push({
                    "From": `${pDate}T${pFrom}Z`,
                    "To": `${pDateTo}T${pTo}Z`,
                });
            }
            if (deliveryCount > 0 && (companyName == "uniqlo" || companyName == "tuniqlo")) {
                for (let i = 0; i <= deliveryCount; i++) {
                    dDate = deliveryFrom.format("YYYY-MM-DD");
                    deliveryTimeWindows.push({
                        "From": `${dDate}T${dFrom}Z`,
                        "To": `${dDate}T${dTo}Z`,
                    });
                    deliveryFrom.add(1, "days");
                }
            } else {
                dDate = deliveryFrom.format("YYYY-MM-DD");
                dDateTo = deliveryTo.format("YYYY-MM-DD");
                deliveryTimeWindows.push({
                    "From": `${dDate}T${dFrom}Z`,
                    "To": `${dDateTo}T${dTo}Z`,
                });
            }
            return {
                pickupTimeWindows,
                deliveryTimeWindows,
                status: 1
            };
        } catch (error) {
            console.log("Error: ", error.message);
            return {
                status: 0,
                msg: error.message
            };
        }
    }
}

module.exports = CheckService = new CheckService();
