/******************/
/*      ITEMS     */
/******************/

Items = new Meteor.Collection('items');

var NonEmptyString = Match.Where(function (x) {
  check(x, String);
  return x.length !== 0;
});

Meteor.methods({
	createItem: function(options) {
		//Check syntax of item
		check(options, {
			name: NonEmptyString,
			description: NonEmptyString,
			price: Number
		});
    if (options.name.length > 100)
      throw new Meteor.Error(413, "Name too long");
    if (options.description.length > 1000)
      throw new Meteor.Error(413, "Description too long");
    if (!Meteor.user())
      throw new Meteor.Error(403, "You must be logged in");
		
		//Add to DB
		return Items.insert(options);
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