const socket = io();
$(document).ready(function(){
	$("#generate-room-code").click(function(){
		socket.emit("generate-room-code",function(data){
			// show code and let user join the room
			$("#room-code-input").val(data);
			$("#feedback").html("Scan this QR code or just copy the room code and share it! <a href = '/join/" + data + "' id = 'link' class = 'red-text'>Join room now!</a>");
			// remove button
			$("#generate-room-code").remove();
			// show qr code and room code
			$("#after-creation").show();
			// generate QR code for others to scan
			const qrcode = new QRCode(document.getElementById("room-qr-code"), {
				text: "http://you-sync.herokuapp.com/join/" + data,
				width: 128,
				height: 128,
				colorDark : "#000000",
				colorLight : "#ffffff",
				correctLevel : QRCode.CorrectLevel.H
			});
		});
	});
});