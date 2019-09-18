// room and user come from the .pug template where they are loaded from backend
const roomClass = new Room(room, user);

const player = new Player(roomClass);

function onYouTubeIframeAPIReady(){
    player.onYouTubeIframeAPIReady();
}

$(document).ready(function(){
	const search = new YTSearch(roomClass);
	const player_ui = new PlayerUI(player);
	player_ui.registerEventHandlers();

	// set title
	$("title").html("Room - " + room);

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

    // open users list
	$("#show-users").click(function(){
		$("body").addClass("remove-scroll");
		$("#users-list-wrapper").fadeIn(500);
	});

	//close whole screen divs
	$(".close-ws-div").click(function(){
		$("body").removeClass("remove-scroll");
		$(this).parents().eq(2).fadeOut(500);
	});

	// close whole screen divs on esc
	$( document ).on( 'keydown', function ( e ) {
		if ( e.keyCode === 27) { // ESC
			$("body").removeClass("remove-scroll");
			$(".ws-div").fadeOut(500);
	    }
	});

	// clear single notification
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

	// clear all notifications
	$("#clear-all-notifications").click(function(){
		$("#notification-list").find(".notification-card-wrapper").remove();
		$("#notification-list").append("<h3 align = 'center' class = 'no-notif-text white-text'>No new notifications!</h3>")
		$(this).css("display","none");
	});
});

// on close remove user
function closeIt()
{
	roomClass.socketEvents.userLeftRoom();
}
window.onunload = closeIt;
window.onbeforeunload = closeIt;