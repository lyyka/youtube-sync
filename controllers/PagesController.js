class PagesController{

    // index page of the app
    index(req, res){
        res.render('index');
    }

    // create room page
    createRoom(req, res){
        res.render('create_room');
    }

    // just a regular join link without any ID
    joinRoomNormally(req, res){
        res.render('join_room', { roomID: "" });
    }

    // when QR code is sacnned
    joinRoomWithCode(req, res){
        const roomID = req.params.roomID;
        res.render('join_room', { roomID: roomID });
    }

    // actual room page
    room(req, res){
        const roomID = req.params.roomID;
        const username = req.params.username;
        res.render("room", { roomID: roomID, username: username });
    }

}

module.exports = new PagesController();