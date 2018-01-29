require('./user-profile');
require('./user-stats');
require('./book-stats');
require('./admin');
require('./utils');
require('./recommend');
require('./aniclub');

Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi from anitales');
});

Parse.Cloud.define('sum', function(request, response) {
        var matrix=request.params.matrix;
        var j=0;
        // var matrix=[1,2,3,4,5];
        for (var i=0;i<matrix.length;i++){
                j+=matrix[i];
        }
        response.success(j);
});


Parse.Cloud.define("getAninews", function(request, response) {
	var AninewsQuery =new Parse.Query("Aninews");
	var AninewsUsername =request.params.AninewsUsername;
	bookQuery.equalTo("ownerUsername",AninewsUsername);
	bookQuery.aggregate([{
			ownerUsername : AninewsUsername, 
			Aninews_NO : {$sum : 1},
			success: function(results){
				response.success("User "+ownerUsername+" Aninews number: "+Aninews_NO);
			},
			error: function(){
				response.error("User does not exist "+AninewsUsername);
			}
	}]);
});

Parse.Cloud.define('queryTest',function(req, res){
  	var bookQuery = new Parse.Query("PublishedBook");

	var pages = req.params.pages;
	var createdAt = req.params.createdAt;
	var playedTimes = req.params.playedTimes;
	var likedTimes = req.params.likedTimes;
	var isDelete = req.params.isDelete;

	console.log('req',req);
	if( typeof(pages)!="undefined"){
		console.log('加入参数pages');
		bookQuery.lessThan("pages",pages-0);
	}

	if( typeof(likedTimes)!="undefined"){
		console.log('加入参数likedTimes');
		bookQuery.lessThan("likedTimes",likedTimes-0);
	}

	if( typeof(playedTimes)!="undefined"){
		console.log('加入参数playedTimes');
		bookQuery.lessThan("playedTimes",playedTimes-0);
	}

	if( typeof(createdAt)!="undefined"){
		console.log('加入参数createdAt');
		var date = new Date(createdAt);
		date.setDate(date.getDate()+1);
		bookQuery.lessThan("createdAt",date);
	}

	if(isDelete!='true' ){

		bookQuery.count({
			success:function(number){

     				console.log('符合条件的文档数为：',number);
				res.success('符合条件的文档数为：'+number);
			},

			error:function(error){
				res.error('请输入正确的参数');
           		}
		});
	}else{
		bookQuery.find({
			success:function(args){
				for(var i = 0; i < args.length ; i++){
					book = args[i];
					console.log(book);
					book.destroy(book);//删除一本书
				}
				res.success('符合条件的文档数为：'+args.length+", 已经将这些数据删除");
			}
		});
	}
});

Parse.Cloud.define("addBookVideoLink", function(request, response) {
	var bookQuery =new Parse.Query("PublishedBook");
	var bookGuId =request.params.bookGuId;
	var videoLink = request.params.videoLink;
	bookQuery.equalTo("guid",bookGuId);
	bookQuery.limit(1);
	bookQuery.find({
			useMasterKey:true,
			success: function(results) {
    		  	var book = results[0];
    		  	book.set("videoLink", videoLink);
    		  	book.save(null, { useMasterKey: true });
				response.success("update book: "+  book.get("title")+ " -  videoLink = " + book.get("videoLink"));
    		},
    		error: function() {
    			response.error("bookGuId doesn't exist!"+request.params.bookGuId);
    		}
	});
});

Parse.Cloud.define("addedFriend", function(request, response) {
	var query = new Parse.Query(Parse.User);
	query.equalTo("objectId", request.params.guid);
	// Find devices associated with these users
	var pushQuery = new Parse.Query(Parse.Installation);
	// need to have users linked to installations
	pushQuery.matchesQuery('user', query);

	query.find({
		success: function(results) {
			var language = results[0].get("language");
            var alertText;
			if(language === "CHINESE") {
				alertText = "你已經收到了一個朋友的要求。";
			} else {
				alertText = "You've recieved a friend request.";
			}
			Parse.Push.send({
			    where: pushQuery,
			    data: {
				    alert: alertText
			    }
			}, {
			    success: function () {
				response.success("Friend request sent with text: "+alertText);
			    },
			    error: function (error) {
				response.error(error);
			    }
			});
		},
		error: function() {

			response.error("Guid doesn't exist!");
		}
	});
});
