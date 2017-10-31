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
        var authors = new Map(); //author name -> count
        var categories = new Map(); //category name -> count
							 console.log("number of events:"+ userEvents.length);
						  for (var i = 0; i < userEvents.length; i++) {
						      var userEvent = userEvents[i]
              readBookIds.push(userEvent.get("bookId"));
              if(userEvent.get("like") || userEvent.get("recommend") ){
                 var author = userEvent.get("AuthorName");
                 if(authors.has(author)){
                    authors.set(author, authors.get(author)+1);
                 }else{
                    authors.set(author, 1);
                 }
                 console.log("authors:"+ JSON.stringify([ ...authors]));

                 var category = userEvent.get("category");
																	if(categories.has(category)){
                    categories.set(category, categories.get(category)+1);
                 }else{
                    categories.set(category, 1);
                 }
                 console.log("categories:"+ JSON.stringify([ ...categories.entries()]));
              }
           }

       return Parse.Promise.as({
          "readBookIds": readBookIds,
          "authors" : [...authors],
          "categories" : [...categories]
       });
    });
}
