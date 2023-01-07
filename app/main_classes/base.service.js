const moment = require("moment")
const PaginationService = require("../services/db");
const PaginationServiceClass = new PaginationService();
const FiltersService = require("../services/filters");
const FiltersServiceClass = new FiltersService();

// Schema
const OrderSchema = require("../newModels/ordersModel");
const DriverSchema = require("../newModels/driverModel");
module.exports = class BaseService {
    constructor() {
        // this.helper = new Helper();
        this.fillters = FiltersServiceClass;
        this.pagination = PaginationServiceClass;
    };
    pagination;
    fillters;

    getResponse = (status, msg, data) => ( { status, msg, data: data || null } );

    getWeekDay = async (date) => {
        try {
            let sday;
            let weekDate = moment(date)._i;
            const thedate = new Date(weekDate);
            let day = thedate.getDay();
            if (day == 1) { sday = "monday"; }
            if (day == 2) { sday = "tuesday"; }
            if (day == 3) { sday = "wednesday"; }
            if (day == 4) { sday = "thursday"; }
            if (day == 5) { sday = "friday"; }
            if (day == 6) { sday = "saturday"; }
            if (day == 0) { sday = "sunday"; }
            return { status: 1, msg: sday};
        } catch (error) {
            return {
                status: 0,
                msg: error.message
            };
        }
    };

    splitToIntArray = async (text, dl) => {
        let array = text.split(dl).map(function (item) {
            return parseInt(item, 10);
        });
        return array;
    }
    dataIndexing = async (data) => {
        let { index, orders } = data;
        // const indexList = {1: "nbcduhbvcndj", 2: "vugfrbvujfdn"};
        const list = [], asd = [];
        Object.keys(index).forEach(x => {
            for (const order of orders) {
                if (indexList[x] == order._id) {
                    list.push(order);
                }
            }
        });
        return list;
    };

    orderEditForCalc = (data) => {
        for (const item of data) {
            OrderSchema.findByIdAndUpdate(item.id, item.data).catch(err => {
                console.log(`orderEdit errMessage: ${err.message}`);
            })
        }
    };

    lastOrderID = async () => {
        const order = await OrderSchema.find({}).sort([["ID", -1]]).limit(1);
        const lastOrderID = order && order[0] ? order[0].get("ID") : 0;
        return lastOrderID
    }

    lastDriver = async () => {
        const driver = await DriverSchema.find({}).sort([["ID", -1]]).limit(1);
        const lastDriver = driver[0];
        return lastDriver
    }

};
