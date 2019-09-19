class SocketController{
    constructor(){
        this.rooms = {};
        this.starting_url = "https://www.youtube.com/watch?v=EwRdKJURDHw";
        this.onEstablishedConnection = this.onEstablishedConnection.bind(this);
        this.registerEvents = this.registerEvents.bind(this);
        this.changeUrl = this.changeUrl.bind(this);
        this.playVideo = this.playVideo.bind(this);
        this.pauseVideo = this.pauseVideo.bind(this);
        this.syncOnSeekbarChange = this.syncOnSeekbarChange.bind(this);
        this.getVideoTime = this.getVideoTime.bind(this);
        this.updateVideoTime = this.updateVideoTime.bind(this);
        this.generateRoomCode = this.generateRoomCode.bind(this);
        this.joinRoom = this.joinRoom.bind(this);
        this.leaveRoom = this.leaveRoom.bind(this);
        this.removeRoomIfEmpty = this.removeRoomIfEmpty.bind(this);
    }

    onEstablishedConnection(socket){
        this.socket = socket;
        
        this.registerEvents();
    }

    // REGISTER EVENTS
    registerEvents(){
        // changes video url for all users in a room
        this.socket.on("change url", this.changeUrl);

        // play video
        this.socket.on("play video", this.playVideo);

        // pause video
        this.socket.on("pause video", this.pauseVideo);

        // sync this.rooms on seekbar change
        this.socket.on("sync on seek", this.syncOnSeekbarChange);

        // get current video time in room
        this.socket.on("get video time", this.getVideoTime);

        // while the video is playing get it's current time so when someone connects, he starts from the time others are listening at the moment
        this.socket.on("update video time", this.updateVideoTime);

        // generates new room
        this.socket.on("generate-room-code", this.generateRoomCode);

        // adds user to the room
        this.socket.on("join room", this.joinRoom);

        // when user leaves the room
        this.socket.on("leave room", this.leaveRoom);
    }

    // WHEN IN ROOM

    changeUrl(data, fn){
        if (this.rooms[data.room]) {
            // change url for room
            this.rooms[data.room].currVideo = data.url;
            // roll back time to 0
            this.rooms[data.room].currTime = 0;
            // broadcast change to room
            this.socket.broadcast.to(data.room).emit("change embed url", { url: data.url, user: data.username, time: this.printTimeStamp() });
            // log the event in console
            console.log(data.username + " has changed the video in " + data.room + " @ " + this.printTimeStamp());
            // log the event in user interface
            fn({ feedback: "You changed the video id to: " + this.parseYouTubeURL(data.url), time:this. printTimeStamp() });
        }
    }

    playVideo(data, fn){
        if (this.rooms[data.room]) {
            // change state of the room to playing
            this.rooms[data.room].state = "playing";
            // broadcast change to room
            this.socket.broadcast.to(data.room).emit("control", { user: data.username, control: "play", time: this.printTimeStamp() });
            // log the event in console
            console.log(data.username + " has played the video in " + data.room + " @ " + this.printTimeStamp());
            // log the event in user interface
            fn({ feedback: "You have played the video", time: this.printTimeStamp() });
        }
    }

    pauseVideo(data, fn){
        if (this.rooms[data.room]) {
            this.rooms[data.room].state = "paused";
            this.socket.broadcast.to(data.room).emit("control", { user: data.username, control: "pause", time: this.printTimeStamp() });
            console.log(data.username + " has paused the video in " + data.room + " @ " + this.printTimeStamp());
            // log the event in user interface
            fn({ feedback: "You have paused the video", time: this.printTimeStamp() });
        }
    }

    syncOnSeekbarChange(data, fn){
        if (this.rooms[data.room]) {
            // update time in room
            this.rooms[data.room].currTime = data.videoTime;
            console.log(data.room + " synced to " + data.videoTime);
            
            this.socket.broadcast.to(data.room).emit("sync", {
                videoTime: data.videoTime
            });
        }
    }

    getVideoTime(data, fn){
        if (this.rooms[data.room]) {
            fn({ videoTime: this.rooms[data.room].currTime });
        }
    }

    updateVideoTime(data, fn){
        if (data.videoTime != null && data.room != null) {
            let room = data.room;
            if (this.rooms[room] != null) {
                this.rooms[room].currTime = data.videoTime;
            }
        }
    }

    // this.rooms

    generateRoomCode(fn){
        let generated = false;
        let room = "";
        while (!generated) {
            const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for (var i = 0; i < 7; i++)
                room += possible.charAt(Math.floor(Math.random() * possible.length));

            if (this.rooms[room] == null) {
                generated = true;
            }
        }
        this.rooms[room] = { users: [], currVideo: this.starting_url, currTime: 0, state: "paused" };
        console.log("New room: " + room + " @ " + this.printTimeStamp());
        fn(room);
    }

    joinRoom(data, fn){
        // get username and room number
        const room = data.room;
        const username = data.username;
        // if room exists
        if (this.rooms[room] != null) {
            // if username is not taken
            if (!this.rooms[room].users.includes(username)) {
                // join the user to room and add him to room variable
                this.socket.username = username;
                this.socket.room = room;
                this.rooms[room].users.push(username);
                this.socket.join(room);
                // broadcast event to all users in room
                this.socket.broadcast.to(room).emit('joined', { message: username + ' joined', users_list: this.rooms[room].users, time: this.printTimeStamp() });
                // log in console
                console.log(username + " has joind the room " + room + " @ " + this.printTimeStamp());
                // send joined user info about the room
                fn({ status: 1, videoUrl: this.rooms[room].currVideo, videoTime: this.rooms[room].currTime, state: this.rooms[room].state, usersList: this.rooms[room].users, message: "You joined the room!" });
            }
            else {
                fn({ status: 0, time: null });
            }
        }
        else {
            fn({ status: -1, time: null });
        }
    }

    leaveRoom(data){
        if (this.rooms[data.room] != null) {
            const room = data.room;
            const index = this.rooms[room].users.indexOf(data.username);
            if (index > -1) {
                this.socket.leave(room);
                this.socket.username = "";
                this.socket.room = "";
                this.socket.disconnect(0);
                this.rooms[room].users.splice(index, 1);
                console.log(data.username + " has left the room " + room + " @ " + this.printTimeStamp());
                this.socket.broadcast.to(room).emit("left", { message: data.username + " left", users_list: this.rooms[room].users, time: this.printTimeStamp() });

                // if room is empty (but wait for some time, in case user just refreshed the page)
                setTimeout(this.removeRoomIfEmpty, 10000, room);
            }
        }
    }

    // UTILITIES

    // delete room if empty, after some period of time
    removeRoomIfEmpty(room) {
        if (this.rooms[room] != undefined) {
            if (this.rooms[room].users.length == 0) {
                delete this.rooms[room];
                console.log(room + " deleted due to no users in it");
            }
        }
    }

    // parse url
    parseYouTubeURL(url) {
        let start = -1;
        let rtn_url = "";
        start = url.lastIndexOf('?v=');
        if (start > -1) {
            // for urls like https://www.youtube.com/watch?v=PkyGvALhmyY
            // if it has more parameters than just video ID
            const indexOfAmp = url.indexOf("&");
            if (indexOfAmp > -1) {
                rtn_url = url.substring(start + 3, indexOfAmp);
            }
            else {
                rtn_url = url.substring(start + 3);
            }
        }
        else {
            // for shor url like https://youtu.be/PkyGvALhmyY
            start = url.lastIndexOf("/");
            rtn_url = url.substring(start + 1);
        }
        console.log(rtn_url);
        return rtn_url;
    }

    // print time stamp for console log messages
    printTimeStamp() {
        var current_date = new Date();
        let hours = current_date.getHours();
        let minutes = current_date.getMinutes();
        let seconds = current_date.getSeconds();
        if(hours < 10){
            hours = "0" + hours;
        }
        if(minutes < 10){
            minutes = "0" + minutes;
        }
        if(seconds < 10){
            seconds = "0" + seconds;
        }
        var time_string = hours + ":" + minutes + ":" + seconds;
        return time_string;
    }
}

module.exports = new SocketController();