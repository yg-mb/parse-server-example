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
    userEventQuery.equalTo("like",true)
    userEventQuery.equalTo("username", username);
    userEventQuery.descending("updatedAt");
    userEventQuery.greaterThan("updatedAt", dateLimit);

    promises.push(userEventQuery.find());


    return Parse.Promise.when(promises).then(function(results) {
        //       console.log("user:"+user.toJSON());
        var userEvents = results[0];
        var bookIds = [];
							 console.log("number of events:"+ userEvents.length);
						  for (var i = 0; i < userEvents.length; i++) {
              bookIds.push(userEvents[i].id);
           }

       return Parse.Promise.as(bookIds);
    });
}
