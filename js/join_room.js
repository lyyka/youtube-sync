$(document).ready(function(){
	$("#join-room").click(function(){
		const username = $("#username-input").val();
		const code = $("#room-code-input").val();
		if(ValidateInput(username,code)){
			window.location.replace("/room/" + code + "/" + username);
		}
	});
});
function ValidateInput(username,code){
	let valid = true;
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