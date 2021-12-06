const users = require('../controllers/user.server.controller');
const auth = require('../../lib/auth');
const eventController = require('../controllers/event.server.controller');

module.exports = function (app){
    // app.route('/users')
    //     .get(users.list);

    //Story9: Register
    //满足输入条件，注册用户
    //!!!输入是否为空、是否符合规则，考虑应该在前端验证，不需要传到后端，浪费时间
    app.route('/users/register')
        .post(users.registerUserController);

    //Story10: Login
    // 登陆需验证：1.邮箱和密码是否valid（前端完成?），2.邮箱密码是否已在db中，3.邮箱密码是否匹配db的结果
    //?用户目前为非登录状态
    app.route('/users/login')
        .post(users.loginController);

    //app.route('/users/id/:id')
        // .get(users.read) //list a single user
        // .put(users.update)
        //.delete(users.delete);

    // On Logout from the Client Side, the easiest way is to remove the token from the storage of browser.
    // if you want to destroy the token on the Node server,
    // The problem with JWT package is that it doesn't provide any method or way to destroy the token.
    // app.route('/users/logout')
    //     // A user that is not currently logged in cannot log out.
    //     // no longer be authenticated
    //     .post(auth.isLoggedIn, users.logoutController);

    // use auth.isLoggedIn to allow registered users only to access routes
    // app.route('/secret-route', auth.isLoggedIn, (req, res, next) => {
    //     console.log(req.userData);
    //     res.send('This is the secret content. Only logged in users can see that!');
    // });

    //Story16: My events
    app.route('/users/:id/myEvents')
        .get(auth.isLoggedIn,eventController.getEventsByUserController);

    app.route('/users/:id/myProfile')
        //Story19: View my profile
        .get(auth.isLoggedIn,users.viewProfileController)
        //Story20: Edit my profile
        .put(auth.isLoggedIn,users.editProfileController)
};