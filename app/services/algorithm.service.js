const axios = require("axios");
const env = process.env.SERVER == "local" ? require("../config/env.local") : require("../config/env");

class Algorithm {
    headers = {
        'Content-Type': 'application/json',
        'XUIDT': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IkFsZ29WMiIsIm5iZiI6MTYzMjQ4ODkzNCwiZXhwIjoxMDI3MjQ4ODkzMywiaWF0IjoxNjMyNDg4OTM0fQ.W6yDHjkJUxrth7yoIsEGzFCD6-clOd8gHSkl0mNUCPs"
    }

    getStatusAutoplan = async (uid, host) => {
        let statusUrl = `${env.engineHost}:${env.enginrPort}/status?execid=${uid}`;
        const result = await axios.get(statusUrl, {
            headers: {
                ...this.headers,
                HostNameAlGO: host
            }
        });
        const dataLength = result.data.length;
        const { ETA } = result.data[dataLength - 1].ThreadOutcome;

        return ETA;
    };

    timeCalculation = async (data, flowType) => {
        const url = flowType == 3 ? `${env.engineHost}:${env.enginrPort}/dispatch/pdp/timecalculation`
            : `${env.engineHost}:${env.enginrPort}/dispatch/vrp/timecalculation`;

        const result = await axios.post(url, JSON.stringify(data),{
            headers: {
                ...this.headers,
                HostNameAlGO: data.host
            }
        });
        return result;
    }

    sendReqToEngine = async (obj, cluster) => {
        console.log("VRP: ",JSON.stringify(obj));
        let url;
        if (cluster == 0) {
            url  = `${env.engineHost}:${env.enginrPort}/dispatch/vrp/singular`;
        }
        if (cluster == 1) {
            url  = `${env.engineHost}:${env.enginrPort}/dispatch/vrp/cluster`;
        }
        const res = await axios.post(url, obj, {
            headers: {
                ...this.headers,
                HostNameAlGO: obj.host
            }
        });
        return res;
    };

    sendReqToEnginePDP = async (obj) => {
        console.log("PDP: ",JSON.stringify(obj));
        let url  = `${env.engineHost}:${env.enginrPort}/dispatch/pdp/singular`;
        const res = await axios.post(url, obj, {
            headers: {
                ...this.headers,
                HostNameAlGO: obj.host
            }
        });
        return res;
    };

    sendReqToEnginePDPFTL = async (obj) => {
        console.log("PDP FTL: ",JSON.stringify(obj));
        let url = `${env.engineHost}:${env.enginrPort}/dispatch/pdpftl/singular`;
        const res = await axios.post(url, obj, {
            headers: {
                ...this.headers,
                HostNameAlGO: obj.host
            }
        }).catch(err => {
            console.log(err);
        })
        return res;
    };

    sendReqToEngineForCancel = async (data) => {
        const { uuid, host } = data;
        let url = `${env.engineHost}:${env.enginrPort}/cancel?execid=${uuid}`;
        const res = await axios.get(url, {
            headers: {
                ...this.headers,
                HostNameAlGO: host
            }
        }).catch(err => {
            console.log(err);
        });
        return res;
    }

    sendReqToEngineForSequence = async (obj) => {
        console.log("Sequence: ",JSON.stringify(obj));
        let url = obj.flowType != 3 ? `${env.engineHost}:${env.enginrPort}/dispatch/seq/singular`
            : `${env.engineHost}:${env.enginrPort}/dispatch/pdp/sequence`;
        const res = await axios.post(url, obj, {
            headers: {
                ...this.headers,
                HostNameAlGO: obj.host
            }
        });
        return res;
    }
}

module.exports = Algorithm;