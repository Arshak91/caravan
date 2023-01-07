const Depos = require("../newModels/depoModel");
const Orders = require("../newModels/ordersModel");
const Errors = require("../errors/depoError");
const ErrorsClass = new Errors();
const BaseService = require('../main_classes/base.service');
const OSmapService = require("./osmap.service");
const OSmapServiceClass = new OSmapService();

// Helpers
const DepotHelper = require("../helpers/depotHelpers");
const DepotHelperClass = new DepotHelper();

class DepoService extends BaseService {


    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.where = params.where;
        }
    }

    getAll = async (data) => {
        let depos, count, message = "Depots list", status = 1;

        let pagination = await this.pagination.sortAndPagination(data.body)
        let fillter = await this.fillters.depoFilter(data.body)

        let { limit, offset, order } = pagination;
        count = await Depos.countDocuments({...fillter});
        depos = await Depos.find({...fillter}).sort(order).limit(limit).skip(offset).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {depos, count});
    }

    getById = async (data) => {
        let _id = data.params.id;
        let depot, message = "Success", status = 1;
        depot = await Depos.findById(_id).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!depot) {
            status = 0;
            message = "such Depot doesn't exist!"
        }
        return this.getResponse(status, message, depot);
    }

    getOne = async (where) => {
        let depot, status = 1, message = "Success";
        depot = await Depos.findOne({...where}).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!depot) {
            message = "such Depot doesn't exist";
            status = 0;
        }
        return this.getResponse(status, message, depot);
    }

    create = async (body) => {
        const errors = await ErrorsClass.createError(body);

        if (!errors.status) {
            return this.getResponse(errors.status, errors.msg);
        } else {
            let depo, message = "Depo successfully created", errorStatus = 1;
            let lat, lon;
            let address = `${body.zip}+${body.city}+${body.streetaddress}+${body.state}`;
            // const { data, status } = await Osmap.GeoLoc(address);
            const { data, status } = await OSmapServiceClass.GeoLoc({query: address})
            if (!status || data.status == 'ZERO_RESULTS') {
                errorStatus = 0;
                message = 'address is wrong';
            } else {
                lat = data.data.results[0].geometry.location.lat;
                lon = data.data.results[0].geometry.location.lng;
                let createData = await DepotHelperClass.generateModel({
                    ...body,
                    lat,
                    lon
                })
                depo = await Depos.create(createData).catch(err => {
                    if (err) {
                        message = err.message;
                        errorStatus = 0;
                    }
                });
            };
            return this.getResponse(errorStatus, message, depo);
        }
    }

    edit = async (data) => {
        let { body } = data, { _id } = body;
        const errors = await ErrorsClass.createError(body);

        if (!errors.status) {
            return this.getResponse(errors.status, errors.msg);
        } else {
            let depo, message = "Depo successfully updated", errorStatus = 1;
            let lat, lon;
            let address = `${body.zip}+${body.city}+${body.streetaddress}+${body.state}`;
            // const { data, status } = await Osmap.GeoLoc(address);
            const { data, status } = await OSmapServiceClass.GeoLoc({query: address})
            if (!status || data.status == 'ZERO_RESULTS') {
                errorStatus = 0;
                message = 'address is wrong';
            } else {
                lat = data.data.results[0].geometry.location.lat;
                lon = data.data.results[0].geometry.location.lng;
                let editData = await DepotHelperClass.generateModel({
                    ...body,
                    lat,
                    lon
                }, true)
                depo = await Depos.findByIdAndUpdate(_id, editData, {new: true}).catch(err => {
                    if (err) {
                        message = err.message;
                        errorStatus = 0;
                    }
                });
            };
            return this.getResponse(errorStatus, message, depo);
        }
    }

    delete = async (data) => {
        let { ids } = data.body, status = 1, message = "Depot(s) successfully deleted";
        const depo = await Depos.deleteMany({
            _id: {
                $in: ids
            }
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0
            }
        });
        await Orders.updateMany({
            depo: {
                $in: ids
            }
        }, {
            depo: null
        })
        return this.getResponse(status, message, depo)

    }
};

module.exports = DepoService;