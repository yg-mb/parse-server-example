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
        if(book){
              return updateBookAndUserEvent(username, book, bookReadAddCount, bookLikeAddCount,  bookRecommendAddCount);
          }else{
              return Parse.Promise.reject("Could not find book with id: "+ bookId);
          }
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
           useMasterKey: true
       }).then(function(results) {
           var book = results[0];
            if(book){
                   return updateBookAndUserEvent(username, book, 1, 0, 0);
              }else{
                   return Parse.Promise.reject("Could not find book with id: "+ bookId);
              }
       }).then(function(results) {
           response.success("incrementFeaturedBookPlay with Book only");

       }, function(error) {
           console.log("error:" + error);
           response.error(error);
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
               useMasterKey: true
           }).then(function(results) {
               var book = results[0];
               if(book){
                    return updateBookAndUserEvent(username, book, 0, 1, 0);
               }else{
                    return Parse.Promise.reject("Could not find book with id: "+ bookId);
               }
           }).then(function(results) {
               response.success("incrementFeaturedBookLike with Book only");

           }, function(error) {
               console.log("error:" + error);
               response.error(error);
           });
});

function updateBookAndUserEvent(username, book, bookReadAddCount, bookLikeAddCount, bookRecommendAddCount){
        book.increment("playedTimes", bookReadAddCount);
        book.increment("likedTimes", bookLikeAddCount);
        book.increment("recommendTimes", bookRecommendAddCount);
        var promises = [];
        promises.push(recordUserEvent(username, book, bookReadAddCount>0, bookLikeAddCount>0, bookRecommendAddCount>0));
        promises.push(book.save(null, {
            useMasterKey: true
        }));
        return Parse.Promise.when(promises);
}

function recordUserEvent(username, book, isRead, isLike, isRecommend) {
    if (username && book) {
        var userEventQuery = new Parse.Query("UserEvent");
        userEventQuery.equalTo("username", username);
        userEventQuery.equalTo("bookId", book.id);
        userEventQuery.limit(1);
        return userEventQuery.find({ useMasterKey: true})
            .then(function(results) {
                if(results.length>0){
                    console.log("updating existing user event book.id :" + book.id);
                    return Parse.Promise.as(results[0]);
                }else{
                    var UserEventClass = Parse.Object.extend("UserEvent");
                        userEvent = new UserEventClass();
                        userEvent.set("username", username);
                        console.log("creating new user event book.id :" + book.id);
                        userEvent.set("bookId", book.id);
                        if (book.get("AuthorName")) {
                            userEvent.set("AuthorName", book.get("AuthorName"));
                        }
                        if (book.get("category")) {
                            userEvent.set("category", book.get("category"));
                        }
                    return Parse.Promise.as(userEvent);
                }
            })
            .then(function(userEvent){
                if (isRead) {
                    userEvent.set("read", true);
                }
                if (isLike) {
                    userEvent.set("like", true);
                }
                if (isRecommend) {
                    userEvent.set("recommend", true);
                }
                console.log("saving user event:" + userEvent);
                return userEvent.save(null, {
                    useMasterKey: true
                });
            });

    }else{
        return Parse.Promise.as();
    }

}
