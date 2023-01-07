const db = require("../config/db.config.js");
const moment = require("moment");
const Check = require("../FTLClasses/checks");
const UploadClass = require("./uploads");
const OrderClass = require("./order");
const UploaderClass = require("./uploader");
const DepoClass = require("./depo");
const Warnings = require("../warnings/orderWarnings");
const LocationClass = require("./location.js");
const BaseService = require("./base.js");

let createTimeWindow = async (data) => {
    let { fromDay, fromHour, toDay, toHour, timezone, depo, userType, consigneeName } = data;
    let zone = timezone.split("C")[1].split(":")[0];
    let frDay = moment(new Date(fromDay)).add(1, "day").format("YYYY-MM-DD");
    let tDay = moment(new Date(toDay)).format("YYYY-MM-DD");
    let pFrom = moment(new Date(fromDay)).subtract(zone, "hours");
    let pickupFrom = moment(new Date(fromDay)).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")+"Z";
    let pickupTo = pFrom.add(1, "day").subtract(1, "second").format("YYYY-MM-DDTHH:mm:ss.SSS")+"Z";
    let startFrom = moment(`${frDay}T${moment(fromHour, "HH:mm").format("HH:mm:ss.SSS")}`, "YYYY-MM-DDTHH:mm:ss.SSS Z").subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")+"Z";
    let entFrom = moment(`${frDay}T${moment(fromHour, "HH:mm").format("HH:mm:ss.SSS")}`, "YYYY-MM-DDTHH:mm:ss.SSS Z").subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")+"Z";
    let endTo = moment(`${tDay}T${moment(toHour, "HH:mm").format("HH:mm:ss.SSS")}`, "YYYY-MM-DDTHH:mm:ss.SSS Z").subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")+"Z";
    let timeWindows;
    timeWindows = await Check.newTimeWindow({
        pickupdateFrom: pickupFrom,
        pickupdateTo: pickupTo,
        deliverydateFrom: entFrom,
        deliverydateTo: endTo,
        timeWindows,
        pickupFrom,
        pickupTo,
        deliveryFrom:  deliveryWindow.From,
        deliveryTo: deliveryWindow.To
    })
};

module.exports = class Logics extends BaseService {


    constructor(params) {
        this.data = params.data;
        this.timezone = params.timezone;
        this.depo = params.depo;
        this.info = params.info;
        this.fileHeaders = params.fileHeaders;
    }

    async UploadAll() {
        let { uuid, userId, fileName, serviceTime, pieceTime, userType, companyName } = this.info, createdOrders = [], errorArr = [];
        let { fileHeaders, timezone, depo, req } = this, deliveryLoc, pickupLoc, createDeliveryLoc, createPickupLoc, timeWindow, orderDepo, orderDepot, pickup = {}, delivery = {};
        fileHeaders = await Helper.reverseObject(JSON.parse(fileHeaders)) ;
        for (const [i, item] of this.data.entries()) {
            let dateTimeCheck = await this.checkDateTimeFormats({item, fileHeaders});
            if (!dateTimeCheck.status) {
                errorArr.push({
                    status: 0,
                    msg: dateTimeCheck.message
                });
            } else {
                const DepoCl = item[fileHeaders["Depot Name"]] ? new DepoClass({
                    where: {
                        name: item[fileHeaders["Depot Name"]]
                    }
                }) : null
                // orderDepo = item[fileHeaders["Depot Name"]] ? await Helper.getOne({
                //     key: "name",
                //     value: ,
                //     table: Depo
                // }) : 1;
                orderDepo = DepoCl ? await DepoCl.getOne() : {status: 2, message: "Depo not found"}
                if (!orderDepo.status) {
                    errorArr.push({
                        status: orderDepo.status,
                        msg: orderDepo.message
                    });

                } else {
                    orderDepot = orderDepo && orderDepo.status == 2 ? depo : orderDepo.data;
                    let pickupStr, deliverStr, orderType = 1;
                    if (!item[fileHeaders["Pick Date"]] && ((!item[fileHeaders["Delivery Window End"]] && item[fileHeaders["Delivery Period"]]) || (item[fileHeaders["Delivery Window End"]] && item[fileHeaders["Delivery Period"]]))) {
                        timeWindow = await this.createTimeFormat({
                            deliveryDate: item[fileHeaders["Delivery Date"]],
                            deliveryStart: item[fileHeaders["Delivery Window Start"]],
                            period: item[fileHeaders["Delivery Period"]],
                            timezone
                        }, 1);
                    } else if (!item[fileHeaders["Pick Date"]] && item[fileHeaders["Delivery Window End"]] && !item[fileHeaders["Delivery Period"]]) {
                        timeWindow = await this.createTimeFormat({
                            deliveryDate: item[fileHeaders["Delivery Date"]],
                            deliveryStart: item[fileHeaders["Delivery Window Start"]],
                            deliveryEnd: item[fileHeaders["Delivery Window End"]],
                            timezone
                        }, 2);
                    }else if (item[fileHeaders["Pick Date"]] && item[fileHeaders["Delivery Date"]]) {
                        timeWindow = await this.createTimeFormat({
                            pickupDate: item[fileHeaders["Pick Date"]],
                            pickupStart: item[fileHeaders["Pick up Window Start"]],
                            pickupEnd: item[fileHeaders["Pick up Window End"]],
                            deliveryDate: item[fileHeaders["Delivery Date"]],
                            deliveryStart: item[fileHeaders["Delivery Window Start"]],
                            deliveryEnd: item[fileHeaders["Delivery Window End"]],
                            timezone
                        }, 3);
                    }
                    pickupStr = `${item[fileHeaders["Zip Code"]]} ${item[fileHeaders["City"]]} ${item[fileHeaders["Customer Address"]]} ${item[fileHeaders["State"]]}`;
                    deliverStr = `${item[fileHeaders["Zip Code"]]} ${item[fileHeaders["City"]]} ${item[fileHeaders["Customer Address"]]} ${item[fileHeaders["State"]]}`;

                    createPickupLoc = await this.createLocation({
                        item,
                        fileHeaders,
                        serviceTime,
                        delivery: {
                            from: timeWindow.pickupDateFrom+"Z",
                            to: timeWindow.pickupDateTo+"Z"
                        }
                    }, "pickup");
                    pickupLoc = createPickupLoc;
                    pickup = {
                        pickupLat: pickupLoc.data._doc.points[0].address.lat,
                        pickupLon: pickupLoc.data._doc.points[0].address.lon,
                        pickupCompanyName: pickupLoc.data._doc.companyLegalName,
                        pickupState: pickupLoc.data._doc.points[0].address.state,
                        pickupStreetAddress: pickupLoc.data._doc.points[0].address.streetAddress,
                        pickupCountry: pickupLoc.data._doc.points[0].address.country,
                        pickupCountryCode: pickupLoc.data._doc.points[0].address.countryCode.toLowerCase(),
                        pickupCity: pickupLoc.data._doc.points[0].address.city,
                        pickupZip: pickupLoc.data._doc.points[0].address.zip,
                        pickupStr
                    };

                    createDeliveryLoc = await this.createLocation({
                        item,
                        fileHeaders,
                        serviceTime,
                        delivery: {
                            from: timeWindow.deliveryDateFrom+"Z",
                            to: timeWindow.deliveryDateTo+"Z"
                        }
                    }, "delivery");
                    deliveryLoc = createDeliveryLoc;

                    delivery = {
                        deliveryCompanyName: deliveryLoc.data._doc.companyLegalName,
                        deliveryState: deliveryLoc.data._doc.points[0].address.state,
                        deliveryStreetAddress: deliveryLoc.data._doc.points[0].address.streetAddress,
                        deliveryCountry: deliveryLoc.data._doc.points[0].address.country,
                        deliveryCountryCode: deliveryLoc.data._doc.points[0].address.countryCode.toLowerCase(),
                        deliveryCity: deliveryLoc.data._doc.points[0].address.city,
                        deliveryZip: deliveryLoc.data._doc.points[0].address.zip,
                        deliveryLat: deliveryLoc.data._doc.points[0].address.lat,
                        deliveryLon: deliveryLoc.data._doc.points[0].address.lon,
                        deliverStr
                    };
                    const checkCl = new Check({
                        data: {
                            pickupdateFrom: timeWindow.pickupDateFrom+"Z",
                            pickupdateTo: timeWindow.pickupDateTo+"Z",
                            deliverydateFrom: timeWindow.deliveryDateFrom+"Z",
                            deliverydateTo: timeWindow.deliveryDateTo+"Z",
                            companyName
                        }
                    })
                    let timeWindows = await checkCl.newTimeWindow();
                    delete timeWindows.status;
                    const { distDur, msg, status } = await Warnings.createOrder({
                        pickupLat: pickup.pickupLat,
                        pickupLon: pickup.pickupLon,
                        deliveryLat: delivery.deliveryLat,
                        deliveryLon: delivery.deliveryLon
                    });
                    let products = [
                        {
                            volume: item[fileHeaders["Volume"]]/item[fileHeaders["Quantity"]],
                            Quantity: item[fileHeaders["Quantity"]]*1,
                            Weight: item[fileHeaders["Weight"]]/item[fileHeaders["Quantity"]],
                            Length: item[fileHeaders["Size"]]/item[fileHeaders["Quantity"]],
                            productdescription: "",
                            freightclasses_id: 0,
                            nmfcnumber: "0",
                            nmfcsubcode: "0"
                        }
                    ];
                    let locationIds = [];
                    if (pickupLoc.data._doc._id == deliveryLoc.data._doc._id) {
                        locationIds.push(pickupLoc.data._doc._id)
                    } else {
                        locationIds.push(pickupLoc.data._doc._id, deliveryLoc.data._doc._id)
                    }
                    let ordClass = new OrderClass({data: {
                        order: {
                            user: userId,
                            depo: orderDepot ? orderDepot._doc._id : null,
                            po: item[fileHeaders["Order Number"]],
                            eqType: 4,
                            //pickup
                            pickupCompanyName: pickup.pickupCompanyName,
                            pickupState: pickup.pickupState,
                            pickupStreetAddress: pickup.pickupStreetAddress,
                            pickupCountry: pickup.pickupCountry,
                            pickupCountryCode: pickup.pickupCountryCode,
                            pickupCity: pickup.pickupCity,
                            pickupZip: pickup.pickupZip,
                            pickupdateFrom: timeWindow.pickupDateFrom+"Z",
                            pickupdateTo: timeWindow.pickupDateTo+"Z",
                            //delivery
                            deliveryCompanyName: delivery.deliveryCompanyName,
                            deliveryState: delivery.deliveryState,
                            deliveryStreetAddress: delivery.deliveryStreetAddress,
                            deliveryCountry: delivery.deliveryCountry,
                            deliveryCountryCode: delivery.deliveryCountryCode,
                            deliveryCity: delivery.deliveryCity,
                            deliveryZip: delivery.deliveryZip,
                            deliverydateFrom: timeWindow.deliveryDateFrom+"Z",
                            deliverydateTo: timeWindow.deliveryDateTo+"Z",
                            pieceCount: item[fileHeaders["Quantity"]],
                            timeWindows,
                            cube: item[fileHeaders["Volume"]] && typeof(item[fileHeaders["Volume"]]) == "number" ? item[fileHeaders["Volume"]]*1 : 1,
                            feet: item[fileHeaders["Size"]] && typeof(item[fileHeaders["Size"]]) == "number" ? item[fileHeaders["Size"]]*1 : 1,
                            weight: item[fileHeaders["Weight"]] && typeof(item[fileHeaders["Weight"]]) == "number" ? item[fileHeaders["Weight"]]*1 : 1,
                            servicetime: serviceTime + (pieceTime * item[fileHeaders["Quantity"]]),
                            pieceTime,
                            locations: locationIds
                        },
                        pickupLatLon:{
                            lat: pickup.pickupLat,
                            lon: pickup.pickupLon
                        },
                        deliveryLatLon:{
                            lat: delivery.deliveryLat,
                            lon: delivery.deliveryLon
                        },
                        distDur,
                        delivery: deliverStr,
                        pickup: pickupStr,
                        status
                    }});
                    let newOrder = await ordClass.create().catch(err => {
                        console.log(err);
                    });
                    let uploadCl = new UploaderClass({
                        units: products,
                        orderId: newOrder.data._doc._id,
                        req
                    });
                    let handlingUnits = await uploadCl.saveHandlingUnits();
                    createdOrders.push({
                        ...newOrder._doc,
                        "products": handlingUnits.handlingUnit
                    });
                    console.log(i);
                }
            }
        }
        const upClass = new UploadClass({ data: {
            UUID: uuid,
            status: 2,
            failed: errorArr,
            FileName: fileName,
            userId,
            orderCount: createdOrders.length
        }});
        let upload = await upClass.edit();
        return await Helper.getResponse(1, `Created ${createdOrders.length} Order`, {
            upload: upload.data,
            count: createdOrders.length
        });
    }

    async createLocation(data, type) {
        let { item, fileHeaders, serviceTime, delivery } = data;
        let country = {}, LatLons, points = [], location;
        const locationCl = new LocationClass({where: {
            companyLegalName: type == "delivery" ? item[fileHeaders["Delivery Customer name"]] : item[fileHeaders["Customer name"]]
        }});
        location = await locationCl.getOne();
        if (location.status) {
            return location
        }
        let deliveryStr, pickupStr, companyLegalName;
        if (type == "delivery") {
            companyLegalName = item[fileHeaders["Delivery Customer name"]];
            deliveryStr = `${item[fileHeaders["Delivery Zip Code"]]}+${item[fileHeaders["Delivery City"]]}+${item[fileHeaders["Delivery Customer Address"]]}+${item[fileHeaders["Delivery State"]]}`;
            LatLons = await this.helper.orderLatLon({
                deliveryAddr: deliveryStr
            });
            country.long_name = LatLons.delivery ? LatLons.deliveryAddress.delCountry : null;
            country.short_name = LatLons.delivery ? LatLons.deliveryAddress.delCountryCode.toLowerCase() : null;
            points = await this.helper.pushPoints({
                LatLons,
                order: {
                    deliveryZip: item[fileHeaders["Delivery Zip Code"]],
                    deliveryCity: item[fileHeaders["Delivery City"]],
                    deliveryState: item[fileHeaders["Delivery State"]],
                    deliveryCountry: country.long_name,
                    deliveryCountryCode: country.short_name,
                    deliveryStreetAddress: item[fileHeaders["Delivery Customer Address"]],
                    deliverydateFrom: delivery.from,
                    deliverydateTo: delivery.to
                },
                type
            });
        } else {
            companyLegalName = item[fileHeaders["Customer name"]];
            pickupStr = `${item[fileHeaders["Zip Code"]]}+${item[fileHeaders["City"]]}+${item[fileHeaders["Customer Address"]]}+${item[fileHeaders["State"]]}`;
            LatLons = await this.helper.orderLatLon({
                pickupAddr: pickupStr
            });
            country.long_name = LatLons.pickup ? LatLons.pickupAddress.pickCountry : null;
            country.short_name = LatLons.pickup ? LatLons.pickupAddress.pickCountryCode.toLowerCase() : null;
            points = await this.helper.pushPoints({
                LatLons,
                order: {
                    deliveryZip: item[fileHeaders["Zip Code"]],
                    deliveryCity: item[fileHeaders["City"]],
                    deliveryState: item[fileHeaders["State"]],
                    deliveryCountry: country.long_name,
                    deliveryCountryCode: country.short_name,
                    deliveryStreetAddress: item[fileHeaders["Customer Address"]],
                    deliverydateFrom: delivery.from,
                    deliverydateTo: delivery.to
                },
                type
            });
        }
        const LocationCl = new LocationClass({data: {
            companyLegalName: companyLegalName,
            serviceTime: serviceTime ? serviceTime : 0,
            points: points
        }})
        location = await LocationCl.create()
        return location;
    }

    async createTimeFormat(data, key) {
        let { deliveryDate, period, timezone, deliveryStart, deliveryEnd } = data;
        let { pickupDate, pickupStart, pickupEnd } = data;
        let zone = timezone.split("C")[1].split(":")[0];
        let pickupDateFrom, pickupDateTo, deliveryDateFrom, deliveryDateTo, deliveryStatus = 1, pickupStatus = 1;
        if (deliveryEnd && moment(deliveryStart, "HH:mm") >= moment(deliveryEnd, "HH:mm")) {
            deliveryStatus = 0;
        }
        if (pickupStart && pickupEnd && moment(pickupStart, "HH:mm") >= moment(pickupEnd, "HH:mm")) {
            pickupStatus = 0;
        }
        if (key == 1) {
            pickupDateFrom = moment(`${deliveryDate}T00:00:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
            pickupDateTo = moment(`${deliveryDate}T${deliveryStart}:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
            deliveryDateFrom = moment(`${deliveryDate}T${deliveryStart}:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
            deliveryDateTo = moment(`${deliveryDate}T${deliveryStart}:00.000`).subtract(zone, "hours").add(period, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
        } else if (key == 2) {
            pickupDateFrom = moment(`${deliveryDate}T00:00:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
            pickupDateTo = moment(`${deliveryDate}T${deliveryStart}:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
            deliveryDateFrom = moment(`${deliveryDate}T${deliveryStart}:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
            deliveryDateTo = !deliveryStatus
            ? moment(`${deliveryDate}T${deliveryEnd}:00.000`).add(1, "day").subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")
            : moment(`${deliveryDate}T${deliveryEnd}:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
        } else if (key == 3) {
            pickupDateFrom = moment(`${pickupDate}T${pickupStart}:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
            pickupDateTo = !pickupStatus
            ? moment(`${pickupDate}T${pickupEnd}:00.000`).add(1, "day").subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")
            : moment(`${pickupDate}T${pickupEnd}:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
            deliveryDateFrom = moment(`${deliveryDate}T${deliveryStart}:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
            deliveryDateTo = !deliveryStatus
            ? moment(`${deliveryDate}T${deliveryEnd}:00.000`).add(1, "day").subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")
            : moment(`${deliveryDate}T${deliveryEnd}:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
        }
        return {
            pickupDateFrom,
            pickupDateTo,
            deliveryDateFrom,
            deliveryDateTo
        };
    }

    async checkDateTimeFormats(data) {
        let { item, fileHeaders } = data, status = 1;
        let deliveryDate, deliveryStart, deliveryEnd;
        let pickupDate, pickupStart, pickupEnd;

        if (!item[fileHeaders["Pick Date"]] && ((!item[fileHeaders["Delivery Window End"]] && item[fileHeaders["Delivery Period"]]) || (item[fileHeaders["Delivery Window End"]] && item[fileHeaders["Delivery Period"]]))) {
            deliveryDate = item[fileHeaders["Delivery Date"]] ? moment(item[fileHeaders["Delivery Date"]], "YYYY-MM-DD", true) : 1;
            deliveryStart = item[fileHeaders["Delivery Window Start"]] ? moment(item[fileHeaders["Delivery Window Start"]], "HH:mm", true) : 1;
        } else if (!item[fileHeaders["Pick Date"]] && item[fileHeaders["Delivery Window End"]] && !item[fileHeaders["Delivery Period"]]) {
            deliveryDate = item[fileHeaders["Delivery Date"]] ? moment(item[fileHeaders["Delivery Date"]], "YYYY-MM-DD", true) : 1;
            deliveryStart = item[fileHeaders["Delivery Window Start"]] ? moment(item[fileHeaders["Delivery Window Start"]], "HH:mm", true) : 1;
            deliveryEnd = item[fileHeaders["Delivery Window End"]] ? moment(item[fileHeaders["Delivery Window End"]], "HH:mm", true) : 1;
        }else if (item[fileHeaders["Pick Date"]] && item[fileHeaders["Delivery Date"]]) {
            pickupDate = item[fileHeaders["Pick Date"]] ? moment(item[fileHeaders["Pick Date"]], "YYYY-MM-DD", true) : 1;
            pickupStart = item[fileHeaders["Pick up Window Start"]] ? moment(item[fileHeaders["Pick up Window Start"]], "HH:mm", true) : 1;
            pickupEnd = item[fileHeaders["Pick up Window End"]] ? moment(item[fileHeaders["Pick up Window End"]], "HH:mm", true) : 1;
            deliveryDate = item[fileHeaders["Delivery Date"]] ? moment(item[fileHeaders["Delivery Date"]], "YYYY-MM-DD", true) : 1;
            deliveryStart = item[fileHeaders["Delivery Window Start"]] ? moment(item[fileHeaders["Delivery Window Start"]], "HH:mm", true) : 1;
            deliveryEnd = item[fileHeaders["Delivery Window End"]] ? moment(item[fileHeaders["Delivery Window End"]], "HH:mm", true) : 1;
        }
        if ((deliveryDate && !deliveryDate.isValid()) || (deliveryStart && !deliveryStart.isValid()) || (deliveryEnd && !deliveryEnd.isValid()) ||
            (pickupDate && !pickupDate.isValid()) || (pickupStart && !pickupStart.isValid()) || (pickupEnd && !pickupEnd.isValid())) {
            status = 0;
        }
        return { status, message: "wrong mapping or wrong Date Formats" };
    }
};
