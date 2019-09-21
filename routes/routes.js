function initRoutes(Controllers, app){
    app.get("/", Controllers.PagesController.index);
    app.get("/create", Controllers.PagesController.createRoom);
    app.get("/join", Controllers.PagesController.joinRoomNormally);
    app.get("/join/:roomID", Controllers.PagesController.joinRoomWithCode);
    app.get("/room/:roomID/:username", Controllers.PagesController.room);
}

module.exports = initRoutes;