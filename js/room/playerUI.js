class PlayerUI{
    constructor(player){
        this.player = player;
        this.registerEventHandlers = this.registerEventHandlers.bind(this);
    }

    registerEventHandlers(){
        this.videoSlider_MouseMove = this.videoSlider_MouseMove.bind(this);
        this.videoSlider_Click = this.videoSlider_Click.bind(this);
        this.onEmbedUrlInputChange = this.onEmbedUrlInputChange.bind(this);

        // show time on mouse move
        $("#video-slider").mousemove(this.videoSlider_MouseMove);
        $("#video-slider").mouseleave(function(e){
            $("#video-time-preview").hide();
        });

        // seek on click
        $("#video-slider").click(this.videoSlider_Click);

        // hide and show controls
        $("#video-wrapper").mouseenter(function(){
            $("#controls-wrapper").fadeIn(300);
        });
        $("#video-wrapper").mouseleave(function(){
            $("#controls-wrapper").fadeOut(300);
        });

        // change embed url
        $("#change-btn").on("click", this.onEmbedUrlInputChange);
    }

    onEmbedUrlInputChange(event){
        const url_new = $("#embed-url").val();
        if(this.testUrl(url_new)){
           this.player.room.socket.emit("change url",{url: url_new, username: this.player.room.username, room: this.player.room.roomId},function(data){
                    addNotification(data.feedback,data.time);
                }
            );
            this.player.changeVideo(url_new);
            this.player.playVideo();
            this.player.setVideoDuration();
        }
    }

    videoSlider_MouseMove(e){
        const offset = $("#video-slider").offset();
        const left = Math.abs(e.pageX - offset.left);
        const totalWidth = $("#video-slider").width();
        const percentage = ( left / totalWidth );
        const preview_time = this.player.parseTime(roomClass.video.duration.value * percentage);
        let preview_time_string = "";
        if(preview_time.hours > 0){
            preview_time_string += preview_time.hours + ":";
        }
        preview_time_string += preview_time.mins + ":" + preview_time.secs;
        //
        const preview_element = $("#video-time-preview");
        preview_element.html(preview_time_string);
        preview_element.css({
            "left": left,
            "top": "-40px",
            "display": "inline",
            "padding-left": "7px",
            "padding-right": "7px",
        });
    }

    videoSlider_Click(e){
        clearInterval(this.player.interval);
        let offset = $("#video-slider").offset();
        let left = Math.abs(e.pageX - offset.left);
        let totalWidth = $("#video-slider").width();
        let percentage = ( left / totalWidth );
        this.player.pauseVideo();
        this.player.YTPlayer.seekTo(this.player.room.video.duration.value * percentage, true);
        this.player.room.socketEvents.syncOnSeek(this.player.room.video.duration.value * percentage, this.player.room.roomId);
        this.player.interval = setInterval(this.player.updateVideoState, 1000);
    }

    testUrl(website){
        return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(website);
    }
}