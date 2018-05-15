var files = require('fs');
var url = require('url');
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

server.listen(80);

var starting_url = "https://www.youtube.com/embed/1vLkX_BYzhg";
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
io.on("connection",function(socket){
	// changes vide url for all users in a room
	socket.on("change url",function(data,fn){
		rooms[data.room].currVideo = data.url;
		socket.broadcast.to(data.room).emit("change embed url",{url: data.url, user: data.user, time: PrintTimeStamp()});
		console.log(data.user + " has changed the video in " + data.room + " @ " + PrintTimeStamp());
		fn({feedback: "You changed the video id to: " + parse_yt_url(data.url), time: PrintTimeStamp()});
	});
	// play video
	socket.on("play video",function(data,fn){
		socket.broadcast.to(data.room).emit("control",{user: data.username, control: "play", time: PrintTimeStamp()});
		console.log(data.username + " has played the video in " + socket.room + " @ " + PrintTimeStamp());
		fn({feedback: "You have played the video", time: PrintTimeStamp()});
	});
	socket.on("pause video",function(data,fn){
		socket.broadcast.to(data.room).emit("control",{user: data.username, control: "pause", time: PrintTimeStamp()});
		console.log(data.username + " has paused the video in " + socket.room + " @ " + PrintTimeStamp());
		fn({feedback: "You have paused the video", time: PrintTimeStamp()});
	});
	// generates new room
	socket.on("generate-room-code",function(fn){
		var generated = false;
		var room = "";
		while(!generated){
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

			for (var i = 0; i < 7; i++)
				room += possible.charAt(Math.floor(Math.random() * possible.length));

			if(rooms[room] == null){
				generated = true;
			}
		}
		rooms[room] = {users: [], currVideo: starting_url};
		console.log("Generated new room: " + room + " @ " + PrintTimeStamp());
		fn(room);
	});
	// adds user to the room
	socket.on("join room",function(data,fn){
		var room = data.room;
		var username = data.username;
		if(rooms[room] != null){
			if(!rooms[room].users.includes(username)){
				socket.username = username;
				socket.room = room;
				rooms[room].users.push(username);
				console.log(rooms[room].users);
				socket.join(room);
	        	socket.broadcast.to(room).emit('joined', { message: username + ' joined', user: username, time: PrintTimeStamp()});
	        	console.log(username + " has joind the room " + room + " @ " + PrintTimeStamp());
	        	fn({status: 1, videoUrl: rooms[room].currVideo, usersList: rooms[room].users, message: "You joined the room!", time: PrintTimeStamp()});
			}
			else{
				fn({status: 0, time: null});
			}
		}
		else{
			fn({status: -1, time: null});
		}
	});
	// when user leaves the room
	socket.on("leave room",function(data){
		if(rooms[data.room] != null){
			var room = data.room;
			var index = rooms[room].users.indexOf(data.user);
			if(index > -1){
				socket.broadcast.to(room).emit("left",{message: data.user + " left", user: data.user, time: PrintTimeStamp()});
				socket.leave(room);
				socket.username = "";
				socket.room = "";
				socket.disconnect(0);
				rooms[room].users.splice(index,1);
				console.log(rooms[room].users);
			}
		}
	});

});
function parse_yt_url(url){
	var start = url.lastIndexOf('/');
	return url.substring(start+1);
}
function PrintTimeStamp(){
	var dt = new Date();
	var time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
	return time;
}
