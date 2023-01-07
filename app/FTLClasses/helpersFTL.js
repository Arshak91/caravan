const fs = require("fs");
const Osmap = require("../FTLClasses/osmap");
module.exports = class Helper {
    constructor() {
        
    }
    checking = async () => {
        return { msg: 'ok' }
    };

    sortAndPagination = async (req) => {
        // console.log(req.query);
        const orderBy = req.query.orderBy ? req.query.orderBy : "_id";
        delete req.query.orderBy;

        const order = req.query.order == "asc" ? 1 : -1;
        delete req.query.order;

        const orderArr = [];
        if (orderBy) { orderArr.push([orderBy, order]); }

        const page = req.query.page ? parseInt(req.query.page) : 1;
        delete req.query.page;

        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        delete req.query.limit;

        const offset = (page - 1) * limit;

        return { order: orderArr, offset, limit };
    }

    getResponse = (status, msg, data) => {
        return {
            status,
            msg,
            data: data || null
        };
    }

    getRemoteInfoForKey = async (req) => {
        let host, endPoint;
        let api = "";
        let uri = api + "/autoplan", companyName;
        const myURL = req.headers["x-forwarded-host"];
        if (req.headers.host == "192.168.88.87:8080") {
            // endPoint =  "http://test.beta.lessplatform.com"+ uri;
            // host = "http://test.beta.lessplatform.com";
            endPoint = "http://192.168.88.87:8080" + uri;
            host = "http://192.168.88.87:8080";
        } else if (req.headers.host == "localhost:8080") {
            endPoint = "http://192.168.88.87:8080" + uri;
            host = "http://192.168.88.87:8080";
        } else {
            endPoint = `http://${myURL}` + uri;
            host = `http://${myURL}`;
        }
        let info = {
            host,
            userName: req.user ? req.user.username : null,
            email: req.user ? req.user.email : null,
            userType: req.user ? req.user.type : null,
            userAgent: req.headers["user-agent"],
            endPoint,
            companyName
        };
        return info;
    }

    getOrderImagePath(directory, fileName, refHost) {
        const dir = `./resources/0/${directory}`;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        let paths, fullHost;
        if (refHost == "http://localhost:4200") {
            fullHost = "http://localhost:8080";
        } else {
            fullHost = refHost;
        }
        paths = {
            urls: {
                Path: `${fullHost}/${directory}/${fileName}`
            },
            filePath: `${dir}/${fileName}`
        };
        console.log("dir", dir);
        console.log("path", `${fullHost}/${directory}/${fileName}`);

        return paths;
    }
    async orderLatLon(datas) {
        try {
            let { pickupAddr, deliveryAddr } = datas;
            let delCity, delCountry, delCountryCode, pickCity, pickCountry, pickCountryCode;
            let pickupCl = new Osmap({data: {query: pickupAddr}}, Helper);
            let deliveryCl = new Osmap({data: {query: deliveryAddr}}, Helper);
            let pickupLatLon = pickupAddr ? await pickupCl.GeoLoc() : null;
            let deliveryLatLon = deliveryAddr ? await deliveryCl.GeoLoc() : null;
            if (deliveryLatLon && deliveryLatLon.status && deliveryLatLon.data.data.status == "OK") {
                for (const item of deliveryLatLon.data.data.results[0].address_components) {
                    if (item.types.includes("locality")) {
                        delCity = item.long_name;
                    }
                    if (item.types.includes("country")) {
                        delCountry = item.long_name;
                        delCountryCode = item.short_name;
                    }
                }
            }
            if (pickupLatLon && pickupLatLon.status && pickupLatLon.data.data.status == "OK") {
                for (const item of pickupLatLon.data.data.results[0].address_components) {
                    if (item.types.includes("locality")) {
                        pickCity = item.long_name;
                    }
                    if (item.types.includes("country")) {
                        pickCountry = item.long_name;
                        pickCountryCode = item.short_name;
                    }
                }
            }

            return {
                pickup: pickupLatLon && pickupLatLon.status && pickupLatLon.data.data.status == "OK" ? 1 : 0,
                pickupLatLon: pickupLatLon && pickupLatLon.status && pickupLatLon.data.data.status == "OK" ? pickupLatLon.data : null,
                pickupAddress: {
                    pickCity,
                    pickCountry,
                    pickCountryCode
                },
                delivery : deliveryLatLon && deliveryLatLon.status && deliveryLatLon.data.data.status == "OK" ? 1 : 0,
                deliveryLatLon: deliveryLatLon && deliveryLatLon.status && deliveryLatLon.data.data.status == "OK" ? deliveryLatLon.data : null,
                deliveryAddress: {
                    delCity,
                    delCountry,
                    delCountryCode
                }
            };

        } catch (error) {
            return {
                status: 0,
                msg: error.message
            };
        }
    }

    async trim(obj) {
        for (let item in obj) {
            obj[item] = obj[item].trim();
        }
        return obj;
    }

    async orderClac(data) {
        let { products } = data;
        let cube = 0, feet = 0, weight = 0, specialneeds = [], quantity = 0;
        for (const item of products) {
            if (item.stackable) orderTypes.stackable = 1;
            if (item.turnable) orderTypes.turnable = 1;
            if (item.hazmat) orderTypes.hazmat = 1;
            if (item.Length && item.Width && item.Height) {
                let val = item.Length * item.Width * item.Height;
                cube += (val * item.Quantity);
            } else if (item.volume > 0) {
                cube += (item.volume * item.Quantity);
            }
            feet += item.Length ? (item.Length * item.Quantity) : 0;

            weight += item.Weight && item.Quantity ? (item.Weight * item.Quantity) : 0;
            quantity += item.Quantity;
            specialneeds.push({
                id: item.id,
                specialneeds: item.specialneeds
            });
        }
        return { cube, feet, weight, specialneeds, quantity }
    }

    async pushPoints(data) {
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
        await points.push({
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
    }

    // static async getLatLonFromObj(data) {
    //     let addr = "";
    //     for (const key in data) {
    //         if (data.key) {
    //             addr += data.key;
    //         }
    //         addr += "+"
    //     }
    //     let addrCl = new Osmap({data: {query: addr}}, Helper);
    //     let latlon = await addrCl.GeoLoc();
    //     return await this.getResponse(latlon.status, latlon.message, latlon.data)
    // }

    // static async createDriverModel(data) {
    //     let { activeMobile, email } = data;
    //     const userCl = new UserClass({where: {email: email}})
    //     const driverCl = new DriverClass({where: {email: email}})
    //     exUser = await userCl.getOne();
    //     exDriver = await driverCl.getOne();
    //     if (exUser) {
    //         return await this.getResponse(0, 'This email address has been already assigned to another user.');
    //     }
    //     if (exDriver) {
    //         return await this.getResponse(0, 'This email address has been already assigned to another user.');
    //     }
    //     let address = {}, latLon;
    //     for (const key in data) {
    //         if (key == "streetaddress" || key == "city" || key == "state" || key == "zip" || key == "country" || key == "countryCode") {
    //             address.key = data.key
    //         }
    //     }
    //     latLon = await this.getLatLonFromObj(address)
    //     if (latLon.status) {
    //         address.lat = latLon.data.data.results[0].geometry.location.lat
    //         address.lon = latLon.data.data.results[0].geometry.location.lng
    //     }
    //     return await this.getResponse(1, 'Success', {
    //         carrier: data.carrierId ? data.carrierId : null,
    //         equipment: data.equipmentId,
    //         asset: data.assetId ? data.assetId : null,
    //         shift: data.shiftId,
    //         depo: data.depotId ? data.depotId : null,

    //         type: data.type ? data.type : null,
    //         eqType: data.eqType ? data.eqType : null,
    //         status: data.status ? data.status : null,
    //         startTime: data.startTime ? data.startTime : null,
    //         endTime: data.endTime ? data.endTime : null,

    //         fname: data.fname,
    //         lname: data.lname,
    //         email: data.email,
    //         address: address,

    //         phone: data.phone  ? data.phone : null,

    //         rate: data.rate ? data.rate : null,
    //         hourlyRate: data.hourlyRate ? data.hourlyRate : null,
    //         perMileRate: data.perMileRate ? data.perMileRate : null,
    //         percentRate: data.percentRate ? data.percentRate : null,
    //         bonuses: data.bonuses ? data.bonuses : null,
    //         fuelsurcharge: data.fuelsurcharge ? data.fuelsurcharge : null,
    //         detention: data.detention ? data.detention : null,

    //         dob: data.dob ? data.dob : null,
    //         hdate: data.dob ? data.dob : null,

    //         easypass: data.easypass ? data.easypass : 0,
    //         ex_rev_per_mile: data.ex_rev_per_mile ? data.ex_rev_per_mile : 0,
    //         ex_rev_goal_week: data.ex_rev_goal_week ? data.ex_rev_goal_week :0 ,
    //         lengthofhaul_min: data.lengthofhaul_min ? data.lengthofhaul_min : 0,
    //         lengthofhaul_max: data.lengthofhaul_min ? data.lengthofhaul_min : 0,
    //         use_sleeper_b_p: data.use_sleeper_b_p ? data.use_sleeper_b_p : 0,
    //         drivinglicence: data.drivinglicence ? data.drivinglicence : null,
    //         throughStates: data.throughStates ? data.throughStates : 0,
    //         pickupDeliveryStates: data.pickupDeliveryStates ? data.pickupDeliveryStates : null,
    //         prefTruckStops: data.prefTruckStops ? data.prefTruckStops : null,
    //         tollRoutes: data.tollRoutes ? data.tollRoutes : null,
    //         routeNumber: data.routeNumber ? data.routeNumber : null
    //     });
    // }
};
