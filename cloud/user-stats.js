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
             var user= results[0][0];
             var userEvent = results[1][0];
             promises = [];
//             console.log("user:"+ JSON.stringify(user));
             if(!user){
                 throw new Error('User not found:'+username);
             }

             if(userEvent){
                 if(like && !userEvent.get("like")){
                     userEvent.set("like",true);
                     user.increment("userLikes");
                 }else if( !like && userEvent.get("like")){
                     userEvent.set("like",false);
                     user.increment("userLikes", -1);
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
                         user.increment("userLikes");
                     }else{
                         userEvent.set("like",false);
                     }
                 promises.push(userEvent.save(null, {
                     useMasterKey: true
                 }));
             }
             promises.push(user.save(null, {
                                 useMasterKey: true
                             }));
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


Parse.Cloud.define("getLikedAuthors", function(request, response) {
   var username = request.params.username;
   var userEventQuery = new Parse.Query("UserLikeEvent");
   userEventQuery.equalTo("username", username);

   return userEventQuery.find()
         .then(function(results) {
             var userNames = results.map(function(a) { return a.get("AuthorName");});
             response.success( JSON.stringify(userNames));
         }, function(error) {
             console.log("error:" + error);
             response.error(error);
         });
 });

 Parse.Cloud.define("incrementClubVisits", function(request, response) {
     var clubGuid = request.params.club_guid;
     var userQuery = new Parse.Query("Aniclub");
     userQuery.equalTo("guid", clubGuid);
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
                response.success("updated:" + clubGuid);
            }else{
               response.error("not found:"+ clubGuid);
            }

         }, function(error) {
             console.log("error:" + error);
             response.error(error);
         });
 });

 Parse.Cloud.define("incrementClubLikes", function(request, response) {
      var clubGuid = request.params.club_guid;
      var likedByUsername = request.params.byUsername;
      var like = request.params.like;

      var promises = [];
      var userQuery = new Parse.Query("Aniclub");
      userQuery.equalTo("guid", clubGuid);
      userQuery.limit(1);
      promises.push(userQuery.find());

      var userEventQuery = new Parse.Query("UserLikeEvent");
      userEventQuery.equalTo("username", likedByUsername);
      userEventQuery.equalTo("clubGuid", clubGuid);
      userEventQuery.limit(1);
      promises.push(userEventQuery.find());

      return Parse.Promise.when(promises)
          .then(function(results) {
              var club= results[0][0];
              var userEvent = results[1][0];
              promises = [];
 //             console.log("user:"+ JSON.stringify(user));
              if(!club){
                  throw new Error('club not found:'+clubGuid);
              }

              if(userEvent){
                  if(like && !userEvent.get("like")){
                      userEvent.set("like",true);
                      club.increment("likes");
                  }else if( !like && userEvent.get("like")){
                      userEvent.set("like",false);
                      club.increment("likes", -1);
                  }
                  promises.push(userEvent.save(null, {
                      useMasterKey: true
                  }));
              }else{
                  var UserEventClass = Parse.Object.extend("UserLikeEvent");
                      userEvent = new UserEventClass();
                      userEvent.set("username", likedByUsername);
                      userEvent.set("clubGuid", clubGuid);
                      if(like){
                          userEvent.set("like",true);
                          club.increment("likes");
                      }else{
                          userEvent.set("like",false);
                      }
                  promises.push(userEvent.save(null, {
                      useMasterKey: true
                  }));
              }
              promises.push(club.save(null, {
                                  useMasterKey: true
                              }));
              return Parse.Promise.when(promises);
          })
          .then(function(results) {
             if(results){
                 response.success("updated club:" + clubGuid);
             }else{
                response.error("not found club:"+ clubGuid);
             }

          }, function(error) {
              console.log("error:" + error);
              response.error(error);
          });
  });
