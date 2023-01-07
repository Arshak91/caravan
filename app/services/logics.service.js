const moment = require("moment");
const convert = require('convert-units');
const Warnings = require("../warnings/orderWarnings");
const WarningsClass = new Warnings();
const orderErrors = require("../errors/orderErrors")
// Services
const BaseService = require("../main_classes/base.service");
const DepoSerice = require("./depo.service");
const DepoSericeClass = new DepoSerice();
const GeneralService = require("../main_classes/general.service");
const GeneralServiceClass = new GeneralService()
const ChecksService = require("./checks.service");
const ChecksClass = new ChecksService();
const UploaderService = require("../services/uploader.service");
const UploaderServiceClass = new UploaderService();
const UploadService = require("../services/upload.service");
const UploadServiceClass = new UploadService();
const LocationService = require("../services/location.service");
const LocationServiceClass = new LocationService();

// Helpers
const OrdersHelper = require("../helpers/orderHelpers");
const OrdersHelperClass = new OrdersHelper();
const LocationHelper = require("../helpers/locationHelpers");
const LocationHelperClass = new LocationHelper();

// Models
const transportTypeModel = require("../newModels/transportTypeModel");
const OrdersModel = require("../newModels/ordersModel");
const ProductModel = require("../newModels/handlingUnitModel");

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

class Logics extends BaseService {


    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.timezone = params.timezone;
            this.depo = params.depo;
            this.info = params.info;
            this.fileHeaders = params.fileHeaders;
        }
    }

    orderInfoArr = async (data) => {
        let { lbs, kgs, cuft, m3, pcs, skids, truckLoad, Truck } = data;
        let volume, Quantity, Weight, Length, pieceCount, truck, loadType;
        if (lbs != "" && lbs) {
            Weight = +lbs;
        } else {
            Weight = 0;
        }
        if ((!lbs || lbs == "") && kgs != "" && kgs) {
            Weight = convert(+kgs).from('kg').to('lb');
        }
        if (cuft != "" && cuft) {
            volume = +cuft;
        } else {
            if (m3 != "" && m3) {
                volume = convert(m3).from("m3").to("ft3")
            } else {
                volume = 0;
            }
        }
        if (pcs != "" && pcs) {
            pieceCount = +pcs;
        } else {
            pieceCount = 1;
        }
        if (skids != "" && skids) {
            Quantity = +skids;
        } else {
            Quantity = 1;
        }
        if (Truck && Truck.toString().toLowerCase() == "false") {
            // if (truckLoad.search("1") != -1 || truckLoadOrd.search("1") != -1) {
            //     if (Weight === 0) {
            //         Weight = 44000
            //     }
            //     loadType = "TL"
            // } else {
            //     loadType = "LTL"
            // }
            loadType = "LTL"
        } else if (Truck && Truck.toString().toLowerCase() == "true") {
            loadType = "TL"
        } else {
            loadType = "LTL"
        }
        if (truckLoad != "" && truckLoad) {
            truck = truckLoad;
        } else {
            truck = 1;
        }
        return { volume, Quantity, Weight, Length, pieceCount, loadType }
    }

    async UploadCaravan(obj) {
        let { uuid, userId, fileName, serviceTime, pieceTime, userType, companyName } = obj.info, createdOrders = [], errorArr = [];
        let { fileHeaders, timezone, depo, req } = obj, deliveryLoc, pickupLoc, createDeliveryLoc, createPickupLoc, timeWindow, orderDepo, orderDepot, pickup = {}, delivery = {};
        fileHeaders = await GeneralServiceClass.reverseObject(JSON.parse(fileHeaders));
        let status = 0, message = "", orderArr = [], orderInfoArr = [];
        for (const [i, item] of obj.data.entries()) {
            let dateTimeCheck = await this.checkDateTimeFormatsForCaravan({item, fileHeaders});
            if (!dateTimeCheck.status) {
                errorArr.push({
                    status: 0,
                    msg: dateTimeCheck.message,
                    ProbillNo: item[fileHeaders["ProbillNo"]],
                    OrderNo: item[fileHeaders["OrderNo"]]
                });
            } else if (!item[fileHeaders["ProbillNo"]] || item[fileHeaders["ProbillNo"]] == "") {
                errorArr.push({
                    status: 0,
                    msg: "ProbillNo is required",
                    OrderNo: item[fileHeaders["OrderNo"]],
                    ProbillNo: null
                });
            } else {
                orderDepot = depo;
                let pickupDate = item[fileHeaders["Pick Date"]] ? moment(item[fileHeaders["Pick Date"]], ["YYYY-MM-DD", "M/D/YYYY"]).format("YYYY-MM-DD") : null,
                pickupStartTime = item[fileHeaders["Pick up Window Start"]] ? moment(item[fileHeaders["Pick up Window Start"]], "HH:mm:ss A").format("HH:mm:ss.SSS") : null,
                pickupEndTime = item[fileHeaders["Pick up Window End"]] ? moment(item[fileHeaders["Pick up Window End"]], "HH:mm:ss A").format("HH:mm:ss.SSS") : null,
                deliveryDate = item[fileHeaders["Delivery Date"]] ? moment(item[fileHeaders["Delivery Date"]], ["YYYY-MM-DD", "M/D/YYYY"]).format("YYYY-MM-DD") : null,
                deliveryStartTime = item[fileHeaders["Delivery Window Start"]] ? moment(item[fileHeaders["Delivery Window Start"]], "HH:mm:ss A").format("HH:mm:ss.SSS") : null,
                deliveryEndTime = item[fileHeaders["Delivery Window End"]] ? moment(item[fileHeaders["Delivery Window End"]], "HH:mm:ss A").format("HH:mm:ss.SSS") : null;
                timeWindow = await this.createTimeFormatCaravan(dateTimeCheck.resultObj, {
                    deliveryDate, pickupDate, pickupStartTime, pickupEndTime,
                    deliveryStartTime, deliveryEndTime, timezone
                })
                let pickupStr, deliverStr;
                let pickupAddr = item[fileHeaders["Address1_pickuploc"]], pickupCity = item[fileHeaders["City_pickuploc"]],
                pickupState = item[fileHeaders["Prov_pickuploc"]], pickupCountry = item[fileHeaders["Country_pickuploc"]], pickupCountryCode = item[fileHeaders["Country_pickuploc"]].toLowerCase(),
                pickupZip = item[fileHeaders["PostalCode_pickuploc"]];
                let deliveryAddr = item[fileHeaders["Address1_deliveryloc"]], deliveryCity = item[fileHeaders["City_deliveryloc"]],
                deliveryState = item[fileHeaders["Prov_deliveryloc"]], deliveryCountry = item[fileHeaders["Country_deliveryloc"]], deliveryCountryCode = item[fileHeaders["Country_deliveryloc"]].toLowerCase(),
                deliveryZip = item[fileHeaders["PostalCode_deliveryloc"]];
                const createPickupLoc = await this.createLocation({
                    item: {
                        CustomerName: item[fileHeaders["Location_pickuploc"]],
                        ZipCode: pickupZip,
                        City: pickupCity,
                        Address: pickupAddr,
                        State: pickupState
                    },
                    serviceTime,
                    delivery: {
                        from: timeWindow.pickupDateFrom+"Z",
                        to: timeWindow.pickupDateTo+"Z"
                    }
                }, "pickup");
                const createDeliveryLoc = await this.createLocation({
                    item: {
                        CustomerName: item[fileHeaders["Location_deliveryloc"]],
                        ZipCode: deliveryZip,
                        City: deliveryCity,
                        Address: deliveryAddr,
                        State: deliveryState
                    },
                    serviceTime,
                    delivery: {
                        from: timeWindow.deliveryDateFrom+"Z",
                        to: timeWindow.deliveryDateTo+"Z"
                    }
                }, "delivery");
                pickupStr = `${pickupZip} ${pickupCity} ${pickupAddr} ${pickupState}`;
                deliverStr = `${deliveryZip} ${deliveryCity} ${deliveryAddr} ${deliveryState}`;
                const pickupLoc = createPickupLoc;
                const deliveryLoc = createDeliveryLoc;
                let pickup, delivery;
                if (!pickupLoc.status || !pickupLoc.data._doc || !pickupLoc.data) {
                    console.log(pickupLoc.data._doc);
                }
                for (const point of pickupLoc.data._doc.points) {
                    if (point.address.streetAddress == pickupAddr) {
                        pickup = {
                            pickupLat: point.address.lat,
                            pickupLon: point.address.lon,
                            pickupCompanyName: pickupLoc.data._doc.companyLegalName,
                            pickupState: point.address.state,
                            pickupStreetAddress: point.address.streetAddress,
                            pickupCountry: point.address.country,
                            pickupCountryCode: point.address.countryCode.toLowerCase(),
                            pickupCity: point.address.city,
                            pickupZip: point.address.zip,
                            pickupStr
                        };
                    }
                }
                for (const point of deliveryLoc.data._doc.points) {
                    if (!point.address.streetAddress) {
                        console.log(deliveryAddr);
                    }
                    if (point.address.streetAddress == deliveryAddr) {
                        delivery = {
                            deliveryCompanyName: deliveryLoc.data._doc.companyLegalName,
                            deliveryState: point.address.state,
                            deliveryStreetAddress: point.address.streetAddress,
                            deliveryCountry: point.address.country,
                            deliveryCountryCode: point.address.countryCode.toLowerCase(),
                            deliveryCity: point.address.city,
                            deliveryZip: point.address.zip,
                            deliveryLat: point.address.lat,
                            deliveryLon: point.address.lon,
                            deliverStr
                        };
                    }
                }
                let orderInfo = await GeneralServiceClass.trimAndSplit(item);
                let hazmat = orderInfo.HazMat == "FALSE" || orderInfo.HazMat == "False" ? false : true
                let { volume, Quantity, Weight, Length, pieceCount, loadType } = await this.orderInfoArr({
                    lbs: orderInfo[fileHeaders["lbs"]],
                    kgs: orderInfo[fileHeaders["kgs"]],
                    cuft: orderInfo[fileHeaders["cu.ft"]],
                    m3: orderInfo[fileHeaders["m3"]],
                    pcs: orderInfo[fileHeaders["pcs"]],
                    skids: orderInfo[fileHeaders["skids"]],
                    truckLoad: orderInfo[fileHeaders["truck_load"]],
                    Truck: orderInfo[fileHeaders["Truckload"]],
                });
                const transportType = await transportTypeModel.findOne({
                    name: loadType
                });
                let products = [
                    {
                        HandlingType_id: "60dace556f8b6c476fd6e8b6",
                        volume: volume > 0 ? volume/Quantity : 0,
                        Quantity: Quantity,
                        Weight: Weight > 0 ? Weight/Quantity : 0,
                        Length: Length > 0 ? Length/Quantity : 0,
                        productdescription: orderInfo.ProductDesc,
                        freightclasses_id: 0,
                        nmfcnumber: "0",
                        nmfcsubcode: "0",
                        hazmat
                    }
                ];
                let locationIds = [];
                if (pickupLoc.data._doc._id == deliveryLoc.data._doc._id) {
                    locationIds.push(pickupLoc.data._doc._id)
                } else {
                    locationIds.push(pickupLoc.data._doc._id, deliveryLoc.data._doc._id)
                }
                orderArr.push({
                    body: {
                        upload: 1,
                        orderNumber: orderInfo[fileHeaders["OrderNo"]],
                        depoid: orderDepot ? orderDepot._id : null,
                        //Pickup
                        pickupCompanyName: pickup.pickupCompanyName,
                        pickupState: pickup.pickupState,
                        pickupCity: pickup.pickupCity,
                        pickupCountry: pickup.pickupCountry,
                        pickupCountryCode: pickup.pickupCountryCode,
                        pickupStreetAddress: pickup.pickupStreetAddress,
                        pickupZip: pickup.pickupZip,
                        pickupLocationtype: null,
                        pickupLocationId: pickupLoc.data._doc._id,
                        pickupdateFrom: timeWindow.pickupDateFrom+"Z",
                        pickupdateTo: timeWindow.pickupDateTo+"Z",
                        //Delivery
                        deliveryCompanyName: delivery.deliveryCompanyName,
                        deliveryState: delivery.deliveryState,
                        deliveryCity: delivery.deliveryCity,
                        deliveryCountry: delivery.deliveryCountry,
                        deliveryCountryCode: delivery.deliveryCountryCode,
                        deliveryStreetAddress: delivery.deliveryStreetAddress,
                        deliveryZip: delivery.deliveryZip,
                        deliveryLocationtype: null,
                        deliveryLocationId: deliveryLoc.data._doc._id,
                        deliverydateFrom: timeWindow.deliveryDateFrom+"Z",
                        deliverydateTo: timeWindow.deliveryDateTo+"Z",
                        po: orderInfo[fileHeaders["PONo"]],
                        pro: orderInfo[fileHeaders["ProbillNo"]],
                        servicetime: pieceCount ? serviceTime + (pieceTime * pieceCount) : serviceTime + (pieceTime * Quantity),
                        pieceTime,
                        pieceCount: pieceCount ? pieceCount : Quantity,
                        locations: locationIds,
                        eqType: "60c343b62117a50336118290",
                        products,
                        loadtype: transportType._doc._id,
                        notes: `${orderInfo[fileHeaders["Comment"]]} ${orderInfo[fileHeaders["Equipment"]]}`
                    },
                    user: req.user,
                    companyName: companyName
                })
            }
        }
        return this.getResponse(1, "Success", { orderArr, errorArr })
    };

    getPickupAndDeliveryData = (location, address) => {
        let obj = {};
        for (const point of location.data._doc.points) {
            if (point.address.streetAddress == address) {
                obj = {
                    Lat: point.address.lat,
                    Lon: point.address.lon,
                    CompanyName: location.data._doc.companyLegalName,
                    State: point.address.state,
                    StreetAddress: point.address.streetAddress,
                    Country: point.address.country,
                    CountryCode: point.address.countryCode.toLowerCase(),
                    City: point.address.city,
                    Zip: point.address.zip,
                };
            }
        }
        return obj;
    }

    async UploadCaravanNew(obj) {
        let { fileName, serviceTime, pieceTime } = obj.info, productArr = [], errorArr = [];
        let { fileHeaders, timezone, depo, req, lastOrderID } = obj, orderDepo, orderDepot;
        fileHeaders = await GeneralServiceClass.reverseObject(JSON.parse(fileHeaders));
        let uploadStatus = 0, message = "", orderArr = [], orderInfoArr = [];
        let ID = lastOrderID+1;
        for (const [i, item] of obj.data.entries()) {
            const [dateTimeCheck, addressCheck, ProbillNoCheck] = await Promise.all([
                this.checkDateTimeFormatsForCaravan({item, fileHeaders}),
                this.checkAddressesForCaravan({item, fileHeaders}),
                this.checkProbillNoForCaravan({item, fileHeaders}),
            ])
            // let dateTimeCheck = await this.checkDateTimeFormatsForCaravan({item, fileHeaders});
            if (!dateTimeCheck.status || !addressCheck.status || !ProbillNoCheck.status) {
                errorArr.push({
                    status: 0,
                    msg: !dateTimeCheck.status ? dateTimeCheck.message : !addressCheck.status ? addressCheck.message : ProbillNoCheck.message,
                    ProbillNo: item[fileHeaders["ProbillNo"]],
                    OrderNo: item[fileHeaders["OrderNo"]]
                });
            } else {
                orderDepot = depo;
                let pickupDate = item[fileHeaders["Pick Date"]] ? moment(item[fileHeaders["Pick Date"]], ["YYYY-MM-DD", "M/D/YYYY"]).format("YYYY-MM-DD") : null,
                pickupStartTime = item[fileHeaders["Pick up Window Start"]] ? moment(item[fileHeaders["Pick up Window Start"]], "HH:mm:ss A").format("HH:mm:ss.SSS") : null,
                pickupEndTime = item[fileHeaders["Pick up Window End"]] ? moment(item[fileHeaders["Pick up Window End"]], "HH:mm:ss A").format("HH:mm:ss.SSS") : null,
                deliveryDate = item[fileHeaders["Delivery Date"]] ? moment(item[fileHeaders["Delivery Date"]], ["YYYY-MM-DD", "M/D/YYYY"]).format("YYYY-MM-DD") : null,
                deliveryStartTime = item[fileHeaders["Delivery Window Start"]] ? moment(item[fileHeaders["Delivery Window Start"]], "HH:mm:ss A").format("HH:mm:ss.SSS") : null,
                deliveryEndTime = item[fileHeaders["Delivery Window End"]] ? moment(item[fileHeaders["Delivery Window End"]], "HH:mm:ss A").format("HH:mm:ss.SSS") : null;

                let pickupStr, deliverStr;
                let pickupAddr = item[fileHeaders["Address1_pickuploc"]], pickupCity = item[fileHeaders["City_pickuploc"]],
                pickupState = item[fileHeaders["Prov_pickuploc"]], pickupCountry = item[fileHeaders["Country_pickuploc"]], pickupCountryCode = item[fileHeaders["Country_pickuploc"]].toLowerCase(),
                pickupZip = item[fileHeaders["PostalCode_pickuploc"]];
                let deliveryAddr = item[fileHeaders["Address1_deliveryloc"]], deliveryCity = item[fileHeaders["City_deliveryloc"]],
                deliveryState = item[fileHeaders["Prov_deliveryloc"]], deliveryCountry = item[fileHeaders["Country_deliveryloc"]], deliveryCountryCode = item[fileHeaders["Country_deliveryloc"]].toLowerCase(),
                deliveryZip = item[fileHeaders["PostalCode_deliveryloc"]];

                const timeWindow = await this.createTimeFormatCaravan(dateTimeCheck.resultObj, {
                    deliveryDate, pickupDate, pickupStartTime, pickupEndTime,
                    deliveryStartTime, deliveryEndTime, timezone
                })
                const [ createPickupLoc, createDeliveryLoc ] = await Promise.all([
                    this.createLocation({
                        item: {
                            CustomerName: item[fileHeaders["Location_pickuploc"]],
                            ZipCode: pickupZip,
                            City: pickupCity,
                            Address: pickupAddr,
                            State: pickupState,
                            country: pickupCountry,
                            countryCode: pickupCountryCode
                        },
                        serviceTime,
                        delivery: {
                            from: timeWindow.pickupDateFrom+"Z",
                            to: timeWindow.pickupDateTo+"Z"
                        }
                    }, "pickup"),
                    this.createLocation({
                        item: {
                            CustomerName: item[fileHeaders["Location_deliveryloc"]],
                            ZipCode: deliveryZip,
                            City: deliveryCity,
                            Address: deliveryAddr,
                            State: deliveryState,
                            country: deliveryCountry,
                            countryCode: deliveryCountryCode
                        },
                        serviceTime,
                        delivery: {
                            from: timeWindow.deliveryDateFrom+"Z",
                            to: timeWindow.deliveryDateTo+"Z"
                        }
                    }, "delivery")
                ]);

                if(!createPickupLoc || !createDeliveryLoc) {
                    errorArr.push({
                        status: 0,
                        msg: "Lat or Lon not finding",
                        ProbillNo: item[fileHeaders["ProbillNo"]],
                        OrderNo: item[fileHeaders["OrderNo"]]
                    });
                } else {
                    pickupStr = `${pickupZip} ${pickupCity} ${pickupAddr} ${pickupState} ${pickupCountry}`;
                    deliverStr = `${deliveryZip} ${deliveryCity} ${deliveryAddr} ${deliveryState} ${deliveryCountry}`;
                    const [pickup, delivery] = await Promise.all([
                        this.getPickupAndDeliveryData(createPickupLoc, pickupAddr),
                        this.getPickupAndDeliveryData(createDeliveryLoc, deliveryAddr)
                    ]);
                    const {distDur, msg, status} = await WarningsClass.createOrder({
                        pickupLat: pickup.Lat,
                        pickupLon: pickup.Lon,
                        deliveryLat: delivery.Lat,
                        deliveryLon: delivery.Lon
                    })
                    if (!createPickupLoc.status || !createPickupLoc.data._doc || !createPickupLoc.data) {
                        console.log(pickupLoc.data._doc);
                    }
                    const [ timeWindows,  orderInfo] = await Promise.all([
                        ChecksClass.newTimeWindow({
                            pickupdateFrom: timeWindow.pickupDateFrom+"Z",
                            pickupdateTo: timeWindow.pickupDateTo+"Z",
                            deliverydateFrom: timeWindow.deliveryDateFrom+"Z",
                            deliverydateTo: timeWindow.deliveryDateTo+"Z",
                        }),
                        GeneralServiceClass.trimAndSplit(item)
                    ])
                    let hazmat = orderInfo.HazMat && (orderInfo.HazMat.toLowerCase() == "true" || orderInfo.HazMat == "1") ? true : false
                    let { volume, Quantity, Weight, Length, pieceCount, loadType } = await this.orderInfoArr({
                        lbs: orderInfo[fileHeaders["lbs"]],
                        kgs: orderInfo[fileHeaders["kgs"]],
                        cuft: orderInfo[fileHeaders["cu.ft"]],
                        m3: orderInfo[fileHeaders["m3"]],
                        pcs: orderInfo[fileHeaders["pcs"]],
                        skids: orderInfo[fileHeaders["skids"]],
                        truckLoad: orderInfo[fileHeaders["truck_load"]],
                        Truck: orderInfo[fileHeaders["Truckload"]],
                    });
                    const transportType = await transportTypeModel.findOne({
                        name: loadType
                    });
                    const orderTypes = {
                        stackable: 0,
                        turnable: 0,
                        hazmat: hazmat ? 1 : 0
                    }
                    let locationIds = [];
                    if (createPickupLoc.data._doc._id == createDeliveryLoc.data._doc._id) {
                        locationIds.push(createPickupLoc.data._doc._id)
                    } else {
                        locationIds.push(createPickupLoc.data._doc._id, createDeliveryLoc.data._doc._id)
                    }
                    const productModel = new ProductModel({
                        HandlingType: "60dace556f8b6c476fd6e8b6",
                        Quantity: Quantity,
                        productdescription: orderInfo.ProductDesc,
                        freightclasses_id: null, // ?
                        nmfcnumber: null, // ?
                        nmfcsubcode: null, // ?
                        Weight: Weight > 0 ? Weight/Quantity : 0,
                        Length: Length > 0 ? Length/Quantity : 0,
                        volume: volume > 0 ? volume/Quantity : 0,
                        Width: 0,
                        Height: 0,
                        mintemperature: 0,
                        maxtemperature: 0,
                        hazmat,
                        density: null
                    })
                    productArr.push(productModel);
                    const orderModel = new OrdersModel({
                        ID,
                        products: productModel._id,
                        loadtype: transportType._doc._id,
                        user: req.user._id,
                        depo: orderDepot ? orderDepot._id : null,
                        orderNumber: orderInfo[fileHeaders["OrderNo"]],

                        //Pickup
                        pickupCompanyName: pickup.CompanyName,
                        pickupState: pickup.State,
                        pickupStreetAddress: pickup.StreetAddress,
                        pickupLocationtypeid: null,
                        pickupLocationId: createPickupLoc.data._doc._id,
                        pickupCountry: pickup.Country,
                        pickupCountryCode: pickup.CountryCode,
                        pickupCity: pickup.City,
                        pickupZip: pickup.Zip,
                        pickup: pickupStr,
                        pickupLon: pickup.Lon,
                        pickupLat: pickup.Lat,
                        pickupdateFrom: timeWindow.pickupDateFrom+"Z",
                        pickupdateTo: timeWindow.pickupDateTo+"Z",

                        //Delivery
                        deliveryCompanyName: delivery.CompanyName,
                        deliveryState: delivery.State,
                        deliveryStreetAddress: delivery.StreetAddress,
                        deliveryLocationtypeid: null,
                        deliveryLocationId: createDeliveryLoc.data._doc._id,
                        deliveryCountry: delivery.Country,
                        deliveryCountryCode: delivery.CountryCode,
                        deliveryCity: delivery.City,
                        deliveryZip: delivery.Zip,
                        deliveryLon: delivery.Lon,
                        deliveryLat: delivery.Lat,
                        deliverydateFrom: timeWindow.deliveryDateFrom+"Z",
                        deliverydateTo: timeWindow.deliveryDateTo+"Z",

                        timeWindows: timeWindows,

                        // Size
                        cube: volume ? volume : 0,
                        feet: Length > 0 ? Quantity * Length : 0,
                        weight: Weight > 0 ? Weight * Quantity : 0,

                        po: orderInfo[fileHeaders["PONo"]],
                        pro: orderInfo[fileHeaders["ProbillNo"]],
                        servicetime: pieceCount ? serviceTime + (pieceTime * pieceCount) : serviceTime + (pieceTime * Quantity),
                        pieceTime,
                        pieceCount: pieceCount ? pieceCount : Quantity,
                        locations: locationIds,
                        eqType: "60c343b62117a50336118290",
                        status: "60b0b9206f8b6c476f2a576f",
                        isPlanned: 0,
                        confirmed: 0,
                        notes: `${orderInfo[fileHeaders["Comment"]]} ${orderInfo[fileHeaders["Equipment"]]}`,
                        timeInfo: {
                            loadTemps: {},
                            loads: {},
                            loadsArr: []
                        },
                        loadTempIds: [],
                        loadIds: [],
                        flowTypes: [],
                        statusInternal: 1,
                        isfreezed: 0,
                        custDistance: status ? distDur.distance : 0,
                        custDuration: status ? distDur.duration : 0,
                        orderTypes
                    });
                    orderArr.push(orderModel);
                    ID += 1;
                }
            }
        }
        return this.getResponse(1, `Created ${orderArr.length} Order`, { orderArr, productArr, errorArr })
    }

    async createLocation(data, type) {
        let { item, serviceTime, delivery } = data;
        let { CustomerCode, CustomerName, ZipCode, City, Address, State, country, countryCode } = item
        let countryObj = {}, LatLons, points = [], newLocation, status = 1;
        let locationOr = CustomerCode ? {
            name: { $regex: CustomerCode, $options:'i' }
        } : { companyLegalName: { $regex: CustomerName, $options:'i' } };
        const [location, locationWithAddr] = await Promise.all([
            LocationServiceClass.getOne(locationOr),
            LocationServiceClass.getOne({
                ...locationOr,
                "points.address.streetAddress": { $regex: Address, $options:'i' },
                "points.address.state": { $regex: State, $options:'i' },
                "points.address.city": { $regex: City, $options:'i' },
                "points.address.zip": { $regex: ZipCode, $options:'i' },
                "points.address.countryCode": { $regex: countryCode, $options:'i' },
                "points.address.country": { $regex: country, $options:'i' },
            })
        ]);
        if (location.status && locationWithAddr.status) {
            return location
        }
        let deliveryStr, pickupStr, companyLegalName;
        if (type == "delivery") {
            companyLegalName = CustomerName;
            deliveryStr = `${ZipCode}+${City}+${Address}+${State}`;
            LatLons = await OrdersHelperClass.orderLatLon({
                deliveryAddr: deliveryStr
            });
            if (!LatLons.delivery) {
                status = 0
            } else {
                countryObj.long_name = LatLons.delivery ? LatLons.deliveryAddress.delCountry : null;
                countryObj.short_name = LatLons.delivery ? LatLons.deliveryAddress.delCountryCode.toLowerCase() : null;
                points = await LocationHelperClass.pushPoints({
                    LatLons,
                    order: {
                        deliveryZip: ZipCode,
                        deliveryCity: City,
                        deliveryState: State,
                        deliveryCountry: countryObj.long_name,
                        deliveryCountryCode: countryObj.short_name,
                        deliveryStreetAddress: Address,
                        deliverydateFrom: delivery.from,
                        deliverydateTo: delivery.to
                    },
                    type
                });
            }
        } else {
            companyLegalName = CustomerName;
            pickupStr = `${ZipCode}+${City}+${Address}+${State}`;
            LatLons = await OrdersHelperClass.orderLatLon({
                pickupAddr: pickupStr
            });
            if (!LatLons.pickup) {
                status = 0
            } else {
                countryObj.long_name = LatLons.pickup ? LatLons.pickupAddress.pickCountry : null;
                countryObj.short_name = LatLons.pickup ? LatLons.pickupAddress.pickCountryCode.toLowerCase() : null;
                points = await LocationHelperClass.pushPoints({
                    LatLons,
                    order: {
                        deliveryZip: ZipCode,
                        deliveryCity: City,
                        deliveryState: State,
                        deliveryCountry: countryObj.long_name,
                        deliveryCountryCode: countryObj.short_name,
                        deliveryStreetAddress: Address,
                        deliverydateFrom: delivery.from,
                        deliverydateTo: delivery.to
                    },
                    type
                });
            }
        }
        if (location.status && !locationWithAddr.status) {
            newLocation = await LocationServiceClass.editForUpload({
                body: {
                    _id: location.data._doc._id,
                    companyLegalName: companyLegalName,
                    serviceTime: serviceTime ? serviceTime : 0,
                    "$push": { points: points[0] }
                }
            })
        } else {
            if(status) {
                newLocation = await LocationServiceClass.createForUpload({
                    name: CustomerCode,
                    companyLegalName: companyLegalName,
                    serviceTime: serviceTime ? serviceTime : 0,
                    points: points
                })
            }
        }
        return newLocation;
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

    async createTimeFormatCaravan(dateTimeCheck, data) {
        let {
            deliveryDate, pickupDate, pickupStartTime,
            pickupEndTime, deliveryStartTime, deliveryEndTime,
            timezone
        } = data;
        let zone = timezone.search("C") > 0 ? timezone.split("C")[1].split(":")[0] : timezone.split(":")[0];
        let pickupDateFrom, pickupDateTo, deliveryDateFrom, deliveryDateTo;
        if (!dateTimeCheck.pickupDate && !dateTimeCheck.deliveryDate) {
            pickupDate = deliveryDate = moment().format('YYYY-MM-DD');
        }
        if (dateTimeCheck.pickupDate && !dateTimeCheck.deliveryDate) {
            deliveryDate = pickupDate;
        }
        if (!dateTimeCheck.pickupDate && dateTimeCheck.deliveryDate) {
            pickupDate = deliveryDate;
        }
        if (!dateTimeCheck.pickupStart) {
            pickupStartTime = moment("00:00:00 AM", "HH:mm:ss A").format("HH:mm:ss.SSS")
        }
        if (!dateTimeCheck.pickupEnd) {
            pickupEndTime = moment("11:59:59 PM", "HH:mm:ss A").format("HH:mm:ss.SSS")
        }
        let pickupStartEnd = true;
        if (dateTimeCheck.pickupStart && dateTimeCheck.pickupEnd) {
            if (moment(pickupStartTime, ["H:mm:ss A", "H:mm:ss", "H:mm:ss.SSS"]) >= moment(pickupEndTime, ["H:mm:ss A", "H:mm:ss", "H:mm:ss.SSS"])) {
                pickupStartEnd = false;
                // pickupStartTime = moment("00:00:00 AM", "HH:mm:ss A").format("HH:mm:ss.SSS")
                // pickupEndTime = moment(pickupEndTime, ["H:mm:ss A", "H:mm:ss", "H:mm:ss.SSS"]).format("HH:mm:ss.SSS")
            }
            pickupStartTime = moment(pickupStartTime, ["HH:mm:ss A", "HH:mm:ss"]).format("HH:mm:ss.SSS")
            pickupEndTime = moment(pickupEndTime, ["H:mm:ss A", "H:mm:ss", "H:mm:ss.SSS"]).format("HH:mm:ss.SSS")

        }

        if (!dateTimeCheck.deliveryStart) {
            deliveryStartTime = moment("00:00:00 AM", "HH:mm:ss A").format("HH:mm:ss.SSS")
        }
        if (!dateTimeCheck.deliveryEnd) {
            deliveryEndTime = moment("11:59:59 PM", "HH:mm:ss A").format("HH:mm:ss.SSS")
        }
        let deliveryStartEnd = true;
        if (dateTimeCheck.deliveryStart && dateTimeCheck.deliveryEnd) {
            if (moment(deliveryStartTime, ["H:mm:ss A", "H:mm:ss", "H:mm:ss.SSS"]) >= moment(deliveryEndTime, ["H:mm:ss A", "H:mm:ss", "H:mm:ss.SSS"])) {
                deliveryStartEnd = false
                // deliveryStartTime = moment("00:00:00 AM", "HH:mm:ss A").format("HH:mm:ss.SSS")
                // deliveryEndTime = moment(deliveryEndTime, ["H:mm:ss A", "H:mm:ss", "H:mm:ss.SSS"]).format("HH:mm:ss.SSS")
            }
            deliveryStartTime = moment(deliveryStartTime, ["H:mm:ss A", "H:mm:ss", "H:mm:ss.SSS"]).format("HH:mm:ss.SSS")
            deliveryEndTime = moment(deliveryEndTime, ["H:mm:ss A", "H:mm:ss", "H:mm:ss.SSS"]).format("HH:mm:ss.SSS")

        }
        pickupDateFrom = moment(`${pickupDate}T${pickupStartTime}`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
        pickupDateTo = !pickupStartEnd
            ? moment(`${pickupDate}T${pickupEndTime}`).add(1, "days").subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")
            : moment(`${pickupDate}T${pickupEndTime}`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
        deliveryDateFrom = moment(`${deliveryDate}T${deliveryStartTime}`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
        if (moment(pickupStartTime, ["H:mm:ss A", "H:mm:ss", "H:mm:ss.SSS"]) > moment(deliveryStartTime, ["H:mm:ss A", "H:mm:ss", "H:mm:ss.SSS"]) && moment(pickupStartTime, ["H:mm:ss A", "H:mm:ss", "H:mm:ss.SSS"]) >= moment(deliveryEndTime, ["H:mm:ss A", "H:mm:ss", "H:mm:ss.SSS"])) {
            deliveryDate = moment(deliveryDate, "YYYY-MM-DD").add(1, "days").format("YYYY-MM-DD");
        }
        deliveryDateTo = !deliveryStartEnd
            ? moment(`${deliveryDate}T${deliveryEndTime}`).add(1, "days").subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")
            : moment(`${deliveryDate}T${deliveryEndTime}`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
        if (pickupDateFrom == pickupDateTo) {
            pickupDateFrom = moment(pickupDateFrom, "YYYY-MM-DDTHH:mm:ss.SSS").subtract(1, "day").format("YYYY-MM-DDTHH:mm:ss.SSS")
        }
        if (deliveryDateFrom == deliveryDateTo) {
            deliveryDateFrom = moment(deliveryDateFrom, "YYYY-MM-DDTHH:mm:ss.SSS").subtract(1, "day").format("YYYY-MM-DDTHH:mm:ss.SSS")
        }

        return {
            pickupDateFrom,
            pickupDateTo,
            deliveryDateFrom,
            deliveryDateTo
        }
    }

    async checkDateTimeFormats(data) {
        let { item, fileHeaders } = data, status = 1, message = "Success";
        let deliveryDate, deliveryStart, deliveryEnd;
        let pickupDate, pickupStart, pickupEnd;

        if (!item[fileHeaders["Pick Date"]] && ((!item[fileHeaders["Delivery Window End"]] && item[fileHeaders["Delivery Period"]]) || (item[fileHeaders["Delivery Window End"]] && item[fileHeaders["Delivery Period"]]))) {
            deliveryDate = item[fileHeaders["Delivery Date"]] ? moment(item[fileHeaders["Delivery Date"]], "YYYY-MM-DD", true) : 1;
            deliveryStart = item[fileHeaders["Delivery Window Start"]] ? moment(item[fileHeaders["Delivery Window Start"]], "H:mm", true) : 1;
        } else if (!item[fileHeaders["Pick Date"]] && item[fileHeaders["Delivery Window End"]] && !item[fileHeaders["Delivery Period"]]) {
            deliveryDate = item[fileHeaders["Delivery Date"]] ? moment(item[fileHeaders["Delivery Date"]], "YYYY-MM-DD", true) : 1;
            deliveryStart = item[fileHeaders["Delivery Window Start"]] ? moment(item[fileHeaders["Delivery Window Start"]], "H:mm", true) : 1;
            deliveryEnd = item[fileHeaders["Delivery Window End"]] ? moment(item[fileHeaders["Delivery Window End"]], "H:mm", true) : 1;
        }else if (item[fileHeaders["Pick Date"]] && item[fileHeaders["Delivery Date"]]) {
            pickupDate = item[fileHeaders["Pick Date"]] ? moment(item[fileHeaders["Pick Date"]], "YYYY-MM-DD", true) : 1;
            pickupStart = item[fileHeaders["Pick up Window Start"]] ? moment(item[fileHeaders["Pick up Window Start"]], "H:mm", true) : 1;
            pickupEnd = item[fileHeaders["Pick up Window End"]] ? moment(item[fileHeaders["Pick up Window End"]], "H:mm", true) : 1;
            deliveryDate = item[fileHeaders["Delivery Date"]] ? moment(item[fileHeaders["Delivery Date"]], "YYYY-MM-DD", true) : 1;
            deliveryStart = item[fileHeaders["Delivery Window Start"]] ? moment(item[fileHeaders["Delivery Window Start"]], "H:mm", true) : 1;
            deliveryEnd = item[fileHeaders["Delivery Window End"]] ? moment(item[fileHeaders["Delivery Window End"]], "H:mm", true) : 1;
        }
        if ((deliveryDate && !deliveryDate.isValid()) || (deliveryStart && !deliveryStart.isValid()) || (deliveryEnd && !deliveryEnd.isValid()) ||
            (pickupDate && !pickupDate.isValid()) || (pickupStart && !pickupStart.isValid()) || (pickupEnd && !pickupEnd.isValid())) {
            status = 0;
            message = "wrong mapping or wrong Date Formats"
        }
        return { status, message};
    }
    async checkDateTimeFormatsForCaravan(data) {
        let { item, fileHeaders } = data, status = 1;
        let deliveryDate, deliveryStart, deliveryEnd;
        let pickupDate, pickupStart, pickupEnd;
        let pickupDateKey = fileHeaders["Pick Date"], pickupStartKey = fileHeaders["Pick up Window Start"], pickupEndKey = fileHeaders["Pick up Window End"],
        deliveryDateKey = fileHeaders["Delivery Date"], deliveryStartKey = fileHeaders["Delivery Window Start"], deliveryEndKey = fileHeaders["Delivery Window End"];

        let resultObj = {
            pickupDate: 0,
            deliveryDate: 0,
            pickupStart: 0,
            pickupEnd: 0,
            deliveryStart: 0,
            deliveryEnd: 0
        };
        for (const key in item) {
            if (item[key] && `${item[key]}`.trim() != "") {
                if (key == pickupDateKey) {
                    pickupDate = moment(item[key], ["YYYY-MM-DD", "M/D/YY", "M/D/YYYY"], true);
                    resultObj["pickupDate"] = pickupDate.isValid();
                }
                if (key == deliveryDateKey) {
                    deliveryDate = moment(item[key], ["YYYY-MM-DD", "M/D/YY", "M/D/YYYY"], true);
                    resultObj["deliveryDate"] = deliveryDate.isValid();
                }
                if (key == pickupStartKey) {
                    pickupStart = moment(item[key], ["H:mm:ss A", "H:mm:ss"], true);
                    resultObj["pickupStart"] = pickupStart.isValid();
                }
                if (key == pickupEndKey) {
                    pickupEnd = moment(item[key], ["H:mm:ss A", "H:mm:ss"], true);
                    resultObj["pickupEnd"] = pickupEnd.isValid();
                }
                if (key == deliveryStartKey) {
                    deliveryStart = moment(item[key], ["H:mm:ss A", "H:mm:ss"], true);
                    resultObj["deliveryStart"] = deliveryStart.isValid();
                }
                if (key == deliveryEndKey) {
                    deliveryEnd = moment(item[key], ["H:mm:ss A", "H:mm:ss"], true);
                    resultObj["deliveryEnd"] = deliveryEnd.isValid();
                }
            }
        }
        for (const key in resultObj) {
            if (!resultObj[key] && resultObj[key] === false) {
                status = 0;
                break;
            }
        }
        return { status, message: "Wrong Date Formats", resultObj };
    }


    checkAddressesForCaravan(data) {
        let { item, fileHeaders } = data, status = 1, messages;

        let pickupAddr = fileHeaders["Address1_pickuploc"], pickupCity = fileHeaders["City_pickuploc"],
        pickupState = fileHeaders["Prov_pickuploc"], pickupCountry = fileHeaders["Country_pickuploc"], pickupCountryCode = fileHeaders["Country_pickuploc"].toLowerCase(),
        pickupZip = fileHeaders["PostalCode_pickuploc"], pickupCompanyName = fileHeaders["Location_pickuploc"];
        let deliveryAddr = fileHeaders["Address1_deliveryloc"], deliveryCity = fileHeaders["City_deliveryloc"],
        deliveryState = fileHeaders["Prov_deliveryloc"], deliveryCountry = fileHeaders["Country_deliveryloc"], deliveryCountryCode = fileHeaders["Country_deliveryloc"].toLowerCase(),
        deliveryZip = fileHeaders["PostalCode_deliveryloc"], deliveryCompanyName = fileHeaders["Location_deliveryloc"];

        let errorMessage = orderErrors.createOrderUploadError({
            pickupCompanyName: item[pickupCompanyName],
            pickupState: item[pickupState],
            pickupStreetAddress: item[pickupAddr],
            pickupCountryCode: item[pickupCountryCode],
            pickupCity: item[pickupCity],
            pickupZip: item[pickupZip],
            deliveryCompanyName: item[deliveryCompanyName],
            deliveryState: item[deliveryState],
            deliveryStreetAddress: item[deliveryAddr],
            deliveryCountryCode: item[deliveryCountryCode],
            deliveryCity: item[deliveryCity],
            deliveryZip: item[deliveryZip],
        })
        if (errorMessage.error) {
            status = 0
            messages = errorMessage.msg
        }
        return { status, message: messages };
    }
    checkProbillNoForCaravan = (data) => {
        let { item, fileHeaders } = data, status = 1, messages;
        let ProbillNo = fileHeaders["ProbillNo"];
        if (!item[ProbillNo] || `${item[ProbillNo]}`.trim() == ""){
            status = 0
            messages = "ProbillNo is required"
        }
        return { status, message: messages };
    }
};

module.exports = Logics;
