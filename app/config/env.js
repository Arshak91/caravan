const env = {
    engineHost: "http://192.168.1.55",
    enginrPort: 8110,
    mapHost: "http://planet.map.lessplatform.com:",
    uploadHost: "http://192.168.1.109:",
    uploadPort: "4774",
    mapPort: 80,
    mapUri:"/route/v1/driving/",
    mapKey: "AIzaSyAF2EnF5r4d18S-d1h5OyVrsRDXa_OzQUU",
    mailer: {
        email: "noreply@lessplatformmailer.com",
        pass: "Less-n0-rep!",
        SMTP_SERVER: "smtp.transip.email",
        PORT: 465,
    },
    mongoCommon: {
        database: "FTL",
        host: "144.217.38.21",
        user: "admin",
        pass: "hello8008there",
        port: 27017,
    },
    mapBox: {
        host: "https://api.mapbox.com/directions/v5/mapbox/driving/",
        linkParams: "?overview=full&access_token=pk.eyJ1IjoiaG92c2VwIiwiYSI6ImNrNTZibjVsbDAyOHYzZG1veXk0MGphczAifQ.QtVXUzQsI0EQB8BFUvq09g",
    }
};

module.exports = env;
