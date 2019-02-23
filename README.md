# Youtube-Sync
Web app that enables you to play youtube videos synced on all your devices

## How to run the app?
As the app is run on node.js server (located in server.js in root of the project), you can run whole app with
```
npm start
```
After that, you can access the app from `localhost:8000` (or which other port you specify in **server.js**)

All of the actions will be logged into the console for tracking the work of server and maybe debug future errors.

**Notice**: you must restart the server with `npm start` each time you make changes to **server.js**

## Documentations
App uses [socket.io](https://socket.io/) to communicate and sync all users in a room.

For back-end we use [node.js](https://nodejs.org/en/) and [express](https://expressjs.com/).

For front-end we user [PUG](https://pugjs.org/api/getting-started.html) files as they are easy to write, layouts can be created, and node.js and express provide great support of sending information from back-end to .pug files.
