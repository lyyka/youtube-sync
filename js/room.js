var query = window.location.search.substring(1);
var qs = parse_query_string(query);
var username = qs.username;
var room = qs.room;

var starting_url = "";

var user_count = 0;

var socket = io.connect('http://192.168.1.4');
// join the user to the room
socket.emit("join room",{username: username,room:room},function(data){
	if(data.status == -1){
		alert("This room does not exist!");
		window.location.replace("/html/create_room.html");
	}
	if(data.status == 0){
		alert("That username is taken!");
		window.location.replace("/html/join_room.html");
	}
	if(data.status == 1){
		ShowNotification(data.message,data.time);
		starting_url = data.videoUrl;
		var users_list = data.usersList;
		for (var i = 0; i < users_list.length; i++) {
			AddUser(users_list[i]);
		}
	}
});

// YOUTUBE API
// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
	var video_id = parse_yt_url(starting_url);
	player = new YT.Player('video', {
	  height: '500',
	  width: '100%',
	  videoId: video_id,
	  events: {
	    'onReady': onPlayerReady,
	  }
	});
}
function PlayVideo(){
	player.playVideo();
}
function PauseVideo(){
	player.pauseVideo();
}
function ChangeVideo(url_new){
	url_new = parse_yt_url(url_new);
	player.cueVideoById(url_new);
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
	AddUser(data.user);
});
socket.on("left",function(data){
	ShowNotification(data.message,data.time);
	RemoveUser(data.user);
});
// when embed video is changes
socket.on("change embed url",function(data){
	ChangeVideo(data.url);
	var message = data.user + " changed video id to: " + parse_yt_url(data.url);
	ShowNotification(message,data.time);
});

function ShowNotification(text,time){
	$("#notification-list").append('<label class = "card">' + text + '<span class = "float-right">' + time + '</span></label>');
}
function AddUser(username){
	$("#users-list").append('<label class = "card">' + username + '</label>');
}
function RemoveUser(username){
	var childs = $("#users-list").find(".card");
	for (var i = childs.length - 1; i >= 0; i--) {
		if(childs.eq(i).html() == username){
			childs.eq(i).remove();
		}
	}
}

$(document).ready(function(){
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
	$("#embed-url").on("input",function(){
		var url_new = $("#embed-url").val();
		ChangeVideo(url_new);
		socket.emit("change url",{url: url_new, user: username, room: room},function(data){
			ShowNotification(data.feedback,data.time);
		});
	});
	$(".section-header").click(function(){
		var el = $(this).parent("div").find(".dropdown");
		var icon = $(this).find(".icon");
		if(el.css("display") == "block"){
			icon.removeClass("fa fa-angle-up");
			icon.addClass("fa fa-angle-down");
			el.slideUp();
		}
		else{
			icon.removeClass("fa fa-angle-down");
			icon.addClass("fa fa-angle-up");
			el.slideDown();
		}
	});
});

function closeIt()
{
	socket.emit("leave room",{user: username, room: room});
}
window.onunload = closeIt;
window.onbeforeunload = closeIt;

function parse_yt_url(url){
	var start = url.lastIndexOf('/');
	return url.substring(start+1);
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