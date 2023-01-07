const OSmapService = require("../services/osmap.service");
const OSmapServiceClass = new OSmapService();
const GeneralHelper = require("../main_classes/general.service");

// Schema
const LocationSchema = require("../newModels/locationModel");

class LocationHelper extends GeneralHelper {

    generateModel = async (data, edit) => {
        const lastID = await this.getLastID(LocationSchema);
        let model = {
            name: data.name,
            companyLegalName: data.companyLegalName,
            email: data.email,
            phone1: data.phone1,
            phone2: data.phone2,
            contactPerson: data.contactPerson,
            points: data.points,
            notes: data.notes,
            rating: data.rating,
            serviceTime: data.serviceTime ? data.serviceTime * 60 : 0,
            driver: data.driverId,
            czone: data.czone,
            depo: data.depo,
            mustbefirst: data.mustbefirst
        };
        model = await this.trim(model, edit);
        !edit ? model["ID"] = lastID ? lastID+1 : 1000 : null;
        return model;
    };

    pushPoints = async (data) => {
        let points = [];
        let { LatLons, order, type } = data, address = {};
        if (type == "pickup") {
            address = {
                lat: LatLons.pickupLatLon.data.status == "OK" ? LatLons.pickupLatLon.data.results[0].geometry.location.lat : 0,
                lon: LatLons.pickupLatLon.data.status == "OK" ? LatLons.pickupLatLon.data.results[0].geometry.location.lng : 0,
                zip: order.deliveryZip,
                city: order.deliveryCity ? order.deliveryCity : LatLons.pickupAddress.pickCity ? LatLons.pickupAddress.pickCity : null,
                state: order.deliveryState,
                country: order.deliveryCountry ? order.deliveryCountry : LatLons.pickupAddress.pickCountry,
                countryCode: order.deliveryCountryCode ? order.deliveryCountryCode : LatLons.pickupAddress.pickCountryCode.toLowerCase(),
                streetAddress: order.deliveryStreetAddress
            };
        } else {
            address = {
                lat: LatLons.deliveryLatLon.data.status == "OK" ? LatLons.deliveryLatLon.data.results[0].geometry.location.lat : 0,
                lon: LatLons.deliveryLatLon.data.status == "OK" ? LatLons.deliveryLatLon.data.results[0].geometry.location.lng : 0,
                zip: order.deliveryZip,
                city: order.deliveryCity ? order.deliveryCity : LatLons.deliveryAddress.delCity ? LatLons.deliveryAddress.delCity : null,
                state: order.deliveryState,
                country: order.deliveryCountry ? order.deliveryCountry : LatLons.deliveryAddress.delCountry,
                countryCode: order.deliveryCountryCode ? order.deliveryCountryCode : LatLons.deliveryAddress.delCountryCode,
                streetAddress: order.deliveryStreetAddress
            }
        }
        points.push({
            address,
            Friday: {
                workingHours: {
                    from: order.deliverydateFrom,
                    to: order.deliverydateTo
                }
            },
            Monday: {
                workingHours: {
                    from: order.deliverydateFrom,
                    to: order.deliverydateTo
                }
            },
            Sunday: {
                workingHours: {
                    from: order.deliverydateFrom,
                    to: order.deliverydateTo
                }
            },
            Tuesday: {
                workingHours: {
                    from: order.deliverydateFrom,
                    to: order.deliverydateTo
                }
            },
            Saturday: {
                workingHours: {
                    from: order.deliverydateFrom,
                    to: order.deliverydateTo
                }
            },
            Thursday: {
                workingHours: {
                    from: order.deliverydateFrom,
                    to: order.deliverydateTo
                }
            },
            Wednesday: {
                workingHours: {
                    from: order.deliverydateFrom,
                    to: order.deliverydateTo
                }
            }
        });
        return points;
    };

    checkHoursCon = async (datas) => {
        let error = true, address = false, msg = "ok";
        for (const data of datas) {
            if (data.address.zip && data.address.city && data.address.streetAddress && data.address.state) {
                address = true;
            }
            if (data.Monday.workingHours.to || data.Monday.workingHours.from || data.Monday.deliveryHours.to || data.Monday.deliveryHours.from) {
                error = false;
            }
            if (data.Tuesday.workingHours.to || data.Tuesday.workingHours.from || data.Tuesday.deliveryHours.to || data.Tuesday.deliveryHours.from) {
                error = false;
            }
            if (data.Wednesday.workingHours.to || data.Wednesday.workingHours.from || data.Wednesday.deliveryHours.to || data.Wednesday.deliveryHours.from) {
                error = false;
            }
            if (data.Thursday.workingHours.to || data.Thursday.workingHours.from || data.Thursday.deliveryHours.to || data.Thursday.deliveryHours.from) {
                error = false;
            }
            if (data.Friday.workingHours.to || data.Friday.workingHours.from || data.Friday.deliveryHours.to || data.Friday.deliveryHours.from) {
                error = false;
            }
            if (data.Saturday.workingHours.to || data.Saturday.workingHours.from || data.Saturday.deliveryHours.to || data.Saturday.deliveryHours.from) {
                error = false;
            }
            if (data.Sunday.workingHours.to || data.Sunday.workingHours.from || data.Sunday.deliveryHours.to || data.Sunday.deliveryHours.from) {
                error = false;
            }
        }

        if (!error) {
            msg = "Error";
        }
        return {
            error,
            address,
            msg
        };
    };

    findLatLon = async (points) => {
        let lat, lon;
        let errors = [], pointArr = [];
        for (const [p, point] of points.entries()) {
            if (point.address.zip && point.address.city && point.address.streetAddress && point.address.state) {
                let address = `${point.address.zip}+${point.address.city}+${point.address.streetAddress}+${point.address.state}`;
                const { data, status } = await OSmapServiceClass.GeoLoc({query: address});
                if (!status || data.status == "ZERO_RESULTS") {
                    lat = null;
                    lon = null;
                    errors.push({
                        index: p,
                        msg: "The mentioned address is not correct."
                    });
                } else if (data.status == "REQUEST_DENIED") {
                    lat = null;
                    lon = null;
                    errors.push({
                        index: p,
                        msg: data.error_message
                    });
                } else {
                    lat = data.data.results[0].geometry.location.lat;
                    lon = data.data.results[0].geometry.location.lng;
                }
            } else {
                errors.push({
                    index: p,
                    msg: "The mentioned address is not correct."
                });
            }
            point.address.lat = lat;
            point.address.lon = lon;
            pointArr.push(point);

        }

        return { lat, lon, errors, pointArr };
    };

    callToUnPlanOrders = async (data) => {
        let { updOrders, timezone, user } = data;

    }
}

module.exports = LocationHelper;