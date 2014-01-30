//Publish all users
Meteor.publish("prinsepusers", function () {
  return Meteor.users.find();
});

//Publish all items
Meteor.publish("items", function() {
	return Items.find();
});
Meteor.publish('itemsFiles', function() {
    return ItemsFS.find();
});

//Publish all stories
Meteor.publish("stories", function() {
	return Stories.find();
});

//Runs functions on startup
Meteor.startup(function(){
	provideHMTAccess();
});

//Provide HMT Access - Hardcoded for now
function provideHMTAccess() {
	var users = Meteor.users.find().fetch();
	//[Abhilash, Ian, Shira, Neth, Cho, Melanie, Prof Tim]
	var HMT_FACEBOOK_IDS = ['524305752', '538477023', '515189471', '1030504678', '1065980324', '761305117', '524231821'];
	var TEST_USERS = HMT_FACEBOOK_IDS.push('100007662518897');
	for (var i = 0; i < users.length; i++) {
		if (_.findWhere(HMT_FACEBOOK_IDS, users[i].services.facebook.id)) {
			console.log('Giving ' + users[i].services.facebook.name + ' HMT access');
			Meteor.users.update(users[i]._id, {$set: {accessLevel: 2}});
		}
	}
}