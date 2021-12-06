//all the application’s logic is stored under the ‘controller’ section
const event = require('../models/event.server.model');

exports.searchEventsController = async function(req, res, next){
    console.log( '\nRequest to search events by keyword(s)...' );
    try {
        const result = await event.searchEventsModel(req);
        res.status( 200 )
    .send( result );
    } catch( err ) {
        res.status( 500 )
        .send( `ERROR searching events by keyword(s) ${ err }` );
    }
    next();
};

exports.getAllEventsController = async function(req, res){
    console.log( '\nRequest to see a list of the existing events yet to be happening...' );
    try {
        const result = await event.getAllEventsModel();
        res.status( 200 )
    .send( result );
    } catch( err ) {
        res.status( 500 )
        .send( `ERROR getting events ${ err }` );
    }
};

exports.filterEventsByCategoryController = async function(req, res){
    console.log( '\nRequest to filter events by category...' );
    let categoryName = req.query.categoryName;
    let categoryString = '';
    //check if categoryName in category list, if not, won't be added to categoryString
    if (categoryName instanceof Array) categoryString = categoryName.map(x => "'" + x + "'").toString();
    else categoryString = `'${categoryName}'`;
    console.log(categoryString);
    try {
        const result = await event.filterEventsByCategoryModel(categoryString);
        res.status( 200 )
    .send( result );
    } catch( err ) {
        res.status( 500 )
        .send( `ERROR filtering events by category ${ err }` );
    }
};

exports.sortEventController = async function(req, res){
    console.log( '\nRequest to sort events...' );
    const sortKeyword = req.query.sortKeyword;
    const orderKeyword = req.query.orderKeyword;
    try {
        const result = await event.sortEventModel(sortKeyword,orderKeyword);
        res.status( 200 )
    .send( result );
    } catch( err ) {
        res.status( 500 )
        .send( `ERROR sorting events ${ err }` );
    }
};

exports.getEventsByPageController = async function(req, res){
    console.log( '\nRequest to list events by page...' );
    const pageNumber = req.query.page;
    try {
        const result = await event.getEventsByPageModel(pageNumber);
        res.status( 200 )
    .send( result );
    } catch( err ) {
        res.status( 500 )
        .send( `ERROR getting events ${ err }` );
    }
};

exports.combineSearchEventController = async function(req, res){
    console.log( '\nRequest to search/filter/sort events...' );
    //find all the parameters
    //parameters for searching
    var keywords = req.query.keywords;
    //parameters for filtering
    let categoryName = req.query.categoryName;
    let categoryString = '';
    if (categoryName instanceof Array) categoryString = categoryName.map(x => "'" + x + "'").toString();
    else categoryString = `'${categoryName}'`;
    //parameters for sorting
    const sortKeyword = req.query.sortKeyword;
    const orderKeyword = req.query.orderKeyword;
    try {
        const result = await event.combineSearchEventModel(keywords,categoryString,sortKeyword,orderKeyword);
        res.status( 200 )
    .send( result );
    } catch( err ) {
        res.status( 500 )
        .send( `ERROR combine searching events ${ err }` );
    }
};

exports.getTheEventDetailController = async function(req, res){
    const eventId = req.params.id;
    console.log(`\nRequest to see event ${eventId} details...`);
    try {
        const result = await event.getTheEventDetailModel(eventId);
        if (result.length === 0){
            res.status(400)
                .send('Invalid Id');
        }else {
            res.status(200)
                .send(result)
        }
    } catch( err ) {
        res.status( 500 )
        .send( `ERROR getting events ${ err }` );
    }
}

exports.addEventsController = async function(req, res){
    console.log( '\nRequest to create a new event...' );
    try {
        const result = await event.addEventsModel(req,res);
        res.status( 200 ).send('Event created.');
    } catch( err ) {
        //500  Internal Server Error 通用错误消息，服务器遇到了一个未曾预料的状况，导致了它无法完成对请求的处理。
        res.status( 500 )
        .send( `ERROR getting event ${ err }` );
    }
};

exports.alterEventDetailController = async function(req, res){
    console.log( `\nRequest to update event ${req.params.id} details...` );
    // const id = req.params.id;
    // const newName = req.body.eventName;
    try {
        const result = await event.alterEventDetailModel(req,res);
        if (result.length === 0){
            res.status(400)
                .send('Invalid Id');
        }else {
            res.status(200)
                .send(result)
        }
    } catch( err ) {
        res.status( 500 )
        .send( `ERROR getting events ${ err }` );
    }
};

exports.deleteEventController = async function(req, res){
    console.log( '\nRequest to delete an event...' );
    const id = req.params.id;
    console.log(id);
    try {
        const result = await event.deleteEventModel(id);
        if (result.length === 0){
            res.status(400)
                .send('Invalid Id');
        }else {
            res.status(200)
                .send(result)
        }
    } catch( err ) {
        res.status( 500 )
        .send( `ERROR getting events ${ err }` );
    }
};

exports.getEventsByUserController = async function(req, res){
    const userId = req.params.id;
    console.log( `\nRequest to get all event of user ${userId}. This user is either as an attendee or as organizer...` );
    try {
        const result = await event.getEventsByUserModel(userId);
        if (result.length === 0){
            res.status(400)
                .send('Invalid Id');
        }else {
            res.status(200)
                .send(result)
        }
    } catch( err ) {
        res.status( 500 )
        .send( `ERROR getting events ${ err }` );
    }
};




