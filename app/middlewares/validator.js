const validator = require("validator");
const bcrypt = require("bcryptjs");
const GeneralHelper = require("../main_classes/general.service");
const GeneralHelperClass = new GeneralHelper();

exports.register = async (req, res, next) => {
    let error = false, messages = [], obj;
    obj = await GeneralHelperClass.trim(req.body);
    let { name, username, email, password, role } = obj;
    let Email = validator.isEmail(email);
    if (!name) {
        error = true;
        messages.push({
            key: "name",
            message: "name is invalid"
        });
    }
    if (!Email) {
        error = true;
        messages.push({
            key: "email",
            message: "EMail is invalid"
        });
    }
    if (!username) {
        error = true;
        messages.push({
            key: "username",
            message: "username is invalid"
        });
    }
    if (!password) {
        error = true;
        messages.push({
            key: "password",
            message: "password is invalid"
        });
    }
    if (!role) {
        error = true;
        messages.push({
            key: "role",
            message: "role is invalid"
        });
    }
    if (error) {
        return res.json({status: 0, message: "validation Errors",data: messages})
    }
    let pass = bcrypt.hashSync(password, 8);
    req.data = {
        ...req.body,
        password: pass
    };
    next();
};