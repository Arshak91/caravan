const Settings = require("../newModels/settingsModel");
const Helpers = require("../FTLClasses/helpersFTL");

module.exports = class SettingsClass {
    constructor(params) {
        this.data = params.data;
        this.where = params.where;
    }
    async getAll() {
        let settings, status = 1, message = "Settings List";
        let { limit, offset, order } = this.data;
        settings = await Settings.find({}).sort(order).limit(limit).skip(offset).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return await Helpers.getResponse(status, message, settings);
    }
    async getOne() {
        let settings, status = 1, message = "Success";
        let fields = this.data && this.data.fields ? this.data.fields : ""
        settings = await Settings.findOne({...this.where}, fields).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!settings) {
            message = "such Settings doesn't exist";
            status = 0;
        }
        return await Helpers.getResponse(status, message, settings);
    }

    async create() {
        let settings, status = 1, message = "Successfully created";
        settings = await Settings.create({
            ...this.data
        }).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return await Helpers.getResponse(status, message, settings);
    }
    async update() {
        let settings, status = 1, message = "Successfully updated";
        settings = await Settings.findOneAndUpdate({...this.where}, {
            ...this.data
        }, {new: true}).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return await Helpers.getResponse(status, message, settings);
    }
};
