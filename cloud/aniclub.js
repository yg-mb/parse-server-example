 /*jshint esversion: 6 */
 const DEFAULT_MAX_MEMBER_NUMBER = 100;

 Parse.Cloud.define("getMyClubs", function(request, response) {
     var username = request.params.username;

     var promises = [];
     var clubQuery = new Parse.Query("Aniclub");
     clubQuery.equalTo("owner", username);
     promises.push(clubQuery.find());

     var clubMemberQuery = new Parse.Query("AniclubMember");
     clubMemberQuery.equalTo("username", username);
     clubMemberQuery.notEqualTo("banned", true);
     promises.push(clubMemberQuery.find());

     var userEventQuery = new Parse.Query("UserLikeEvent");
     userEventQuery.equalTo("username", username);
     userEventQuery.exists("clubGuid");
     userEventQuery.equalTo("like", true);
     promises.push(userEventQuery.find());

     return Parse.Promise.when(promises)
         .then(function(results) {
             promises = [];
             promises.push(Parse.Promise.as(results[0]));

             var joinedClubIds = results[1].map(function(clubMember) {
                 return clubMember.get("aniclubGuid");
             });
             var joinedClubQuery = new Parse.Query("Aniclub");
             joinedClubQuery.containedIn("guid", joinedClubIds);
             promises.push(joinedClubQuery.find());

             var likedClubIds = results[2].map(function(userLikeEvent) {
                 return userLikeEvent.get("clubGuid");
             });
             var likedClubQuery = new Parse.Query("Aniclub");
             likedClubQuery.containedIn("guid", likedClubIds);
             promises.push(likedClubQuery.find());
             return  Parse.Promise.when(promises);
         })
         .then(function(results) {
             var getClubGuid = function(club) {
                 return {
                     guid: club.get("guid"),
                     name: club.get("name")
                 };
             };
             var ownedClubs = results[0].map(getClubGuid);
             var joinedClubs = results[1].map(getClubGuid);
             var likedClubs = results[2].map(getClubGuid);
             response.success(JSON.stringify({
                 owned: ownedClubs,
                 joined: joinedClubs,
                 liked: likedClubs
             }));
         }, function(error) {
             console.log("error:" + error);
             response.error(error);
         });
 });

 Parse.Cloud.define("joinClub", function(request, response) {
     var username = request.params.username;
     var clubGuid = request.params.clubGuid;
     var join = request.params.join;

     var promises = [];
     var clubQuery = new Parse.Query("Aniclub");
     clubQuery.equalTo("guid", clubGuid);
     clubQuery.limit(1);
     promises.push(clubQuery.find());

     var clubMemberQuery = new Parse.Query("AniclubMember");
     clubMemberQuery.equalTo("aniclubGuid", clubGuid);
     clubMemberQuery.equalTo("username", username);
     clubMemberQuery.limit(1);
     promises.push(clubMemberQuery.find());


     return Parse.Promise.when(promises)
         .then(function(results) {
             var club = results[0][0];
             var clubMember = results[1][0];
             var updatePromises = [];
             if (join) {
                 //join club
                 var bannedBefore = !clubMember ? false : clubMember.get("banned");
                 var currentMemberNumber = club.get("membersNumber");
                 var maxMemberNumber = club.get("maxMemberNumber") || DEFAULT_MAX_MEMBER_NUMBER;
                 if (bannedBefore) {
                     //banned from club
                     response.error("Banned");
                 } else if (currentMemberNumber >= maxMemberNumber) {
                     //club is full
                     response.error("Full");
                 } else {
                     //clean up old data
                     if (clubMember) {
                         updatePromises.push(clubMember.destroy(null, {
                             useMasterKey: true
                         }));
                     }

                     //increment member count
                     club.increment("membersNumber", 1);
                     updatePromises.push(club.save(null, {
                         useMasterKey: true
                     }));

                     //create member record
                     var AniclubMemberClass = Parse.Object.extend("AniclubMember");
                     var newClubMember = new AniclubMemberClass();
                     newClubMember.set("username", username);
                     newClubMember.set("aniclubGuid", clubGuid);
                     updatePromises.push(newClubMember.save(null, {
                         useMasterKey: true
                     }));

                     return Parse.Promise.when(updatePromises);
                 }
             } else if (clubMember) {
                 //leave club
                 //clean up old data
                 updatePromises.push(clubMember.destroy(null, {
                     useMasterKey: true
                 }));
                 //decrease member count
                 club.increment("membersNumber", -1);
                 updatePromises.push(club.save(null, {
                     useMasterKey: true
                 }));
                 return Parse.Promise.when(updatePromises);
             } else {
                 response.success("OK");
             }
         }).then(function(results) {
             response.success("OK");
         }, function(error) {
             console.log("error:" + error);
             response.error(error);
         });
 });



 Parse.Cloud.define("UpdateClubMember", function(request, response) {
     var username = request.params.username;
     var clubGuid = request.params.clubGuid;
     var banned = request.params.banned;
     var message = request.params.message;

     var promises = [];
     var clubQuery = new Parse.Query("Aniclub");
     clubQuery.equalTo("guid", clubGuid);
     clubQuery.limit(1);
     promises.push(clubQuery.find());

     var clubMemberQuery = new Parse.Query("AniclubMember");
     clubMemberQuery.equalTo("aniclubGuid", clubGuid);
     clubMemberQuery.equalTo("username", username);
     clubMemberQuery.limit(1);
     promises.push(clubMemberQuery.find());


     return Parse.Promise.when(promises)
         .then(function(results) {
             var club = results[0][0];
             var clubMember = results[1][0];
             var updatePromises = [];
             if (banned && clubMember) {
                 //ban user
                 clubMember.set("banned", true);
                 if (message) {
                     clubMember.set("banned_message", message);
                 }
                 updatePromises.push(clubMember.save(null, {
                     useMasterKey: true
                 }));

                 //decrease member count
                 club.increment("membersNumber", -1);
                 updatePromises.push(club.save(null, {
                     useMasterKey: true
                 }));
                 return Parse.Promise.when(updatePromises);
             } else {
                 response.success("OK");
             }
         }).then(function(results) {
             response.success("OK");
         }, function(error) {
             console.log("error:" + error);
             response.error(error);
         });
 });

Parse.Cloud.define("VisitClub", function(request, response) {
     var username = request.params.username;
     var clubGuid = request.params.clubGuid || request.params.club_guid;

     var promises = [];

     var aniclubQuery = new Parse.Query("Aniclub");
     aniclubQuery.equalTo("guid", clubGuid);
     aniclubQuery.limit(1);
    promises.push(aniclubQuery.find());

      var userEventQuery = new Parse.Query("UserClubLastVisit");
        userEventQuery.equalTo("username", username);
        userEventQuery.equalTo("clubGuid", clubGuid);
        userEventQuery.limit(1);
        promises.push(userEventQuery.find());

     return Parse.Promise.when(promises)
         .then(function(results) {
             var updatePromises = [];
             //increase aniclub number of visits
             if(results[0] && results[0][0]){
                var aniclub = results[0][0];
                  aniclub.increment("visits");
                   updatePromises.push(aniclub.save(null, {useMasterKey: true}));
                   console.log("increment aniclub visits to "+aniclub.get("visits"));
             }

            if(results[1] && results[1][0]){
                var userLastVisitEvent = results[1][0];
                userLastVisitEvent.set("lastVisit", new Date());
                console.log("update aniclub lastVisit to "+ userLastVisitEvent.get("lastVisit"));
                updatePromises.push(userLastVisitEvent.save(null, {
                    useMasterKey: true
                }));
            }else{
                var UserEventClass = Parse.Object.extend("UserClubLastVisit");
                var userEvent = new UserEventClass();
                userEvent.set("username", username);
                userEvent.set("clubGuid", clubGuid);
                userEvent.set("lastVisit", new Date());
                console.log("create aniclub lastVisit to "+ userEvent.get("lastVisit"));
                updatePromises.push(userEvent.save(null, {
                    useMasterKey: true
                }));
            }
             return Parse.Promise.when(updatePromises);
         }).then(function(results) {
             response.success("OK");
         }, function(error) {
             console.log("error:" + error);
             response.error(error);
         });
 });


 Parse.Cloud.define("VisitClubBookshelf", function(request, response) {
     var username = request.params.username;
     var clubGuid = request.params.clubGuid || request.params.club_guid;

     var promises = [];

     var userEventQuery = new Parse.Query("UserClubLastVisit");
     userEventQuery.equalTo("username", username);
     userEventQuery.equalTo("clubGuid", clubGuid);
     userEventQuery.limit(1);
     promises.push(userEventQuery.find());

     return Parse.Promise.when(promises)
         .then(function(results) {
             var updatePromises = [];

             if(results[0] && results[0][0]){
                 var userLastVisitEvent = results[0][0];
                 userLastVisitEvent.set("lastVisitBookshelf", new Date());
                 console.log("update aniclub lastVisitBookshelf to "+ userLastVisitEvent.get("lastVisitBookshelf"));
                 updatePromises.push(userLastVisitEvent.save(null, {
                     useMasterKey: true
                 }));
             }else{
                 var UserEventClass = Parse.Object.extend("UserClubLastVisit");
                 var userEvent = new UserEventClass();
                 userEvent.set("username", username);
                 userEvent.set("clubGuid", clubGuid);
                 userEvent.set("lastVisit", new Date());
                 userEvent.set("lastVisitBookshelf", new Date());
                 console.log("create aniclub lastVisitBookshelf to "+ userEvent.get("lastVisitBookshelf"));
                 updatePromises.push(userEvent.save(null, {
                     useMasterKey: true
                 }));
             }
             return Parse.Promise.when(updatePromises);
         }).then(function(results) {
             response.success("OK");
         }, function(error) {
             console.log("error:" + error);
             response.error(error);
         });
 });

function getAninewsUpdateCountPromise(clubGuid, lastVisit){
    var aninewsUpdateCountQuery = new Parse.Query("Aninews");
    aninewsUpdateCountQuery.greaterThan("createdAt", lastVisit);
    aninewsUpdateCountQuery.equalTo("clubGuid", clubGuid);
    return aninewsUpdateCountQuery.count({useMasterKey: true})
       .then(function(countResult){
       return Parse.Promise.as({
           "clubGuid": clubGuid,
           "aninewsUpdateCount": countResult
       });
    });
}

function getBookUpdateCountPromise(clubGuid, lastVisit){
    var bookUpdateCountQuery = new Parse.Query("PublishedBook");
     bookUpdateCountQuery.greaterThan("AddToClubDate", lastVisit);
     bookUpdateCountQuery.equalTo("clubGuid", clubGuid);
     return bookUpdateCountQuery.count({useMasterKey: true})
        .then(function(countResult){
            return Parse.Promise.as({
                "clubGuid": clubGuid,
                "booksUpdateCount": countResult
            });
     });
}


Parse.Cloud.define("getClubStats", function(request, response) {
     var clubGuids =request.params.clubGuids;
     var username = request.params.username;
     var lastVisitQuery = new Parse.Query("UserClubLastVisit");
         lastVisitQuery.containedIn("clubGuid", clubGuids);
         lastVisitQuery.equalTo("username", username);
     var lastVisitBookshelfDefault = new Date();
        lastVisitBookshelfDefault.setDate(lastVisitBookshelfDefault.getDate() - 14);
     return lastVisitQuery.find().then(function(results) {
            var countPromises = [];
            for(var i= 0; i< results.length ; i++){
                var lastVisitEvent = results[i];
                var clubId = lastVisitEvent.get("clubGuid");
                var lastVisit = lastVisitEvent.get("lastVisit");
                var lastVisitBookshelf = lastVisitEvent.get("lastVisitBookshelf") || lastVisitBookshelfDefault;
                console.log("lastVisitBookshelf:"+ lastVisitBookshelf.toString());
                countPromises.push(getAninewsUpdateCountPromise(clubId, lastVisit));
                countPromises.push(getBookUpdateCountPromise(clubId, lastVisitBookshelf));
                }
             return Parse.Promise.when(countPromises);
         }).then(function(results) {
                        response.success(JSON.stringify({"results": results}));
                    }, function(error) {
                        console.log("error:" + error);
                        response.error(error);
                    });

});
