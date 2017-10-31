// get recommended books for a user
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
function getRecommendBooks(username){
    var promises = [];

				var dateLimit = new Date();
				dateLimit.setDate(dateLimit.getDate() - 60); //less than 2 months

    console.log("query userEvents for :"+ username);
    var userEventQuery = new Parse.Query("UserEvent");
    userEventQuery.equalTo("username", username);
    userEventQuery.descending("updatedAt");
    userEventQuery.greaterThan("updatedAt", dateLimit);

    promises.push(userEventQuery.find());


    return Parse.Promise.when(promises).then(function(results) {
        //       console.log("user:"+user.toJSON());
        var userEvents = results[0];
        var readBookIds = [];
        var authors = [];
        var categories = [];
							 console.log("number of events:"+ userEvents.length);
						  for (var i = 0; i < userEvents.length; i++) {
						      var userEvent = userEvents[i]
              readBookIds.push(userEvent.get("bookId"));
              if(userEvent.get("like") || userEvent.get("recommend") ){
																	authors.push(userEvent.get("AuthorName"));
																	categories.push(userEvent.get("category"));
              }
           }

       return Parse.Promise.as({
          "readBookIds": readBookIds,
          "authors" : authors,
          "categories" : categories
       });
    });
}
