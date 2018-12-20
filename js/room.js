let starting_url = "";
let starting_time = 0;
let starting_state = "paused";

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
		showNotification(data.message,data.time);
		starting_url = data.videoUrl;
		var users_list = data.usersList;
		refreshUsersList(users_list);
		starting_time = data.videoTime;
		starting_state = data.state;
		// load the qr code
        // for now qr code is returning only the room number
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
	const video_id = patseYTUrl(starting_url);
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
		socket.emit("play video",{username:user,room:room},function(data){
			showNotification(data.feedback,data.time);
		});
		playVideo();
	});

	$("#pause-btn").click(function() {
		socket.emit("pause video",{username:user,room:room},function(data){
			showNotification(data.feedback,data.time);
		});
		pauseVideo();
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
      	interval = setInterval(updateVideoState, 500);
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
	const message = data.user + " changed video id to: " + patseYTUrl(data.url);
	showNotification(message,data.time);
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
    // change embed url
	$("#change-btn").on("click",function(){
		const url_new = $("#embed-url").val();
		if(testUrl(url_new)){
			socket.emit("change url",{url: url_new, username: user, room: room},function(data){
				showNotification(data.feedback,data.time);
			});
			changeVideo(url_new);
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
		fixNotificationCards();
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
	//fixNotificationCards();
});

function playVideo(){
	socket.emit("get video time",{room: room},function(data){
		const seekTime = data.videoTime;
		if(seekTime > player.getCurrentTime()){
			console.log(seekTime + " ? " + player.getCurrentTime());
			player.seekTo(data.videoTime,true);
			player.playVideo();
		}
		else{
			player.playVideo();
		}
	});
}
function pauseVideo(){
	player.pauseVideo();
}
function changeVideo(url_new){
	const id = patseYTUrl(url_new);
    player.seekTo(0, true);
	player.cueVideoById(id);
}
function refreshUsersList(users_list){
	$("#users-list").find(".card").remove();
	for (var i = 0; i < users_list.length; i++) {
		addUser(users_list[i]);
	}
}
function showNotification(text,time){
	$("#notification-list").find(".no-notif-text").remove();
	$("#clear-all-notifications").show();
	$("#notification-list").append('<div class="notification-card-wrapper"><label class="card">' + text + '</label><button type="button" class="my-btn fill-red clear-notification">Clear</button></div>');
	fixNotificationCards();
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
	//return true;
	return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(website);
}
function closeIt()
{
	socket.emit("leave room",{username: user, room: room});
}
window.onunload = closeIt;
window.onbeforeunload = closeIt;
function updateVideoState(){
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
function patseYTUrl(url){
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