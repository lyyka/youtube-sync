// autoload controllers
const Controllers = require(__dirname + '/controllers/autoload.js');

// express
const express = require('express');
const app = express();
const bodyParser = require("body-parser");

// socketio
const server = require('http').Server(app);
const io = require('socket.io')(server);

// use statements
app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.set('view engine', 'pug')

// listen
server.listen(process.env.PORT || 8000, "0.0.0.0");

// initialize the routes
require(__dirname + "/routes/routes.js")(Controllers, app);

// socket io on connection
io.on("connection", Controllers.SocketController.onEstablishedConnection);