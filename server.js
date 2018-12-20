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
app.set('view engine', 'pug')

server.listen(process.env.PORT || 8000);

const starting_url = "https://www.youtube.com/watch?v=j2LTY2UArsQ";
const rooms = {};

app.get("/",function(req,res){
    res.render('index');
});
app.get("/create",function(req,res){
    res.render('create_room');
});
app.get("/join",function(req,res){
    res.render('join_room', {roomID: ""});
});
app.get("/join/:roomID",function(req,res){
    // when scanned from QR code
    const roomID = req.params.roomID;
    res.render('join_room', {roomID: roomID});
});
app.get("/room/:roomID/:username", function(req,res){
    const roomID = req.params.roomID;
    const username = req.params.username;
    res.render("room",{roomID: roomID, username: username});
});
// io
io.on("connection", onConnect);
function onConnect(socket){
    // changes vide url for all users in a room
    socket.on("change url",function(data,fn){
        // change url for room
        rooms[data.room].currVideo = data.url;
        // roll back time to 0
        rooms[data.room].currTime = 0;
        // broadcast change to room
        socket.broadcast.to(data.room).emit("change embed url",{url: data.url, user: data.username, time: printTimeStamp()});
        // log the event in console
        console.log(data.username + " has changed the video in " + data.room + " @ " + printTimeStamp());
        // log the event in user interface
        fn({feedback: "You changed the video id to: " + parse_yt_url(data.url), time: printTimeStamp()});
    });
    // play video
    socket.on("play video",function(data,fn){
        // change state of the room to playing
        rooms[data.room].state = "playing";
        // broadcast change to room
        socket.broadcast.to(data.room).emit("control",{user: data.username, control: "play", time: printTimeStamp()});
        // log the event in console
        console.log(data.username + " has played the video in " + socket.room + " @ " + printTimeStamp());
        // log the event in user interface
        fn({feedback: "You have played the video", time: printTimeStamp()});
    });
    // pause video
    socket.on("pause video",function(data,fn){
        rooms[data.room].state = "paused";
        socket.broadcast.to(data.room).emit("control",{user: data.username, control: "pause", time: printTimeStamp()});
        console.log(data.username + " has paused the video in " + socket.room + " @ " + printTimeStamp());
        // log the event in user interface
        fn({feedback: "You have paused the video", time: printTimeStamp()});
    });
    socket.on("get video time",function(data,fn){
        if(rooms[data.room] != null){
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
        console.log("Generated new room: " + room + " @ " + printTimeStamp());
        fn(room);
    });
    // adds user to the room
    socket.on("join room",function(data,fn){
        // get username and room number
        const room = data.room;
        const username = data.username;
        // if room exists
        if(rooms[room] != null){
            // if username is not taken
            if(!rooms[room].users.includes(username)){
                // join the user to room and add him to room variable
                socket.username = username;
                socket.room = room;
                rooms[room].users.push(username);
                socket.join(room);
                // broadcast event to all users in room
                socket.broadcast.to(room).emit('joined', { message: username + ' joined', users_list: rooms[room].users, time: printTimeStamp()});
                // log in console
                console.log(username + " has joind the room " + room + " @ " + printTimeStamp());
                // send joined user info about the room
                fn({status: 1, videoUrl: rooms[room].currVideo, videoTime: rooms[room].currTime, state: rooms[room].state, usersList: rooms[room].users, message: "You joined the room!", time: printTimeStamp()});
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
            const index = rooms[room].users.indexOf(data.username);
            if(index > -1){
                socket.leave(room);
                socket.username = "";
                socket.room = "";
                socket.disconnect(0);
                rooms[room].users.splice(index,1);
                console.log(data.username + " has left the room " + room + " @ " + printTimeStamp());
                socket.broadcast.to(room).emit("left",{message: data.username + " left", users_list: rooms[room].users, time: printTimeStamp()});
            }
        }
    });

}
function parse_yt_url(url){
	var start = url.lastIndexOf('=');
	return url.substring(start+1);
}
function printTimeStamp(){
	var dt = new Date();
	var time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
	return time;
}
