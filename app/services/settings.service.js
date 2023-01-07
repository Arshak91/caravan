const Settings = require("../newModels/settingsModel");
const BaseService = require("../main_classes/base.service");
const OrderHelper = require("../helpers/orderHelpers");
const OrderHelperClass = new OrderHelper();
class SettingsService extends BaseService {
    constructor() {
        super();
    }
    getAll = async (body) => {
        let settings, status = 1, message = "Settings List";
        let pagination = await this.pagination.sortAndPagination(body.query)
        let filter = await this.fillters.settingsFilter(body.query)

        let { limit, offset, order } = pagination;
        settings = await Settings.find({...filter}).sort(order).limit(limit).skip(offset).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, settings);
    };

    getOne = async (data) => {
        let { where, userId } = data;
        let settings, status = 1, message = "Success", fields;
        if (where.fields && where.fields !== "") {
            fields = where.fields.split(",").join(" ");
            delete where.fields
        };

        settings = await Settings.findOne({
            ...where,
            user: userId
        }, fields).populate("user", "username name email").catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!settings) {
            message = "such Settings doesn't exist";
            status = 0;
        }
        return this.getResponse(status, message, settings);
    };

    async create(data) {
        let settings, status = 1, message = "Successfully created";
        settings = await Settings.create({
            ...data,
            "userType" : "bfibf",
            "exchangeRate" : "vfeve",
            "units" : {
                "a" : 8
            },
            "Currency" : {
                "b" : 98
            },
            "defaultCurrency" : null,
            "defaultServiceTime" : 420.0,
            "pieceTime" : 30.0,
            "orders" : null,
            "loads" : null,
            "loadTemps" : null,
            "drivers" : null,
            "apiConfigs" : {
                "leafletRouteUrl" : "http://planet.map.lessplatform.com/route/v1"
            },
            "autoplan" : {
                "maxStop" : "30",
                "maxCount" : "1000"
            },
            "permisions" : [
                1
            ],
            "permisionConfig" : true,
            "IterationMultiplier": 1
        }).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, settings);
    }
    async update(data) {
        const { defaultServiceTime, pieceTime, updateAll, fileHeaders } = data.body;
        let settingsModel = {};
        for (const key in data.body) {
            settingsModel[key] = data.body[key]
        }
        let where = { user: data.user._id };
        let settings, status = 1, message = "Successfully updated";
        settings = await Settings.findOneAndUpdate({...where}, {
            ...settingsModel
        }, {new: true}).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (updateAll) {
            try {
                await OrderHelperClass.editServicetimes({
                    serviceTime: defaultServiceTime,
                    pieceTime: pieceTime,
                    user: data.user
                })
            } catch (error) {
                console.log(error);
            }
            
        }
        return this.getResponse(status, message, settings);
    }
};

module.exports = SettingsService;