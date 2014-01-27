//Publish all users
Meteor.publish("prinsepusers", function () {
  return Meteor.users.find({});
});

//Publish all items
Meteor.publish("items", function() {
	return Items.find({});
});

//Runs functions on startup
Meteor.startup(function(){
	Items.remove({});
	provideHMTAccess();
});

//Provide HMT Access - Hardcoded for now
function provideHMTAccess() {
	var users = Meteor.users.find().fetch();
	//[Abhilash]
	var hmtIds = ['524305752'];
	for (var i = 0; i < users.length; i++) {
		if (hmtIds.indexOf(users[i].services.facebook.id) > -1) 
			Meteor.users.update(users[i]._id, {$set: {accessLevel: 2}});
	}
}