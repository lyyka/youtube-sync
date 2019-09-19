class SocketEvents{

    constructor(room){
        this.room = room;
        this.socket = room.socket;

        this.joinRoom = this.joinRoom.bind(this);
        this.userLeftRoom = this.userLeftRoom.bind(this);
        this.playVideo = this.playVideo.bind(this);
        this.pauseVideo = this.pauseVideo.bind(this);
        this.updateVideoTime = this.updateVideoTime.bind(this);
        this.onSync = this.onSync.bind(this);
        this.onControl = this.onControl.bind(this);
        this.onJoined = this.onJoined.bind(this);
        this.someoneLeft = this.someoneLeft.bind(this);
        this.embedURLChanged = this.embedURLChanged.bind(this);
        this.videoStateChanged = this.videoStateChanged.bind(this);
    }

    // EMITTERS

    // when user first joins the room
    joinRoom(data){
        if (data.status == -1) {
            window.location.replace("/create");
        }
        if (data.status == 0) {
            window.location.replace("/join");
        }
        if (data.status == 1) {
            this.room.addNotification(data.message);
            this.room.starting_url = data.videoUrl;
            this.room.refreshUsersList(data.usersList);
            this.room.starting_time = data.videoTime;
            this.room.starting_state = data.state;
            // load the qr code
            const qrcode = new QRCode(document.getElementById("room-qr-code"), {
                text: "http://" + window.location.hostname + "/join/" + room,
                width: 128,
                height: 128,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            $("#room-qr-code").append('<h4 align = "left" class = "red-text">' + room + '</h4>');
        }
    }

    // when the browser closes or is refreshed
    userLeftRoom(){
		this.socket.emit("leave room",{username: this.room.username, room: this.room.roomId});
    }

    // emits play video cotnrol to the server which broadcasts control to all members
    playVideo(){
        const room = this.room;
        this.socket.emit("play video", { username: this.room.username, room: this.room.roomId }, function (data) {
            room.addNotification(data.feedback, data.time);
        });
    }

    // emits pause video cotnrol to the server which broadcasts control to all members
    pauseVideo(){
        const room = this.room;
        this.socket.emit("pause video", { username: this.room.username, room: this.room.roomId }, function (data) {
            room.addNotification(data.feedback, data.time);
        });
    }

    // emit video time and room to sync on trackbar seek
    syncOnSeek(videoTime, room){
        alert("Emit seek to " + videoTime);
        
        this.socket.emit("sync on seek", {
            videoTime: videoTime,
            room: room
        });
    }

    // updates video time on the server
    updateVideoTime(player){
        this.socket.emit("update video time",{videoTime: player.getCurrentTime(), room: this.room.roomId});
    }

    // LISTENERS

    onSync(data){
        if (data.videoTime) {
            alert("Should sync to " + data.videoTime);
            this.room.player.YTPlayer.seekTo(data.videoTime, true);
            this.room.player.playVideo();
        }
    }

    // when someone plays/pauses the video, that control gets sent over the server to each room member
    // this is a callback when a user receives the control from the server
    onControl(data){
        if (data.control == "play") {
            data.user += " played the video.";
            this.room.player.playVideo();
        }
        if (data.control == "pause") {
            data.user += " paused the video.";
            this.room.player.pauseVideo();
        }
        this.room.addNotification(data.user, data.time);
    }

    // when user joins to the room
    onJoined(data){
        this.room.addNotification(data.message, data.time);
        this.room.refreshUsersList(data.users_list);
    }

    // when user leaves the room
    someoneLeft(data){
        this.room.addNotification(data.message, data.time);
        this.room.refreshUsersList(data.users_list);
    }

    // when the embed URL is changed
    embedURLChanged(data){
        this.room.player.changeVideo(data.url);
        this.room.player.playVideo();
        const message = data.user + " changed video id to: " + this.room.player.parseURL(data.url);
        this.room.addNotification(message, data.time);
    }

    videoStateChanged(data){
        if (data.state != null) {
            this.room.player.seekTo(data.state, true);
        }
    }
}