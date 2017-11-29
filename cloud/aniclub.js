 /*jshint esversion: 6 */
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
         userEventQuery.notNull("clubGuid", clubGuid); //TODO not empty


         promises.push(userEventQuery.find());

    return userEventQuery.find()
          .then(function(results) {
              var userNames = results.map(function(a) { return a.get("AuthorName");});
              response.success( JSON.stringify(userNames));
          }, function(error) {
              console.log("error:" + error);
              response.error(error);
          });
  });