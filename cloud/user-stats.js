 /*jshint esversion: 6 */
 Parse.Cloud.define("incrementUserVisits", function(request, response) {
     var username = request.params.username;
     var visit = request.params.visit;
     var userQuery = new Parse.Query("_User");
     userQuery.equalTo("username", username);
     userQuery.limit(1);

     return userQuery.find()
         .then(function(results) {
             var user = results[0];
             if (user) {
                 user.increment("visits");
                 return user.save(null, {
                     useMasterKey: true
                 });
             } else {
                 return Parse.Promise.as(null);
             }
         })
         .then(function(results) {
            if(results){
                response.success("updated:" + username);
            }else{
               response.error("not found:"+ username);
            }

         }, function(error) {
             console.log("error:" + error);
             response.error(error);
         });
 });
