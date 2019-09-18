class Player{
    constructor(room) {
        this.room = room;
        this.player = undefined;
        this.room.player = this;

        this.onYouTubeIframeAPIReady = this.onYouTubeIframeAPIReady.bind(this);
        this.onPlayerReady = this.onPlayerReady.bind(this);
        this.onPlayerStateChange = this.onPlayerStateChange.bind(this);

        this.updateVideoState = this.updateVideoState.bind(this);
        this.setVideoDuration = this.setVideoDuration.bind(this);
        this.changeVideo = this.changeVideo.bind(this);
    }

    // returns videos id from the string
    parseURL(url){
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
        return rtn_url;
    }

    onYouTubeIframeAPIReady() {
        const video_id = this.parseURL(this.room.starting_url);
        this.player = new YT.Player('video', {
            height: '500',
            width: '100%',
            videoId: video_id,
            playerVars: {
                rel: 0,
                controls: 0,
                autplay: 0,
                disablekb: 1
            },
            events: {
                'onReady': this.onPlayerReady,
                'onStateChange': this.onPlayerStateChange
            }
        });
    }
    
    // 4. The API will call this function when the video player is ready.
    onPlayerReady(event) {
        const room = this.room;
        const outter_player = this;
        // bind event
        $("#video-toggle").click(function () {
            if (room.video.playing) {
                // emit event
                room.socketEvents.pauseVideo();
                outter_player.pauseVideo();
            }
            else {
                // emit
                room.socketEvents.playVideo();
                outter_player.playVideo();
            }
            room.video.playing = !room.video.playing;
            // $(this).find("i.fas").toggleClass("fa-play fa-pause");
        });
        this.changeVideo(this.room.starting_url);
        this.pauseVideo();
        this.player.seekTo(this.room.starting_time, true);
    }

    playVideo(){
        // change icon on control
        $("#video-toggle").find("i.fas").removeClass("fa-play");
        $("#video-toggle").find("i.fas").addClass("fa-pause");
        // gets current time from server, if it is in front of current local time, it will seek to it.
        const outter_player = this;
        this.room.socket.emit("get video time",{room: this.room.roomId},function(data){
            console.log("get video time callback");
            
            const seekTime = data.videoTime;
            if(seekTime > outter_player.player.getCurrentTime()){
                outter_player.player.seekTo(seekTime, true);
                outter_player.player.playVideo();
            }
            else{
                outter_player.player.playVideo();
            }
        });
    }

    pauseVideo(){
        console.log("video paused");
        
        // change icon
        $("#video-toggle").find("i.fas").addClass("fa-play");
        $("#video-toggle").find("i.fas").removeClass("fa-pause");
        this.player.pauseVideo();
    }
    
    onPlayerStateChange(event) {
        if (event.data == YT.PlayerState.PLAYING) {
            if (this.room.was_buff) {
                this.room.socketEvents.playVideo();
                this.playVideo();
                this.room.was_buff = false;
            }
            // set interval
            this.setVideoDuration();
            this.interval = setInterval(this.updateVideoState, 1000);
        }
        if (event.data == YT.PlayerState.PAUSED) {
            clearInterval(this.interval);
        }
        if (event.data == YT.PlayerState.BUFFERING) {
            this.room.was_buff = true;
            this.room.socketEvents.pauseVideo();
        }
    }

    // update video state each second
    updateVideoState(){
        // get current time
        const get_current_time = this.player.getCurrentTime();
        const current_time = this.parseTime(get_current_time);
        let final = "";
        if(current_time.hours > 0){
            final += current_time.hours + ":";
        }
        final += current_time.mins + ":";
        final += current_time.secs;
        // update video timeline
        const percent = (get_current_time/this.room.video.duration.value)*100;
        $("#video-slider-front").width(percent + "%");
        // change time label
        $("#video-time").html(final + " / " + this.room.video.duration.string);
        // emit the updated time
        this.room.socketEvents.updateVideoTime(this.player);
    }

    setVideoDuration(){
        // get the video duration
        const getDuration  = this.player.getDuration();
        const duration = this.parseTime(getDuration);
        this.room.video.duration.value = getDuration; 
        this.room.video.duration.string = "";
        if(duration.hours > 0){
            this.room.video.duration.string += duration.hours + ":";
        }
        this.room.video.duration.string += duration.mins + ":";
        this.room.video.duration.string += duration.secs;
    }

    changeVideo(videoUrlOrID){
        let new_video_id = "";
        new_video_id = this.parseURL(videoUrlOrID);
        if(new_video_id.length > 0){
            this.player.seekTo(0, true);
            this.player.cueVideoById(new_video_id);
        }
    }

    parseTime(seconds){
        let hours = Math.floor(seconds/3600);
        seconds -= hours*3600;
        let mins = Math.floor(seconds/60);
        seconds -= mins*60;
        let secs = Math.floor(seconds);
        if(hours < 10){
            hours = "0"+hours;
        }
        if(mins<10){
            mins = "0"+mins;
        }
        if(secs<10){
            secs = "0"+secs;
        }
        return { hours: hours, mins: mins, secs: secs }
    }
}