const db = require('../../config/db');

exports.registerUserModel = async function(registerInfo){
    console.log( 'Request to add an user into the database...' );
    const conn = await db.getPool().getConnection();

    let query = '';
    // if(Object.keys(registerInfo).length === 1) query = 'INSERT INTO USERS (password) VALUES (?)' ;
    if(Object.keys(registerInfo).length === 4) query = 'INSERT INTO USERS (firstName,lastName,emailAddress,password) VALUES (?)' ;
    else query = 'INSERT INTO USERS(firstName,lastName,emailAddress,password,profilePhoto) VALUES (?)';

    const [ rows ] = await conn.query(query,[registerInfo]);
    conn.release();
    return rows['insertId'];
};

exports.loginModel = async function(email){
    console.log( 'Request to check if email and password match from database...' );
    const conn = await db.getPool().getConnection();
    let query = `SELECT * from USERS where emailAddress = '${email}';`;
    const [ rows ] = await conn.query(query,[email]);
    conn.release();
    return rows[0];
};

// exports.getAll = async function(){
//     console.log( 'Request to get all users from the database...' );
//     const conn = await db.getPool().getConnection();
//     const query = 'select * from USERS';
//     const [ rows ] = await conn.query( query );
//     conn.release();
//     return rows;
// };

// exports.getOne = async function(id){
//     console.log(  `Request to get user ${id} from the database...` );
//     const conn = await db.getPool().getConnection();
//     const query = 'select * from USERS where userId = ?';
//     const [ rows ] = await conn.query( query,[id] );
//     conn.release();
//     return rows;
// };

exports.viewProfileModel = async function(requestedId){
    console.log(  `Request to get user${requestedId}'s profile from the database...` );
    const conn = await db.getPool().getConnection();
    const getProfileQuery = 'select firstName,lastName,emailAddress,profilePhoto from users where userId = ?;';
    const [ profileDetails ] = await conn.query(getProfileQuery,[requestedId] );
    conn.release();
    return profileDetails;
};

exports.editProfileModel = async function(req){
    const userId = req.params.id;
    console.log( `Request to update user ${userId}'s profile detail(s) from the database...` );
    const conn = await db.getPool().getConnection();
    const requestDetails = req.body; //req.body不应该为空，前端检测
    let query = '';
    for (const [key, value] of Object.entries(requestDetails)) {
        if (value !== undefined) query += `${key} = '${value}',`
    }
    let finalQuery = query.substring(0, query.length - 1);
    const alterQuery = `UPDATE USERS set ${finalQuery} where userId = ${userId}`;
    console.log(alterQuery);
    const [editEventRows] = await conn.query(alterQuery);
    conn.release();
    return editEventRows;
};

// exports.remove = async function(id){
//     console.log( `Request to delete user ${id} from the database...` );
//     const conn = await db.getPool().getConnection();
//     const query = 'DELETE from USERS where userId = ?';
//     const [ rows ] = await conn.query(query,[id]);
//     conn.release();
//     return rows;
// };



