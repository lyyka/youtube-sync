const files = require('fs');
const url = require('url');
// express
const express = require('express');
const app = express();
const bodyParser = require("body-parser");
// socketio
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

server.listen(8000);

const starting_url = "https://www.youtube.com/watch?v=1vLkX_BYzhg";
const rooms = {};

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
app.get("/room",function(req,res){
	files.readFile("html/room.html",function(err,data){
		if(err){
			res.writeHead(404,{"Content-Type": "text/html"});
			res.write("404 Not found");
		}
		else{
			res.writeHead(200,{"Content-Type": "text/html"});
			res.write(data);
		}
		res.end();
	});
});
app.get("/create",function(req,res){
	files.readFile("html/create_room.html",function(err,data){
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
app.get("/join",function(req,res){
	files.readFile("html/join_room.html",function(err,data){
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
		rooms[data.room].currTime = 0;
		socket.broadcast.to(data.room).emit("change embed url",{url: data.url, user: data.user, time: PrintTimeStamp()});
		console.log(data.user + " has changed the video in " + data.room + " @ " + PrintTimeStamp());
		fn({feedback: "You changed the video id to: " + parse_yt_url(data.url), time: PrintTimeStamp()});
	});
	// play video
	socket.on("play video",function(data,fn){
		rooms[data.room].state = "playing";
		socket.broadcast.to(data.room).emit("control",{user: data.username, control: "play", time: PrintTimeStamp()});
		console.log(data.username + " has played the video in " + socket.room + " @ " + PrintTimeStamp());
		fn({feedback: "You have played the video", time: PrintTimeStamp()});
	});
	// pause video
	socket.on("pause video",function(data,fn){
		rooms[data.room].state = "paused";
		socket.broadcast.to(data.room).emit("control",{user: data.username, control: "pause", time: PrintTimeStamp()});
		console.log(data.username + " has paused the video in " + socket.room + " @ " + PrintTimeStamp());
		fn({feedback: "You have paused the video", time: PrintTimeStamp()});
	});
	socket.on("get video time",function(data,fn){
		if(rooms[data.room] != null){
			console.log(rooms[data.room].currTime);
			fn({videoTime: rooms[data.room].currTime});
		}
	});
	// while the video is playing get it's current time so when someone connects, he starts from the time others are listening at the moment
	socket.on("update video time",function(data){
		if(data.videoTime != null && data.room != null){
			let room = data.room;
			if(rooms[room] != null && data.videoTime > rooms[room].currTime){
				rooms[room].currTime = data.videoTime;
			}
		}
	});
	// generates new room
	socket.on("generate-room-code",function(fn){
		let generated = false;
		let room = "";
		while(!generated){
			const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

			for (var i = 0; i < 7; i++)
				room += possible.charAt(Math.floor(Math.random() * possible.length));

			if(rooms[room] == null){
				generated = true;
			}
		}
		rooms[room] = {users: [], currVideo: starting_url, currTime: 0, state: "paused"};
		console.log("Generated new room: " + room + " @ " + PrintTimeStamp());
		console.log(rooms);
		fn(room);
	});
	// adds user to the room
	socket.on("join room",function(data,fn){
		const room = data.room;
		const username = data.username;
		if(rooms[room] != null){
			if(!rooms[room].users.includes(username)){
				socket.username = username;
				socket.room = room;
				rooms[room].users.push(username);
				socket.join(room);
	        	socket.broadcast.to(room).emit('joined', { message: username + ' joined', users_list: rooms[room].users, time: PrintTimeStamp()});
	        	console.log(username + " has joind the room " + room + " @ " + PrintTimeStamp());
	        	fn({status: 1, videoUrl: rooms[room].currVideo, videoTime: rooms[room].currTime, state: rooms[room].state, usersList: rooms[room].users, message: "You joined the room!", time: PrintTimeStamp()});
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
			const room = data.room;
			const index = rooms[room].users.indexOf(data.user);
			if(index > -1){
				socket.leave(room);
				socket.username = "";
				socket.room = "";
				socket.disconnect(0);
				rooms[room].users.splice(index,1);
				console.log(data.user + " has left the room " + room + " @ " + PrintTimeStamp());
				socket.broadcast.to(room).emit("left",{message: data.user + " left", users_list: rooms[room].users, time: PrintTimeStamp()});
			}
		}
	});

});
function parse_yt_url(url){
	var start = url.lastIndexOf('=');
	return url.substring(start+1);
}
function PrintTimeStamp(){
	var dt = new Date();
	var time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
	return time;
}
