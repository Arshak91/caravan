const User = require("../newModels/userModel");
const BaseService = require("./base");

module.exports = class UserClass extends BaseService {


    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.where = params.where;
        }
    }

    async create () {
        let message = "User Created", status = 1;
        this.where = {
            $or: [
                { email: this.data.email },
                { username: this.data.username }
            ]
        }
        let existUser = await this.getOne();
        let user;
        if (!existUser.status) {
            user = await User.create({
                ...this.data
            }).catch(async err => {
                if (err) {
                    message = err.message;
                    status = 0;
                }
            })
        } else {
            message = "Fail -> Username or Email is already taken!";
            status = 0;
        }
        return this.helper.getResponse(status, message, user);
    }
    async getOne(obj) {
        let user, message = "Success", status = 1;
        user = await User.findOne({
            ...obj.where
        }).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (user)
            return this.helper.getResponse(status, message, user);
        else
            return this.helper.getResponse(0, "User not found");
    }
    async getOneWithRole() {
        let user, message = "Success", status = 1;
        user = await User.findOne({
            ...this.where
        }).populate("role").catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (user)
            return this.helper.getResponse(status, message, user);
        else
            return this.helper.getResponse(0, "User not found");
    }
};
