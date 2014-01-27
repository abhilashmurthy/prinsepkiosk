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
		item.borrowers = [];
		
		//Check if item already exists
		console.log('Inserting item: ' + JSON.stringify(item));
		var storedItem = Items.findOne({name: item.name});
		if (storedItem) Items.update(storedItem._id, {$inc: {count: 1}});
		else Items.insert(item);
	},
	deleteItem: function(item) {
		Items.remove(item._id);
	},
	decrItem: function(item) {
		Items.update(item._id, {$inc: {count: -1}, $set: {available: --item.count - item.borrowers.length === 0 ? false : true}});
	},
	incrItem: function(item) {
		Items.update(item._id, {$inc: {count: 1}, $set: {available: true}});
	},
	borrowItem: function(item) {
		var me = Meteor.users.findOne(this.userId);
		if (_.findWhere(item.requests, {_id: me._id})) return false;
		if (_.findWhere(item.borrowers, {_id: me._id})) return false;
		Items.update(item._id, {$push: {requests: me}});
		return true;
	},
	giveItem: function(request) {
		if (request.user._id === this.userId) return false; //RS cannot give to self
		Items.update(request.item._id, 
			{
				$pull: {requests: request.user}, //Remove user from requests
				$push: {borrowers: request.user}, //Add user to borrowers
				$inc: {count: -1}, //Decrement count
				$set: {available: --request.item.count === 0 ? false : true} //Change availability of item
			}
		);
		return true;
	},
	rejectItem: function(request) {
		Items.update(request.item._id, {$pull: {requests: request.user}});
	},
	collectItem: function(collect) {
		Items.update(collect.item._id, 
			{
				$pull: {borrowers: collect.user}, //Remove user from borrowers
				$inc: {count: 1}, //Increment counnt
				$set: {available: true} //Change availability of item
			}
		);
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