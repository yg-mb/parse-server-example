 /*jshint esversion: 6 */


// get recommended books for a user
const MAX_NUMBER_OF_DAYS = 45;
const MAX_NUMBER_OF_BOOKS_PER_GROUP = 4;
const MAX_NUMBER_OF_READ = 20;
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
            var authors = results.authors.filter(e => e !== username);
            var categories = results.categories;
            var readBookIds = results.readBookIds;
            var resultsPromises = [];
            if(authors.length >0){
                resultsPromises.push(Parse.Promise.as(authors));
            }else{
                // if no authors, use top author
                resultsPromises.push(Parse.Promise.as(["sarahness","crystalgaming9","willowteddyboo", "piepiediva","kinda","major_wolf","powell24","chip","brianacute","sharpie"]));
            }
             if(categories.length >0){
                resultsPromises.push(Parse.Promise.as(categories));
            }else{
                // if no category, use top category
                resultsPromises.push(Parse.Promise.as(["Comedy","Adventure","Singing", "Fantasy", "Humor"]));
            }
            resultsPromises.push(Parse.Promise.as(readBookIds));
            return Parse.Promise.when(resultsPromises);

        }).then(function(results ) {
            authors = results[0];
            categories = results[1];
            readBookIds = results[2];
            console.log("creating recommendBookPromises");
            var recommendBookPromises = [];
            recommendBookPromises.push(getRecommendTopBooksByAuthor(readBookIds, authors, dateLimit));
            recommendBookPromises.push(getRecommendNewBooksByAuthor(readBookIds, authors, dateLimit));
            recommendBookPromises.push(getRecommendTopBooksByCategory(readBookIds, categories, dateLimit));
            recommendBookPromises.push(getRecommendNewBooksByCategory(readBookIds, categories, dateLimit));
            return Parse.Promise.when(recommendBookPromises);
        }).then(function(results) {
            for (var i = 0; i < results.length; i++) {
                shuffleArray(results[i]);
                results[i] = results[i].slice(0, MAX_NUMBER_OF_BOOKS_PER_GROUP);
            }
            var topBooksByAuthor = results[0];
            var newBooksByAuthor = results[1];
            var topBooksByCategory = results[2];
            var newBooksByCategory = results[3];

            var bookMapFunction = function(a){
                return JSON.stringify({id: a.id, title: a.get("title")});
            };

             console.log("topBooksByAuthor:"+topBooksByAuthor.map(bookMapFunction));
             console.log("newBooksByAuthor:"+newBooksByAuthor.map(bookMapFunction));
             console.log("topBooksByCategory:"+topBooksByCategory.map(bookMapFunction));
             console.log("newBooksByCategory:"+newBooksByCategory.map(bookMapFunction));
            return Parse.Promise.as({
                "topBooksByAuthor": topBooksByAuthor.map(function(a) { return a.id;}),
                "newBooksByAuthor": newBooksByAuthor.map(function(a)  { return a.id;}),
                "topBooksByCategory": topBooksByCategory.map(function(a) { return a.id;}),
                "newBooksByCategory": newBooksByCategory.map(function(a)  { return a.id;})
            });
        });
}

//best books of authors
function getRecommendTopBooksByAuthor(readBookIds, authors, dateLimit){
    console.log("query best books of authors:"+ authors);
    var bookQuery = new Parse.Query("PublishedBook");
    bookQuery.notEqualTo("active",false);   //not removed
    bookQuery.containedIn("AuthorName", authors);   //within authors
    bookQuery.notContainedIn("objectId",readBookIds);   //not read by me
    // bookQuery.greaterThan("publish_date", dateLimit);
    bookQuery.limit(MAX_NUMBER_OF_BOOKS_PER_GROUP*2);
    bookQuery.descending("likedTimes"); //top liked by others

    return bookQuery.find({
               useMasterKey: true
           });
}

//recent new books of authors
function getRecommendNewBooksByAuthor(readBookIds, authors, dateLimit){
    console.log("query new books of authors:"+ authors);
    var bookQuery = new Parse.Query("PublishedBook");
    bookQuery.notEqualTo("active",false);   //not removed
    bookQuery.containedIn("AuthorName", authors);   //within authors
    bookQuery.notContainedIn("objectId",readBookIds);   //not read by me
    bookQuery.greaterThan("publish_date", dateLimit);    //recently published
    bookQuery.limit(MAX_NUMBER_OF_BOOKS_PER_GROUP*2);
    bookQuery.descending("publish_date");    //recently published

    return bookQuery.find({
               useMasterKey: true
           });
}
//best recent books of categories
function getRecommendTopBooksByCategory(readBookIds, categories, dateLimit){
    console.log("query best books of categories:"+ categories);
    var bookQuery = new Parse.Query("PublishedBook");
    bookQuery.notEqualTo("active",false);    //not removed
    bookQuery.containedIn("category", categories); //within categories
    bookQuery.notContainedIn("objectId",readBookIds); //not read by me
    bookQuery.greaterThan("publish_date", dateLimit); //recently published
    bookQuery.limit(MAX_NUMBER_OF_BOOKS_PER_GROUP*2);
    bookQuery.descending("likedTimes"); // top liked by others
    return bookQuery.find({
               useMasterKey: true
           });
}

//recent new books of categories
function getRecommendNewBooksByCategory(readBookIds, categories, dateLimit){
    console.log("query new books of categories:"+ categories);
    var bookQuery = new Parse.Query("PublishedBook");
    bookQuery.notEqualTo("active",false);               //not removed
    bookQuery.containedIn("category", categories);      //within categories
    bookQuery.notContainedIn("objectId",readBookIds); //not read by me
    bookQuery.lessThan("playedTimes", MAX_NUMBER_OF_READ);  //not read by many others
    bookQuery.greaterThan("publish_date", dateLimit);   //recently published
    bookQuery.greaterThan("pages", MIN_NUMBER_OF_PAGE);     //book not too short
    bookQuery.limit(MAX_NUMBER_OF_BOOKS_PER_GROUP*2);
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
        if(userEvent.get("bookId")){
            readBookIds.push(userEvent.get("bookId"));
        }
        if (userEvent.get("like") || userEvent.get("recommend")|| userEvent.get("save")) {
            var author = userEvent.get("AuthorName");
            if(author){
                if (authorMap.has(author)) {
                    authorMap.set(author, authorMap.get(author) + 1);
                } else {
                    authorMap.set(author, 1);
                }
            }

            var category = userEvent.get("category");
            if(category){
                if (categoryMap.has(category)) {
                    categoryMap.set(category, categoryMap.get(category) + 1);
                } else {
                    categoryMap.set(category, 1);
                }
            }
        }
    }
    var authors = [...authorMap];
    var categories = [...categoryMap];

    console.log("authors:"+ JSON.stringify(authors));
    console.log("categories:"+ JSON.stringify(categories));
    authors.sort = function(a,b) {
        if(a && b){
            return a[1]>b[1]? 1:a[1]<b[1]?-1:0;
        }else{
            return 0;
        }
    };
    authors.sort();

    categories.sort = function(a,b) {
      if(a && b){
             return a[1]>b[1]? 1:a[1]<b[1]?-1:0;
         }else{
             return 0;
         }
    };
    categories.sort();

    //take top random 2 authors of top 8
    authors = authors.slice(0, 2*MAX_NUMBER_OF_BOOKS_PER_GROUP);
    categories = categories.slice(0, MAX_NUMBER_OF_BOOKS_PER_GROUP);
    shuffleArray(authors);
//    shuffleArray(categories);
    authors = authors.slice(0, MAX_NUMBER_OF_BOOKS_PER_GROUP/2);
//    categories = categories.slice(0, MAX_NUMBER_OF_BOOKS_PER_GROUP);

    authors = authors.map(function(a) { return a[0];});
    categories = categories.map(function(a) { return a[0];});
    console.log("sorted authors:"+ authors);
    console.log("sorted categories:"+ categories);

    return Parse.Promise.as({
        "readBookIds": readBookIds,
        "authors": authors,
        "categories": categories
    });

}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
