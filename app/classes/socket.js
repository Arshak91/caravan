module.exports = class SocketService {

    async checkToken(token) {
        if (token) {
            console.log(token);
        }
        return "you are connected !";
    }
    async sendData (str) {
        return [str];
    }
};
