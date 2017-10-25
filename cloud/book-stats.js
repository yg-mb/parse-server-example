Parse.Cloud.define("incrementFeaturedBookStats", function(request, response) {
    var bookQuery = new Parse.Query("PublishedBook");

    var bookId = request.params.bookRemoteId;
    var bookLikeAddCount = request.params.likedTimes || 0;
    var bookReadAddCount = request.params.readTimes || 0;
    var bookRecommendAddCount = request.params.recommendTimes || 0;
    var username = request.params.username;

    console.log("search with ids:" + bookId);
    bookQuery.equalTo("objectId", bookId);
    bookQuery.limit(1);
    bookQuery.find({
        useMasterKey: true
    }).then(function(results) {
        var book = results[0];
        book.increment("playedTimes", bookReadAddCount);
        book.increment("likedTimes", bookLikeAddCount);
        book.increment("recommendTimes", bookRecommendAddCount);
        var promises = [];

        promises.push(recordUserEvent(username, book, false, true, false));
        promises.push(book.save(null, {
            useMasterKey: true
        }));
        console.log("search with ids:" + bookId);
        return Parse.Promise.when(promises);
    }).then(function(results) {
        response.success("incrementFeaturedBookStats with Book only");

    }, function(error) {
        console.log("error:" + error);
        response.error(error);
    });
});

Parse.Cloud.define("incrementBookReport", function(request, response) {
    var bookQuery = new Parse.Query("PublishedBook");

    var bookId = request.params.bookRemoteId;
    console.log("search with ids:" + bookId);
    bookQuery.equalTo("objectId", bookId);
    bookQuery.limit(1);
    bookQuery.find({
        useMasterKey: true,
        success: function(results) {
            var book = results[0];
            book.increment("reportedTimes");
            book.save(null, {
                useMasterKey: true
            });
            response.success("incrementBookReport with Book only");
        },
        error: function() {
            response.error("bookId doesn't exist!" + request.params.bookRemoteId);
        }
    });
});

Parse.Cloud.define("incrementFeaturedBookPlay", function(request, response) {
    var bookQuery = new Parse.Query("PublishedBook");
    var username = request.params.username;
    var bookId = request.params.bookRemoteId;
    console.log("search with ids:" + bookId);
    bookQuery.equalTo("objectId", bookId);
    bookQuery.limit(1);
    bookQuery.find({
        useMasterKey: true,
        success: function(results) {
            var book = results[0];
            book.increment("playedTimes");
            var promises = [];
            promises.push(recordUserEvent(username, book, false, true, false));
            promises.push(book.save(null, {
                useMasterKey: true
            }));
            return Parse.Promise.when(promises).then(function(results) {
                response.success("incrementFeaturedBookPlay with Book only");
            }, function(error) {
                console.log("error:" + error);
                response.error(error);
            });
        },
        error: function() {
            response.error("bookId doesn't exist!" + request.params.bookRemoteId);
        }
    });
});

// Use Parse.Cloud.define to define as many cloud functions as you want.
Parse.Cloud.define("incrementFeaturedBookLike", function(request, response) {
    var bookQuery = new Parse.Query("PublishedBook");
    var username = request.params.username;
    var bookId = request.params.bookRemoteId;
    bookQuery.equalTo("objectId", bookId);
    bookQuery.limit(1);
    bookQuery.find({
        useMasterKey: true,
        success: function(results) {
            var book = results[0];
            book.increment("likedTimes");
            var promises = [];
            promises.push(recordUserEvent(username, book, false, true, false));
            promises.push(book.save(null, {
                useMasterKey: true
            }));
            return Parse.Promise.when(promises).then(function(results) {
                response.success("incrementFeaturedBookLike with Book only");
            }, function(error) {
                console.log("error:" + error);
                response.error(error);
            });

        },
        error: function() {
            response.error("bookId doesn't exist!" + request.params.bookRemoteId);
        }
    });
});

function recordUserEvent(username, book, isRead, isLike, isRecommend) {
    if (username && book) {
        var UserEventClass = Parse.Object.extend("UserEvent");
        userEvent = new UserEventClass();
        userEvent.set("username", username);
        console.log("recording user event 0 :" + userProfile);
        console.log("recording user event book.id :" + book.id);
        userEvent.set("bookId", book.id);
        console.log("recording user event 1 :" + userProfile);
        if (book.get("AuthorName")) {
            userEvent.set("AuthorName", book.get("AuthorName"));
        }
        if (book.get("category")) {
            userEvent.set("category", book.get("category"));
        }
        if (isRead) {
            userEvent.set("read", true);
        }
        if (isLike) {
            userEvent.set("like", true);
        }
        if (isRecommend) {
            userEvent.set("recommend", true);
        }
        console.log("recording user event:" + userProfile);
        return userEvent.save(null, {
            useMasterKey: true
        });

    }

}
