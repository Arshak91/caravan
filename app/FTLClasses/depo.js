const Depos = require("../newModels/depoModel");
const Check = require("../classes/checks");
const Helpers = require("../FTLClasses/helpersFTL");
const BaseService = require('../FTLClasses/base');



module.exports = class DepoClass extends BaseService {


    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.where = params.where;
        }
    }

    async check () {
        return await this.helper.checking();
    }

    async getAll(data) {
        let depos, count, message = "Depos list", status = 1;
        let { limit, offset, order } = data.data;
        count = await Depos.countDocuments({...data.where});
        depos = await Depos.find({...data.where}).sort(order).limit(limit).skip(offset).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.helper.getResponse(status, message, {depos, count});
    }
    async getOne(data) {
        let depo, status = 1, message = "Success";
        depo = await Depos.findOne({...data.where}).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!depo) {
            message = "such Depo doesn't exist";
            status = 0;
        }
        return await Helpers.getResponse(status, message, depo);
    }

    async create(obj) {
        let { data } = obj;
        let depo, message = "Depo successfully created", status = 1;
        depo = await Depos.create({
            name: data.name,

            customerId: data.customerId,

            streetaddress: data.streetaddress,
            city: data.city,
            state: data.state,
            zip: data.zip,
            country: data.country,
            countryCode: data.countryCode,

            lat: data.lat,
            lon: data.lon,
            workinghours: data.workinghours
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        })
        return await Helpers.getResponse(status, message, depo);
    }
};