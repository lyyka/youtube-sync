let video_playing = true;

let starting_url = "";
let starting_time = 0;
let starting_state = "paused";

let current_video_duration;
let current_video_duration_string;

let was_buff = false;

let interval;

const socket = io();
// join the user to the room
socket.emit("join room",{username: user,room: room},function(data){
	if(data.status == -1){
		alert("This room does not exist!");
		window.location.replace("/create");
	}
	if(data.status == 0){
		alert("That username is taken!");
		window.location.replace("/join");
	}
	if(data.status == 1){
		showNotification(data.message);
		starting_url = data.videoUrl;
		var users_list = data.usersList;
		refreshUsersList(users_list);
		starting_time = data.videoTime;
		starting_state = data.state;
		// load the qr code
        const qrcode = new QRCode(document.getElementById("room-qr-code"), {
            text: "http://you-sync.herokuapp.com/join/" + room,
            width: 128,
            height: 128,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
        $("#room-qr-code").append('<h4 align = "left" class = "red-text">' + room + '</h4>')
	}
});

// YOUTUBE API

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
	// bind events
	$("#video-toggle").click(function(){
		if(video_playing){
			socket.emit("pause video",{username:user,room:room},function(data){
				showNotification(data.feedback,data.time);
			});
			pauseVideo();
		}
		else{
			socket.emit("play video",{username:user,room:room},function(data){
				showNotification(data.feedback,data.time);
			});
			playVideo();
		}
		video_playing = !video_playing;
		// $(this).find("i.fas").toggleClass("fa-play fa-pause");
	});
	changeVideo(starting_url);
	pauseVideo();
	player.seekTo(starting_time,true);
}

function onPlayerStateChange(event){
	if (event.data == YT.PlayerState.PLAYING) {
		if(was_buff){
			socket.emit("play video",{username:user,room:room},function(data){
				showNotification(data.feedback,data.time);
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
    if(event.data == YT.PlayerState.BUFFERING){
    	was_buff = true;
    	socket.emit("pause video",{username:user,room:room},function(data){
			showNotification(data.feedback,data.time);
		});
    }
}

// END YOUTUBE API

// when control is received
socket.on('control', function (data) {
	let message = data.user;
	if(data.control == "play"){
		message += " played the video.";
		playVideo();
	}
	if(data.control == "pause"){
		message += " paused the video.";
		pauseVideo();
	}
	showNotification(message,data.time);
});
// notify users when someone joins
socket.on("joined",function(data){
	showNotification(data.message,data.time);
	refreshUsersList(data.users_list);
});
// notify users when someone leaves
socket.on("left",function(data){
	showNotification(data.message,data.time);
	refreshUsersList(data.users_list);
});
// when embed video is changed
socket.on("change embed url",function(data){
	changeVideo(data.url);
	playVideo();
	const message = data.user + " changed video id to: " + parseURL(data.url);
	showNotification(message,data.time);
});
// receive video state change event
socket.on("video state change",function(data){
	if(data.state != null){
		player.seekTo(data.state,true);
	}
});
$(document).ready(function(){
	// set title
	$("title").html("Room - " + room);
	// set padding for body on bottom
	$("body").css("padding-bottom",$("#footer").height()+50);
	// on resize fix padding for footer
	$(window).resize(function(){
		if($(window).width() <= 770){
			$("body").css("padding-bottom",$("#footer").height()+50+10);
		}
		else{
			$("body").css("padding-bottom",$("#footer").height()+50);
		}
	});
	// search yt api
	$("#search-btn").click(function(){
		// reference
		// https://developers.google.com/youtube/v3/docs/search/list#usage
		//
		const q = $("#search-video").val();
		if(q != undefined && q.trim().length > 0){
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
			search_request.done(function(data){
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
			search_request.fail(function(data){
				console.log(data);
				$("#video-search-results").append("<h3 class = 'align-center'>Error</h3>");
			});
		}
	});
	// on click on search result card
	$("#video-search-results").on("click", "div.yt-search-result-card", function(){
		let videoId = $(this).find(".video-id-input").val();
		if(videoId.length > 0){
			videoId = "?v=" + videoId;
			socket.emit("change url",{url: videoId, username: user, room: room},function(data){
				showNotification(data.feedback,data.time);
			});
			changeVideo(videoId);
			playVideo();
			setVideoDuration();
		}
	});
    // change embed url
	$("#change-btn").on("click",function(){
		const url_new = $("#embed-url").val();
		if(testUrl(url_new)){
			socket.emit("change url",{url: url_new, username: user, room: room},function(data){
				showNotification(data.feedback,data.time);
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
		$("#notification-list-wrapper").fadeIn(500);
		// fixNotificationCards();
	});
    // see all users
	$("#show-users").click(function(){
		$("#users-list-wrapper").fadeIn(500);
	});
	//close notif center
	$(".close-ws-div").click(function(){
		$(this).parents().eq(2).fadeOut(500);
	});
	//clear notif
	$("#notification-list").on("click",".clear-notification",function(){
		const button = $(this);
		let notification_list = button.parents().eq(1);
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
			$(".ws-div").fadeOut(500);
	    }
	});
});

function playVideo(){
	$("#video-toggle").find("i.fas").removeClass("fa-play");
	$("#video-toggle").find("i.fas").addClass("fa-pause");
	socket.emit("get video time",{room: room},function(data){
		const seekTime = data.videoTime;
		if(seekTime > player.getCurrentTime()){
			player.seekTo(data.videoTime,true);
			player.playVideo();
		}
		else{
			player.playVideo();
		}
	});
}
function pauseVideo(){
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
function showNotification(text){
	$("#notification-list").find(".no-notif-text").remove();
	$("#clear-all-notifications").show();
	$("#notification-list").append('<div class="notification-card-wrapper"><label class="card">' + text + '</label><button type="button" class="my-btn fill-red clear-notification"><i class = "fas fa-times"></i></button></div>');
	// fixNotificationCards();
}
function fixNotificationCards(){
	// FIX NOTIFICATION BUTTONS
	let wrappers = $(".notification-card-wrapper");
	for (var i = wrappers.length - 1; i >= 0; i--) {
		let wrapper = wrappers.eq(i);

		// fix button
		let label = wrapper.find(".card");
		let button = wrapper.find(".clear-notification");
		label.css("padding-right", button.width() + 5);
		button.height(label.height()+2);

		// fix margin of the card
		wrapper.height(label.height()*2);
	}
}
function addUser(username){
	$("#users-list").append('<label class = "card">' + username + '</label>');
}
function testUrl(website){
	return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(website);
}
function closeIt()
{
	socket.emit("leave room",{username: user, room: room});
}
window.onunload = closeIt;
window.onbeforeunload = closeIt;
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
	const percent = (get_current_time/current_video_duration)*100;
	$("#video-slider-front").width(percent + "%");
	// change time label
	$("#video-time").html(final + " / " + current_video_duration_string);
	// emit the updated time
	socket.emit("update video time",{videoTime: player.getCurrentTime(), room: room});
}
function setVideoDuration(){
	// get the video duration
	const getDuration  = player.getDuration();
	const duration = parseTime(getDuration);
	current_video_duration = getDuration; 
	current_video_duration_string = "";
	if(duration.hours > 0){
		current_video_duration_string += duration.hours + ":";
	}
	current_video_duration_string += duration.mins + ":";
	current_video_duration_string += duration.secs;
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