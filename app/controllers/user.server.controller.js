const user = require('../models/user.server.model');
const auth = require('../../lib/auth');

// bcryptjs — The bcrypt hashing function allows us to build a password security platform that scales with computation power
// and always hashes every password with a salt.
const bcrypt = require('bcryptjs');
 //jsonwebtoken — This module provides Express middleware for validating JWTs (JSON Web Tokens) through the jsonwebtoken module.
// The decoded JWT payload is available on the request object.
const jwt = require('jsonwebtoken');

//casual user register as a registered user
exports.registerUserController = async function(req, res){
    console.log( '\nRequest to register as a new user...' );
    const fName = req.body.firstName;
    const lName = req.body.lastName;
    const email = req.body.emailAddress;

    //验证邮箱是否已存在于db
    //409 error: conflict resource
    if (!await auth.isEmailExist(email)) return res.status(409).send('Email address already been used for registration');

    let psw = req.body.password;
    //如果密码是valid，生成token
    //?考虑加密在前端完成，因为如果在前后端交互时hack会有风险
    const encryptedPassword = await bcrypt.hash(psw, 10);

    const profilePhoto = req.body.profilePhoto;
    let registerInfo = [];
    if (profilePhoto !== undefined) registerInfo = [fName,lName,email,encryptedPassword,profilePhoto];
    else registerInfo = [fName,lName,email,encryptedPassword];

    //???如果注册成功，马上变为登陆状态？redirect to user profile page
    try {
        const result = await user.registerUserModel(registerInfo);
        console.log('Redirect to login page');
        res
        //If you're already dealing with login authentication via JWT,
        //and there's no reason for the client-side code to care about the user ID
        // .json({'userId': res.userId});
        .redirect(302, '/users/login');

    } catch( err ) {
        res.status( 500 )
        .send( `ERROR registering user ${ err }` );
    }
};

// exports.list = async function(req, res){
//     console.log( '\nRequest to list users...' );
//     try {
//         const result = await user.getAll();
//         res.status( 200 )
//     .send( result );
//     } catch( err ) {
//         res.status( 500 )
//         .send( `ERROR getting users ${ err }` );
//     }
// };

exports.loginController = async function(req,res,next){
    console.log( '\nRequest to login...' );
    const email = req.body.emailAddress;
    const password = req.body.password;
    // 2.邮箱密码是否已在db中，
    if (!await auth.isEmailExist(email)) return res.status(409).send('You have not registered yet');
    // 3.邮箱密码是否匹配db的结果
    try {
        var userDetails = await user.loginModel(email);
        var pswDB = userDetails.password;
    } catch( err ) {
        res.status( 500 )
        .send( `ERROR login user ${ err }` );
    }

    // check password,compare req password with db password
    bcrypt.compare(
          password,
          pswDB,
          (bErr, bResult) => {
          // wrong password
              if (bErr) {
              return res.status(401).send({
                  msg: 'Username or password is incorrect!'
              });}
          if (bResult) {
              var token = jwt.sign({
                      //pass variables that we want to “store” in the JWT token
                      emailAddress: userDetails.emailAddress,
                      userId: userDetails.userId
              },
              //pass a key with which the JWT token is generated, this is important for the verification later. Here you can enter any string.
              'SECRETKEY', {
                  //how long the token should be valid
                  expiresIn: '3h'
              });
          }
          return res.status(200).send({
              msg: 'Logged in!',
              token,
              user: userDetails
            })
          }
    )
};

// exports.read = async function(req, res){
//     console.log( '\nRequest to get a user...' );
//     const id = req.params.id;
//     try {
//         const result = await user.getOne(id);
//         if (result.length === 0){
//             res.status(400)
//                 .send('Invalid Id');
//         }else {
//             res.status(200)
//                 .send(result)
//         }
//     } catch( err ) {
//         res.status( 500 )
//         .send( `ERROR getting user ${id} ${ err }` );
//     }
// };

exports.viewProfileController = async function(req, res){
    console.log( `\nRequest to get a user's profile...` );
    const requestedId = parseInt(req.params.id);
    const currentLoggedInUser = req.userData.userId;
    if (requestedId !== currentLoggedInUser) res.status(400).send('No one else can view another user’s information ')
    else{
        try {
        const result = await user.viewProfileModel(requestedId);
        if (result.length === 0){
            res.status(400)
                .send('Invalid Id');
        }else {
            res.status(200)
                .send(result)
        }
    } catch( err ) {
        res.status( 500 )
        .send( `ERROR getting user's profile details ${id} ${ err }` );
    }
    }

};

exports.editProfileController = async function(req, res){
    console.log( `\nRequest to edit user's profile...` );
    const requestedId = parseInt(req.params.id);
    const currentLoggedInUser = req.userData.userId;
    if (await auth.isEmailExist(req.body.emailAddress)) res.status(400).send('The email address already be used by another user');
    if (requestedId !== currentLoggedInUser) res.status(400).send('No one else can view another user’s information ');
    else {
        try {
            const result = await user.editProfileModel(req);
            if (result.length === 0) {
                res.status(400)
                    .send('Invalid Id');
            } else {
                res.status(200)
                    .send(result)
            }
        } catch (err) {
            res.status(500)
                .send(`ERROR updating user's profile ${err}`);
        }
    }
};

// exports.delete = async function(req, res){
//     console.log( '\nRequest to delete a user...' );
//     const id = req.params.id;
//     console.log(id);
//     try {
//         const result = await user.remove(id);
//         if (result.length === 0){
//             res.status(400)
//                 .send('Invalid Id');
//         }else {
//             res.status(200)
//                 .send(result)
//         }
//     } catch( err ) {
//         res.status( 500 )
//         .send( `ERROR deleting user ${id} ${ err }` );
//     }
// };

