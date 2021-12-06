const db = require('../../config/db');
const auth = require('../../lib/auth');

// add an attendance
exports.registerInterestModel = async function(req,res){
    const userId = req.userData.userId;
    var eventId = req.params.id;
    console.log( `User ${userId} request to register interest of event ${eventId} from the database...` );
    const conn = await db.getPool().getConnection();

    //If the event does not require attendance control, the user’s attendance status should
    //be set to ‘Accepted’ and the number of attendees shall increase by one and the number
    //of available seats (if applicable) decreased by one.
    //同一user不能对同一event register interest 2次，加一个if条件...
    if (!await auth.isControlAttendance(eventId)) {
        const registerInterestQuery = `INSERT into registerInterest(eventId, userId, attendanceStatus) values (${eventId}, ${userId}, 'accepted');`
        const [ registerInterestRows ] = await conn.query(registerInterestQuery);
        const changeEventDetails = `UPDATE EVENTS SET NumberOfAttendees = NumberOfAttendees+1, availableSeat = availableSeat-1 where eventId = ${eventId};`;
        const [ changeEventRows ] = await conn.query(changeEventDetails);
        conn.release();
        return [registerInterestRows,changeEventRows];
    } else {
        //Should the user be interested in attending the event – and seats are still available
        if(await auth.isSeatAvailable(eventId)){
        //如果需要control attendance，查看是否有seat，如果有insert into，状态为pending
            const registerInterestQuery = `INSERT into registerInterest(eventId, userId) values (${eventId}, ${userId});`
            const [ registerInterestRows ] = await conn.query(registerInterestQuery);
            const changeEventDetails = `UPDATE EVENTS SET NumberOfAttendees = NumberOfAttendees+1, availableSeat = availableSeat-1 where eventId = ${eventId};`;
            const [ changeEventRows ] = await conn.query(changeEventDetails);
            conn.release();
            return registerInterestRows;
        }else if(!await auth.isSeatAvailable(eventId)){
            //if seats are still available when user register interest– the user should be able to register their interest in doing so.
            res.status(400).send('Sorry, there is no more seat for this event')
        }else if(await auth.isEventCapacityFull(eventId)){
            //Users shouldn't be able to request attendance for events already in their full capacity
            res.status(400).send(`Sorry, event ${eventID} already in its full capacity`);
        }
    }
};

//event organizer changes the status of attendance for an event
exports.changeAttendeeStatusModel = async function(eventId, userId){
    console.log( `Event${eventId} organizer(Id: ${userId}) requests to change status of attendance from the database...` );
    const conn = await db.getPool().getConnection();

    //查询还有多少available seat，批准这么多个attendance，状态从pending改为accepted，
    const availableSeatQuery = `SELECT availableSeat from EVENTS where eventId = ${eventId};`
    const [ availableSeatRow ] = await conn.query(availableSeatQuery);
    const availableSeat = availableSeatRow[0]['availableSeat'];
    const changeStatusQuery = `UPDATE registerInterest SET attendanceStatus = 'Accepted' where eventId = ${eventId} and attendanceStatus = 'pending' order by id limit ${availableSeat};`;
    const [ changeStatusRows ] = await conn.query(changeStatusQuery);
    //其他attendance的状态改为rejected
    const rejectAttendeeQuery = `UPDATE registerInterest SET attendanceStatus = 'Rejected' where eventId = ${eventId} and attendanceStatus = 'pending';`;
    const [ rejectAttendeeRows ] = await conn.query(rejectAttendeeQuery);
    conn.release();
    return [changeStatusRows, rejectAttendeeRows];
};

//delete an attendance
exports.cancelInterestModel = async function(req){
    const userId = req.userData.userId;
    const eventId = req.params.id;
    console.log( `User ${userId} request to cancel interest of event ${eventId} from the database...` );
    const conn = await db.getPool().getConnection();

    // In doing so, their seat will then become available (if applicable),
    // the number of attendees will be increased by one and
    // the user will be removed from the list of the event’s attendees.
    const cancelInterestQuery = `DELETE from registerInterest where eventId = ${eventId}`
    const [ registerInterestRows ] = await conn.query(cancelInterestQuery);
    const changeEventDetails = `UPDATE EVENTS SET NumberOfAttendees = NumberOfAttendees-1, availableSeat = availableSeat+1 where eventId = ${eventId};`;
    const [ changeEventRows ] = await conn.query(changeEventDetails);
    conn.release();
    return [registerInterestRows,changeEventRows];
};

