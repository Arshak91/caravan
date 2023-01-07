const moment = require("moment");
const bcrypt = require("bcryptjs");
const Drivers = require("../newModels/driverModel");
const Users = require("../newModels/userModel");
const Role = require("../newModels/rolesModel");
// Services
const BaseService = require("../main_classes/base.service");
const UserService = require("../services/user.service");
const UserServiceClass = new UserService();
const SettingsService = require("./settings.service");
const SettingsServiceClass = new SettingsService();
const ScheduleService = require("../services/schedule.service");
const ScheduleServiceClass = new ScheduleService();
const DriverHelper = require("../helpers/driverHelpers");
const DriverHelperClass = new DriverHelper();
const GeneralHelper = require("../main_classes/general.service");
const GeneralHelperClass = new GeneralHelper();
const Mailer = require("./mailer.service");
const MailerClass = new Mailer();


const createAndEditError = async (data, edit = null) => {
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

class DriverService extends BaseService {


    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.where = params.where;
        }
    }
    driverErrorHandler = {
        createAndEdit: async (driver) => ( await createAndEditError(driver) )
    };

    getAll = async (data) => {
        let drivers, count, message = "Drivers list", status = 1;

        let pagination = await this.pagination.sortAndPagination(data.body)
        let fillter = await this.fillters.driverFilter(data.body)

        let { limit, offset, order } = pagination;
        count = await Drivers.countDocuments({...fillter});
        drivers = await Drivers.find({...fillter}).populate({path: "asset", populate: "equipment"}).populate({path: "schedule"}).sort(order).limit(limit).skip(offset).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {drivers, count});
    }
    getAllWithoutPagination = async (body) => {
        let drivers, count, message = "Drivers list", status = 1;

        let fillter = await this.fillters.driverFilter(body.query)

        count = await Drivers.countDocuments({...fillter});
        drivers = await Drivers.find({...fillter}).populate("schedule").catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {drivers, count});
    };

    getById = async (data) => {
        let _id = data.params.id;
        let driver, message = "Success", status = 1;
        driver = await Drivers.findById(_id).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!depo) {
            status = 0;
            message = "such Drivers doesn't exist!"
        }
        return this.getResponse(status, message, driver);
    }
    getOne = async (where) => {
        let driver, status = 1, message = "Success";
        driver = await Drivers.findOne({...where}).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!driver) {
            message = "such Driver doesn't exist";
            status = 0;
        }
        return this.getResponse(status, message, driver);
    }

    create = async (data) => {
        let { body } = data;
        const finishedData = await GeneralHelperClass.trim(body)
        const errors = await this.driverErrorHandler.createAndEdit(finishedData);
        if (!errors.status) {
            return this.getResponse(errors.status, errors.msg);
        } else {
            let driver, message = "Driver successfully created", status = 1, schedule;
            const [exUser, exDriver, lastDriver] = await Promise.all([
                UserServiceClass.getOne({
                    email: finishedData.email
                }),
                this.getOne({
                    email: finishedData.email
                }),
                this.lastDriver()
            ]);
            const [driverModel, lastDriverID] = await Promise.all([
                DriverHelperClass.createDriverModel({
                    ...finishedData,
                    exUser,
                    exDriver
                }),
                lastDriver.get("ID")
            ])
            ;
            if(driverModel.status) {
                driver = await Drivers.create({
                    ...driverModel.data,
                    ID: lastDriverID+1
                }).catch(err => {
                    if (err) {
                        message = err.message;
                        status = 0;
                    }
                });
            } else {
                message = driverModel.message;
            }
            if (!driver) {
                status = 0;
            } else {
                schedule = await ScheduleServiceClass.create({
                    monday: finishedData.monday,
                    tuesday: finishedData.tuesday,
                    wednesday: finishedData.wednesday,
                    thursday: finishedData.thursday,
                    friday: finishedData.friday,
                    saturday: finishedData.saturday,
                    sunday: finishedData.sunday
                }).catch(err => {
                    console.log(err);
                })
                await Drivers.findByIdAndUpdate(driver._doc._id, {
                    schedule: schedule.data._doc._id
                });
            }

            return this.getResponse(status, message, driver);
        }
    }

    update = async (data) => {
        let { body } = data;
        const finishedData = await GeneralHelperClass.trim(body)
        const errors = await this.driverErrorHandler.createAndEdit(finishedData);
        if (!errors.status) {
            return this.getResponse(errors.status, errors.msg);
        } else {
            let message = "Driver successfully updated", status = 1;
            const { _id, email } = finishedData;
            const driver = await Drivers.findById(_id, "email schedule");
            const schedule = await ScheduleServiceClass.getOne({_id: driver._doc.schedule});
            const driverEmail = driver.get("email");
            let exUser, exDriver;
            if (email !== driverEmail) {
                exUser = await UserServiceClass.getOne({
                    email: finishedData.email
                }).catch(err => {
                    console.log(err);
                })
                exDriver = await this.getOne({
                    email: finishedData.email
                }).catch(err => {
                    console.log(err);
                })
            }
            let driverModel = await DriverHelperClass.createDriverModel({
                ...finishedData,
                exUser,
                exDriver
            });
            const newDriver = driverModel.status ? await Drivers.findByIdAndUpdate(_id, {
                ...driverModel.data
            }, { new: true }).catch(err => {
                if (err) {
                    message = err.message;
                    status = 0;
                }
            }) : null;
            if (!newDriver) {
                message = "Driver doesn't updated";
                status = 0;
            } else {
                await ScheduleServiceClass.edit({
                    _id: schedule.data._doc._id,
                    monday: finishedData.monday,
                    tuesday: finishedData.tuesday,
                    wednesday: finishedData.wednesday,
                    thursday: finishedData.thursday,
                    friday: finishedData.friday,
                    saturday: finishedData.saturday,
                    sunday: finishedData.sunday
                }).catch(err => {
                    console.log(err);
                })
            }
            return this.getResponse(status, message, newDriver);
        }
    }

    delete = async (body) => {
        let { ids } = body;
        let message = "Driver(s) successfully deleted", status = 1, emailArr = [];
        const emails = await Drivers.find({
            _id: { $in: ids }
        }).distinct('email');
        const scheduleIds = await Drivers.find({
            _id: { $in: ids }
        }).distinct('schedule');
        const deletedDrivers = await Drivers.deleteMany({
            _id: { $in: ids }
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0
            }
        });
        emails.forEach(email => {
            if (email) {
                emailArr.push(email)
            }
        });
        if (status) {
            await ScheduleServiceClass.delete({
                _id: {
                    $in: scheduleIds
                }
            });
            emailArr.length ? await UserServiceClass.delete({
                email: {
                    $in: emailArr
                }
            }) : "";
        }
        return this.getResponse(status, message, deletedDrivers)
    }

    quickCreate = async (data) => {
        let { count } = data.body, drivers = [],
        { timezone } = data.headers;
        let date = '2020-08-11T08:30:00.000Z', hours;
        let tzone = timezone.split(":")[0];
        const startTime = moment(date, "YYYY-MM-DDTHH:mm:ss.SSS").subtract(tzone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")+"Z";
        for (let i = 0; i < count; i++) {
            let driver = await Drivers.create({fname: `Driver ${i+1}`});
            let schedule = await ScheduleServiceClass.create({
                monday: { from: startTime},
                tuesday: { from: startTime},
                wednesday: { from: startTime},
                thursday: { from: startTime},
                friday: { from: startTime},
                saturday: { from: startTime},
                sunday: { from: startTime}
            });
            await Drivers.findByIdAndUpdate(driver._doc._id, {
                schedule: schedule.data._doc._id
            });
            drivers.push(driver._doc._id);
        }
        return this.getResponse(1, "Succefully created", drivers);
    }

    createNewUser = async (obj, rull) => {
        let pass = "demopass", user, msg, existUser, role;
        existUser = await Users.findOne({ email: obj.data.email });
        role = await Role.findOne({name: "DRIVER",});
        if (existUser) {
            user = await Users.findByIdAndUpdate(existUser._doc._id, {
                password: bcrypt.hashSync(pass, 8),
                role: role._doc._id
            }, { new: true })
        } else {
            user = await UserServiceClass.create({
                data: {
                    name: obj.data.fname,
                    email: obj.data.email,
                    password: bcrypt.hashSync(pass, 8),
                    role: role._doc._id
                }
            });
            await SettingsServiceClass.create({
				user: user.data._id
			})
        }
        await Drivers.findByIdAndUpdate(obj.id, {
            mobileActive: 1
        });
        let subject = "Less Platform driver registration";
        let text = `
            Welcome aboard, ${obj.data.fname}!\r\n
            First tap on the link below and install our app from Google Play.\r\n
            http://bit.ly/LessPlatformDriverApp\r\n
            \r\n
        Then login using your credentials:\r\n
        Company name:  ${rull.split('.')[0].replace('http://', '')}
        Email: ${obj.data.email}\r\n
        Password: ${pass}\r\n
        \r\n
        \r\n
        Please, make sure to keep it safe and don"t share it with anyone.\r\n
        If you didn"t try to sign up, don"t worry. You can safely ignore this email.`;
        await MailerClass.sendMail(user.data.email, subject, text);
        msg = "A message is sent to the driver\"s email that contains his password.";
        return {
            status: 1,
            msg,
        };
    }

    activate = async (data) => {
        let { ids } = data.body, { user } = data;
        let drivers, msg = 'drivers active for Mobile', driverArr = [], wrongs = [];
        drivers = await Drivers.find({
            _id: {
                $in: ids
            }
        });
        for (const driver of drivers) {
            if (driver.email) {
                let obj = {
                    id: driver._id,
                    data: {
                        fname: driver.fname,
                        email: driver.email
                    },
                    user
                };
                const urls = data.get('host');
                const rull =  urls.slice(0, urls.indexOf('.'))
                let newUser = await this.createNewUser(obj, rull);
                if (newUser.status) {
                    driverArr.push(driver._id);
                }
            } else {
                wrongs.push({
                    id: driver._id,
                    message: "driver haven't EMail"
                })
            }
        }
        return this.getResponse(1, msg, {driverArr, wrongs});
    }
};

module.exports = DriverService;