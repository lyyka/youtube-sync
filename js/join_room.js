var socket = io.connect("http://192.168.1.4");
socket.on("notification",function(sender,data){
	alert(sender + ":" + data);
});
$(document).ready(function(){
	$("#join-room").click(function(){
		var username = $("#username-input").val();
		var code = $("#room-code-input").val();
		if(ValidateInput(username,code)){
			window.location = "/html/room.html?username="+username+"&room="+code;
		}
	});
});
function ValidateInput(username,code){
	var valid = true;
	var username = username;
	var code = code;
	if(username.length == 0){
		valid = false;
	}
	if(code.length != 7 || !validCode(code)){
		valid = false;
	}
	return valid;
}
function validCode(str){
	return /^\w+$/.test(str);
}