 /*jshint esversion: 6 */
 Parse.Cloud.define("incrementUserVisits", function(request, response) {
     var username = request.params.username;
     var userQuery = new Parse.Query("_User");
     userQuery.equalTo("username", username);
     userQuery.limit(1);

     return userQuery.find()
         .then(function(results) {
             var user = results[0];
             if (user) {
                 user.increment("userVisits");
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


Parse.Cloud.define("incrementUserLikes", function(request, response) {
     var username = request.params.username;
     var likedByUsername = request.params.byUsername;
     var like = request.params.like;

     var promises = [];
     var userQuery = new Parse.Query("_User");
     userQuery.equalTo("username", username);
     userQuery.limit(1);
     promises.push(userQuery.find());

     var userEventQuery = new Parse.Query("UserLikeEvent");
     userEventQuery.equalTo("username", likedByUsername);
     userEventQuery.equalTo("AuthorName", username);
     userEventQuery.limit(1);
     promises.push(userEventQuery.find());

     return Parse.Promise.when(promises)
         .then(function(results) {
             var user= results[0];
             var userEvent = results[1];
             promises = [];
             console.log("user:"+ JSON.stringify(user));
             if(user){
                 if(like){
                     user.increment("userLikes");
                 }else{
                     user.decrement("userLikes");
                 }
                 promises.push(user.save(null, {
                     useMasterKey: true
                 }));
             }else{
                  throw new Error('User not found:'+username);
             }

             if(userEvent){
                 if(like){
                     userEvent.set("like",true);
                 }else{
                     userEvent.set("like",false);
                 }
                 promises.push(userEvent.save(null, {
                     useMasterKey: true
                 }));
             }else{
                 var UserEventClass = Parse.Object.extend("UserLikeEvent");
                     userEvent = new UserEventClass();
                     userEvent.set("username", likedByUsername);
                      userEvent.set("AuthorName", username);
                     if(like){
                         userEvent.set("like",true);
                     }else{
                         userEvent.set("like",false);
                     }
                 promises.push(userEvent.save(null, {
                     useMasterKey: true
                 }));
             }
             return Parse.Promise.when(promises);
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
