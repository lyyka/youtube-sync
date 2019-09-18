class YTSearch{
    constructor(room){
        this.room = room;
        // search yt api
        $("#search-btn").click(this.searchYoutube);
        // on click on search result card
        $("#video-search-results").on("click", "div.yt-search-result-card", this.searchResultCardClicked);

        this.searchYoutube = this.searchYoutube.bind(this);
        this.searchResultCardClicked = this.searchResultCardClicked.bind(this);
    }

    searchYoutube(e) {
        // reference
        // https://developers.google.com/youtube/v3/docs/search/list#usage
        //
        const q = $("#search-video").val();
        if (q != undefined && q.trim().length > 0) {
            $("#video-search-results").empty();
            const search_request = $.get({
                url: "https://www.googleapis.com/youtube/v3/search",
                data: {
                    part: "snippet",
                    maxResults: 50,
                    q: q,
                    type: "video",
                    videoEmbeddable: "true",
                    videoSyndicated: "true",
                    key: "AIzaSyAayCuwKXQgIRrj2xB8WbReNj6lLffs1-A"
                }
            });
            search_request.done(function (data) {
                data.items.forEach(search_result => {
    
                    const thumbnail = search_result.snippet.thumbnails.default.url;
                    const title = search_result.snippet.title;
                    const channelTitle = search_result.snippet.channelTitle;
                    const videoId = search_result.id.videoId;
    
                    $("#video-search-results").append(
                        '<div class = "yt-search-result-card"><div class = "yt-search-result-card-inner"><img src = "' + thumbnail + '" class = "img-fluid" /><br /><h4>' + title + '</h4><p>' + channelTitle + '</p><input type = "text" class = "video-id-input hide" value = "' + videoId + '" /></div></div>'
                    );
                });
            });
            search_request.fail(function (data) {
                $("#video-search-results").append("<h3 class = 'align-center'>Error</h3>");
            });
        }
    }
    
    searchResultCardClicked(e){
        let videoId = $(this).find(".video-id-input").val();
        if (videoId.length > 0) {
            videoId = "?v=" + videoId;
            this.room.socket.emit("change url", { url: videoId, username: user, room: room }, function (data) {
                this.room.addNotification(data.feedback, data.time);
            });
            this.room.player.changeVideo(videoId);
            this.room.player.playVideo();
            this.room.player.setVideoDuration();
        }
    }
}