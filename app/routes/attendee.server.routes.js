const attendee = require('../controllers/attendee.server.controller');
const auth = require('../../lib/auth');

module.exports = function (app) {
    app.route('/events/:id/interest')
        //Story17: Attendance request
        //Only an authenticated user may request to attend an event.
        .post(auth.isLoggedIn, attendee.registerInterestController)
        .delete(auth.isLoggedIn, attendee.cancelInterestController)
        //Story13: Control attendance
        .put(auth.isLoggedIn,auth.isOrganizer,attendee.changeAttendeeStatusController)
}