class YTSearch{
    constructor(room){
        this.room = room;
        // search yt api
        $("#search-btn").click(this.searchYoutube);
        // on click on search result card
        $("#video-search-results").on("click", "div.yt-search-result-card", function (e) {
            let videoId = $(this).find(".video-id-input").val();
            if (videoId.length > 0) {
                videoId = "?v=" + videoId;
                room.socket.emit("change url", { url: videoId, username: room.username, room: room.roomId }, function (data) {
                    room.addNotification(data.feedback, data.time);
                });
                room.player.changeVideo(videoId);
                room.player.playVideo();
                room.player.setVideoDuration();
            }
        });

        this.searchYoutube = this.searchYoutube.bind(this);
        // this.searchResultCardClicked = this.searchResultCardClicked.bind(this);
    }

    searchYoutube(e) {
        // reference
        // https://developers.google.com/youtube/v3/docs/search/list#usage
        //
        const q = $("#search-video").val();
        if (q != undefined && q.trim().length > 0) {
            $("#yt-search-loading-wrapper").show();
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

                    // main wrapper
                    const card = $("<div></div>", {
                        class: "yt-search-result-card cursor-pointer p-3 mb-2 bg-white shadow-sm border rounded"
                    });
                    // whole row
                    const row = $("<div></div>", {
                        class: "row"
                    });
                    // image column
                    const img_col = $("<div></div>", {
                        class: "col-lg-4"
                    })
                    const thumbnail_img = $("<img/>", {
                        src: thumbnail,
                        class: "img-fluid"
                    });
                    img_col.append(thumbnail_img)
                    // text column
                    const text_column = $("<div></div>", {
                        class: "col-lg-8"
                    });
                    const video_id_input = $("<input/>", {
                        type: "hidden",
                        class: "video-id-input",
                        value: videoId
                    });
                    const title_text = $("<h5></h5>", {
                        class: "text-break"
                    });
                    const substringed_title = title.length > 30 ? (title.substring(0, 30) + "...") : title;
                    title_text.text(substringed_title);
                    const channel_title = $("<p></p>", {
                        class: "text-break"
                    });
                    channel_title.text(channelTitle);
                    text_column.append(video_id_input);
                    text_column.append(title_text);
                    text_column.append(channel_title);

                    row.append(img_col);
                    row.append(text_column);
                    card.append(row);

                    $("#video-search-results").append(card);
                });
                $("#yt-search-loading-wrapper").hide();
            });
            search_request.fail(function (data) {
                $("#video-search-results").append("<h3 class = 'align-center'>Error</h3>");
                $("#yt-search-loading-wrapper").hide();
            });
        }
    }
}