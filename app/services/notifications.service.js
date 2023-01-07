const BaseService = require("../main_classes/base.service");
const Notification = require("../newModels/notificationsModel");
const NotificationHelpers = require("../helpers/notificationshelpers");
const NotificationHelpersClass = new NotificationHelpers();

class NotificationService extends BaseService {
    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.where = params.where;
        }
    }
    getAll = async (body) => {
        let notifications, count, message = "notification List", status = 1;

        let pagination = await this.pagination.sortAndPagination(body.query)
        let fillter = await this.fillters.notificationsFilter(body.query)

        let { limit, offset, order } = pagination;
        count = await Notification.countDocuments({
            ...fillter,
            user: body.user._id
        });
        notifications = await Notification.find({
            ...fillter,
            user: body.user._id
        }).sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {notifications, count});
    }
    getOne = async (where) => {
        let notification;
        notification = await Notification.findOne({...where});
        return this.getResponse(1, "ok", notification);
    }

    getById = async (req) => {
        let notification, _id = req.params.id;
        notification = await Notification.findById(_id);
        return this.getResponse(1, "ok", notification);
    }

    getAllWithoutPagination = async (obj) => {
        let notifications;
        notifications = await Notification.find({...obj.where}).populate("images");
        return this.getResponse(1, "ok", notifications);
    }

    create = async (data) => {
        const notificationModel = await NotificationHelpersClass.getNotificationModel(data);
        const notification = await Notification.create({
            ...notificationModel
        }).catch(err => {
            console.log(`Notification Create: ${err.message}`)
        });
        return this.getResponse(1, "Successfully created", notification);
    }
    update = async (obj) => {
        let notification;
        const notificationModel = await NotificationHelpersClass.getNotificationModel(obj)
        const _id = obj._id;
        notification = await Notification.findOneAndUpdate({_id}, {
            ...notificationModel
        }, {new: true}).catch(err => {
            console.log(err);
        });
        return this.getResponse(1, "Successfully updated", notification);
    }

    seen = async (data) => {
        let { body, user } = data;
        const notification = await Notification.findOneAndUpdate({
            _id: body.id
        }, {
            seen: 1,
            seenAt: new Date(),
            updatedAt: new Date()
        }, { new: true });
        return this.getResponse(1, "Notification seen", notification);
    }

    setAllNotificationSeen = async (data) => {
        let { user } = data;
        const notifications = await Notification.updateMany({
            user: user._id
        }, {
            seen: 1,
            seenAt: new Date(),
            updatedAt: new Date()
        });
        return this.getResponse(1, "Notifications seen", notifications);
    }
    delete = async (body) => {
        let { idList } = body;
        let notifications, message = "Successfully deleted", status = 1;
        notifications = await Notification.deleteMany({
            _id: {
                $in: idList
            }
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, notifications);
    }
};

module.exports = NotificationService;
