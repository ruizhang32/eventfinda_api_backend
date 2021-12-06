const mysql = require('mysql2/promise');
require('dotenv').config({ path: './pas.env' });

let state = {
    pool:null
};

// two functions: connect and get inside 'db.js'
// connects to the database
exports.connect = async function(){
    state.pool = await mysql.createPool({
        host: process.env.HOST,
        user: process.env.USER,
        password: process.env.PASSWORD,
        database:process.env.DATABASE,
    });
    await state.pool.getConnection();
    console.log('Successfully connected to database');
};


// returns the connection pool
exports.getPool = function (){
    return state.pool;
};
