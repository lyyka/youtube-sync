$(document).ready(function(){
	$("body").css("padding-bottom",$("#footer").height()+100);
	$(window).resize(function(){
		$("body").css("padding-bottom",$("#footer").height()+100);
	});
});