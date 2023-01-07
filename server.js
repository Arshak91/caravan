// Get dependencies
const express = require("express");
const path = require("path");
const http = require("http");
const bodyParser = require("body-parser");
// const redis = require("redis");
// const client = redis.createClient({host : "127.0.0.1", port : 6379});

//const fileupload = require("express-fileupload");

//var upload = require("express-fileupload");

// Get our API routes
//const api = require("./server/routes/api");

const app = express();
require("dotenv").config();

// for file upload
var upload = require("express-fileupload");
app.use(upload({
  limits: { fileSize: 5 * 1024 * 1024 },
}));

// Parsers for POST data
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: false, limit: "10mb" }));
//app.use(bodyParser.urlencoded({ extended: false }));

// Set our api routes
const FTLApi = require("./app/router/FTLRouters.js");
FTLApi(app);

// Point static path to dist
app.use(express.static(path.join(__dirname, "dist")));
app.use("/resources", express.static(path.join(__dirname, "resources")));



// Catch all other routes and return the index file
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/index.html"));
});

/**
 * Get port from environment and store in Express.
 */
const port = process.env.PORT || "8080";
app.set("port", port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => console.log(`API running on localhost:${port}`));

const io = require("socket.io")(server);
const SocketService = require("./app/socket/socket");

const socket = new SocketService(io);
socket.initSocket();
module.exports = socket;
