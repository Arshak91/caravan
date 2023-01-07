const db = require('../config/db.config.js');
const User = db.user;

exports.createAndEditError = async (data, edit = null) => {
    let { fname, lname, email, country, drivinglicence, shiftId, assetId } = data;
    let msg = [], status = 1;

    if (!fname) {
        status = 0;
        msg.push({fname: "firstName is required", key: "fname"});
    }
    if (!lname) {
        status = 0;
        msg.push({lname: "lastName is required", key: "lname"});
    }
    if (!email) {
        status = 0;
        msg.push({email: "Email is required", key: "email"});
    }
    if (!shiftId) {
        status = 0;
        msg.push({shiftId: "Shift is required", key: "shiftId"});
    }
    return {
        status,
        msg
    };
};
