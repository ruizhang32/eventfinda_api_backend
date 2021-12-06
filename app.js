const db = require('./config/db'),
    express = require('./config/express');
require('dotenv').config({ path: './config/pas.env' });

const app = express();

async function main(){
    try{
        await db.connect();
        // const port = process.env.PORT || 3000;
        app.listen(process.env.PORT,function () {
            console.log( 'Listening on port: ' +  process.env.PORT);
        });
    }catch (err){
        console.log('Unable to connect to MySQL.');
        process.exit(1);
    }
}
main().catch(err => console.log(err));