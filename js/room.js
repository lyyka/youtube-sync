var query = window.location.search.substring(1);
var qs = parse_query_string(query);
var username = qs.username;
var room = qs.room;

var socket = io.connect('http://192.168.1.4');
// join the user to the room
socket.emit("join room",{username: username,room:room},function(data){
	if(data == 1){
		alert("Joined!");
	}
	else{
		alert("Error joining!");
		window.location = "/html/join_room.html";
	}
});
// when control is pressed
socket.on('control', function (data) {
	if(data.control == "play"){
		PlayVideo();
	}
	if(data.control == "pause"){
		PauseVideo();
	}
});
// when embed video is changes
socket.on("change embed url",function(data){
	ChangeVideo(data.url);
});
// global variable for the player
var player;

// this function gets called when API is ready to use
function onYouTubePlayerAPIReady() {
  // create the global player from the specific iframe (#video)
  player = new YT.Player('video', {
    events: {
      // call this function when player is ready to use
      'onReady': onPlayerReady
    }
  });
}

function onPlayerReady(event) {
	// bind events
	$("#play-btn").click(function() {
		socket.emit("play video",{username:username,room:room},function(data){});
		PlayVideo();
	});

	$("#pause-btn").click(function() {
		socket.emit("play video",{username:username,room:room},function(data){});
		pauseVideo();
	});
  
}
function PlayVideo(){
	player.playVideo();
}
function PauseVideo(){
	player.pauseVideo();
}
function ChangeVideo(url_new){
	$("#video").prop("src",url_new);
}
// Inject YouTube API script
var tag = document.createElement('script');
tag.src = "//www.youtube.com/player_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

$(document).ready(function(){
	$("body").css("padding-bottom",$("#footer").height()+50);
	$(window).resize(function(){
		if($(window).width() <= 770){
			alert("less");
			$("body").css("padding-bottom",$("#footer").height()+50+10);
		}
		else{
			$("body").css("padding-bottom",$("#footer").height()+50);
		}
	});
	$("#embed-url").on("input",function(){
		var url_new = $("#embed-url").val();
		ChangeVideo(url_new);
		socket.emit("change url",{url: url_new},function(data){});
	});
});

function closeIt()
{

}
window.onbeforeunload = closeIt;

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