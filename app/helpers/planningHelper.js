const env = process.env.SERVER == "local" ? require("../config/env.local") : require("../config/env");
const moment = require("moment");
const uuIdv1 = require("uuid/v1");

// Helpers
const OrderHelper = require("./orderHelpers");
const OrderHelperClass = new OrderHelper();
// Service
const GeneralService = require("../main_classes/general.service");
// Models
const OrdersSchema = require("../newModels/ordersModel");
const DepotSchema = require("../newModels/depoModel");
const ShiftSchema = require("../newModels/shiftModel");
const TransportTypeSchema = require("../newModels/transportTypeModel");
const EquipmentsSchema = require("../newModels/equipmentModel");
const PlanningSchema = require("../newModels/planningModel");
class PlanningHelper extends GeneralService {

    constructor(params) {
        super()
    }

    joinLatLon = async (points) => {
        points.slice(0, -1);
        const arr = [];
        const str = points.split(";");
        let strlast = str[str.length - 1];
        // let newStr = "";

        for (let i = 0; i < str.length; i++) {

            if (!arr.includes(str[i]) && str[i] !== "" || (arr.includes(str[i]) && str[i] != str[i - 1])) {
                arr.push(str[i]);
            }
        }
        if (arr[arr.length - 1] != strlast) {
            arr.push(strlast);
        }

        return arr.join(";");
    }
    getLatLon = async (loadTemp, orders) => {
        let { depot, flowType, ret} = loadTemp;
        let depoLat, depoLon;
        if (depot && depot.status) {
            depoLat = depot.data._doc.lat;
            depoLon = depot.data._doc.lon;
        } else if (depot && depot._doc) {
            depoLat = depot._doc.lat;
            depoLon = depot._doc.lon;
        }
        let points = "";
        let newPoints;
        if (flowType == 2) {
            points += depoLon && depoLat ? `${depoLon},${depoLat};` : '';
            for (const order of orders) {
                points += order.deliveryLon && order.deliveryLat ? `${order.deliveryLon},${order.deliveryLat};` : '';
            }
            newPoints = await this.joinLatLon(points);
            if (ret == 0) {
                newPoints += depoLon && depoLat ?  `${depoLon},${depoLat};` : '';
            }
        } else if (flowType == 1) {
            points += depoLon && depoLat ?  `${depoLon},${depoLat};` : '';
            for (const order of orders) {
                points += order.pickupLon && order.pickupLat && order ? `${order.pickupLon},${order.pickupLat};` : '';
            }
            newPoints = await this.joinLatLon(points);
            newPoints += depoLon && depoLat ? `${depoLon},${depoLat};` : '';
        } else if (flowType == 3) {
            for (const order of orders) {
                points += `${order.pickupLon},${order.pickupLat};${order.deliveryLon},${order.deliveryLat};`;
            }
            newPoints = await this.joinLatLon(points);
        }
        // else if (flowType == 4) {
        //     points += `${depoLon},${depoLat};`;
        //     points += `${lastDepo.lon},${lastDepo.lat};`;
        // } else if (flowType == 6) {
        //     points += `${lastDepo.lon},${lastDepo.lat};`;
        //     points += `${port.lon},${port.lat};`;
        // } else if (flowType == 7) {
        //     points += `${port.lon},${port.lat};`;
        //     points += `${lastPort.lon},${lastPort.lat};`;
        // } else if (flowType == 8) {
        //     points += `${port.lon},${port.lat};`;
        //     points += `${depoLon},${depoLat};`;
        // }
        return newPoints;
    };
    checkingByFlowType = async (data) => {
        let endOrderAddress, start, end, startAddress;
        let { depot, sortOrders, ret, flowType, time, orderTimeWindow, wai, distTime, l } = data;
        let { dateTime, loadId, order, wobj, startTime, maxShift } = data;
        let { lateETA, overTime, departTime } = data;

        depot = depot && depot.data ? depot : depot ? depot.data = depot : null;

        start = depot && depot.status ? {
            Lat: depot.data._doc.lat,
            Lon: depot.data._doc.lon,
        } : null;
        if (flowType == 2) {
            endOrderAddress = sortOrders ? sortOrders[sortOrders.length-1].delivery : null;

            end = depot && sortOrders ? ret == 0 ? {
                Lat: depot.data._doc.lat,
                Lon: depot.data._doc.lon,
            } : {
                Lat: sortOrders[sortOrders.length-1].deliveryLat,
                Lon: sortOrders[sortOrders.length-1].deliveryLon,
            } : null;

            if (orderTimeWindow && time < new Date(orderTimeWindow.deliveryFrom).getTime()) {
                wai = new Date(orderTimeWindow.deliveryFrom).getTime()-time;
                time += wai;
                distTime += (wai/1000);
            }
            if (loadId && dateTime > new Date(orderTimeWindow.deliveryTo).getTime()) {
                console.log("loadId: ", loadId, "orderId: ", order._id, "warning: ", lateETA.data._doc.name);
                wobj.push({ orderId: order._id, status: lateETA.data._doc });
            } else if (loadId && (startTime + maxShift) < new Date(orderTimeWindow.deliveryFrom).getTime()) {
                console.log("loadId: ", loadId, "orderId: ", order._id, "warning: ", overTime.data._doc.name);
                wobj.push({ orderId: order._id, status: overTime.data._doc });
            } else if (loadId && dateTime + (order.servicetime*1000) > (new Date(orderTimeWindow.deliveryTo).getTime() + 180000)) {
                console.log("loadId: ", loadId, "orderId: ", order._id, "warning: ", departTime.data._doc.name);
                wobj.push({ orderId: order._id, status: departTime.data._doc });
            }
        }
        if (flowType == 1) {
            endOrderAddress = sortOrders ? sortOrders[sortOrders.length-1].pickup : null;

            end = depot && sortOrders ? {
                Lat: depot.data._doc.lat,
                Lon: depot.data._doc.lon,
            } : null;

            if (orderTimeWindow && time < new Date(orderTimeWindow.pickupFrom).getTime()) {
                wai = new Date(orderTimeWindow.pickupFrom).getTime()-time;
                time += wai;
                distTime += (wai/1000);
            };

            if (loadId && dateTime > new Date(orderTimeWindow.pickupTo).getTime()) {
                console.log("loadId: ", loadId, "orderId: ", order._id, "warning: ", lateETA.data._doc.name);
                wobj.push({ orderId: order._id, status: lateETA.data._doc });
            } else if (loadId && (startTime + maxShift) < new Date(orderTimeWindow.pickupFrom).getTime()) {
                console.log("loadId: ", loadId, "orderId: ", order._id, "warning: ", overTime.data._doc.name);
                wobj.push({ orderId: order._id, status: overTime.data._doc });
            } else if (loadId && dateTime + (order.servicetime*1000) > (new Date(orderTimeWindow.pickupTo).getTime() + 180000)) {
                console.log("loadId: ", loadId, "orderId: ", order._id, "warning: ", departTime.data._doc.name);
                wobj.push({ orderId: order._id, status: departTime.data._doc });
            }
        }

        if (flowType == 3) {
            start = sortOrders ? {
                Lat: sortOrders[0].pickupLat,
                Lon: sortOrders[0].pickupLon,
            } : null;
            startAddress = sortOrders ? sortOrders[0].pickup : null;
            endOrderAddress = sortOrders ? sortOrders[sortOrders.length-1].delivery : null;

            end = sortOrders ? {
                Lat: sortOrders[sortOrders.length-1].deliveryLat,
                Lon: sortOrders[sortOrders.length-1].deliveryLon,
            } : null;
            if (l % 2 == 0) {
                if (orderTimeWindow && time < new Date(orderTimeWindow.deliveryFrom).getTime()) {
                    wai = new Date(orderTimeWindow.deliveryFrom).getTime()-time;
                    time += wai;
                    distTime += (wai/1000);
                }
                if (loadId && dateTime > new Date(orderTimeWindow.deliveryTo).getTime()) {
                    console.log("loadId: ", loadId, "orderId: ", order._id, "warning: ", lateETA.data._doc.name);
                    wobj.push({ orderId: order._id, status: lateETA.data._doc });
                } else if (loadId && (startTime + maxShift) < new Date(orderTimeWindow.deliveryFrom).getTime()) {
                    console.log("loadId: ", loadId, "orderId: ", order._id, "warning: ", overTime.data._doc.name);
                    wobj.push({ orderId: order._id, status: overTime.data._doc });
                } else if (loadId && dateTime + (order.servicetime*1000) > (new Date(orderTimeWindow.deliveryTo).getTime() + 180000)) {
                    console.log("loadId: ", loadId, "orderId: ", order._id, "warning: ", departTime.data._doc.name);
                    wobj.push({ orderId: order._id, status: departTime.data._doc });
                }
            } else {
                if (orderTimeWindow && time < new Date(orderTimeWindow.pickupFrom).getTime()) {
                    wai = new Date(orderTimeWindow.pickupFrom).getTime()-time;
                    time += wai;
                    distTime += (wai/1000);
                };

                if (loadId && dateTime > new Date(orderTimeWindow.pickupTo).getTime()) {
                    console.log("loadId: ", loadId, "orderId: ", order._id, "warning: ", lateETA.data._doc.name);
                    wobj.push({ orderId: order._id, status: lateETA.data._doc });
                } else if (loadId && (startTime + maxShift) < new Date(orderTimeWindow.pickupFrom).getTime()) {
                    console.log("loadId: ", loadId, "orderId: ", order._id, "warning: ", overTime.data._doc.name);
                    wobj.push({ orderId: order._id, status: overTime.data._doc });
                } else if (loadId && dateTime + (order.servicetime*1000) > (new Date(orderTimeWindow.pickupTo).getTime() + 180000)) {
                    console.log("loadId: ", loadId, "orderId: ", order._id, "warning: ", departTime.data._doc.name);
                    wobj.push({ orderId: order._id, status: departTime.data._doc });
                }
            }
        }
        return {
            endOrderAddress, startAddress,
            start, end,
            wai, time, distTime,
            wobj
        }
    };

    timeInfoByFlowType = async (datas, orderTimeWindow) => {
        let timeInfo = {
            id: 0,
            waiting: 0,
            arTime: null,
            leaveTime: null,
            eta: null,
            ata: null
        }, obj = {}, arr = [];
        let { flowType, allleg, tEta, loadId, duration, shiftVal, recharge, brTime, rest, shiftName, i } = datas;
        let waiting = 0, arTime = null, leaveTime = null, servicetime, ata = null, wait = 0, rech = false, restBool = false;
        if (flowType == 2) {
            servicetime = allleg.servicetime ? allleg.servicetime : 0;
            if (tEta < new Date(orderTimeWindow.deliveryFrom).getTime() && shiftName != 'Team shift') {
                waiting = new Date(orderTimeWindow.deliveryFrom).getTime() - tEta;
                if (duration > (brTime*1000) && duration + waiting >= (shiftVal*1000)) {
                    wait = ((shiftVal * 1000) - duration);
                    rech = true;
                } else if (duration < (brTime*1000) && duration + waiting >= (shiftVal*1000)) {
                    wait = ((shiftVal * 1000) - (duration + (rest*1000)));
                    restBool = true;
                    rech = true;
                } else {
                    wait = waiting;
                }
                arTime = tEta + wait + (rech ? (recharge*1000) : 0) + (restBool ? (rest*1000) : 0);
                leaveTime = arTime + (allleg.servicetime*1000);
                ata = allleg.timeInfo && allleg.timeInfo.loads && allleg.timeInfo.loads[loadId] && allleg.timeInfo.loads[loadId].ata ? allleg.timeInfo.loads[loadId].ata : null;
            } else if (tEta < new Date(orderTimeWindow.deliveryFrom).getTime() && shiftName == 'Team shift') {
                waiting = new Date(orderTimeWindow.deliveryFrom).getTime() - tEta;
                wait = waiting;
                arTime = tEta + waiting;
                leaveTime = arTime + (allleg.servicetime*1000);
                ata = allleg.timeInfo && allleg.timeInfo.loads && allleg.timeInfo.loads[loadId] && allleg.timeInfo.loads[loadId].ata ? allleg.timeInfo.loads[loadId].ata : null;
            } else if (tEta >= new Date(orderTimeWindow.deliveryFrom).getTime()) {
                waiting = 0;
                arTime = tEta;
                leaveTime = tEta + (servicetime*1000);
                ata = allleg.timeInfo && allleg.timeInfo.loads && allleg.timeInfo.loads[loadId] && allleg.timeInfo.loads[loadId].ata ? allleg.timeInfo.loads[loadId].ata : null;
            }
        }
        if (flowType == 1) {
            servicetime = allleg.servicetime ? allleg.servicetime : 0;
            if (tEta < new Date(orderTimeWindow.pickupFrom).getTime() && shiftName != 'Team shift') {
                waiting = new Date(orderTimeWindow.pickupFrom).getTime() - tEta;
                if (duration + waiting >= (shiftVal*1000)) {
                    wait = ((shiftVal * 1000) - duration);
                    rech = true;
                } else {
                    wait = waiting;
                }
                arTime = tEta + wait + rech ? (recharge*1000) : 0;
                leaveTime = arTime + (allleg.servicetime*1000);
                ata = allleg.timeInfo && allleg.timeInfo.loads && allleg.timeInfo.loads[loadId] && allleg.timeInfo.loads[loadId].ata ? allleg.timeInfo.loads[loadId].ata : null;
            } else if (tEta < new Date(orderTimeWindow.pickupFrom).getTime() && shiftName == 'Team shift') {
                waiting = new Date(orderTimeWindow.pickupFrom).getTime() - tEta;
                wait = waiting;
                arTime = tEta + waiting;
                leaveTime = arTime + (allleg.servicetime*1000);
                ata = allleg.timeInfo && allleg.timeInfo.loads && allleg.timeInfo.loads[loadId] && allleg.timeInfo.loads[loadId].ata ? allleg.timeInfo.loads[loadId].ata : null;
            } else if (tEta >= new Date(orderTimeWindow.pickupFrom).getTime()) {
                waiting = 0;
                arTime = tEta;
                leaveTime = tEta + (servicetime*1000);
                ata = allleg.timeInfo && allleg.timeInfo.loads && allleg.timeInfo.loads[loadId] && allleg.timeInfo.loads[loadId].ata ? allleg.timeInfo.loads[loadId].ata : null;
            }
        }

        if (flowType == 3) {
            servicetime = allleg.servicetime ? allleg.servicetime : 0;
            if (i % 2 == 0) {
                if (tEta < new Date(orderTimeWindow.deliveryFrom).getTime() && shiftName != 'Team shift') {
                    waiting = new Date(orderTimeWindow.deliveryFrom).getTime() - tEta;
                    if (duration > (brTime*1000) && duration + waiting >= (shiftVal*1000)) {
                        wait = ((shiftVal * 1000) - duration);
                        rech = true;
                    } else if (duration < (brTime*1000) && duration + waiting >= (shiftVal*1000)) {
                        wait = ((shiftVal * 1000) - (duration + (rest*1000)));
                        restBool = true;
                        rech = true;
                    } else {
                        wait = waiting;
                    }
                    arTime = tEta + wait + (rech ? (recharge*1000) : 0) + (restBool ? (rest*1000) : 0);
                    leaveTime = arTime + (allleg.servicetime*1000);
                    ata = allleg.timeInfo && allleg.timeInfo.loads && allleg.timeInfo.loads[loadId] && allleg.timeInfo.loads[loadId].ata ? allleg.timeInfo.loads[loadId].ata : null;
                } else if (tEta < new Date(orderTimeWindow.deliveryFrom).getTime() && shiftName == 'Team shift') {
                    waiting = new Date(orderTimeWindow.deliveryFrom).getTime() - tEta;
                    wait = waiting;
                    arTime = tEta + waiting;
                    leaveTime = arTime + (allleg.servicetime*1000);
                    ata = allleg.timeInfo && allleg.timeInfo.loads && allleg.timeInfo.loads[loadId] && allleg.timeInfo.loads[loadId].ata ? allleg.timeInfo.loads[loadId].ata : null;
                } else if (tEta >= new Date(orderTimeWindow.deliveryFrom).getTime()) {
                    waiting = 0;
                    arTime = tEta;
                    leaveTime = tEta + (servicetime*1000);
                    ata = allleg.timeInfo && allleg.timeInfo.loads && allleg.timeInfo.loads[loadId] && allleg.timeInfo.loads[loadId].ata ? allleg.timeInfo.loads[loadId].ata : null;
                }
            } else {
                if (tEta < new Date(orderTimeWindow.pickupFrom).getTime() && shiftName != 'Team shift') {
                    waiting = new Date(orderTimeWindow.pickupFrom).getTime() - tEta;
                    if (duration + waiting >= (shiftVal*1000)) {
                        wait = ((shiftVal * 1000) - duration);
                        rech = true;
                    } else {
                        wait = waiting;
                    }
                    arTime = tEta + wait + rech ? (recharge*1000) : 0;
                    leaveTime = arTime + (allleg.servicetime*1000);
                    ata = allleg.timeInfo && allleg.timeInfo.loads && allleg.timeInfo.loads[loadId] && allleg.timeInfo.loads[loadId].ata ? allleg.timeInfo.loads[loadId].ata : null;
                } else if (tEta < new Date(orderTimeWindow.pickupFrom).getTime() && shiftName == 'Team shift') {
                    waiting = new Date(orderTimeWindow.pickupFrom).getTime() - tEta;
                    wait = waiting;
                    arTime = tEta + waiting;
                    leaveTime = arTime + (allleg.servicetime*1000);
                    ata = allleg.timeInfo && allleg.timeInfo.loads && allleg.timeInfo.loads[loadId] && allleg.timeInfo.loads[loadId].ata ? allleg.timeInfo.loads[loadId].ata : null;
                } else if (tEta >= new Date(orderTimeWindow.pickupFrom).getTime()) {
                    waiting = 0;
                    arTime = tEta;
                    leaveTime = tEta + (servicetime*1000);
                    ata = allleg.timeInfo && allleg.timeInfo.loads && allleg.timeInfo.loads[loadId] && allleg.timeInfo.loads[loadId].ata ? allleg.timeInfo.loads[loadId].ata : null;
                }
            }
            
        }

        timeInfo.waiting = wait/1000;
        timeInfo.arTime = moment.utc(arTime, "x").format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z";
        timeInfo.leaveTime = moment.utc(leaveTime, "x").format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z";
        timeInfo.eta = moment.utc(tEta, "x").format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z";
        timeInfo.id = loadId;
        timeInfo.ata = ata;
        obj[loadId] = timeInfo;
        arr.push({
            ...timeInfo
        });
        wait = 0;
        return { arr, obj, info: { tEta, arTime, leaveTime } };
    }
    generatePlanningModel = async (data) => {
        let {
            orders, nickname, equipmentName,
            cube, feet, weight, comment, flowType,
            startTime, depot, driver, ret,
            startAddress, endOrderAddress, feelRates, permileRates, pieceTotalQuantity, planType,
            start, end, totalDistance, user, loadType, depotType, ordersCount
        } = data;
        depot = depot && depot.status ? depot : null;
        const orderIds = typeof(orders) === 'string' ? orders.split(",") : orders;
        let newOrderIds = [];
        if (flowType == 3) {
            orderIds.forEach(order => {
                newOrderIds.push(order, order)
            });
        } else {
            orderIds.forEach(order => {
                newOrderIds.push(order)
            });
        }
        let planningObj = {
            nickname: nickname,
            equipment: equipmentName,
            // carrierId: 27,
            driver: driver._id,
            depo: depot && depot.status ? depot.data._doc._id : null,
            shift: driver ? driver.shift : null,
            flowType: flowType,
            startAddress: startAddress,
            endAddress: !ret ? depot && depot.status ? depot.data._doc.address : null : endOrderAddress,
            start,
            end,
            weight: weight,
            feet: feet,
            freezed: 0,
            startTime: startTime,
            comment: comment,
            cube: cube,
            feelRates: feelRates,
            permileRates: permileRates,
            pieceTotalQuantity: pieceTotalQuantity,
            return: ret,
            planType: planType,
            disabled: 0,
            totalDistance,
            user,
            loadType,
            depotType,
            ordersCount
        }
        return planningObj;
    };

    changed = async (data) => {
        try {
            let { table, user, type, loadId, object } = data, one, changed;
            one = await table.findOne({ _id: loadId });
            changed = one && one._doc.changed && Array.isArray(one._doc.changed) ? one._doc.changed : [];
            changed.push({
                change: true,
                user: {
                    id: user._id,
                    username: user.username
                },
                changeTime: new Date(Date.now()),
                type
            });
            let rest = await table.findOneAndUpdate({
                _id: loadId
            }, {
                ...object,
                changed
            }, {new: true});
            return rest;
        } catch (error) {
            console.log(error);
        }
    };

    getAddressByFlowType = async (flowType, ret, depo, orderList) => {
        let address = {};
        address.startAddress = "";
        address.endAddress = "";
        let depot = depo && depo.status ? depo.data : null;
        if (flowType == 1) {
            address.startAddress = depot._doc.address;
            address.endAddress = depot._doc.address;
        } else if (flowType == 2 && ret == 0) {
            address.startAddress = depot._doc.address;
            address.endAddress = depot._doc.address;
        } else if (flowType == 2 && ret == 1) {
            let data = orderList[orderList.length - 1];
            address.endAddress = `${data.deliveryStreetAddress}, ${data.deliveryCity || ``}, ${data.deliveryZip || ``}, ${data.deliveryCountry}`;
            for (const item in data) {
                if (data[item] && (item == "deliveryStreetAddress" || item == "deliveryCity" || item == "deliveryZip" || item == "deliveryCountry")) {
                    address.endAddress += `${data[item]}, `;
                }
            }
            address.startAddress = depot._doc.address;
        } else if (flowType == 3) {
            let endData = orderList[orderList.length - 1];
            let startData = orderList[0];
            address.endAddress = `${endData.deliveryStreetAddress}, ${endData.deliveryCity || ``}, ${endData.deliveryZip || ``}, ${endData.deliveryCountry}`;
            address.startAddress = `${startData.pickupStreetAddress}, ${startData.pickupCity || ``}, ${startData.pickupZip || ``}, ${startData.pickupCountry}`;
        }
        return address;
    };

    getDepotTypeByFlowType = async (data) => {
        let { flowType, depotType } = data;
        let type = null;
        if (flowType == 1) {
            type = 1
        }
        if (flowType == 2) {
            type = 0
        }
        if (flowType == 3) {
            type = depotType
        }
        return type
    }

    getEquipmentAttributesForPlanning = () => {
        const attributes = "name type value eqType createdAt maxVolume maxweight updatedAt valueUnit horsePower trailerType externalWidth internalWidth externalHeight externalLength internalHeight internalLength";
        return attributes;
    };

    getSingleLoadSequence = async (obj) => {
        let { data, load, job, user, timezone, host } = obj;
        let { noTimeWindow } = data.body;
        let { orders, depo, UUID, carTypes, shift, startTime, flowType, _id, confirmed, loadType, equipment } = load;
        if (!UUID) { UUID = uuIdv1(); };
        const [depot, transportType, PostServer, selectedOrders, ordersData, equipmentData] = await Promise.all([
            depo ? DepotSchema.findById(depo) : null,
            TransportTypeSchema.findById(loadType),
            this.getRemoteInfoForKey(data),
            OrderHelperClass.getIDby_id({
                ids: orders
            }),
            OrdersSchema.find({
                _id: {
                    $in: orders
                }
            }).populate("locations").populate("loadtype").populate("depo").populate("products").populate("status"),
            equipment ? EquipmentsSchema.findById(equipment) : null
        ])
        const loadTypeName = transportType.get("name");
        let DepotLocation = {};
        if (depot) {
            DepotLocation = {
                lat: depot._doc.lat,
                lon: depot._doc.lon
            }
        }
        const equipmentArr = equipmentData ? [
            {
                "carCount": "1",
                "feet": equipmentData.value,
                "weight": equipmentData.maxweight,
                "cube": equipmentData.maxVolume
            }
        ] : null;
        const shiftData = shift ? await ShiftSchema.findById(shift) : null;
        let shiftObj = {};
        if (shiftData) {
            shiftObj = {
                "shift": shiftData._doc.shift,
                "break_time": shiftData._doc.break_time,
                "max_shift": shiftData._doc.max_shift,
                "rest": shiftData._doc.rest,
                "recharge": shiftData._doc.recharge,
                "drivingtime": shiftData._doc.drivingtime
            };
        };
        const date = moment.utc(startTime).format("YYYY-MM-DD");
        let maxStops = orders.length, timeLimit = 60, oVRP = load.return;
        let dryRun = false, loadMinimize = true, singleRouteCalc = true;
        const MapUrl = env.mapHost + env.mapPort + "/table/v1/driving/";
        let firstSequence = null;
        let jobParams = {
            params: {
                noTimeWindow: false,
                DurationMultiplier: 1,
                IterationMultiplier: 1,
                timeRange: Number.MAX_VALUE,
                waitingTime: Number.MAX_VALUE,
                manualStartTime: false,
                timeOptimization: false,
            }
        };
        if (job && job._doc.defaultStructure) {
            job._doc.defaultStructure.filter(x => {
                if(x.loadId.toString() == load._id.toString()) {
                    firstSequence = x.orders;
                }
            })
            jobParams = job.get("params");
        }
        console.log(jobParams);

        firstSequence = await OrderHelperClass.getIDby_id({
            ids: firstSequence
        });

        const OrderArr = await OrderHelperClass.sendAlgoOrders({
            orders: ordersData,
            noTimeWindow,
            flowType
        });
        let dataForSeq = {
            "execid": UUID,
            "PostServer": `${PostServer.host}/planning/sequence`,
            "ErrorServer": `${PostServer.host}/planning/engine/error`,
            "algorithm": loadTypeName == "TL" ? "PdpSeqTL" : flowType == 3 ? "PdpSeqLTL" : "VRP",
            "MapServer": MapUrl,
            "params": {
                "date": date,
                "loadStartTime": startTime,
                "depoId": depo,
                "flowType": flowType,
                "maxStops": maxStops,
                "timeLimit": timeLimit,
                "selectedOrders": selectedOrders,
                "PreliminaryResultLoad": firstSequence,
                "oVRP": oVRP,
                "shiftId": shift,
                "dryRun": dryRun,
                "loadMinimize": loadMinimize,
                "singleRouteCalc": singleRouteCalc,
                "seqMode": true,
                "noTimeWindow": jobParams.noTimeWindow,
                "DurationMultiplier": jobParams.DurationMultiplier,
                "IterationMultiplier": jobParams.IterationMultiplier,
                "timeRange": +jobParams.timeRange,
                "waitingTime": +jobParams.waitingTime,
                "manualStartTime": jobParams.manualStartTime,
                "timeOptimization": jobParams.timeOptimization,
                "ftl": loadTypeName == "TL" ? true : false
            },
            "depo": DepotLocation,
            "shift": shiftObj,
            "Returnees": JSON.stringify({
                loadId: _id.toString(),
                user,
                timezone,
                orders,
                startTime,
                ret: load.return,
                depotId: depo,
                shiftId: shift,
                confirmed,
                host,
                sequence: true
            }),
            "Orders": OrderArr,
        };
        if (equipmentArr) {
            dataForSeq["equipment"] = equipmentArr;
        }
        return dataForSeq;
    };
    changeIDTo_id = async (data) => {
        let { orderIDS } = data;
        const idsArr = await OrderHelperClass.getIDby_id({orderIDS});
        return idsArr;
    };

    generateCarTypes = async (data) => {
        let { compEquip, equip } = data;
        let assets = compEquip && compEquip._doc ? compEquip._doc : {};
        let equipment = equip && equip._doc ? equip._doc : {};
        const carTypes = {
            ...assets,
            ...equipment
        };
        return carTypes;
    };

    changeForCalc = async (data, flowType) => {
        const {id, loadData, changed } = data;
        let obj = {
            stopLocations: loadData.allStops,
            status: loadData.statusId,
            busy: 0,
            warning: loadData.warning,
            warningData: loadData.warningsArr,
            totalDuration: loadData.totalDuration,
            orders: loadData.orderIds,
            stops: loadData.stops,
            Deadhead: loadData.Deadhead,
            totalDistance: loadData.totalDistance,
            warningMessage: loadData.warningMessage
        };
        if (changed) {
            obj["$push"] = changed
        }
        if(flowType == 3) {
            obj["ordersCount"] = loadData.orderIds.length/2;
        } else {
            obj["ordersCount"] = loadData.orderIds.length;
        }
        const load = await PlanningSchema.findByIdAndUpdate(id, obj, {new: true}).populate(["orders", "depo"]).catch(err => {
            console.log(`changeForCalc: ${err.message}`)
        });
        return load;
    }
}

module.exports = PlanningHelper;