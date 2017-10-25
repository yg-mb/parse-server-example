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
        useMasterKey: true,
        success: function(results) {
            var book = results[0];
            book.increment("playedTimes", bookReadAddCount);
            book.increment("likedTimes", bookLikeAddCount);
            book.increment("recommendTimes", bookRecommendAddCount);
            book.save(null, {
                useMasterKey: true
            });
            recordUserEvent(username, book, bookReadAddCount > 0, bookLikeAddCount > 0, bookRecommendAddCount > 0);
            response.success("incrementBookStats with Book only");
        },
        error: function() {
            response.error("bookId doesn't exist!" + request.params.bookRemoteId);
        }
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
            book.save(null, {
                useMasterKey: true
            });
            recordUserEvent(username, book, true, false, false);
            response.success("incrementBookPlay with Book only");
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
            book.save(null, {
                useMasterKey: true
            });
            recordUserEvent(username, book, false, true, false);
            response.success("incrementBookLikes with Book only");
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
        userEvent.set("bookId", book.get("id"));
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
        userEvent.save(null, {
            useMasterKey: true
        });
        console.log("recorded user event:" + userProfile);
    }

}
