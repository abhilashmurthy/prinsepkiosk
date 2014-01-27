/******************/
/*      ITEMS     */
/******************/
Items = new Meteor.Collection('items');

var NonEmptyString = Match.Where(function (x) {
  check(x, String);
  return x.length !== 0;
});

var ConvertedNumber = Match.Where(function (x) {
	check(x, String);
	return parseInt(x) !== NaN;
});

Meteor.methods({
	createItem: function(item) {
		//Check syntax of item
		check(item, {
			name: NonEmptyString,
			type: String,
			description: Match.Optional(String),
			price: Match.Optional(ConvertedNumber)
		});
		if (item.name.length > 100)
		  throw new Meteor.Error(413, "Name too long");
		if (item.description.length > 1000)
		  throw new Meteor.Error(413, "Description too long");
		if (!Meteor.user())
		  throw new Meteor.Error(403, "You must be logged in");
		
		//Default parameters
		item.count = 1;
		item.available = true;
		item.requests = [];
		
		//Check if item already exists
		console.log('Inserting item: ' + JSON.stringify(item));
		var storedItem = Items.findOne({name: item.name});
		if (storedItem) Items.update(storedItem._id, {$inc: {count: 1}});
		else Items.insert(item);
	},
	deleteItem: function(item) {
		if (item.count > 1) Items.update(item._id, {$inc: {count: -1}});
		else Items.remove(item._id);
	},
	borrowItem: function(item) {
		var me = Meteor.users.findOne(this.userId);
		Items.update(item._id, {$pull: {requests: me}}); //Remove me and readd me - Shortcut
		Items.update(item._id, {$push: {requests: me}});
	}
});


/******************/
/*      USERS     */
/******************/

Meteor.methods({
	requestRSAccess: function() {
		//User requests RS access
		var requestId = Meteor.users.update(this.userId, {$set: {requestRSAccess: true}});
		return requestId;
	},
	grantRSAccess: function(user) {
		//HMT grants RS access
		var grantId = Meteor.users.update(user._id, {$unset: {requestRSAccess: true}, $set: {accessLevel: 1}});
		return grantId;
	},
	rejectRSAccess: function(user) {
		//HMT rejects RS access
		var rejectId = Meteor.users.update(user._id, {$unset: {requestRSAccess: true}});
		return rejectId;
	}
});