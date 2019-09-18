class SocketEvents{

    constructor(){
        
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
            addNotification(data.message);
            this.starting_url = data.videoUrl;
            var users_list = data.usersList;
            refreshUsersList(users_list);
            this.starting_time = data.videoTime;
            this.starting_state = data.state;
            // load the qr code
            const qrcode = new QRCode(document.getElementById("room-qr-code"), {
                text: "http://you-sync.herokuapp.com/join/" + room,
                width: 128,
                height: 128,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            $("#room-qr-code").append('<h4 align = "left" class = "red-text">' + room + '</h4>')
        }
    }

    // LISTENERS
    onSync(data){
        if (data.videoTime) {
            player.seekTo(data.videoTime, true);
            playVideo();
        }
    }

    onControl(data){
        let message = data.user;
        if (data.control == "play") {
            message += " played the video.";
            playVideo();
        }
        if (data.control == "pause") {
            message += " paused the video.";
            pauseVideo();
        }
        addNotification(message, data.time);
    }

    onJoined(data){
        addNotification(data.message, data.time);
        refreshUsersList(data.users_list);
    }

    someoneLeft(data){
        addNotification(data.message, data.time);
        refreshUsersList(data.users_list);
    }

    embedURLChanged(data){
        changeVideo(data.url);
        playVideo();
        const message = data.user + " changed video id to: " + parseURL(data.url);
        addNotification(message, data.time);
    }

    videoStateChanged(data){
        if (data.state != null) {
            player.seekTo(data.state, true);
        }
    }
}