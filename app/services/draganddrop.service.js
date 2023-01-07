const OrderSchema = require('../newModels/ordersModel');
const PlanningSchema = require('../newModels/planningModel');
const BaseService = require('../main_classes/base.service');
const PlanningHelper = require('../helpers/planningHelper');
const OSmapService = require('../services/osmap.service');
const CalculationService = require('../services/calculation.service');
const GeneralHelper = require("../main_classes/general.service");
const GeneralHelperClass = new GeneralHelper();

module.exports = class DragAndDropHelperService extends BaseService {

    get helper () { return new PlanningHelper() };
    get OSmap () { return new OSmapService() };
    get Calc () { return new CalculationService() };

    addOrderFromLoad = async (data) => {
        let returnObject = -1, orderId = '';
        const { load, orders, depo, user } = data;
        let { flowType } = load;
        let weight = 0,
            cube = 0,
            feet = 0,
            rate = 0, permileRates = 0, pieceTotalQuantity = 0;
        for (const order of orders) {
            orderId += flowType == 3 ? `${order._id.toString()},${order._id.toString()},` : `${order._id.toString()},`;
            cube += +order.cube ? +order.cube : 0;
            weight += +order.weight ? +order.weight : 0;
            feet += +order.feet ? +order.feet : 0;
            rate += +order.rate ? +order.rate : 0;
            permileRates += +order.permileRate ? +order.permileRate : 0;
            pieceTotalQuantity += +order.pieceCount ? +order.pieceCount : 0
        }

        let loadId = load._id,
        odistance,
        oduration,
        oldids = 0,
        newids;

        if (!load.orders) {
            newids = orderId;
        } else {
            oldids = load.orders;
            newids = load.orders.join(",") + ',' + orderId;
        }
        newids = newids.slice(0, -1);
        orderId = orderId.slice(0, -1);

        const oldOrderList = await OrderSchema.find({ _id: { $in: oldids } });

        if (!oldOrderList.length) return this.getResponse(0, 'Fail to fetch old orders id list');

        const getLatLonBody = {
            depot: load.depo,
            flowType: load.flowType,
            ret: load.return
        };

        const oldpoints = await this.helper.getLatLon(getLatLonBody, oldOrderList);

        const dt = await this.OSmap.GetDistDur(oldpoints);

        odistance = dt.data.distance;
        oduration = dt.data.duration;

        const news = await OrderSchema.find({ _id: { $in: newids.split(',') } });

        if (!news.length) return this.getResponse(0, 'Fail to fetch new orders id list');
        // indexing Orders
        let indexing = await GeneralHelperClass.indexingArr(newids.split(","))
        const sortOrders = await GeneralHelperClass.sortArray(indexing, news)

        const newpoints = await this.helper.getLatLon(getLatLonBody, sortOrders);
        const dtd = await this.OSmap.GetDistDur(newpoints);

        let start = {}, end = {}, endAddress;

        if (flowType == 1) {
            start.Lat = depo.lat;
            start.Lon = depo.lon;
            end.Lat = depo.lat;
            end.Lon = depo.lon;
            endAddress = depo.address;
        } else if (flowType == 2) {
            start.Lat = depo.lat;
            start.Lon = depo.lon;
            if(load.return == 1) {
                end.Lat = sortOrders[sortOrders.length -1].deliveryLat;
                end.Lon = sortOrders[sortOrders.length -1].deliveryLon;
                endAddress = sortOrders[sortOrders.length -1].delivery;
            } else {
                end.Lat = depo.lat;
                end.Lon = depo.lon;
                endAddress = depo.address;
            }
        }

        let emptymile = 0;

        if(load.flowType == 2 || load.flowType == 1 || load.flowType == 3){
            emptymile = await this.Calc.emptymileage({
                load,
                order: sortOrders,
                orderIds: newids,
                start,
                end,
                ret: load.return
            });
        }

        if (dtd.status) {
            let updateObj = {
                _id: loadId,
                end: end,
                endAddress,
                orders: newids.split(','),
                stops: news.length,
                ordersCount: flowType == 3 ? newids.split(',').length/2 : newids.split(',').length,
                totalDistance: dtd.data.distance,
                weight: load.weight + weight,
                cube: load.cube + cube,
                feet: load.feet + feet,
                feelRates: load.feelRates + rate,
                permileRates: load.permileRates + permileRates,
                pieceTotalQuantity: load.pieceTotalQuantity + pieceTotalQuantity,
                emptymile: emptymile ? emptymile : 0,
                busy: 1,
                $push: {
                    changed: {
                        change: true,
                        user: {
                            id: user._id,
                            username: user.username
                        },
                        changeTime: new Date(Date.now()),
                        type: "addOrderFromLoad"
                    }
                }
            };

            const oids = orderId.split(',');

            const newLoad = await PlanningSchema.findById(loadId);
            // newLoad.orders = [];

            // if (newLoad.orders && newLoad.orders.length > 0) {
            //     let oids = newLoad.orders;
            //     orders.forEach(o => {
            //         oids.forEach(oid => {
            //             if (o._id == oid) {
            //                 newLoad.orders.push(o);
            //             }
            //         });
            //     });
            // }
            // returnObject = {
            //     status: 1,
            //     msg: 'ok',
            //     "Old Distance": odistance,
            //     "Old Duration": oduration,
            //     "New Distance": dtd.data.distance,
            //     "New Duration": dtd.data.duration,
            //     newLoad
            // };
            returnObject = updateObj
        }

        return this.getResponse(1, "ok", returnObject);
    };

    emptymileage = async (data, osrm) => {

        let { orderIds } = data;
        let oids = data.load.orders;
        let arroids = orderIds;
        let lastOrder;
        let firstOrder;
        let meters;
        let start = data.start;
        let end = data.end;
       if(data.load.flowType == 1){

            data.order.forEach(o => {
                if(o.id == arroids[0]) {  firstOrder = o; }
            });

            let dlatlon = start.Lat + "," + start.Lon;
            let olatlon = firstOrder ? firstOrder.pickupLat + "," + firstOrder.pickupLon : '';
            let LatLon = `${dlatlon};${olatlon}`;

            const distDur = await this.OSmap.GetDistDur(LatLon+LatLon);
            console.log(distDur);
            meters = distDur.data.legs[0].distance;

       } // LP2D

        if(data.load.flowType == 2){
            data.order.forEach(o => {
                if(o.id == arroids[arroids.length -1]) {
                    lastOrder = o;
                } else if(o.id == arroids[arroids.length -2]) {
                    lastOrder = o;
                }
            });

            let dlatlon = end.Lat + "," + end.Lon;
            let olatlon = lastOrder.deliveryLat + "," + lastOrder.deliveryLon;
            if(data.ret == 0){
                let LatLon = `${olatlon};${dlatlon}`;
                // console.log("calc",LatLon);
                const distDur = await osrm.GetDistDur(LatLon);
                meters = distDur.data.legs[0].distance;
            } else{
                meters = 0;
            }
       } // D2E
       
       // let emptymile =  meters/1600;
       return meters;

    };


    calculationForLoadTemp = async (data) => {
        let loadTemps, newLoadTemps, { arr, host, settings } = data, orders, result = {};
        loadTemps = await PlanningSchema.find({ _id: { $in: arr } }).populate('shift').populate({
            path: 'orders',
            populate: ["status", "locations"]
        }).populate(['depo', 'loadType', 'equipment']);
        for (const loadTemp of loadTemps) {
            orders = loadTemp.orders;
            let newOrderIds = [];
            orders.map(order => {
                newOrderIds.push(order._id.toString())
            })
            if (orders) {
                const getLatLonBody = {
                    depot: loadTemp.depo,
                    flowType: loadTemp.flowType,
                    ret: loadTemp.return
                };
                const oldpoints = await this.helper.getLatLon(getLatLonBody, loadTemp.orders);
                const orderMapInfo = await this.OSmap.GetDistDur(oldpoints);
                let calcModel;
                calcModel = await this.Calc.calcByC({
                    newOrderIdsArr: newOrderIds,
                    loads: loadTemp,
                    flowType: loadTemp.flowType,
                    host,
                    settings
                })
                result[loadTemp._id.toString()] = calcModel;
            }
        }
        return {result};
    };

    removeOrderFromLoadTemp = async (data, map) => {
        const { ordersIdsArr, load, user, previousOrderIds } = data;
        const orders = data.orders;
        let deletedLoads = [];
        let weight = 0, cube = 0, feet = 0, rate = 0, OIds = [], pieceTotalQuantity = 0;
        if (orders && orders.length) {
            for (const order of orders) {
                OIds.push(order._id.toString());
                cube += (order.cube ? order.cube*1 : 0);
                weight += (order.weight ? order.weight*1 : 0);
                feet += (order.feet ? order.feet*1 : 0);
                rate += (order.rate ? order.rate*1 : 0);
                pieceTotalQuantity += +order.pieceCount ? +order.pieceCount : 0
            }
        }
        let returnObject = -1;
        if (!ordersIdsArr.length) {
            await PlanningSchema.deleteOne({ _id: load._id });
            let unPlanOrders = await OrderSchema.find({ _id: { $in: OIds } });
            let orderArr, info, pickupInfo;

            for (const order of unPlanOrders) {
                orderArr = order.loadTempIds;
                orderArr = orderArr.filter(item => {
                    return item.toString() != load._id.toString();
                });
                // let orderIndex = orderArr.indexOf(load._id.toString());
                // if (orderIndex > -1) {
                //     orderArr.splice(orderIndex, 1);
                // }
                info = order.timeInfo;
                pickupInfo = order.pickupTimeInfo;
                delete info.loadTemps[load._id.toString()];
                if (pickupInfo && pickupInfo.loadTemps) {
                    delete pickupInfo.loadTemps[load._id.toString()];
                }
                await OrderSchema.updateMany({ _id: order._id },{
                    loadTempIds: orderArr,
                    confirmed: 0,
                    timeInfo: info,
                    pickupTimeInfo: pickupInfo
                });
            }
            deletedLoads.push(load._id);
            returnObject = {
                status: 1,
                msg: `This load ${load._id} will be deleted as there are no orders in it.`,
                newLoad: [],
                delete: true
            };
        } else {
            const ordersIdsUpdated = ordersIdsArr;

            const planning = await PlanningSchema.findById(load._id).populate("depo");
            if (planning)  {
                const depo = planning.depo;
                let odistance;
                let oduration;

                const old = await OrderSchema.find({ _id: { $in: planning.orders } });
                if (old && old.length) {
                    const oldpointsBody = { depot: planning.depo, flowType: planning.flowType, ret: planning.return };
                    const oldpoints = await this.helper.getLatLon(oldpointsBody, old);

                    const  dt = await this.OSmap.GetDistDur(oldpoints);
                    odistance = dt.data.distance;
                    oduration = dt.data.duration;

                    const news = await OrderSchema.find({ _id: { $in: ordersIdsUpdated } });

                    if (news && news.length) {

                        const oldpointsBody = { depot: planning.depo, flowType: planning.flowType, ret: planning.return };
                        const newpoints = await this.helper.getLatLon(oldpointsBody, news);

                        const oldDistDur = await this.OSmap.GetDistDur(newpoints);
                        let start = {}, end = {}, endAddress;
                        if (load.flowType == 1) { // LP2D
                            // start.Lat = order[0].pickupLat*1;
                            // start.Lon = order[0].pickupLon*1;
                            start.Lat = depo.lat;
                            start.Lon = depo.lon;
                            end.Lat = depo.lat;
                            end.Lon = depo.lon;
                            endAddress = depo.address;
                        } else if (load.flowType == 2) { // D2E
                            start.Lat = depo.lat;
                            start.Lon = depo.lon;
                            if(load.return == 1){ // ret = 1 not return
                                end.Lat = news[news.length -1].deliveryLat;
                                end.Lon = news[news.length -1].deliveryLon;
                                endAddress = news[news.length -1].delivery;
                            } else {
                                end.Lat = depo.lat;
                                end.Lon = depo.lon;
                                endAddress = depo.address;
                            }
                        };

                        const emptymile = load.flowType == 2 || load.flowType == 1 ? await this.Calc.emptymileage({
                            load,
                            order: news,
                            orderIds: ordersIdsUpdated.join(","),
                            start,
                            end,
                            ret: load.return
                        }) : 0;

                        if (oldDistDur) {
                            let updateObj = {
                                _id: load._id,
                                end: end,
                                endAddress: endAddress,
                                orders: ordersIdsUpdated,
                                stops: news.length,
                                totalDistance: oldDistDur.data.distance,
                                weight: load.weight - weight,
                                cube: load.cube - cube,
                                feet: load.feet - feet,
                                feelRates: load.feelRates - rate,
                                pieceTotalQuantity: load.pieceTotalQuantity - pieceTotalQuantity,
                                emptymile: emptymile,
                                busy: 1,
                                $push: {
                                    changed: {
                                        change: true,
                                        user: {
                                            id: user._id,
                                            username: user.username
                                        },
                                        changeTime: new Date(Date.now()),
                                        type: "removeOrderFromLoadTemp"
                                    }
                                }
                            };
                            const unPlanOrders = await OrderSchema.find({ _id: { $in: OIds } });
                            let orderArr, info, pickupInfo;
                            for (const order of unPlanOrders) {
                                orderArr = order.loadTempIds;
                                orderArr = orderArr.filter(ord => {
                                    return ord.toString() != load._id.toString();
                                });
                                // let orderIndex = orderArr.indexOf(load._id.toString());
                                // if (orderIndex > -1) {
                                //     orderArr.splice(orderIndex, 1);
                                // }
                                info = order.get("timeInfo");
                                pickupInfo = order.get("pickupTimeInfo");
                                if (pickupInfo && pickupInfo.loadTemps) {
                                    delete pickupInfo.loadTemps[load._id.toString()];
                                }
                                delete info.loadTemps[load._id.toString()];
                                await OrderSchema.updateMany({ _id: order._id },{
                                    loadTempIds: orderArr,
                                    status: "60b0b9206f8b6c476f2a576f",
                                    confirmed: 0,
                                    timeInfo: info,
                                    pickupTimeInfo: pickupInfo
                                });
                            }
                            const newLoad = await PlanningSchema.findById(load.id);

                            if (orders) {
                                let oids = [];
                                returnObject = {
                                    status: 1,
                                    msg: 'ok',
                                    updateObj
                                };
                            } else {
                                returnObject = {
                                    status: 0,
                                    msg: 'Can not access orders table',
                                };
                            }
                        }


                    } else returnObject = { msg :'Error On New order query', status: 0 };
                } else returnObject = {status: 0, msg: 'Error On Old orders Query ' }
            } else returnObject = {
                status: 0,
                msg: 'Can not access loads table',
                'error': err.msg
            };
        }
        return { ...returnObject, deletedLoads};
    }
};