var files = require('fs');
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

// app.listen(8080,function(){
// 	console.log("listening on port 8080");
// });
server.listen(80);

var users = [];

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
app.post("/play",function(req,res){
	io.emit("control",{control: "play"});
	res.end();
});
app.post("/pause",function(req,res){
	io.emit("control",{control: "pause"});
	res.end();
});
io.on("connection",function(socket){
	socket.on("set username",function(data,fn){
		console.log("Connected: " + data.username);
		users.push(data.username);
		fn(null);
	});
	socket.on("disconnect user",function(data,fn){
		console.log("Disconnected: " + data.username);
		var index = users.indexOf(data.username);
		if(index > -1){
			users.splice(index,1);
		}
		fn(null);
	});
	socket.on("change url",function(data,fn){
		io.emit("change embed url",{url: data.url});
		fn(null);
	});
});
