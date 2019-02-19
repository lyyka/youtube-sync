$(document).ready(function(){
	$("#join-room").click(joinRoom);
});

function joinRoom(){
	if(joinModule.validateInput()){
		window.location.replace("/room/" + joinModule.fields.code.val() + "/" + joinModule.fields.username.val());
	}
}

joinModule = (function(){

	const fields = {
		'username': $("#username-input"),
		'code': $("#room-code-input")
	};

	const validateInput = function(){
		let valid = true;
		if (fields.username.val().length == 0) {
			valid = false;
		}
		if (fields.code.val().length != 7 || !validCode(fields.code.val())) {
			valid = false;
		}
		return valid;
	}

	const validCode = function(code){
		return /^\w+$/.test(code);
	}

	const api = {
		'validateInput': validateInput,
		'fields': fields
	}

	return api;

})();