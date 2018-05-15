var socket = io.connect('http://192.168.1.4');
$(document).ready(function(){
	$("#generate-room-code").click(function(){
		socket.emit("generate-room-code",function(data){
			$("#room-code-input").val(data);
			$("#feedback").html("Copy this room code and share it with friends or give them this link <a href = '192.168.1.4/" + data + "' class = 'red-text'>192.168.1.4/" + data + "</a>! :)");
			$("#feedback").fadeIn(800);
		});
	});
	$("#copy-room-code").click(function(){
		var copyText = $("#room-code-input");
		copyText.select();
		document.execCommand("Copy");
		$("#copy-room-code").html("Copied");
		window.setTimeout(function(){
			$("#copy-room-code").html("Copy");
		},1500);
	});
});