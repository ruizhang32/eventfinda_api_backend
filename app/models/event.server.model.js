//Anything relating to domain elements or interactions with databases comes under the ‘model’ section
const db = require('../../config/db');

exports.searchEventsModel = async function(req){
    const keywords = req.query.keyword;
    console.log('Request to get events that include keywords from the database...' );
    const conn = await db.getPool().getConnection();
    if (keywords.length === 1) var finalSearchQuery =
        'select distinct EVENTS.eventId,eventName,eventDate,firstName,lastName,NumberOfAttendees' +
        'from EVENTS' +
        ' left join EventCategory on EVENTS.eventId = EventCategory.eventId' +
        ' left join USERS on events.organizerId = users.userId' +
        `where eventName like '%${keywords[0]}%' `;
    else{
        let searchQuery = 'select distinct EVENTS.eventId,eventName,eventDate,firstName,lastName,NumberOfAttendees ' +
            'from EVENTS' +
            ' left join EventCategory on EVENTS.eventId = EventCategory.eventId' +
            ' left join USERS on events.organizerId = users.userId' +
            ' where eventName like';
        for (let i = 0; i < keywords.length; i++){
            searchQuery +=  ` '%${keywords[i]}%' or eventName like`
        }
        finalSearchQuery = searchQuery.substr(0,searchQuery.length-18);
    }
    const [ searchResult ] = await conn.query(finalSearchQuery,[keywords]);

    for (let i = 0; i < searchResult.length; i++) {
        const eventRow = searchResult[i]
        const eventId = eventRow['eventId'];
        const findCategoryQuery =
            'select categoryName from category ' +
            'left join EventCategory on EventCategory.categoryId = Category.categoryId ' +
            `where eventId = ${eventId};`
        const [ eventsCategories ] = await conn.query(findCategoryQuery);
        const values = eventsCategories.map(item => {
            return (item['categoryName']);
        });

        if (!eventRow.hasOwnProperty('category'))   eventRow['category'] = values;
    }
    conn.release();
    return [searchResult];
};

exports.getAllEventsModel = async function(){
    console.log( 'Request to get all events from the database...' );
    const conn = await db.getPool().getConnection();
    const getAllEventsQuery = 'select distinct(eventName),eventDate,categoryName,firstName,lastName,NumberOfAttendees ' +
            'from EVENTS' +
            ' left join EventCategory on EVENTS.eventId = EventCategory.eventId' +
            ' left join category on EventCategory.categoryId = Category.categoryId' +
            ' left join USERS on events.organizerId = users.userId' +
            ' where eventDate > DATE(now());';
    const [ allEvents ] = await conn.query( getAllEventsQuery );
    conn.release();
    return allEvents;
};

exports.filterEventsByCategoryModel = async function(categoryString){
    console.log('Request to get events filtered by category from the database...' );
    const conn = await db.getPool().getConnection();
    const filterEventsByCategoryQuery = `
                select distinct(eventName)
                from EVENTS natural join EventCategory
                natural join Category
                where categoryName in (${categoryString})`;
    const [ filteredEvents ] = await conn.query(filterEventsByCategoryQuery);
    conn.release();
    return filteredEvents;
};

//events ordered according to their date, from the first to be happening to the latest.
exports.sortEventModel = async function(sortKeyword,orderKeyword){
    console.log('Request to get sorted events from the database...' );
    const conn = await db.getPool().getConnection();
    const query = `select * from EVENTS order by ${sortKeyword} ${orderKeyword};`;
    const [ sortedEvents ] = await conn.query(query);
    conn.release();
    return sortedEvents;
};

exports.getEventsByPageModel = async function(reqPageNumber,res){
    let pageNo = parseInt(reqPageNumber) - 1;
    console.log( `Request to list events of page ${reqPageNumber} from the database...` );
    const conn = await db.getPool().getConnection();
    //get how many pages...
    const [eventCounter] = await conn.query('select count(*) as eventCounter from EVENTS;');
    const lastPageNo = Math.floor((eventCounter[0].eventCounter)/2) - 1;
    if (lastPageNo < pageNo) {
        //if requested page number is larger than last page no, set pageNo as last page no...
        pageNo = lastPageNo;
    }
    if (lastPageNo === pageNo) var pageMsg = `This is page No.${reqPageNumber}, This is the last page!`;
    else pageMsg = `This is page No.${reqPageNumber}`;

    const pageStartingRow = pageNo * 2; //2 here is the number of events per page, website designer decides how many events per page
    const query = `select * from EVENTS order by eventDate LIMIT 2 OFFSET ${pageStartingRow};`;
    const [ pagedEvents ] = await conn.query( query );
    conn.release();
    return [pagedEvents,pageMsg];
};

exports.combineSearchEventModel = async function(keywords,categoryString,sortKeyword,orderKeyword){
    console.log(`Request to get events that name includes ${keywords}.
                Event(s) is(are) in category ${categoryString}, sorted by ${sortKeyword} in ${orderKeyword} order from the database ` );
    const conn = await db.getPool().getConnection();
    let query = 'select distinct(eventName),eventDate from EVENTS natural join EventCategory natural join Category where 1=1 ';
    if (categoryString !== "'undefined'") query += ` and categoryName in (${categoryString})`;
    //if can have only one keyword:
    if (keywords.length === 1) var finalSearchQuery =
        'select distinct EVENTS.eventId,eventName,eventDate,firstName,lastName,NumberOfAttendees' +
        'from EVENTS' +
        ' left join EventCategory on EVENTS.eventId = EventCategory.eventId' +
        ' left join USERS on events.organizerId = users.userId' +
        `where eventName like '%${keywords[0]}%' `;
    else{
        let searchQuery = 'select distinct EVENTS.eventId,eventName,eventDate,firstName,lastName,NumberOfAttendees ' +
            'from EVENTS' +
            ' left join EventCategory on EVENTS.eventId = EventCategory.eventId' +
            ' left join USERS on events.organizerId = users.userId' +
            ' where eventName like';
        for (let i = 0; i < keywords.length; i++){
            searchQuery +=  ` '%${keywords[i]}%' or eventName like`
        }
        finalSearchQuery = searchQuery.substr(0,searchQuery.length-18);
    }

    if (sortKeyword !== undefined) finalSearchQuery +=  ` order by ${sortKeyword}`;
    if (orderKeyword !== undefined) finalSearchQuery += ` ${orderKeyword}`;
    const [ combineSearchResult ] = await conn.query(finalSearchQuery);
    conn.release();
    return combineSearchResult;
};

exports.getTheEventDetailModel = async function(eventId){
    console.log( `Request to get event ${eventId} details from the database...` );
    const conn = await db.getPool().getConnection();
    // Organizer: profile image (or a default, if none exists), first name and last name;
    // List of attendees, each one with their first and last names, and profile picture displayed;
    const getEventDetailsQurey = 'select * from EVENTS EQUI Join PROFILES on organizerId = userId where eventId = ?';
    const [ eventDetails ] = await conn.query(getEventDetailsQurey,[eventId]);

    for (let i = 0; i < eventDetails.length; i++) {
        const eventDetailsRow = eventDetails[i]
        const eventId = eventDetailsRow['eventId'];
        const findSimilarEventQuery =
            'select distinct (eventName) from EVENTS ' +
            'natural join EventCategory ' +
            'where categoryId in ' +
            `(select categoryId from EventCategory natural join EVENTS natural join category where eventId = ${eventId});`
        const [ similarEvents ] = await conn.query(findSimilarEventQuery);
        const similarEventName = similarEvents.map(item => {
            return (item['eventName']);
        });
        const attendeeQuery = `
            (select firstName, lastName, profilePhoto, 'attendee' as role 
            from registerInterest
            natural join users where eventId = ${eventId}) union
            (select firstName, lastName, profilePhoto, 'organizer' as role
            from holdEvent
            natural join users where eventId = ${eventId}
            );`;
        const [ attendeeList ] = await conn.query(attendeeQuery);
        const attendees = attendeeList.map(item => {
            return item;
        });

        if (!eventDetailsRow.hasOwnProperty('similarEvent'))   eventDetailsRow['similarEvent'] = similarEventName;
        if (!eventDetailsRow.hasOwnProperty('attendee'))   eventDetailsRow['attendee'] = attendees;
    }

    conn.release();
    return [eventDetails];
}

exports.addEventsModel = async function(req,res){
    console.log( 'Request to add an event into the database...' );
    const conn = await db.getPool().getConnection();
    //在后端check optional的attribute是否有被输入--在model模块验证
    // eventPhoto,YES
    // NumberOfAttendees,YES
    // maxCapacity,YES
    // eventURL,YES
    // eventVenue,YES
    // fee,YES
    //前端输入的内容的格式是否正确在前端验证
    //可以检查event name是否有重复......
    let insertContents = ' (eventName,eventDate,';
    let addEventValues = [req.body.eventName,req.body.eventDate];

    if (req.body.eventPhoto !== undefined) {
        insertContents += 'eventPhoto,';
        addEventValues.push(req.body.eventPhoto);
    }
    insertContents += 'description,';
    addEventValues.push(req.body.description);

    if (req.body.NumberOfAttendees !== undefined) {
        insertContents += 'NumberOfAttendees,';
        addEventValues.push(req.body.NumberOfAttendees);
    }

    if (req.body.maxCapacity !== undefined) {
        insertContents += 'maxCapacity,';
        addEventValues.push(req.body.maxCapacity);
    }

    insertContents += 'eventType,';
    addEventValues.push(req.body.eventType);

    if (req.body.eventType === 'online'){
        if(req.body.eventVenue !== undefined) {
            res.status(400).send('Online events must have URL, but not venue');
            return;
        }
        if (req.body.eventURL === undefined) {
            res.status(400).send('Online events must have URL');
            return;
        }
    }else{
        if(req.body.eventVenue === undefined) {
            res.status(400).send('In-person events must have a venue');
            return;
        }
    }

    //Online events must have URL, but not venue.
    if (req.body.eventURL !== undefined) {
        insertContents += 'eventURL,';
        addEventValues.push(req.body.eventURL);
    }
    // in-person events must have a venue, and they may or may not have a U
    if (req.body.eventVenue !== undefined) {
        insertContents += 'eventVenue,';
        addEventValues.push(req.body.eventVenue);
    }

    insertContents += 'controlAttendance,';
    addEventValues.push(req.body.controlAttendance);

    if (req.body.fee !== undefined) {
        insertContents += 'fee,';
        addEventValues.push(req.body.fee);
    }

    // When an event is created, the user is added as the event's organizer
    const organizerId = req.userData.userId;
    insertContents += 'organizerId) ';
    addEventValues.push(organizerId);

    const addEventQuery = 'INSERT INTO EVENTS' + insertContents + ' VALUES (?)';
    const [addEventRows] = await conn.query(addEventQuery,[addEventValues]);

    const eventId = addEventRows['insertId'];
    const insertIntoHoldEventQuery = `insert into holdEvent (eventId, organizerId) values (${eventId},${organizerId});`
    const [insertIntoHoldEventResult] = await conn.query(insertIntoHoldEventQuery);

    conn.release();
    return [addEventRows,insertIntoHoldEventResult];
};

exports.deleteEventModel = async function(id){
    console.log( `Request to delete user ${id} from the database...` );
    const conn = await db.getPool().getConnection();
    const query = 'DELETE from EVENTS where eventId = ?';
    const [ rows ] = await conn.query(query,[id]);
    conn.release();
    return rows;
};

exports.getEventsByUserModel = async function(userId){
    console.log( `Request to get all event of user ${userId} from the database...` );
    const conn = await db.getPool().getConnection();
    const getEventsByUserQuery = `
        (select distinct e.eventId,eventName,eventDate,firstName as organizerFirstName,lastName as organizerLastName,NumberOfAttendees
        from EVENTS e
        left join holdEvent hE on e.eventId = hE.eventId
        left join USERS u on u.userId = hE.organizerId
        where e.organizerId = ${userId})
        union
        (select distinct e.eventId,eventName,eventDate,firstName as organizerFirstName,lastName as organizerLastName,NumberOfAttendees
        from EVENTS e
        left join registerInterest rI on e.eventId = rI.eventId
        left join USERS u on u.userId = rI.userId
        where rI.userId = ${userId});`
    console.log(getEventsByUserQuery);
    const [ getEventsByUserRows ] = await conn.query(getEventsByUserQuery);
    conn.release();
    return getEventsByUserRows;
};

exports.alterEventDetailModel = async function(req, res){
    // const eventId = req.params.id;
    const id = req.params.id;
    console.log( `Request to update event ${id} details from database...` );
    const conn = await db.getPool().getConnection();
    //可加入validation验证输入的body的正确性，如果是错误格式，res.status(400).send(err.details[0].message);
    const requestDetails = req.body;
    //如果req.body不应该为空，前端已检测
    var query = '';

    for (const [key, value] of Object.entries(requestDetails)) {
        if (value !== undefined) query += `${key} = '${value}',`
    }
    var finalQuery = query.substring(0, query.length - 1);
    const alterQuery = `UPDATE EVENTS set ${finalQuery} where eventId = ?`;
    console.log(alterQuery);
    const [addEventRows] = await conn.query(alterQuery,[id]);

    conn.release();
    return addEventRows;
};




