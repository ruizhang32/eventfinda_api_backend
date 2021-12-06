const emailValidator = require("email-validator");
const passwordValidator = require('password-validator');
// const passport = require('passport');
// const LocalStrategy = require('passport-local').Strategy;
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const moment = require('moment');

//验证姓名是否非空、有效
//中间件不涉及db查询
exports.isValidName = function(req,res,next){
   if(!/^[a-zA-Z ]+$/.test(req.body.firstName) || !/^[a-zA-Z ]+$/.test(req.body.lastName)) return res.status(400).send("Please enter a valid name");
   next();
}

//验证邮箱的syntax
//验证邮箱非空
exports.isValidEmail = function(req,res,next){
    if (req.body.emailAddress === "" || !emailValidator.validate(req.body.emailAddress)) return res.status(400).send("Check Email address, please");
    next();
}

//验证密码syntax，可自定义规则
//验证密码非空
exports.isValidPassword = function (req,res,next){
    // Create a schema
    let schema = new passwordValidator();

    // Add properties to it
    schema
    .is().min(8)                                    // Minimum length 8
    // .is().max(100)                                  // Maximum length 100
    .has().uppercase()                              // Must have uppercase letters
    .has().lowercase()                              // Must have lowercase letters
    .has().digits(2)                                // Must have at least 2 digits
    .has().not().spaces()// Should not have spaces
    // .not([''])
    .is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values

    if (!schema.validate(req.body.password)) return res.status(400).send(schema.validate('joke', { details: true }));
    next();
}

exports.isEmailExist = async function(emailAddress){
    console.log( 'Request to check if email address already in database...' );
    const conn = await db.getPool().getConnection();
    let query = `select count(*) as count from USERS where emailAddress = '${emailAddress}';`;
    // const results = await conn.promise().query(query)
    const [ rows ] = await conn.query(query);
    conn.release();
    return rows[0]['count'] !== 0;
};

//ref: https://webdeasy.de/en/complete-login-system-with-node-js-vue-js-restapi-jwt-part-1-2/
exports.isLoggedIn = function (req, res, next) {
      try {
          console.log('check if logged in...')
          const token = req.headers.authorization.split(' ')[1];
          //The req.userData contains the data we have stored in the JWT key (in this case emailAddress and userId).
          //This allows us to read user-defined values from the database using the userId for protected routes, for example.
          const decoded = jwt.verify(
          token,
          'SECRETKEY'
          );
          req.userData = decoded;
          next();
      } catch (err) {
        return res.status(401).send({
          msg: 'Your session is not valid!'
        });
      }
}

//Only the organizer of an event can edit it
exports.isOrganizer = async function (req, res, next) {
    console.log('Connect to db to check event organizer...');
    const conn = await db.getPool().getConnection();

    const currentUser = req.userData.userId;
    const eventId = req.params.id;
    const query = `SELECT organizerId from EVENTS where eventId = ${eventId}`;
    const [organizerId] = await conn.query(query);
    if (organizerId[0]['organizerId'] !== currentUser) res.status(401).send('Only the organizer of an event can operate on event');
        console.log(`Current user is the event ${req.params.id} organizer... `)
    conn.release();
    next();
}

exports.isControlAttendance = async function (eventId) {
    console.log('Connect to db to check if event ${eventId} attendance controlling ...');
    const conn = await db.getPool().getConnection();
    const query = `SELECT controlAttendance from EVENTS where eventId = ${eventId}`;
    const [controlAttendance] = await conn.query(query);
    conn.release();
    return controlAttendance[0]['controlAttendance'] === 'yes';
}

exports.isSeatAvailable = async function (eventId) {
    console.log('Connect to db to check if event ${eventId} still has seat from db...');
    const conn = await db.getPool().getConnection();
    const query = `SELECT availableSeat from EVENTS where eventId=${eventId} and availableSeat > 0;`;
    const [availableSeatNo] = await conn.query(query);
    conn.release();
    return (availableSeatNo[0]['availableSeat'] > 0);
}

exports.isEventCapacityFull = async function (eventId) {
    console.log('Connect to db to check if event ${eventId} capacity is full from db...');
    const conn = await db.getPool().getConnection();
    const query = `SELECT count(*) as isCapacityFull from EVENTS where eventId=${eventId} and NumberOfAttendees = maxCapacity;`;
    const [isCapacityFull] = await conn.query(query);
    conn.release();
    //if NumberOfAttendees = maxCapacity, capacity is full
    return (isCapacityFull[0]['isCapacityFull'] > 0);
}

exports.notRegisteredThisEvent = async function (userId,eventId) {
    console.log(`Connect to db to check if user ${userId} already register interest of event ${eventId} from db...`);
    const conn = await db.getPool().getConnection();
    const query = `SELECT count(*) as registeredThisEvent from registerInterest where eventId=${eventId} and userId=${userId};`;
    const [registeredThisEvent] = await conn.query(query);
    conn.release();
    console.log(registeredThisEvent[0]['registeredThisEvent']);
    return !(registeredThisEvent[0]['registeredThisEvent'] > 0);
}

// A user cannot request to attend an event if the event has already happened, ie the
// event date is in the past.
exports.eventNotHappened = async function (eventId) {
    console.log('Connect to db to check if event ${eventId} already happened...');
    const conn = await db.getPool().getConnection();
    const query = `SELECT eventDate from EVENTS where eventId=${eventId} and NumberOfAttendees < maxCapacity;`;
    const [eventNotHappened] = await conn.query(query);
    conn.release();
    //需要格式化后与date.now比较
    const now = new Date();
    console.log(moment(eventNotHappened[0]['eventDate']).isAfter(moment(now)));
    return moment(eventNotHappened[0]['eventDate']).isAfter(moment(now));

}
