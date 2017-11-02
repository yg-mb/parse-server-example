"use strict";

// get recommended books for a user
const MAX_NUMBER_OF_DAYS = 60;
const MAX_NUMBER_OF_BOOKS_PER_GROUP = 4;
const MAX_NUMBER_OF_READ = 10;
const MIN_NUMBER_OF_PAGE = 5;

Parse.Cloud.define("RecommendBook", function(request, response) {
    var username = request.params.username;
    return getRecommendBooks(username)
        .then(function(results) {
            var responseString = JSON.stringify(results);
            response.success(responseString);
        }, function(error) {
            console.log("error:" + error);
            response.error(error);
        });
});

//return a promise
function getRecommendBooks(username) {
    var promises = [];

    var dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - MAX_NUMBER_OF_DAYS); //less than 2 months

    console.log("query userEvents for :" + username);
    var userEventQuery = new Parse.Query("UserEvent");
    userEventQuery.equalTo("username", username);
    userEventQuery.descending("updatedAt");
    userEventQuery.greaterThan("updatedAt", dateLimit);

    promises.push(userEventQuery.find());


    return Parse.Promise.when(promises)
        .then(function(results) {
            //       console.log("user:"+user.toJSON());
            var userEvents = results[0];
            return getUserReadPreferences(userEvents);
        }).then(function(results) {
            var readBookIds = results.readBookIds;
            var authors = results.authors;
            var categories = results.categories;
            console.log("creating recommendBookPromises");
            var recommendBookPromises = [];
            recommendBookPromises.push(getRecommendTopBooksByAuthor(readBookIds, authors, dateLimit));
            recommendBookPromises.push(getRecommendNewBooksByAuthor(readBookIds, authors, dateLimit));
            recommendBookPromises.push(getRecommendTopBooksByCategory(readBookIds, categories, dateLimit));
            recommendBookPromises.push(getRecommendNewBooksByCategory(readBookIds, categories, dateLimit));
            return Parse.Promise.when(recommendBookPromises);
        }).then(function(results) {
            var topBooksByAuthor = results[0];
            var newBooksByAuthor = results[1];
            var topBooksByCategory = results[2];
            var newBooksByCategory = results[3];
             console.log("combine results");
            return Parse.Promise.as({
                "topBooksByAuthor": topBooksByAuthor,
                "newBooksByAuthor": newBooksByAuthor,
                "topBooksByCategory": topBooksByCategory,
                "newBooksByCategory": newBooksByCategory
            });
        });
}

//best books of authors
function getRecommendTopBooksByAuthor(readBookIds, authors, dateLimit){
    var bookQuery = new Parse.Query("PublishedBook");
    bookQuery.notEqualTo("active",false);   //not removed
    bookQuery.containedIn("AuthorName", authors);   //within authors
    bookQuery.notContainedIn("objectId",readBookIds);   //not read by me
    // bookQuery.greaterThan("publish_date", dateLimit);
    bookQuery.limit(MAX_NUMBER_OF_BOOKS_PER_GROUP);
    bookQuery.descending("likedTimes"); //top liked by others

    return bookQuery.find({
               useMasterKey: true
           });
}

//recent new books of authors
function getRecommendNewBooksByAuthor(readBookIds, authors, dateLimit){
    var bookQuery = new Parse.Query("PublishedBook");
    bookQuery.notEqualTo("active",false);   //not removed
    bookQuery.containedIn("AuthorName", authors);   //within authors
    bookQuery.notContainedIn("objectId",readBookIds);   //not read by me
    bookQuery.greaterThan("publish_date", dateLimit);    //recently published
    bookQuery.limit(MAX_NUMBER_OF_BOOKS_PER_GROUP);
    bookQuery.descending("publish_date");    //recently published

    return bookQuery.find({
               useMasterKey: true
           });
}
//best recent books of categories
function getRecommendTopBooksByCategory(readBookIds, categories, dateLimit){
    var bookQuery = new Parse.Query("PublishedBook");
    bookQuery.notEqualTo("active",false);    //not removed
    bookQuery.containedIn("category", categories); //within categories
    bookQuery.notContainedIn("objectId",readBookIds); //not read by me
    bookQuery.greaterThan("publish_date", dateLimit); //recently published
    bookQuery.limit(MAX_NUMBER_OF_BOOKS_PER_GROUP);
    bookQuery.descending("likedTimes"); // top liked by others
    return bookQuery.find({
               useMasterKey: true
           });
}

//recent new books of categories
function getRecommendNewBooksByCategory(readBookIds, categories, dateLimit){
    var bookQuery = new Parse.Query("PublishedBook");
    bookQuery.notEqualTo("active",false);               //not removed
    bookQuery.containedIn("category", categories);      //within categories
    bookQuery.notContainedIn("objectId",readBookIds); //not read by me
    bookQuery.lessThan("playedTimes", MAX_NUMBER_OF_READ);  //not read by many others
    bookQuery.greaterThan("publish_date", dateLimit);   //recently published
    bookQuery.greaterThan("pages", MIN_NUMBER_OF_PAGE);     //book not too short
    bookQuery.limit(MAX_NUMBER_OF_BOOKS_PER_GROUP);
    bookQuery.descending("recommendTimes");     // top recommended by others

    return bookQuery.find({
               useMasterKey: true
           });
}

function getUserReadPreferences(userEvents) {
    var readBookIds = [];
    var authorMap = new Map(); //author name -> count
    var categoryMap = new Map(); //category name -> count
    console.log("number of events:" + userEvents.length);
    for (var i = 0; i < userEvents.length; i++) {
        var userEvent = userEvents[i];
        readBookIds.push(userEvent.get("bookId"));
        if (userEvent.get("like") || userEvent.get("recommend")) {
            var author = userEvent.get("AuthorName");
            if (authorMap.has(author)) {
                authorMap.set(author, authorMap.get(author) + 1);
            } else {
                authorMap.set(author, 1);
            }

            var category = userEvent.get("category");
            if (categoryMap.has(category)) {
                categoryMap.set(category, categoryMap.get(category) + 1);
            } else {
                categoryMap.set(category, 1);
            }
        }
    }
    var authors = [...authorMap].slice(0, MAX_NUMBER_OF_BOOKS_PER_GROUP*2);
    var categories = [...categoryMap].slice(0, MAX_NUMBER_OF_BOOKS_PER_GROUP);

    authors.sort = function(a,b) {
        return a[1]>b[1]? 1:a[1]<b[1]?-1:0;
    };
    authors.sort();

    categories.sort = function(a,b) {
        return a[1]>b[1]? 1:a[1]<b[1]?-1:0;
    };
    categories.sort();
    //todo only keep first n results of authors and categories
    return Parse.Promise.as({
        "readBookIds": readBookIds,
        "authors": authors,
        "categories": categories
    });

}
