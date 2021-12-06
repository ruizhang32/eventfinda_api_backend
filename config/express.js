// will hold all the details for configuring express,
// as well as being the starting point for our express API

const express = require('express');
const body_parser = require('body-parser');

module.exports = function (){
    const app = express();
    app.use(body_parser.json());

    //user.server.routes.js file will take in the ‘app’ variable
    require('../app/routes/user.server.routes.js')(app);
    require('../app/routes/event.server.routes.js')(app);
    require('../app/routes/attendee.server.routes.js')(app);
    return app;
};

