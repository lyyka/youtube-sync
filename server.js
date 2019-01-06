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

server.listen(process.env.PORT || 8000, "0.0.0.0");

const starting_url = "https://www.youtube.com/watch?v=bM7SZ5SBzyY";
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
// socket io on connection
io.on("connection", onConnect);
function onConnect(socket){
    // changes vide url for all users in a room
    socket.on("change url",function(data,fn){
        if(rooms[data.room]){
            // change url for room
            rooms[data.room].currVideo = data.url;
            // roll back time to 0
            rooms[data.room].currTime = 0;
            // broadcast change to room
            socket.broadcast.to(data.room).emit("change embed url",{url: data.url, user: data.username, time: printTimeStamp()});
            // log the event in console
            console.log(data.username + " has changed the video in " + data.room + " @ " + printTimeStamp());
            // log the event in user interface
            fn({feedback: "You changed the video id to: " + parseYouTubeURL(data.url), time: printTimeStamp()});
        }
    });
    // play video
    socket.on("play video",function(data,fn){
        if(rooms[data.room]){
            // change state of the room to playing
            rooms[data.room].state = "playing";
            // broadcast change to room
            socket.broadcast.to(data.room).emit("control",{user: data.username, control: "play", time: printTimeStamp()});
            // log the event in console
            console.log(data.username + " has played the video in " + data.room + " @ " + printTimeStamp());
            // log the event in user interface
            fn({feedback: "You have played the video", time: printTimeStamp()});
        }
    });
    // pause video
    socket.on("pause video",function(data,fn){
        if(rooms[data.room]){
            rooms[data.room].state = "paused";
            socket.broadcast.to(data.room).emit("control",{user: data.username, control: "pause", time: printTimeStamp()});
            console.log(data.username + " has paused the video in " + data.room + " @ " + printTimeStamp());
            // log the event in user interface
            fn({feedback: "You have paused the video", time: printTimeStamp()});
        }
    });
    // sync rooms on seek
    socket.on("sync on seek", function(data){
        if(rooms[data.room]){
            // update time in room
            rooms[data.room].currTime = data.videoTime;
            socket.broadcast.to(data.room).emit("sync",{
                videoTime: data.videoTime
            });
        }
    });
    // get current video time in room
    socket.on("get video time",function(data,fn){
        if(rooms[data.room]){
            fn({videoTime: rooms[data.room].currTime});
        }
    });
    // while the video is playing get it's current time so when someone connects, he starts from the time others are listening at the moment
    socket.on("update video time",function(data){
        if(data.videoTime != null && data.room != null){
            let room = data.room;
            if(rooms[room] != null){
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
        console.log("New room: " + room + " @ " + printTimeStamp());
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
                fn({status: 1, videoUrl: rooms[room].currVideo, videoTime: rooms[room].currTime, state: rooms[room].state, usersList: rooms[room].users, message: "You joined the room!"});
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

                // if room is empty (but wait for some time, in case user just refreshed the page)
                setTimeout(removeRoomIfEmpty, 10000, room);
            }
        }
    });

}
// delete room if empty, after some period of time
function removeRoomIfEmpty(room){
    if(rooms[room] != undefined){
        if(rooms[room].users.length == 0){
            delete rooms[room];
            console.log(room + " deleted due to no users in it");
        }
    }
}
// parse url
function parseYouTubeURL(url){
	let start = -1;
	let rtn_url = "";
	start = url.lastIndexOf('?v=');
	if(start > -1){
		// for urls like https://www.youtube.com/watch?v=PkyGvALhmyY
		// if it has more parameters than just video ID
		const indexOfAmp = url.indexOf("&");
		if(indexOfAmp > -1){
			rtn_url = url.substring(start+3, indexOfAmp);
		}
		else{
			rtn_url = url.substring(start+3);
		}
	}
	else{
		// for shor url like https://youtu.be/PkyGvALhmyY
		start = url.lastIndexOf("/");
		rtn_url = url.substring(start+1);
	}
	console.log(rtn_url);
	return rtn_url;
}
// print time stamp for console log messages
function printTimeStamp(){
	var current_date = new Date();
	var time_string = current_date.getHours() + ":" + current_date.getMinutes() + ":" + current_date.getSeconds();
	return time_string;
}
