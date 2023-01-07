class NotificationHelper {
    getNotificationModel = async (data) => {
        let obj = {
            user: data.user,
            seen: data.seen,
            type: data.type,
            title: data.title,
            content: data.content,
            seenAt: data.seenAt,
        };
        return obj;
    }
}
module.exports = NotificationHelper;