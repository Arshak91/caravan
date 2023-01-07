const BaseService = require("../main_classes/base.service");
const Shift = require("../newModels/shiftModel");

//Helpers
const ShiftHelper = require("../helpers/shiftHelper");
const ShiftHelperClass = new ShiftHelper();


class ShiftService extends BaseService {
    constructor() {
        super();
    }

    getAll = async (data) => {
        let { body } = data
        let pagination = await this.pagination.sortAndPagination(body);
        let fillter = await this.fillters.shiftFilter(body);
        let shifts, message = "Shift list", status = 1, count;
        let { limit, offset, order } = pagination;
        count = await Shift.countDocuments({...fillter});
        shifts = await Shift.find({...fillter}).sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {shifts, count});
    };

    getOne = async (where) => {
        let message = "Success", status = 1;
        const shift = await Shift.findOne({...where}).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if(!shift) {
            status = 0;
            message = "such shift doesn't exist"
        }
        return this.getResponse(status, message, shift);
    };

    edit = async (data) => {
        let { id } = data.params, status = 1, message = "Shift successfully updated";
        let model = await ShiftHelperClass.generateModel(data.body);
        const shift = await Shift.findByIdAndUpdate(id, model, {new: true}).catch(err => {
            if(err) {
                status = 0;
                message = err.message
            }
        })
        return this.getResponse(status, message, shift);
    }
};

module.exports = ShiftService;