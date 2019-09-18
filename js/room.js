class Room{

	constructor(roomId, username){
		this.roomId = roomId;
		this.username = username;
		this.starting_url = "";
		this.starting_time = 0;
		this.starting_state = "paused"

		this.video = {
			playing: true,
			duration: {
				value: 0,
				string: "00:00:00"
			}
		}

		this.was_buff = false;
		this.interval = undefined;

		this.socket = io();
		this.socketEvents = new SocketEvents();
		this.registerEvents = this.registerEvents.bind(this);
		this.registerEvents();
	}

	registerEvents(){
		this.socket.emit("join room", { username: this.username, room: this.roomId }, this.socketEvents.joinRoom);
		
		// when someone seeks, this function syncs everyone to that seek
		this.socket.on("sync", this.socketEvents.onSync);

		// when control is received
		socket.on('control', this.socketEvents.onControl);

		// notify users when someone joins
		socket.on("joined", this.socketEvents.onJoined);

		// notify users when someone leaves
		socket.on("left", this.socketEvents.someoneLeft);

		// when embed video is changed
		socket.on("change embed url", this.socketEvents.embedURLChanged);

		// receive video state change event
		socket.on("video state change", fthis.socketEvents.videoStateChanged);
	}

}

// room and user come from the .pug template where they are loaded from backend
const roomClass = new Room(room, user);

let player;
function onYouTubeIframeAPIReady() {
	const video_id = parseURL(starting_url);
	player = new YT.Player('video', {
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
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange
		}
	});
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
	// bind event
	$("#video-toggle").click(function () {
		if (video.playing) {
			// emit event
			socket.emit("pause video", { username: user, room: room }, function (data) {
				addNotification(data.feedback, data.time);
			});
			pauseVideo();
		}
		else {
			// emit
			socket.emit("play video", { username: user, room: room }, function (data) {
				addNotification(data.feedback, data.time);
			});
			playVideo();
		}
		video.playing = !video.playing;
		// $(this).find("i.fas").toggleClass("fa-play fa-pause");
	});
	changeVideo(starting_url);
	pauseVideo();
	player.seekTo(starting_time, true);
}

function onPlayerStateChange(event) {
	if (event.data == YT.PlayerState.PLAYING) {
		if (was_buff) {
			socket.emit("play video", { username: user, room: room }, function (data) {
				addNotification(data.feedback, data.time);
			});
			playVideo();
			was_buff = false;
		}
		// set interval
		setVideoDuration();
		interval = setInterval(updateVideoState, 1000);
	}
	if (event.data == YT.PlayerState.PAUSED) {
		clearInterval(interval);
	}
	if (event.data == YT.PlayerState.BUFFERING) {
		was_buff = true;
		socket.emit("pause video", { username: user, room: room }, function (data) {
			addNotification(data.feedback, data.time);
		});
	}
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
		const preview_time = parseTime(video.duration.value * percentage);
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
		clearInterval(interval);
		let offset = $(this).offset();
		let left = Math.abs(e.pageX - offset.left);
		let totalWidth = $("#video-slider").width();
		let percentage = ( left / totalWidth );
		socket.emit("sync on seek",{
			videoTime: video.duration.value * percentage,
			room: room
		});
		player.seekTo(video.duration.value * percentage, true);
		playVideo();
		interval = setInterval(updateVideoState, 1000);
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
		socket.emit("change url", { url: videoId, username: user, room: room }, function (data) {
			addNotification(data.feedback, data.time);
		});
		changeVideo(videoId);
		playVideo();
		setVideoDuration();
	}
}

function playVideo(){
	// change icon on control
	$("#video-toggle").find("i.fas").removeClass("fa-play");
	$("#video-toggle").find("i.fas").addClass("fa-pause");
	// gets current time from server, if it is in front of current local time, it will seek to it.
	socket.emit("get video time",{room: room},function(data){
		const seekTime = data.videoTime;
		if(seekTime > player.getCurrentTime()){
			player.seekTo(seekTime, true);
			player.playVideo();
		}
		else{
			player.playVideo();
		}
	});
}
function pauseVideo(){
	// change icon
	$("#video-toggle").find("i.fas").addClass("fa-play");
	$("#video-toggle").find("i.fas").removeClass("fa-pause");
	player.pauseVideo();
}
function changeVideo(videoUrlOrID){
	let new_video_id = "";
	new_video_id = parseURL(videoUrlOrID);
	if(new_video_id.length > 0){
		player.seekTo(0, true);
		player.cueVideoById(new_video_id);
	}
}
function refreshUsersList(users_list){
	$("#users-list").find(".card").remove();
	for (var i = 0; i < users_list.length; i++) {
		addUser(users_list[i]);
	}
}
function addNotification(text){
	$("#notification-list").find(".no-notif-text").remove();
	$("#clear-all-notifications").show();
	$("#notification-list").append('<div class="notification-card-wrapper"><label class="card">' + text + '</label><button type="button" class="my-btn fill-red clear-notification"><i class = "fas fa-times"></i></button></div>');
}
function addUser(username){
	$("#users-list").append('<label class = "card">' + username + '</label>');
}
function testUrl(website){
	return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(website);
}
// on close remove user
function closeIt()
{
	socket.emit("leave room",{username: user, room: room});
}
window.onunload = closeIt;
window.onbeforeunload = closeIt;
// update video state each second
function updateVideoState(){
	// get current time
	const get_current_time = player.getCurrentTime();
	const current_time = parseTime(get_current_time);
	let final = "";
	if(current_time.hours > 0){
		final += current_time.hours + ":";
	}
	final += current_time.mins + ":";
	final += current_time.secs;
	// update video timeline
	const percent = (get_current_time/video.duration.value)*100;
	$("#video-slider-front").width(percent + "%");
	// change time label
	$("#video-time").html(final + " / " + video.duration.string);
	// emit the updated time
	socket.emit("update video time",{videoTime: player.getCurrentTime(), room: room});
}
function setVideoDuration(){
	// get the video duration
	const getDuration  = player.getDuration();
	const duration = parseTime(getDuration);
	video.duration.value = getDuration; 
	video.duration.string = "";
	if(duration.hours > 0){
		video.duration.string += duration.hours + ":";
	}
	video.duration.string += duration.mins + ":";
	video.duration.string += duration.secs;
}
function parseTime(seconds){
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
// returns videos id from the string
function parseURL(url){
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