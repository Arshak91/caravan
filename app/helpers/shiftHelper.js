const env = process.env.SERVER == "local" ? require("../config/env.local") : require("../config/env");

// Service
const GeneralService = require("../main_classes/general.service");

class ShiftHelper extends GeneralService {

    constructor(params) {
        super()
    }

    generateModel = async (data) => {
        let { shiftName, shift, break_time, drivingtime, max_shift, rest, recharge, status } = data;
        let model = {
            shiftName: shiftName ? shiftName : "",
            shift: shift ? shift : "",
            break_time: break_time ? break_time : "",
            drivingtime: drivingtime ? drivingtime : "",
            max_shift: max_shift ? max_shift : "",
            rest: rest ? rest : "",
            recharge: recharge ? recharge : "",
            status: status ? status : "",
        };
        return await this.trim(model);
    }
}

module.exports = ShiftHelper;