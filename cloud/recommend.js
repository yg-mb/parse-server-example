// get recommended books for a user
Parse.Cloud.define("RecommendBook", function(request, response) {
    var username = request.params.username;
    var promises = [];

				var dateLimit = new Date();
				dateLimit.setDate(dateLimit.getDate() - 60); //less than 2 months

    console.log("query userEvents for :"+ username);
    var userEventQuery = new Parse.Query("UserEvent");
    userEventQuery.equalTo("username", username);
    userEventQuery.descending("updatedAt");
    userEventQuery.greaterThan("updatedAt", dateLimit);

    promises.push(userEventQuery.find());


    Parse.Promise.when(promises).then(function(results) {
        //       console.log("user:"+user.toJSON());
        var userEvents = results[0];
									 console.log("number of events:"+ userEvents.length);

       return Parse.Promise.as(userEvents);
    }).then(function(results) {
        var responseString = JSON.stringify(results);
        response.success(responseString);
    }, function(error) {
        console.log("error:" + error);
        response.error(error);
    });
});
