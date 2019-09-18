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
            var users_list = data.usersList;
            this.room.refreshUsersList(users_list);
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
            $("#room-qr-code").append('<h4 align = "left" class = "red-text">' + room + '</h4>')
        }
    }

    userLeftRoom(){
		this.socket.emit("leave room",{username: this.room.username, room: this.room.roomId});
    }

    playVideo(){
        const room = this.room;
        this.socket.emit("play video", { username: this.room.username, room: this.room.roomId }, function (data) {
            room.addNotification(data.feedback, data.time);
        });
    }

    pauseVideo(){
        const room = this.room;
        this.socket.emit("pause video", { username: this.room.username, room: this.room.roomId }, function (data) {
            room.addNotification(data.feedback, data.time);
        });
    }

    updateVideoTime(player){
        this.socket.emit("update video time",{videoTime: player.getCurrentTime(), room: this.room.roomId});
    }

    // LISTENERS
    onSync(data){
        if (data.videoTime) {
            player.seekTo(data.videoTime, true);
            this.room.player.playVideo();
        }
    }

    onControl(data){
        if (data.control == "play") {
            console.log("play control");
            
            data.user += " played the video.";
            this.room.player.playVideo();
        }
        if (data.control == "pause") {
            console.log("pause control");
            data.user += " paused the video.";
            this.room.player.pauseVideo();
        }
        this.room.addNotification(data.user, data.time);
    }

    onJoined(data){
        this.room.addNotification(data.message, data.time);
        this.room.refreshUsersList(data.users_list);
    }

    someoneLeft(data){
        this.room.addNotification(data.message, data.time);
        this.room.refreshUsersList(data.users_list);
    }

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