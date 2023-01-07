const BaseService = require('../main_classes/base.service');
const Users = require("../newModels/userModel");
const Settings = require("../newModels/settingsModel");
const bcrypt = require("bcryptjs");

class UserService extends BaseService {
    constructor() {
        super();
    };

    create = async (body) => {
        const { email, username, password } = body.data;
        let message = "User Created", status = 1, where;
        where = {
            $or: [
                { email },
                { username }
            ]
        }
        let existUser = await this.getOne(where);
        let user;
        if (!existUser.status) {
            user = await Users.create({
                ...body.data,
                email: email.toLowerCase(),
                username: username ? username.toLowerCase() : null
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
        return this.getResponse(status, message, user);
    };

    async getOne(where) {
        let user, message = "Success", status = 1;

        user = await Users.findOne({
            ...where
        }).populate("role").catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (user)
            return this.getResponse(status, message, user);
        else
            return this.getResponse(0, "User not found");
    };
    async getMany(where) {
        let users, message = "User list", status = 1;

        users = await Users.find({
            ...where
        }).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!users) {
            message = "User not found";
            status = 0;
        }
        return this.getResponse(status, message, user);
    };

    getOneWithRole = async (where) => {
        let user, message = "Success", status = 1;
        user = await Users.findOne({
            ...where
        }).populate("role").catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (user)
            return this.getResponse(status, message, user);
        else
            return this.getResponse(0, "User not found");
    };

    update = async (data) => {
        let message = "User updated", status = 1;
        let { _id } = data.body;
        const user = Users.findByIdAndUpdate(_id, {
            ...data.body
        }, {new: true}).catch(err => {
            if(err) {
                message = err.message;
                status = 0
            }
        });
        return this.getResponse(status, message);
    }

    delete = async (where) => {
        let message = "User(s) not found", status = 2;
        const userIds = await Users.find(where).distinct("_id");
        if (userIds.length) {
            await Users.deleteMany({
                _id: { $in: userIds }
            }).catch(err => {
                if (err) {
                    message = err.message;
                    status = 0
                }
            })
            await Settings.deleteMany({
                user: { $in: userIds }
            }).catch(err => {
                if (err) {
                    message = err.message;
                    status = 0
                }
            })
            if(status == 2) {
                message = "User(s) Successfully deleted!";
                status = 1;
            }
        } else {
            status = 1;
        }

        return this.getResponse(status, message);
    };

    changePassword = async (data) => {
        const postData = data.body;

        if (!postData.passwordNew.trim() && postData.passwordNew.trim().length < 8) {
            return this.getResponse(0, 'minimum length of password must be 8');
        }
        const user = await Users.findOne({
            $or: [
                { username: { $regex: postData.username, $options:'i' } },
                { email: { $regex: postData.username, $options:'i' } }
            ]
        });
        if (!user) {
            return this.getResponse(0, 'User Not Found.')
        }
        var passwordIsValid = bcrypt.compareSync(postData.passwordOld, user.password);
        if (!passwordIsValid) {
            return this.getResponse(0, 'Invalid Password!', {
                auth: false, accessToken: null
            })
        }

        const updatedUser =await Users.findByIdAndUpdate(user._id, {
            password: bcrypt.hashSync(postData.passwordNew, 8),
            changePasswordAt: Date.now()
        }, {new: true});
        return this.getResponse(1, 'Password was changed successfully.')
    };

};

module.exports = UserService;