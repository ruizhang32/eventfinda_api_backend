// anything that relates to presentation or the interface comes under the ‘view’ section
const events = require('../controllers/event.server.controller');
const auth = require('../../lib/auth');

module.exports = function (app){

    // Searching events
    // Story1: Search
    app.route('/events/search')
        .get(events.searchEventsController);

    // Story2: List of events
    app.route('/events')
        .get(events.getAllEventsController)

        //Story 12: Create event
        //create an event, the user must first be logged in.
        //在前端验证:输入的内容是否符合格式，用户名、密码等（所以不在后端返回400错误码）
        //在前端验证not null的内容必须非空
        //在后端check optional的attribute是否有被输入--在model模块验证
        //400 Bad Request，由于明显的客户端错误（例如，格式错误的请求语法）
        //验证用户是否有权限，如non-authenticated，返回401错误码 Unauthorized，即用户没有必要的凭据
        .post(auth.isLoggedIn, events.addEventsController);

    //Story3: Filter
    app.route('/events/category')
        .get(events.filterEventsByCategoryController);

    //Story4: Sort
    app.route('/events/sort')
        .get(events.sortEventController);

    //Story5: Pagination
    app.route('/events/page')
        .get(events.getEventsByPageController);

    //Story6: Combination
    app.route('/events/combineSearch')
        .get(events.combineSearchEventController);

    //Story7: Event details & Story8: Similar events
    app.route('/events/:id/detail')
        .get(events.getTheEventDetailController); //list a single event's detail information

    //Story14: Edit event
    app.route('/events/:id/changeEventDetails')
        .put(auth.isLoggedIn,auth.isOrganizer,events.alterEventDetailController);

    //Story15: Delete event
    app.route('/events/:id')
       .delete(auth.isLoggedIn,auth.isOrganizer,events.deleteEventController);
};