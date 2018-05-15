var files = require('fs');
var url = require('url');
const safeStringify = require('fast-safe-stringify')
// express
var express = require('express');
var app = express();
const bodyParser = require("body-parser");
// socketio
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

var last_client = null;

server.listen(80);

var rooms = {};

app.get("/",function(req,res){
	files.readFile("index.html",function(err,data){
		if(err){
			res.writeHead(404,{"Content-Type": "text/html"});
			res.write("404 Not Found");
		}
		else{
			res.writeHead(200,{"Content-Type": "text/html"});
			res.write(data);
		}
		res.end();
	});
});
// plays video for all
app.post("/play",function(req,res){
	io.emit("control",{control: "play"});
	res.end();
});
// pauses video for all
app.post("/pause",function(req,res){
	io.emit("control",{control: "pause"});
	res.end();
});
io.on("connection",function(socket){
	// changes vide url for all users in a room
	socket.on("change url",function(data,fn){
		io.emit("change embed url",{url: data.url});
		fn(null);
	});
	// play video
	socket.on("play video",function(data,fn){
		socket.broadcast.to(data.room).emit("control",{user: data.username, control: "play"});
		fn(null);
	});
	socket.on("pause video",function(data,fn){
		socket.broadcast.to(data.room).emit("control",{user: data.username, control: "pause"});
		fn(null);
	});
	// generates new room
	socket.on("generate-room-code",function(fn){
		var generated = false;
		var room_code = "";
		while(!generated){
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

			for (var i = 0; i < 7; i++)
				room_code += possible.charAt(Math.floor(Math.random() * possible.length));

			if(rooms[room_code] == null){
				generated = true;
			}
		}
		rooms[room_code] = [];
		console.log("Generated new room: " + room_code + " @ " + PrintTimeStamp());
		fn(room_code);
	});
	// adds user to the room
	socket.on("join room",function(data,fn){
		var room = data.room;
		var username = data.username;
		if(rooms[room] != null){
			socket.username = username;
			socket.room = room;
			rooms[room].push(username);
			socket.join(room);
        	socket.broadcast.to(room).emit('notification', username + ' has connected to this room');
        	fn(1);
		}
		else{
			fn(null);
		}
	});
});
function PrintTimeStamp(){
	var dt = new Date();
	var time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
	return time;
}
