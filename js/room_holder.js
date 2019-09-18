// room and user come from the .pug template where they are loaded from backend
const roomClass = new Room(room, user);

const player = new Player(roomClass);

function onYouTubeIframeAPIReady(){
    player.onYouTubeIframeAPIReady();
}

$(document).ready(function(){
	// set title
	$("title").html("Room - " + room);
	// search yt api
	$("#search-btn").click(searchYoutube);
	// on click on search result card
	$("#video-search-results").on("click", "div.yt-search-result-card", searchResultCardClicked);
	// show time on mouse move
	$("#video-slider").mousemove(function(e){
		let offset = $(this).offset();
		let left = Math.abs(e.pageX - offset.left);
		let totalWidth = $("#video-slider").width();
		let percentage = ( left / totalWidth );
		const preview_time = player.parseTime(roomClass.video.duration.value * percentage);
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
			"display": "inline"
		});
	});
	$("#video-slider").mouseleave(function(){
		$("#video-time-preview").hide();
	});
	// seek on click
	$("#video-slider").click(function(e){
		clearInterval(player.interval);
		let offset = $(this).offset();
		let left = Math.abs(e.pageX - offset.left);
		let totalWidth = $("#video-slider").width();
		let percentage = ( left / totalWidth );
		roomClass.socket.emit("sync on seek",{
			videoTime: roomClass.video.duration.value * percentage,
			room: roomClass.roomId
		});
		player.player.seekTo(roomClass.video.duration.value * percentage, true);
		player.playVideo();
		player.interval = setInterval(player.updateVideoState, 1000);
	});
	// hide and show controls
	$("#video-wrapper").mouseenter(function(){
		$("#controls-wrapper").fadeIn(300);
	});
	$("#video-wrapper").mouseleave(function(){
		$("#controls-wrapper").fadeOut(300);
	});
    // change embed url
	$("#change-btn").on("click",function(){
		const url_new = $("#embed-url").val();
		if(testUrl(url_new)){
			socket.emit("change url",{url: url_new, username: user, room: room},function(data){
				addNotification(data.feedback,data.time);
			});
			changeVideo(url_new);
			playVideo();
			setVideoDuration();
		}
	});
    // leave room
    $("#leave-room").click(function(event){
        event.preventDefault();
        closeIt();
        location.replace("/");
    });
    // open notifications
	$("#show-notify").click(function(){
		$("body").addClass("remove-scroll");
		$("#notification-list-wrapper").fadeIn(500);
	});
    // open users
	$("#show-users").click(function(){
		$("body").addClass("remove-scroll");
		$("#users-list-wrapper").fadeIn(500);
	});
	//close whole screen divs
	$(".close-ws-div").click(function(){
		$("body").removeClass("remove-scroll");
		$(this).parents().eq(2).fadeOut(500);
	});
	// clear notif
	$("#notification-list").on("click",".clear-notification",function(){
		const button = $(this);
		const notification_list = button.parents().eq(1);
		button.parent().remove();
		const wrappers = notification_list.find(".notification-card-wrapper");
		if(wrappers.length == 0){
            $("#clear-all-notifications").hide();
			notification_list.append("<h3 align = 'center' class = 'no-notif-text white-text'>No new notifications!</h3>")
		}
	});
	// CLEAR ALL NOTIFICATIONS
	$("#clear-all-notifications").click(function(){
		$("#notification-list").find(".notification-card-wrapper").remove();
		$("#notification-list").append("<h3 align = 'center' class = 'no-notif-text white-text'>No new notifications!</h3>")
		$(this).css("display","none");
	});
	// close whole screen divs on esc
	$( document ).on( 'keydown', function ( e ) {
		if ( e.keyCode === 27) { // ESC
			$("body").removeClass("remove-scroll");
			$(".ws-div").fadeOut(500);
	    }
	});
});

// YOUTUBE SEARCH

function searchYoutube(e) {
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

function searchResultCardClicked(e){
	let videoId = $(this).find(".video-id-input").val();
	if (videoId.length > 0) {
		videoId = "?v=" + videoId;
		roomClass.socket.emit("change url", { url: videoId, username: user, room: room }, function (data) {
			roomClass.addNotification(data.feedback, data.time);
		});
		roomClass.player.changeVideo(videoId);
		roomClass.player.playVideo();
		roomClass.player.setVideoDuration();
	}
}

function testUrl(website){
	return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(website);
}

// on close remove user
function closeIt()
{
	roomClass.socketEvents.userLeftRoom();
}
window.onunload = closeIt;
window.onbeforeunload = closeIt;