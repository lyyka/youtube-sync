let user_ipv4 = "";
/**
 * Get the user IP throught the webkitRTCPeerConnection
 * @param onNewIP {Function} listener function to expose the IP locally
 * @return undefined
 */
function getUserIP(onNewIP) { //  onNewIp - your listener function for new IPs
    //compatibility for firefox and chrome
    var myPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    var pc = new myPeerConnection({
        iceServers: []
    }),
    noop = function() {},
    localIPs = {},
    ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g,
    key;

    function iterateIP(ip) {
        if (!localIPs[ip]) onNewIP(ip);
        localIPs[ip] = true;
    }

     //create a bogus data channel
    pc.createDataChannel("");

    // create offer and set local description
    pc.createOffer(function(sdp) {
        sdp.sdp.split('\n').forEach(function(line) {
            if (line.indexOf('candidate') < 0) return;
            line.match(ipRegex).forEach(iterateIP);
        });
        
        pc.setLocalDescription(sdp, noop, noop);
    }, noop); 

    //listen for candidate events
    pc.onicecandidate = function(ice) {
        if (!ice || !ice.candidate || !ice.candidate.candidate || !ice.candidate.candidate.match(ipRegex)) return;
        ice.candidate.candidate.match(ipRegex).forEach(iterateIP);
    };
}

// Usage

getUserIP(function(ip){
    user_ipv4 = ip;
});

const socket = io.connect('https://you-sync.herokuapp.com' + (process.env.PORT || 8000));
$(document).ready(function(){
	$("#generate-room-code").click(function(){
		socket.emit("generate-room-code",function(data){
			$("#room-code-input").val(data);
			$("#feedback").html("Copy this room code and share it with friends! <a href = '/join' id = 'link' class = 'red-text'>Join room now!</a>");
			$("#feedback").fadeIn(800);
		});
	});
	$("#copy-room-code").click(function(){
		const copyText = $("#room-code-input");
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