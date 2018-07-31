var socket = io.connect('http://192.168.1.4:8080');
$(document).ready(function(){
	$("#generate-room-code").click(function(){
		socket.emit("generate-room-code",function(data){
			$("#room-code-input").val(data);
			$("#feedback").html("Copy this room code and share it with friends! <a href = '/join' id = 'link' class = 'red-text'>Join room now!</a>");
			$("#feedback").fadeIn(800);
		});
	});
	$("#copy-room-code").click(function(){
		var copyText = $("#room-code-input");
		if(copyText.val().length == 0){
			$("#copy-room-code").html("Nothing to copy");
		}
		else{
			copyText.select();
			document.execCommand("Copy");
			$("#copy-room-code").html("Copied");
		}
		window.setTimeout(function(){
			$("#copy-room-code").html("Copy");
		},1500);
	});
});