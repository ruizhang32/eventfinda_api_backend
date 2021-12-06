const attendee = require('../models/attendee.server.model');
const auth = require('../../lib/auth');

exports.registerInterestController = async function(req, res){
    const userId = req.userData.userId;
    const eventId = req.params.id;
    console.log( `\nUser ${userId} request to register interest of event ${eventId}...` );
    if (!auth.notRegisteredThisEvent) res.status(400).send('Users should not be able to register their attendance for event that they are already attending');
    if (!auth.eventNotHappened) res.status(400).send('A user cannot request to attend an event if the event has already happened');
    else {
        try {
            const result = await attendee.registerInterestModel(req, res);
            if (result.length !== 0) res.status(200).send(result);
                // else {
                //
                // }
            } catch( err ) {
                res.status( 500 )
                    .send( `ERROR User ${userId} request to register interest of event ${eventId}: ${ err }` );
            }
    }
};

exports.changeAttendeeStatusController = async function(req, res) {
    const eventId = req.params.id;
    const userId = req.userData.userId;
    console.log(`\nEvent${eventId} organizer(Id: ${userId}) requests to change status of attendance...`);
    try {
            const result = await attendee.changeAttendeeStatusModel(eventId, userId);
            if (result.length === 0){
                res.status(400)
                    .send('Invalid Id');
            }else {
                res.status(200)
                    .send(result)
            }
        } catch( err ) {
            res.status( 500 )
                .send( `ERROR organizer(Id: ${userId}) requests to change status of attendance: ${ err }` );
        }
}

exports.cancelInterestController = async function(req, res){
    const userId = req.userData.userId;
    const eventId = req.params.id;
    console.log( `\nUser ${userId} request to cancel interest of event ${eventId}...` );
    // Should the user already be registered to attend the event
    // A user cannot change his attendance status for an event if it has already happened (ie the date is in the past).
    if (await auth.notRegisteredThisEvent(userId,eventId)) res.status(400).send('Should the user already be registered to attend the event');
    if (!await auth.eventNotHappened(eventId)) res.status(400).send('A user cannot change his attendance status for an event if it has already happened');
    else{
        try {
            const result = await attendee.cancelInterestModel(req, res);
            if (result.length === 0){
                res.status(400)
                    .send('Invalid Id');
            }else {
                res.status(200)
                    .send(result)
            }
        } catch( err ) {
            res.status( 500 )
                .send( `ERROR User ${userId} request to cancel interest of event ${eventId}: ${ err }` );
        }
    }
};

