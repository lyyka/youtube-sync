$(document).ready(function(){
	$("body").css("padding-bottom",$("#footer").height()+100);
	$(window).resize(function(){
		if($(window).width() <= 770){
			$("body").css("padding-bottom",$("#footer").height()+100+10);
		}
		else{
			$("body").css("padding-bottom",$("#footer").height()+100);
		}
	});
});