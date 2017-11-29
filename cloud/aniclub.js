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
         promises.push(clubMemberQuery.find());

         var userEventQuery = new Parse.Query("UserLikeEvent");
         userEventQuery.equalTo("username", username);
         userEventQuery.exists("clubGuid");
         promises.push(userEventQuery.find());

    return Parse.Promise.when(promises)
          .then(function(results) {

              var getClubGuid = function(club) {
                return {
                  guid: club.get("guid"),
                  name: club.get("name")
              }; };
              var ownedClubs =  results[0].map(getClubGuid);
              var joinedClubs = results[1].map(getClubGuid);
              var likedClubs =  results[2].map(getClubGuid);
              response.success( JSON.stringify({
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
         if(join){
           //join club
           var bannedBefore = !clubMember ? false : clubMember.get("banned");
           var currentMemberNumber = club.get("membersNumber");
           var maxMemberNumber = club.get("maxMemberNumber") || DEFAULT_MAX_MEMBER_NUMBER;
           if(bannedBefore){
             //banned from club
             response.error("Banned");
           }else if(currentMemberNumber>=maxMemberNumber){
             //club is full
             response.error("Full");
           }else{
             //clean up old data
             if(clubMember){
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
         }else if(clubMember) {
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
         }else{
            response.success("OK");
         }
       }). then( function(results){
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
          if(banned && clubMember){
              //ban user
                clubMember.set("banned", true);
                updatePromises.push(clubMember.save(null, {
                    useMasterKey: true
                }));

              //decrease member count
              club.increment("membersNumber", -1);
              updatePromises.push(club.save(null, {
                  useMasterKey: true
              }));
              return Parse.Promise.when(updatePromises);
          }else{
            response.success("OK");
          }
        }). then( function(results){
            response.success("OK");
        }, function(error) {
            console.log("error:" + error);
            response.error(error);
        });
    });
