let mobile_set = false;
$(document).ready(function(){
    setMobile();
    // open nav
    $("#nav-icon").click(function(){
        $(this).toggleClass("open");

        $("#nav-list-wrapper").slideToggle();
    });
    $(window).resize(function(){
        // show mobile nav
        setMobile();
    });
});
function setMobile(){
    if($(window).width() > 1100){
        mobile_set = false;
        $("#nav-icon-wrapper").hide();
        $("#nav-list-wrapper").show();
    }
    else{
        if(!mobile_set){
            mobile_set = true;
            $("#nav-icon-wrapper").show();
            $("#nav-list-wrapper").hide();
        }
    }
}