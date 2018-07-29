var query = window.location.search.substring(1);
var qs = parse_query_string(query);
var username = qs.username;
var room = qs.room;

var starting_url = "";
var starting_time = 0;
var starting_state = "paused";

var was_buff = false;

var interval;

var socket = io.connect('http://localhost:8080');
// join the user to the room
socket.emit("join room",{username: username,room:room},function(data){
	if(data.status == -1){
		alert("This room does not exist!");
		window.location.replace("/create");
	}
	if(data.status == 0){
		alert("That username is taken!");
		window.location.replace("/join");
	}
	if(data.status == 1){
		ShowNotification(data.message,data.time);
		starting_url = data.videoUrl;
		var users_list = data.usersList;
		RefreshUsersList(users_list);
		starting_time = data.videoTime;
		starting_state = data.state;
		$("#room-share").html("Share this room with your friends: <span class = 'red-text'>" +
		 room + "</span>");
	}
});

// YOUTUBE API

var player;
function onYouTubeIframeAPIReady() {
	var video_id = parse_yt_url(starting_url);
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
	$("#play-btn").click(function() {
		socket.emit("play video",{username:username,room:room},function(data){
			ShowNotification(data.feedback,data.time);
		});
		PlayVideo();
	});

	$("#pause-btn").click(function() {
		socket.emit("pause video",{username:username,room:room},function(data){
			ShowNotification(data.feedback,data.time);
		});
		PauseVideo();
	});
	ChangeVideo(starting_url);
	PauseVideo();
	player.seekTo(starting_time,true);
}

function onPlayerStateChange(event){
	if (event.data == YT.PlayerState.PLAYING) {
		if(was_buff){
			socket.emit("play video",{username:username,room:room},function(data){
				ShowNotification(data.feedback,data.time);
			});
			PlayVideo();
			was_buff = false;
		}
      	interval = setInterval(UpdateVideoState, 500);
    }
	if (event.data == YT.PlayerState.PAUSED) {
		clearInterval(interval);
    }
    if(event.data == YT.PlayerState.BUFFERING){
    	was_buff = true;
    	socket.emit("pause video",{username:username,room:room},function(data){
			ShowNotification(data.feedback,data.time);
		});
    }
}

// END YOUTUBE API

// when control is received
socket.on('control', function (data) {
	var message = data.user;
	if(data.control == "play"){
		message += " played the video.";
		PlayVideo();
	}
	if(data.control == "pause"){
		message += " paused the video.";
		PauseVideo();
	}
	ShowNotification(message,data.time);
});
// notify users when someone joins
socket.on("joined",function(data){
	ShowNotification(data.message,data.time);
	RefreshUsersList(data.users_list);
});
socket.on("left",function(data){
	ShowNotification(data.message,data.time);
	RefreshUsersList(data.users_list);
});
// when embed video is changes
socket.on("change embed url",function(data){
	ChangeVideo(data.url);
	var message = data.user + " changed video id to: " + parse_yt_url(data.url);
	ShowNotification(message,data.time);
});
// receive video state change event
socket.on("video state change",function(data){
	if(data.state != null){
		player.seekTo(data.state,true);
	}
});
$(document).ready(function(){
	// FIX URL CHANGE BUTTON
	$("#change-btn").height($("#embed-url").height() + 2);
	//$(".notification-card-wrapper").find(".clear-notification").height($(".notification-card-wrapper").find(".card"));
	$("title").html("Room - " + room);
	$("body").css("padding-bottom",$("#footer").height()+50);
	$(window).resize(function(){
		if($(window).width() <= 770){
			$("body").css("padding-bottom",$("#footer").height()+50+10);
		}
		else{
			$("body").css("padding-bottom",$("#footer").height()+50);
		}
	});
	$("#change-btn").on("click",function(){
		var url_new = $("#embed-url").val();
		if(TestUrl(url_new)){
			socket.emit("change url",{url: url_new, user: username, room: room},function(data){
				ShowNotification(data.feedback,data.time);
			});
			ChangeVideo(url_new);
		}
	});
	$("#show-notify").click(function(){
		$("#notification-list-wrapper").fadeIn(500);
		FixNotificationCards();
	});
	$("#show-users").click(function(){
		$("#users-list-wrapper").fadeIn(500);
	});
	//clear notif
	$("#notification-list").on("click",".clear-notification",function(){
		var button = $(this);
		var notification_list = button.parents().eq(1);
		button.parent().remove();
		var wrappers = notification_list.find(".notification-card-wrapper");
		if(wrappers.length == 0){
			notification_list.append("<h3 align = 'center' class = 'no-notif-text white-text'>No new notifications!</h3>")
		}
	});
	// CLEAR ALL NOTIFICATIONS
	$("#clear-all-notifications").click(function(){
		$(this).parent().find(".notification-card-wrapper").remove();
		$(this).parent().append("<h3 align = 'center' class = 'no-notif-text white-text'>No new notifications!</h3>")
		$(this).css("display","none");
	});
	// close ws divs on esc
	$( document ).on( 'keydown', function ( e ) {
	    if ( e.keyCode === 27) { // ESC
			$(".ws-div").fadeOut(500);
	    }
	});
	//FixNotificationCards();
});

function PlayVideo(){
	player.playVideo();
}
function PauseVideo(){
	player.pauseVideo();
}
function ChangeVideo(url_new){
	var id = parse_yt_url(url_new);
	player.cueVideoById(id);
}
function RefreshUsersList(users_list){
	$("#users-list").find(".card").remove();
	for (var i = 0; i < users_list.length; i++) {
		AddUser(users_list[i]);
	}
}
function ShowNotification(text,time){
	$("#notification-list").find(".no-notif-text").remove();
	$("#clear-all-notifications").css("display","block");
	$("#notification-list").append('<div class="notification-card-wrapper"><label class="card">' + text + '</label><button type="button" class="my-btn fill-red clear-notification">Clear</button></div>');
	FixNotificationCards();
}
function FixNotificationCards(){
	// FIX NOTIFICATION BUTTONS
	var wrappers = $(".notification-card-wrapper");
	for (var i = wrappers.length - 1; i >= 0; i--) {
		var wrapper = wrappers.eq(i);

		// fix button
		var label = wrapper.find(".card");
		var button = wrapper.find(".clear-notification");
		label.css("padding-right", button.width() + 5);
		button.height(label.height()+2);

		// fix margin of the card
		wrapper.height(label.height()*2);
	}
}
function AddUser(username){
	$("#users-list").append('<label class = "card">' + username + '</label>');
}
function TestUrl(website){
	//return true;
	return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(website);
}
function closeIt()
{
	socket.emit("leave room",{user: username, room: room});
}
window.onunload = closeIt;
window.onbeforeunload = closeIt;
function UpdateVideoState(){
	var resp = parseTime(player.getCurrentTime());
	// final for current time
	var final = "";
	if(resp.hours > 0){
		final += resp.hours + ":";
	}
	final += resp.mins + ":";
	final += resp.secs;
	// final for length
	var duration = parseTime(player.getDuration());
	var finalDuration = "";
	if(duration.hours > 0){
		finalDuration += duration.hours + ":";
	}
	finalDuration += duration.mins + ":";
	finalDuration += duration.secs;
	$("#videoTime").html(final + " / " + finalDuration);
	socket.emit("update video time",{videoTime: player.getCurrentTime(), room: room});
}
function parseTime(seconds){
	var hours = Math.floor(seconds/3600);
	seconds -= hours*3600;
	var mins = Math.floor(seconds/60);
	seconds -= mins*60;
	var secs = Math.floor(seconds);
	if(hours < 10){
		hours = "0"+hours;
	}
	if(mins<10){
		mins = "0"+mins;
	}
	if(secs<10){
		secs = "0"+secs;
	}
	return {hours: hours, mins: mins, secs: secs}
}
// returns videos id from the string
function parse_yt_url(url){
	var start = -1;
	if(url.indexOf('=') == -1){
		start = url.lastIndexOf('/');
	}
	else{
		start = url.lastIndexOf('=');
	}
	if(start != -1){
		return url.substring(start+1);
	}
}
// get username and room code from the link
function parse_query_string(query) {
  var vars = query.split("&");
  var query_string = {};
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    var key = decodeURIComponent(pair[0]);
    var value = decodeURIComponent(pair[1]);
    // If first entry with this name
    if (typeof query_string[key] === "undefined") {
      query_string[key] = decodeURIComponent(value);
      // If second entry with this name
    } else if (typeof query_string[key] === "string") {
      var arr = [query_string[key], decodeURIComponent(value)];
      query_string[key] = arr;
      // If third or later entry with this name
    } else {
      query_string[key].push(decodeURIComponent(value));
    }
  }
  return query_string;
}