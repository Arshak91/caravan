const moment = require("moment");
const env = process.env.SERVER == "local" ? require("../config/env.local") : require("../config/env");
const { warningCodes } = require("../constants/warningCodes")
// Helpers
const PlanningHelper = require("../helpers/planningHelper");
const PlanningHelperClass = new PlanningHelper();
const OrderHelper = require("../helpers/orderHelpers");
const OrderHelperClass = new OrderHelper()

// Services
const StatusService = require("./status.service");
const StatusServiceClass = new StatusService();
const OrderService = require("./order.service");
const OrderServiceClass = new OrderService();
const BaseService = require('../main_classes/base.service');
const OSrmService = require('../services/osmap.service');
const CalculationService = require('../services/calculation.service');
const AlgorithmService = require("./algorithm.service");
const AlgorithmServiceClass = new AlgorithmService();

// Models
const OrderSchema = require("../newModels/ordersModel");
const JobSchema = require("../newModels/jobModel");
const StatusesSchema = require("../newModels/statusesModel");


class Calculations extends BaseService {
    get osrm () { return new OSrmService()};
    get calc () { return new CalculationService() }

    addDataOrdersLatLonByFlowType = async (data) => {
        let { orders, flowType } = data;
        let orderArr = [], repOrders = [];
        if (flowType == 2) {
            orderArr.push(orders[0]);
            for (let i = 1; i < orders.length; i++) {
                if (orders[i].deliveryLon !== orders[i-1].deliveryLon && orders[i].deliveryLat !== orders[i-1].deliveryLat) {
                    orderArr.push(orders[i]);
                } else {
                    repOrders.push([orders[i-1]._id, orders[i]._id]);
                }
            }
        }
        if (flowType == 1) {
            orderArr.push(orders[0]);
            for (let i = 1; i < orders.length; i++) {
                if (orders[i].pickupLon !== orders[i-1].pickupLon && orders[i].pickupLat !== orders[i-1].pickupLat) {
                    orderArr.push(orders[i]);
                } else {
                    repOrders.push([orders[i-1]._id, orders[i]._id]);
                }
            }
        }
        if (flowType == 3) {
            for (let i = 0; i < orders.length; i++) {
                if (i == 0) {
                    orderArr.push(orders[i]);
                } else {
                    orderArr.push(orders[i], orders[i]);
                }
                
            }
        }
        return {orders: orderArr, repOrders};
    }

    groupConcatOrderIds = async (data) => {
        let newArr = data.reduce((acc, cur) => {
            const accLastArr = acc[acc.length - 1] || [];
            if (accLastArr[accLastArr.length - 1] === cur[0]) {
                acc[acc.length - 1] = accLastArr.concat(cur.slice(1));
            } else {
                acc.push(cur);
            }
            return acc;
        }, []);
        return {
            status: 1,
            newArr,
            msg: "Ok"
        };
    }

    getOrderTimeWindow = async (time, order) => {
        let data = moment(time, "x").format("YYYY-MM-DD"), timeWindows = {};
        if (!order || !order.timeWindows || !order.timeWindows.deliveryTimeWindows) {
            console.log(order);
        }
        for (const item of order.timeWindows.deliveryTimeWindows) {
            if (moment(item.From.split("T")[0], "YYYY-MM-DD") <= moment(data, "YYYY-MM-DD")) {
                timeWindows.deliveryFrom = item.From;
                timeWindows.deliveryTo = item.To;
            } else if (moment(item.From.split("T")[0], "YYYY-MM-DD") > moment(data, "YYYY-MM-DD")) {
                timeWindows.deliveryFrom = item.From;
                timeWindows.deliveryTo = item.To;
                break;
            }
        }
        for (const item of order.timeWindows.pickupTimeWindows) {
            if (moment(item.From.split("T")[0], "YYYY-MM-DD") <= moment(data, "YYYY-MM-DD")) {
                timeWindows.pickupFrom = item.From;
                timeWindows.pickupTo = item.To;
            } else if (moment(item.From.split("T")[0], "YYYY-MM-DD") > moment(data, "YYYY-MM-DD")) {
                timeWindows.pickupFrom = item.From;
                timeWindows.pickupTo = item.To;
            }
        }
        return timeWindows;
    }

    addWarrningsByFlowType = async (data, order,time, orderTimeWindow, date) => {
        const lateETA = await StatusServiceClass.getOne({ _id: "60b0b9216f8b6c476f2a5780" });
        const overTime = await StatusServiceClass.getOne({ _id: "60b0b9226f8b6c476f2a57ad" });
        const departTime = await StatusServiceClass.getOne({ _id: "60b0b9226f8b6c476f2a57b9" });
        let wobj = [], startTime = date, maxShift = 0;
        let { shiftName, shift, max_shift, recharge, flowType, loadId } = data
        if (shiftName != "Team shift" && max_shift > shift) {
            maxShift = (max_shift + (Math.floor(max_shift / shift) * recharge))*1000;
        } else {
            maxShift = max_shift * 1000;
        }
        let dateTime = time;
        let warnings = await PlanningHelperClass.checkingByFlowType({
            flowType,
            dateTime,
            orderTimeWindow,
            loadId,
            order,
            wobj,
            maxShift,
            startTime,
            lateETA: lateETA,
            overTime: overTime,
            departTime: departTime,
        })
        return warnings.wobj;
    }

    checkByLoadType = async (data) => {
        let  { loadType, timeInfo, info, obj, arr, order, loadId, flowType, pickupTimeInfo, pickupInfo, i } = data;
        let loadIds, loadTempIds, flowTypes, action;
        loadTempIds = order.loadTempIds ? order.loadTempIds : [];
        loadIds = order.loadIds ? order.loadIds : [];
        flowTypes = order.flowTypes ? order.flowTypes : [];
        if (flowType == 1) {
            action = 0
        }
        if (flowType == 2) {
            action = 1
        }
        if (flowType == 3 && i % 2 != 0) {
            action = 0
        } else if(flowType == 3 && i % 2 == 0) {
            action = 1
        }
        if (loadType == 0) {
            if (!loadTempIds.includes(loadId)) {
                loadTempIds.push(loadId);
            }
            if (flowType == 3 && i % 2 != 0) {
                if (pickupTimeInfo) {
                    pickupInfo.loadTemps = pickupTimeInfo.loadTemps ? {
                        ...pickupTimeInfo.loadTemps,
                        ...obj
                    } : { ...obj };
                } else {
                    pickupInfo.loadTemps = {
                        ...obj
                    };
                }
            } else {
                if (timeInfo) {
                    info.loadTemps = timeInfo.loadTemps ? {
                        ...timeInfo.loadTemps,
                        ...obj
                    } : { ...obj };
                } else {
                    info.loadTemps = {
                        ...obj
                    };
                }
            }
        } else {
            if (!loadIds.includes(loadId)) {
                loadIds.push(loadId);
            }
            if (!flowTypes.includes(flowType)) {
                flowTypes.push(flowType);
            }
            if (flowType == 3 && i % 2 != 0) {
                if (pickupTimeInfo && Object.keys(pickupTimeInfo).length) {
                    pickupInfo.loadTemps = pickupTimeInfo.loadTemps;
                    pickupInfo.loads = pickupTimeInfo.loads ? {
                        ...pickupTimeInfo.loads,
                        ...obj
                    } : { ...obj };
                    pickupInfo.loadsArr = pickupTimeInfo.loadsArr.length > 0 ? pickupTimeInfo.loadsArr : [];
                    if (pickupInfo.loadsArr.length > 0) {
                        for (const [l, load] of info.loadsArr.entries()) {
                            if (load.id == arr[0].id) {
                                pickupInfo.loadsArr[l] = arr[0];
                                // info.loadsArr = info.loadsArr.concat(arr);
                            }
                        }
                    } else {
                        pickupInfo.loadsArr = pickupInfo.loadsArr.concat(arr);
                    }
                } else {
                    pickupInfo.loadTemps = timeInfo.loadTemps;
                    pickupInfo.loads = {
                        ...obj
                    };
                    pickupInfo.loadsArr = pickupInfo.loadsArr.concat(arr);
                }
            } else {
                if (timeInfo && Object.keys(timeInfo).length) {
                    info.loadTemps = timeInfo.loadTemps;
                    info.loads = timeInfo.loads ? {
                        ...timeInfo.loads,
                        ...obj
                    } : { ...obj };
                    info.loadsArr = timeInfo.loadsArr.length > 0 ? timeInfo.loadsArr : [];
                    if (info.loadsArr.length > 0) {
                        for (const [l, load] of info.loadsArr.entries()) {
                            if (load.id == arr[0].id) {
                                info.loadsArr[l] = arr[0];
                                // info.loadsArr = info.loadsArr.concat(arr);
                            }
                        }
                    } else {
                        info.loadsArr = info.loadsArr.concat(arr);
                    }
                } else {
                    info.loadTemps = timeInfo.loadTemps;
                    info.loads = {
                        ...obj
                    };
                    info.loadsArr = info.loadsArr.concat(arr);
                }
            }
        }
        return { status: 1, newInfo: info, loadTempIds, loadIds, flowTypes, pickupNewInfo: pickupInfo, action };
    }

    addWarningInStops = async (data) => {
        let { warnings, alllegs, i, warningsArr } = data;
        let warning = 0, thisLeg = alllegs[i];
        if (warnings.length) {
            for (const elem of warnings) {
                // console.log(thisLeg["type"].orders, elem.orderId);
                if (thisLeg.orders.includes(elem.orderId)) {
                    warning = 1;
                    thisLeg.warningStatus = elem.status;
                    for (const item of thisLeg.datas) {
                        warningsArr[item._id] = elem.status.name;
                    }
                    break;
                } else {
                    thisLeg.warningStatus = null;
                }
            }
        } else {
            thisLeg.warningStatus = null;
        }
        return {
            alllegs: thisLeg,
            warning
        };
    };

    editOrderModel = async (data) => {
        let { status, loadTempIds, loadIds, flowTypes, flowType, timeInfo, pickupTimeInfo, i } = data;
        let orderModel = {
            status,
            loadTempIds,
            loadIds,
            flowTypes
        };
        if (flowType == 3 && i % 2 != 0) {
            orderModel.pickupTimeInfo = pickupTimeInfo;
        } else {
            orderModel.timeInfo = timeInfo;
        };
        return orderModel;
    };

    getStatuses = async (data) => {
        let { codes } = data, names = [];

        for (const code of codes) {
            names.push(warningCodes[code]);
        }
        const statuses = await StatusesSchema.find({
            name: {
                $in: names
            }
        });
        return statuses;
    }

    stops = async (data) => {
        const {
            loadType, loads, timezone, start,
            sortOrders, flowType, traficInfo,
            loadId, user, shift
        } = data;
        let generalStatus = 1, generalMessage = "Success";
        let str , type = [], dstr;
        let zone = timezone.split(":")[0];
        // let date = start == 1 || start == 2 ? new Date(loads.startedTime).getTime() : new Date(loads.startTime).getTime();
        let date = start == 1 || start == 2 ? new Date(loads.startedTime).getTime() :
        +moment.utc(loads.startTime).format("x");
        
        console.log(+moment.utc(loads.startTime).format("x"));
        console.log(+moment(loads.startTime).format("x"));
        let brTime = shift.break_time, shiftVal = shift.shift, { rest, recharge, shiftName, max_shift } = shift;

        let { orders, repOrders } = await this.addDataOrdersLatLonByFlowType({
            orders: sortOrders,
            flowType
        });

        let groupConcatOrderIds = await this.groupConcatOrderIds(repOrders);

        let { legs } = traficInfo;
        let warnings = [], time = date, distTime = 0, fullDur = 0,
        rech = 0, brRest = 0, k = 0, k1 = 0, k2 = 0, sleepTime = 0;
        let br_shift = brTime/shiftVal;
        for (const [l, leg] of legs.entries()) {
            time += (leg.duration*1000);
            distTime += (leg.duration);
            if (orders[l]) {
                let orderTimeWindow = await this.getOrderTimeWindow(time, orders[l]);
                let wai = 0;

                // CHECK Waiting
                let waitingInfo  = await PlanningHelperClass.checkingByFlowType({flowType, time, orderTimeWindow, wai, distTime, l});

                wai = waitingInfo.wai
                time = waitingInfo.time
                distTime = waitingInfo.distTime

                

                if (distTime >= brTime && (distTime - fullDur) >= brTime) {
                    if (k == 0) {
                        distTime += rest;
                        brRest = rest;
                        time += (rest * 1000);
                    }
                    if (((time-date) - fullDur)/1000 < shiftVal && legs[l+1] && ((time - fullDur)/1000 + legs[l+1].duration > shiftVal) && (shiftName != "Team shift"  || shiftName != "Team(China)")) {
                        fullDur += (((time-date) - fullDur) + (recharge*1000));
                        // time += (((distTime - time) + recharge)*1000);
                        distTime = 0;
                        time = 0;
                        rech = recharge;
                    } else if ((((time-date) - fullDur)/1000 > shiftVal && legs[l+1]) && (shiftName != "Team shift" && shiftName != "Team(China)")) {
                        fullDur += (((time-date) - fullDur) + (recharge*1000));
                        let breakCount = Math.floor(distTime/shiftVal) ? Math.floor(distTime/shiftVal) : 1;
                        if (Math.floor(distTime/shiftVal) && (distTime/shiftVal - breakCount) >= br_shift) {
                            breakCount += 1;
                        }
                        distTime += (rest * breakCount);
                        // time += ((distTime + recharge)*1000);
                        rech = (recharge * (distTime / shiftVal));
                        distTime = 0;
                        time = 0;
                    }
                    if (((time-date) - fullDur)/1000 > shiftVal && !legs[l+1]) {
                        fullDur += (((time-date) - fullDur) + recharge/1000);
                        distTime = 0;
                        time = 0;
                    }
                    k++;
                    if (distTime == 0) {
                        k = 0;
                    }
                }
                if (time == 0) {
                    time = (date+ (fullDur));
                }

                let serviceTimes, summService = false;
                for (const orderId of groupConcatOrderIds.newArr) {
                    if (orderId.includes(orders[l]._id)) {
                        summService = true;
                        serviceTimes = await OrderServiceClass.summOrderServicetime({ ids: orderId})
                    }
                }
                // CHECK Warnings
                let wrn = await this.addWarrningsByFlowType({
                    loadId, shiftName, shift: shiftVal, max_shift, recharge, flowType
                }, orders[l], time, orderTimeWindow, date);

                warnings = warnings.concat( wrn );

                time += !summService ? (orders[l].servicetime * 1000) : (serviceTimes.data.count*1000);

            }
            // str1 = await this.addSingleOrderLatlonByFlowType(str1, orders[l], data.loads);
        }
        fullDur = 0;

        for (const order of orders) {
            let bool = true;
            if (groupConcatOrderIds.newArr.length > 0) {
                for ( const [r, repOrder] of groupConcatOrderIds.newArr.entries() ) {
                    if ( repOrder.includes(order._id) ) {
                        let orderArr = [];
                        order._doc ? orderArr.push(order._doc) : orderArr.push(order);
                        for (const rOrd of repOrder) {
                            if (rOrd != order._id) {
                                let order = await OrderServiceClass.getById({
                                    params: {
                                        id: rOrd
                                    },
                                    user
                                });
                                orderArr.push(order.data._doc);
                            }
                        }
                        type.push({
                            type: "order",
                            datas: orderArr,
                            orders: repOrder,
                            actions: {},
                            multi: null
                        });
                        bool = false;
                    }
                    if (bool && (r == groupConcatOrderIds.newArr.length - 1) && (!groupConcatOrderIds.newArr[groupConcatOrderIds.newArr.length -1].includes(order._id))) {
                        type.push({
                            type: "order",
                            datas: [order],
                            orders: [order._id],
                            actions: {},
                            multi: null
                        });
                    }
                }
            } else {
                type.push({
                    type: "order",
                    datas: [order],
                    orders: [order._id],
                    actions: {},
                    multi: null
                });
            }
        }
        let alllegs = legs, orderType = type, newStops = [];
        let newAllLegs = [], Etatime;
        let warningsArr = {};
        let tEta;
        let warning = 0;
        let info = {
            loads: {},
            loadTemps: {},
            loadsArr: []
        }, arr = [], totalDuration, fixDuration = 0, bool = false;
        let pickupInfo = {
            loads: {},
            loadTemps: {},
            loadsArr: []
        }
        const statuses = await StatusServiceClass.getOne({_id: "60b0b9206f8b6c476f2a576f"})
        console.log("loadTemp", shiftName);
        let orderUpd, timeInfoRech;
        if (alllegs.length == 1 || (alllegs.length == 2 && loads.return == 0)) {
            alllegs[0]["type"] = orderType[0];
            newStops[0] = orderType[0];
            totalDuration = (alllegs[0]["duration"]*1);
            if (totalDuration >= brTime && (totalDuration - fullDur) >= brTime) {
                if (k1 == 0) {
                    totalDuration += rest;
                }
                if ((totalDuration - fullDur) > shiftVal) {
                    let breakCount = Math.floor((totalDuration - fullDur)/shiftVal) ? Math.floor((totalDuration - fullDur)/shiftVal) : 1;
                    if (Math.floor((totalDuration - fullDur)/shiftVal) && ((totalDuration - fullDur)/shiftVal - breakCount) >= br_shift) {
                        breakCount += 1;
                    }
                    // += (rest * breakCount);
                    timeInfoRech = (recharge * (distTime / shiftVal));
                    fullDur += ((rest * breakCount) + (totalDuration - fullDur) + timeInfoRech);
                    // fullDur += ((totalDuration - fullDur) + recharge);
                    totalDuration = 0;
                }
                k1++;
                if (totalDuration == 0) {
                    k1 = 0;
                }
            }
            if (totalDuration == 0) {
                totalDuration = fullDur;
            }
            if (!newStops[0].datas[0].timeInfo) {
                arr.push({
                    status: 0,
                    msg: "timeInfo null",
                    id: newStops.datas[0]._id
                });
                newStops[0].datas[0].timeInfo = {};
            }
            if (newStops[0].orders.length == 1) {
                tEta = (totalDuration*1000) + date;
                let orderTimeWindow = await this.getOrderTimeWindow(tEta, newStops[0].datas[0]);
                let { obj, arr } = await PlanningHelperClass.timeInfoByFlowType({
                    flowType: flowType, allleg: newStops[0].datas[0], tEta, loadId,
                    duration: totalDuration*1000,
                    shiftVal,
                    recharge,
                    brTime,
                    rest,
                    shiftName
                }, orderTimeWindow);
                // Check by LoadType
                let {status, newInfo, loadTempIds, loadIds, flowTypes } = await this.checkByLoadType({
                    loadType, timeInfo: newStops[0].datas[0].timeInfo,
                    info, obj, arr,
                    order: newStops[0].datas[0],
                    loadId,
                    flowType,
                    i: 0
                });
                if (status) {
                    newStops[0].datas[0].timeInfo.loads = newInfo.loads;
                    newStops[0].datas[0].timeInfo.loadTemps = newInfo.loadTemps;
                    newStops[0].datas[0].timeInfo.loadsArr = newInfo.loadsArr;
                    newStops[0].datas[0].statusId = loadType == 0 ? statuses.data._doc._id : newStops[0].datas[0].status._doc ? newStops[0].datas[0].status._doc._id : newStops[0].datas[0].status._id;
                    newStops[0].datas[0].statusName = loadType == 0 ? statuses.data._doc.name : newStops[0].datas[0].status._doc ? newStops[0].datas[0].status._doc.name : newStops[0].datas[0].status.name;
                    newStops[0].datas[0].statusType = loadType == 0 ? statuses.data._doc.statustype : newStop[0].datas[0].status._doc ? newStops[0].datas[0].status._doc.type : newStops[0].datas[0].status.type;
                    newStops[0].datas[0].statusColor = loadType == 0 ? statuses.data._doc.color : newStops[0].datas[0].status._doc ? newStops[0].datas[0].status._doc.color : newStops[0].datas[0].status.color;
                    newStops[0].actions[newStops[0].orders[0]] = 1;
                    newStops[0].multi = false;
                };
                const generateEditOrderModel = await this.editOrderModel({
                    status: loadType == 0 ? statuses.data._doc._id : newStops[0].datas[0].status,
                    loadTempIds: loadTempIds,
                    loadIds: loadIds,
                    flowTypes,
                    flowType,
                    timeInfo: newInfo,
                    i: 0
                })
                orderUpd = await OrderServiceClass.updateForCalc({
                    _id: newStops[0].datas[0]._id,
                    ...generateEditOrderModel
                }).catch(err => {
                    console.log(err);
                })
                totalDuration += loadType == 0 ? newInfo.loadTemps[loadId].waiting : newInfo.loads[loadId].waiting;
                totalDuration += newStops[0].datas[0].servicetime;
            } else if (newStops[0].orders.length > 1) {
                let orderData = newStops[0].datas;
                for (const [o, order] of orderData.entries()) {
                    tEta = (totalDuration*1000) + date;
                    let orderTimeWindow = await this.getOrderTimeWindow(tEta, order);
                    let { obj, arr } = await PlanningHelperClass.timeInfoByFlowType({
                        flowType, allleg: order, tEta, loadId,
                        duration: totalDuration*1000,
                        shiftVal,
                        recharge,
                        brTime,
                        rest,
                        shiftName
                    }, orderTimeWindow);
                    let {status, newInfo, loadTempIds, loadIds, flowTypes }  = await this.checkByLoadType({
                        loadType, timeInfo: order.timeInfo,
                        info,
                        obj,
                        arr,
                        order,
                        loadId,
                        flowType,
                        i: 0
                    });
                    if (status) {
                        newStops[0].datas[o].timeInfo.loads = newInfo.loads;
                        newStops[0].datas[o].timeInfo.loadTemps = newInfo.loadTemps;
                        newStops[0].datas[o].timeInfo.loadsArr = newInfo.loadsArr;
                        newStops[0].datas[o].statusId = loadType == 0 ? statuses.data._doc._id : order.status._doc._id;
                        newStops[0].datas[o].statusName = loadType == 0 ? statuses.data._doc.name : order.status._doc.name;
                        newStops[0].datas[o].statusType = loadType == 0 ? statuses.data._doc.statustype : order.status._doc.type;
                        newStops[0].datas[o].statusColor = loadType == 0 ? statuses.data._doc.color : order.status._doc.color;
                        newStops[0].actions[order._id.toString()] = 1;
                        let act = newStops[0].actions, actionArr = [];
                        for (const key in act) {
                            actionArr.push(act[key])
                        }
                        if (actionArr.includes(0) && actionArr.includes(1)) {
                            newStops[0].multi = true;
                        } else {
                            newStops[0].multi = false;
                        }
                    }
                    const generateEditOrderModel = await this.editOrderModel({
                        status: loadType == 0 ? statuses.data._doc._id : order.status,
                        loadTempIds,
                        loadIds,
                        flowTypes,
                        flowType,
                        timeInfo: newInfo,
                        i: 0
                    })
                    orderUpd = await OrderServiceClass.updateForCalc({
                        _id: order._id,
                        ...generateEditOrderModel
                    }).catch(err => {
                        console.log(err);
                    })
                    totalDuration += loadType == 0 ? newInfo.loadTemps[loadId].waiting : newInfo.loads[loadId].waiting;
                    totalDuration += order.servicetime;
                }
            }
            let newAlleg = await this.addWarningInStops({
                warnings,
                alllegs: newStops,
                i: 0,
                warningsArr
            });
            newStops[0] = newAlleg.alllegs;
            warning = newAlleg.warning;
            newAllLegs.push(newStops[0]);
        } else if (alllegs.length > 1) {
            totalDuration = 0;
            let legsLenght = alllegs.length;
            for (const [i, leg] of alllegs.entries()) {
                totalDuration += (alllegs[i]["duration"]*1);
                alllegs[i]["type"] = orderType[i] ? orderType[i] : false;
                newStops[i] = orderType[i] ? orderType[i] : false;

                if (totalDuration >= brTime && (totalDuration - fullDur) >= brTime) {
                    if (k2 == 0) {
                        totalDuration += rest;
                    }

                    if ((totalDuration - fullDur) < shiftVal && alllegs[i+1] && ((totalDuration - fullDur) + (alllegs[i+1].duration) > shiftVal)) {
                        fullDur += ((totalDuration - fullDur) + recharge);
                        totalDuration = 0;
                    } else if ((totalDuration - fullDur) > shiftVal && alllegs[i+1]) {
                        let breakCount = Math.floor((totalDuration - fullDur)/shiftVal) ? Math.floor((totalDuration - fullDur)/shiftVal) : 1;
                        if (Math.floor((totalDuration - fullDur)/shiftVal) && ((totalDuration - fullDur)/shiftVal - breakCount) >= br_shift) {
                            breakCount += 1;
                        }
                        // += (rest * breakCount);
                        timeInfoRech = (recharge * (distTime / shiftVal));
                        fullDur += ((rest * breakCount) + (totalDuration - fullDur) + timeInfoRech);
                        totalDuration = 0;
                    }
                    if ((totalDuration - fullDur) > shiftVal && !alllegs[i+1]) {
                        fullDur += ((totalDuration - fullDur) + recharge);
                        totalDuration = 0;
                    }
                    k2++;
                    if (totalDuration == 0) {
                        k2 = 0;
                    }
                }
                if (totalDuration == 0) {
                    totalDuration = fullDur;
                }
                if (newStops[i] && newStops[i].orders.length == 1) {
                    tEta = (totalDuration*1000) + date;
                    let orderTimeWindow = await this.getOrderTimeWindow(tEta, newStops[i].datas[0], timezone);
                    let { obj, arr } = await PlanningHelperClass.timeInfoByFlowType({
                        flowType, allleg: newStops[i].datas[0], tEta, loadId,
                        duration: totalDuration*1000,
                        shiftVal,
                        recharge,
                        brTime,
                        rest,
                        shiftName,
                        i
                    }, orderTimeWindow);
                    // Check by LoadType
                    let {status, newInfo, loadTempIds, loadIds, flowTypes, pickupNewInfo, action } = await this.checkByLoadType({
                        loadType,
                        timeInfo: newStops[i].datas[0].timeInfo,
                        pickupTimeInfo: newStops[i].datas[0].pickupTimeInfo,
                        info, obj, arr, pickupInfo,
                        order: newStops[i].datas[0], loadId, flowType,
                        i
                    });
                    if (status) {
                        newStops[i].datas[0].timeInfo.loads = newInfo.loads;
                        newStops[i].datas[0].timeInfo.loadTemps = newInfo.loadTemps;
                        newStops[i].datas[0].timeInfo.loadsArr = newInfo.loadsArr;
                        newStops[i].datas[0].pickupTimeInfo = {};
                        newStops[i].datas[0].pickupTimeInfo.loads = pickupNewInfo.loads;
                        newStops[i].datas[0].pickupTimeInfo.loadTemps = pickupNewInfo.loadTemps;
                        newStops[i].datas[0].pickupTimeInfo.loadsArr = pickupNewInfo.loadsArr;
                        newStops[i].actions[newStops[i].orders[0]] = action;
                        newStops[i].datas[0].statusId = loadType == 0 ? statuses.data._doc._id : newStops[i].datas[0].status._doc ? newStops[i].datas[0].status._doc._id : newStops[i].datas[0].status._id;
                        newStops[i].datas[0].statusName = loadType == 0 ? statuses.data._doc.name : newStops[i].datas[0].status._doc ? newStops[i].datas[0].status._doc.name : newStops[i].datas[0].status.name;
                        newStops[i].datas[0].statusType = loadType == 0 ? statuses.data._doc.statustype : newStops[i].datas[0].status._doc ? newStops[i].datas[0].status._doc.type : newStops[i].datas[0].status.type;
                        newStops[i].datas[0].statusColor = loadType == 0 ? statuses.data._doc.color : newStops[i].datas[0].status._doc ? newStops[i].datas[0].status._doc.color : newStops[i].datas[0].status.color;
                        newStops[i].multi = false;
                    };
                    const generateEditOrderModel = await this.editOrderModel({
                        status: loadType == 0 ? statuses.data._doc._id : newStops[i].datas[0].status,
                        loadTempIds: loadTempIds,
                        loadIds: loadIds,
                        flowTypes,
                        flowType,
                        timeInfo: newInfo,
                        pickupTimeInfo: pickupNewInfo,
                        i
                    })
                    orderUpd = await OrderServiceClass.updateForCalc({
                        _id: newStops[i].datas[0]._id,
                        ...generateEditOrderModel
                    }).catch(err => {
                        console.log(err);
                    })
                    if (loadType == 0) {
                        if (flowType != 3) {
                           totalDuration += newInfo.loadTemps[loadId.toString()].waiting;
                        } else {
                            totalDuration += i % 2 == 0 ? newInfo.loadTemps[loadId.toString()].waiting
                                : pickupInfo.loadTemps[loadId.toString()].waiting;
                        }
                    } else {
                        if (flowType != 3) {
                            totalDuration += newInfo.loads[loadId.toString()].waiting;
                        } else {
                            totalDuration += i % 2 == 0 ? newInfo.loads[loadId.toString()].waiting
                                : pickupInfo.loads[loadId.toString()].waiting;
                        }
                    }
                    totalDuration += newStops[i].datas[0].servicetime;
                } else if (newStops[i] && newStops[i].orders.length > 1) {
                    let orderData = newStops[i].datas;
                    for (const [o, order] of orderData.entries()) {
                        tEta = (totalDuration*1000) + date;
                        let orderTimeWindow = await this.getOrderTimeWindow(tEta, order);
                        let { obj, arr } = await PlanningHelperClass.timeInfoByFlowType({
                            flowType, allleg: order, tEta, loadId,
                            duration: totalDuration*1000,
                            shiftVal,
                            recharge,
                            brTime,
                            rest,
                            shiftName
                        }, orderTimeWindow);
                        let {status, newInfo, loadTempIds, loadIds, flowTypes, pickupNewInfo, action }  = await this.checkByLoadType({
                            loadType, timeInfo: order.timeInfo,
                            info, obj, arr, pickupInfo,
                            order, loadId, flowType
                        });
                        if (status) {
                            newStops[i].datas[o].timeInfo.loads = newInfo.loads;
                            newStops[i].datas[o].timeInfo.loadTemps = newInfo.loadTemps;
                            newStops[i].datas[o].timeInfo.loadsArr = newInfo.loadsArr;
                            newStops[i].datas[o].pickupTimeInfo = {};
                            newStops[i].datas[o].pickupTimeInfo.loads = pickupNewInfo.loads;
                            newStops[i].datas[o].pickupTimeInfo.loadTemps = pickupNewInfo.loadTemps;
                            newStops[i].datas[o].pickupTimeInfo.loadsArr = pickupNewInfo.loadsArr;
                            newStops[i].datas[o].statusId = loadType == 0 ?  statuses.data._doc._id : order.status._doc._id;
                            newStops[i].datas[o].statusName = loadType == 0 ? statuses.data._doc.name : order.status._doc.name;
                            newStops[i].datas[o].statusType = loadType == 0 ? statuses.data._doc.statustype : order.status._doc.type;
                            newStops[i].datas[o].statusColor = loadType == 0 ? statuses.data._doc.color : order.status._doc.color;
                            newStops[i].actions[order._id.toString()] = action;
                            let act = newStops[i].actions, actionArr = [];
                            for (const key in act) {
                                actionArr.push(act[key])
                            }
                            if (actionArr.includes(0) && actionArr.includes(1)) {
                                newStops[i].multi = true;
                            } else {
                                newStops[i].multi = false;
                            }
                        };
                        const generateEditOrderModel = await this.editOrderModel({
                            status: loadType == 0 ? statuses.data._doc._id : order.status._id,
                            loadTempIds,
                            loadIds,
                            flowTypes,
                            flowType,
                            timeInfo: newInfo,
                            pickupTimeInfo: pickupNewInfo,
                            i
                        })
                        orderUpd = await OrderServiceClass.updateForCalc({
                            _id: order._id,
                            ...generateEditOrderModel
                        }).catch(err => {
                            console.log(err);
                        });
                        if (loadType == 0) {
                            if (flowType != 3) {
                                totalDuration += newInfo.loadTemps[loadId].waiting; 
                            } else {
                                totalDuration += i % 2 == 0 ? newInfo.loadTemps[loadId.toString()].waiting 
                                    : pickupInfo.loadTemps[loadId.toString()].waiting;
                            }
                        } else {
                            if (flowType != 3) {
                                totalDuration += newInfo.loads[loadId].waiting; 
                            } else {
                                totalDuration += i % 2 == 0 ? newInfo.loads[loadId.toString()].waiting 
                                    : pickupInfo.loads[loadId.toString()].waiting;
                            }
                        }
                        totalDuration += order.servicetime;
                    }
                }
                let newAlleg;
                if (newStops[i] && newStops[i].orders) {
                    newAlleg = await this.addWarningInStops({
                        warnings,
                        alllegs: newStops,
                        i: i,
                        warningsArr
                    });
                    alllegs[i] = newAlleg.alllegs;
                    warning = newAlleg.warning;
                }
                newStops[i] ? newAllLegs.push(newStops[i]) : null;
            }
            for (const leg of alllegs) {
                if (leg.type && leg.type.datas) {
                    for (const item of leg.type.datas) {
                        if (item.status == null) {
                            item.status = "60b0b9206f8b6c476f2a576f";
                        }
                    }
                }
            }
        }
        const x = {
            allStops: newAllLegs,
            statusId: statuses.data._doc._id,
            warningsArr,
            sleepTime,
            totalDuration,
            status: generalStatus,
            msg: generalMessage,
            warning,
        };
        return x;
    };

    stopsFromC = async (data) => {
        let { load, planningId, warnings, loadType, FlowType } = data;
        let Messages, WarningTimeCalculationsEnums, warningBool = false;
        if (warnings && warnings.InfisibleLoad) {
            warningBool = true;
            Messages = warnings.Messages;
            WarningTimeCalculationsEnums = warnings.WarningTimeCalculationsEnums;
        }
        let warningData = {};
        let { Distances, ETAs, ArriveTimes, DepartTimes, WaitingTimes, TotalDistance, TotalMinutes, WarnningMessage, StartLocation, EndLocation } = load;
        if(WarnningMessage) {
            warningBool = true;
            Messages = [WarnningMessage]
        };
        let orderIds = [], stops = [], Deadhead = 0, o_IDs = [];
        Distances.forEach(item => {
            o_IDs.push(item.OrderID)
        });
        const [defaultStatus, orders] = await Promise.all([
            StatusesSchema.findById("60b0b9206f8b6c476f2a576f"),
            OrderSchema.find({ ID: { $in: o_IDs} }).populate("status")
        ]);
        let sortOrders = [];
        o_IDs.forEach((item, index) => {
            const i = orders.findIndex(x => x.ID === item);
            sortOrders[index] = orders[i];
        });

        let updateData = [];
        for (const [d, distance] of Distances.entries()) {
            // let order = await OrderSchema.findOne({ ID: distance.OrderID }).populate("status");
            let order = sortOrders[d];
            let orderObj = order._doc;
            if(orderObj.loadTempIds){
                if(!orderObj.loadTempIds.includes(planningId)) {
                    orderObj.loadTempIds.push(planningId)
                }
            } else {
                orderObj.loadTempIds = [planningId]
            }
            orderIds.push(orderObj._id.toString())
            const status = orderObj.status;
            let timeInfo = {
                loadTemps: {},
                loads: {},
                loadsArr: []
            };
            timeInfo.loadTemps[planningId] = {
                id: null,
                ata: null,
                eta: null,
                arTime: null,
                leaveTime: null,
                waiting: null,
            };
            if (distance.Action == 0 && FlowType == 3) {
                if (d > 0 && loadType == "TL") {
                    Deadhead += Distances[d-1].DistanceToNext;
                }
                if (orderObj.pickupTimeInfo && orderObj.pickupTimeInfo.loadTemps) {
                    orderObj.pickupTimeInfo.loadTemps[planningId] = {
                        id: planningId,
                        ata: null,
                        eta: moment(ETAs[d], "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z",
                        arTime: moment(ArriveTimes[d], "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z",
                        leaveTime: moment(DepartTimes[d], "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z",
                        waiting: WaitingTimes[d],
                    }
                } else {
                    timeInfo.loadTemps[planningId].id = planningId;
                    timeInfo.loadTemps[planningId].ata = null;
                    timeInfo.loadTemps[planningId].eta = moment(ETAs[d], "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z";
                    timeInfo.loadTemps[planningId].arTime = moment(ArriveTimes[d], "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z";
                    timeInfo.loadTemps[planningId].leaveTime = moment(DepartTimes[d], "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z";
                    timeInfo.loadTemps[planningId].waiting = WaitingTimes[d];
                    orderObj.pickupTimeInfo = timeInfo;
                }
            } else {
                if (orderObj.timeInfo && orderObj.timeInfo.loadTemps) {
                    orderObj.timeInfo.loadTemps[planningId] = {
                        id: planningId,
                        ata: null,
                        eta: moment(ETAs[d], "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z",
                        arTime: moment(ArriveTimes[d], "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z",
                        leaveTime: moment(DepartTimes[d], "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z",
                        waiting: WaitingTimes[d],
                    }
                } else {
                    timeInfo.loadTemps[planningId].id = planningId;
                    timeInfo.loadTemps[planningId].ata = null;
                    timeInfo.loadTemps[planningId].eta = moment(ETAs[d], "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z";
                    timeInfo.loadTemps[planningId].arTime = moment(ArriveTimes[d], "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z";
                    timeInfo.loadTemps[planningId].leaveTime = moment(DepartTimes[d], "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z";
                    timeInfo.loadTemps[planningId].waiting = WaitingTimes[d];
                    orderObj.timeInfo = timeInfo;
                }
            }
            if (warnings && warnings.InfisibleLoad) {
                warningData[orderObj._id.toString()] = []
                for (const item of WarningTimeCalculationsEnums[d]) {
                    if(item) {
                        warningData[orderObj._id.toString()].push(warningCodes[item])
                    }
                }
            }
            updateData.push({
                id: orderObj._id,
                data: orderObj
            })
            // OrderSchema.findByIdAndUpdate(orderObj._id, orderObj, { new: true });
            if (status && status._doc) {
                orderObj.statusId = status._doc._id.toString();
                orderObj.statusName = status._doc.name,
                orderObj.statusType = status._doc.statustype,
                orderObj.statusColor = status._doc.color
            }
            let actions = {};
            let stopsLength = stops.length;
            if (d > 0 && Distances[d-1] && Distances[d-1].DistanceToNext == 0) {
                stops[stopsLength-1].actions[orderObj._id.toString()] = distance.Action;
                stops[stopsLength-1].datas.push(orderObj);
                stops[stopsLength-1].orders.push(orderObj._id.toString());
                let act = stops[stopsLength-1].actions, actionArr = [];
                for (const key in act) {
                    actionArr.push(act[key])
                }
                if (actionArr.includes(0) && actionArr.includes(1)) {
                    stops[stopsLength-1].multi = true;
                } else {
                    stops[stopsLength-1].multi = false;
                }
            } else {
                actions[orderObj._id.toString()] = distance.Action;
                stops.push({
                    datas: [orderObj],
                    orders: [orderObj._id.toString()],
                    actions,
                    type: "order",
                    multi: false
                })
            }
        };
        return {
            allStops: stops,
            orderIds,
            stops: stops.length,
            statusId: defaultStatus._id.toString(),
            warning: warningBool ? 1 : 0,
            warningsArr: warningData,
            warningMessage: Messages,
            totalDuration: TotalMinutes*60,
            totalDistance: TotalDistance,
            Deadhead,
            status: 1,
            msg: "Success",
            updateData
        }
    }

    calcByC = async (data) => {
        let { newOrderIdsArr, loads, flowType, host, settings } = data;
        let newOrderIDSStr = "", newOrders = [], job, obj = {};
        const durationMulti = settings.get("durationMultiplier")
        for (const order of newOrderIdsArr) {
            const newOrder = await OrderServiceClass.getById({params: {id: order}});
            newOrderIDSStr += flowType == 3 ? `${newOrder.data.get("ID")},${newOrder.data.get("ID")},` : `${newOrder.data.get("ID")},`;
            newOrders.push(newOrder.data);
        }
        newOrderIDSStr = newOrderIDSStr.slice(0, -1);

        if (loads.UUID) {
            job = await JobSchema.findOne({UUID: loads.UUID});
        } else {
            job = {
                _doc: {
                    params: {
                        noTimeWindow: false,
                        cubeCalc: true,
                        loadStartTime: loads.startTime,
                        DurationMultiplier: durationMulti ? durationMulti : 1,
                        noTimeWindow : false,
                        maxStops: newOrderIdsArr.length*2,
                        oVRP: loads.return,
                        WaitingTime: 1000,
                        manualStartTime: false
                    }
                }
            }
        }
        const OrderArr = await OrderHelperClass.sendAlgoOrders({
            orders: newOrders,
            noTimeWindow: job._doc.params.noTimeWindow,
            flowType: loads.flowType
        });

        obj = {
            Execid: loads.UUID ? loads.UUID : null,
            params: {
                "LoadStartTime": loads.startTime,
                "CubeCalc": job._doc.params.cubeCalc,
                "DurationMultiplier": job._doc.params.DurationMultiplier,
                "NoTimeWindow": job._doc.params.noTimeWindow,
                "TimeRange": job._doc.params.timeRange,
                "WaitingTime": job._doc.params.waitingTime,
                "MaxStops": job._doc.params.maxStops,
                "Return": job._doc.params.oVRP ? false : true,
                "NoHos": false,
                "deliveryCalc": flowType == 2 ? true : false,
                "manualStartTime": job._doc.params.manualStartTime,
            },
            depo: loads.depo ? loads.depo._doc : null,
            Current: newOrderIDSStr.split(","),
            Shift: loads.shift._doc,
            Orders: OrderArr,
            MapServer: `${env.mapHost}${env.mapPort}/table/v1/driving/`,
            host
        };
        if(loads.equipment) {
            obj["equipment"] = [{
                "feet": loads.equipment._doc.value,
                "weight": loads.equipment._doc.maxweight,
                "cube": loads.equipment._doc.maxVolume
            }];
        }
        const stops = await AlgorithmServiceClass.timeCalculation(obj, flowType);
        const calculation = stops.data.Status !== 3
        ? {
            status: 0,
            msg: stops.data.Message
        }
        : await this.stopsFromC({
            load: stops.data.Loads[0],
            planningId: loads._id,
            warnings: stops.data.WarningTimeCalculation,
            FlowType: flowType
        });
        if (calculation.updateData) {
            this.orderEditForCalc(calculation.updateData);
        };
        return calculation;
    }

    emptymileage = async (data) => {
        let { orderIds, order } = data;
        let oids = data.load.orders;
        let arroids = orderIds.split(',');
        let lastOrder;
        let firstOrder;
        let meters = 0;
        let start = data.start;
        let end = data.end;
        let LatLon;
       if(data.load.flowType == 1){

            order.forEach(o => {
                if(o._id.toString() == arroids[0]) {  firstOrder = o; }
            });

            let dlatlon = start.Lon + "," + start.Lat;
            let olatlon = firstOrder ? firstOrder.pickupLon + "," + firstOrder.pickupLat  : '';
            LatLon = `${dlatlon};${olatlon}`;

            const distDur = await this.osrm.GetDistDur(LatLon);
            meters = distDur.data.legs[0].distance;

       } // LP2D

        if(data.load.flowType == 2){
            order.forEach(o => {
                if(o._id.toString() == arroids[arroids.length -1]) {
                    lastOrder = o;
                } else if(o._id.toString() == arroids[arroids.length -2]) {
                    lastOrder = o;
                }
            });

            let dlatlon = end.Lon + "," + end.Lat;
            let olatlon = lastOrder.deliveryLon + "," + lastOrder.deliveryLat;
            if(data.ret == 0){
                let LatLon = `${olatlon};${dlatlon}`;
                // console.log("calc",LatLon);
                const ddur = await this.osrm.GetDistDur(LatLon);
                meters = ddur.data.legs[0].distance;
            } else{
                meters = 0;
            }
        } // D2E

        if(data.load.flowType == 3){
            for (const [o, ord] of order.entries()) {
                if (order[o+1]) {
                    let dlatlon = ord.deliveryLon + "," + ord.deliveryLat;
                    let platlon = order[o+1].pickupLon + "," + order[o+1].pickupLat;
                    let LatLon = `${dlatlon};${platlon}`;
                    const ddur = await this.osrm.GetDistDur(LatLon);
                    meters += ddur.data.distance;
                }
            }
        } // E2E

       // let emptymile =  meters/1600;
       return meters;

    };

    getEmptyMileageByFlowType = async (data) => {
        let { flowType, oVRP, depo, orderList } = data;
        let lastOrder, firstOrder;
        let depoLonLat = depo && depo.status ? depo.data : null;
        let start = {}, end = {}, meters = 0;
        // LP2D
        if (flowType == 1) {
            firstOrder = orderList[0]

            let dlatlon = depoLonLat._doc.lon + "," + depoLonLat._doc.lat;
            let olatlon = firstOrder ? firstOrder.pickupLon + "," + firstOrder.pickupLat : '';
            let LatLon = `${dlatlon};${olatlon}`;
            const distDur = await this.osrm.GetDistDur(LatLon);
            meters = distDur.data.legs[0].distance;
            start = {
                Lat: depoLonLat._doc.lat,
                Lon: depoLonLat._doc.lon
            }
            end = {
                Lat: depoLonLat._doc.lat,
                Lon: depoLonLat._doc.lon
            }
        }
        // D2E
        if (flowType == 2) {
            lastOrder = orderList[orderList.length-1]
            let dlatlon = depoLonLat._doc.lon + "," + depoLonLat._doc.lat;
            let olatlon = lastOrder.deliveryLon + "," + lastOrder.deliveryLat;
            start = {
                Lat: depoLonLat._doc.lat,
                Lon: depoLonLat._doc.lon
            }
            if(oVRP == 0){
                let LatLon = `${olatlon};${dlatlon}`;
                // console.log("calc",LatLon);
                const ddur = await this.osrm.GetDistDur(LatLon);
                meters = ddur.data.distance;
                end = {
                    Lat: depoLonLat._doc.lat,
                    Lon: depoLonLat._doc.lon
                }
            } else {
                meters = 0;
                end = {
                    Lat: lastOrder.deliveryLat,
                    Lon: lastOrder.deliveryLon
                }
            }
        }
        if (flowType == 3) {
            lastOrder = orderList[orderList.length-1];
            firstOrder = orderList[0];
            start = {
                Lat: firstOrder.pickupLat,
                Lon: firstOrder.pickupLon
            };
            end = {
                Lat: lastOrder.deliveryLat,
                Lon: lastOrder.deliveryLon
            };
            for (const [o, order] of orderList.entries()) {
                if (orderList[o+1]) {
                    let dlatlon = order.deliveryLon + "," + order.deliveryLat;
                    let platlon = orderList[o+1].pickupLon + "," + orderList[o+1].pickupLat;
                    let LatLon = `${dlatlon};${platlon}`;
                    const ddur = await this.osrm.GetDistDur(LatLon);
                    meters += ddur.data.distance;
                }
            }
        }
        return { meters, start, end };
    }

};
module.exports = Calculations;