class Room{

	constructor(roomId, username){
		this.roomId = roomId;
		this.username = username;
		this.starting_url = "";
		this.starting_time = 0;
		this.starting_state = "paused"

		this.video = {
			playing: false,
			duration: {
				value: 0,
				string: "00:00:00"
			}
		}

		this.was_buff = false;

		this.socket = io();
		this.socketEvents = new SocketEvents(this);
		this.registerEvents = this.registerEvents.bind(this);
		this.registerEvents();

		this.refreshUsersList = this.refreshUsersList.bind(this);
	}

	registerEvents(){
		this.socket.emit("join room", { username: this.username, room: this.roomId }, this.socketEvents.joinRoom);
		
		// when someone seeks, this function syncs everyone to that seek
		this.socket.on("sync", this.socketEvents.onSync);

		// when control is received
		this.socket.on('control', this.socketEvents.onControl);

		// notify users when someone joins
		this.socket.on("joined", this.socketEvents.onJoined);

		// notify users when someone leaves
		this.socket.on("left", this.socketEvents.someoneLeft);

		// when embed video is changed
		this.socket.on("change embed url", this.socketEvents.embedURLChanged);

		// receive video state change event
		this.socket.on("video state change", this.socketEvents.videoStateChanged);
	}

	addNotification(text){
		$("#notification-list").find(".no-notif-text").remove();
		$("#clear-all-notifications").show();
		$("#notification-list").append('<div class="notification-card-wrapper"><label class="card">' + text + '</label><button type="button" class="my-btn fill-red clear-notification"><i class = "fas fa-times"></i></button></div>');
	}

	refreshUsersList(users_list){
		$("#users-list").find(".card").remove();
		for (var i = 0; i < users_list.length; i++) {
			this.addUser(users_list[i]);
		}
	}

	addUser(username){
		$("#users-list").append('<label class = "card">' + username + '</label>');
	}

}