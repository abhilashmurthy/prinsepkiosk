/******************/
/*      ITEMS     */
/******************/
Items = new Meteor.Collection('items');
ItemsFS = new CollectionFS('items');

ItemsFS.allow({
  insert: function(userId, file) { return userId && file.owner === userId; },
  update: function(userId, file, fields, modifier) {
    return userId && file.owner === userId;
  },
  remove: function(userId, file) { return userId && file.owner === userId; }
});

ItemsFS.filter({
    allow: {
        contentTypes: ['image/*']
    }
});

if (Meteor.isServer) {
	ItemsFS.fileHandlers({
		default1: function(options) {
			return { blob: options.blob, fileRecord: options.fileRecord };
		}
	});
}

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
			location: NonEmptyString,
			imageId: String
		});
		if (item.name.length > 100)
		  throw new Meteor.Error(413, "Name too long");
		if (item.location.length > 1000)
		  throw new Meteor.Error(413, "Description too long");
		if (!Meteor.user())
		  throw new Meteor.Error(403, "You must be logged in");
		
		//Default parameters
		item.count = 1;
		item.available = true;
		item.requesters = [];
		item.borrowers = [];
		item.name = titleCase(item.name);
		item.location = titleCase(item.location);
		
		//Check if item already exists
		console.log('Inserting item: ' + JSON.stringify(item));
		var storedItem = Items.findOne({name: item.name});
		if (storedItem) Items.update(storedItem._id, {$inc: {count: 1}});
		else Items.insert(item);
		
		//Create story
		Meteor.call('createStory', {
			time: moment().format('MMM DD YY, h:mm a'),
			subject: Meteor.user(),
			action: 'Added an item',
			object: {item: item}
		});
		
		return (storedItem === undefined || storedItem === null);
	},
	deleteItem: function(item) {
		ItemsFS.remove(item.imageId);
		Items.remove(item._id);
		
		//Create story
		Meteor.call('createStory', {
			time: moment().format('MMM DD YY, h:mm a'),
			subject: Meteor.user(),
			action: 'Removed an item',
			object: {item: item}
		});
	},
	commentItem: function(item) {
		Items.update(item._id, {$set: {comment: item.comment}});
		
		//Create story
		Meteor.call('createStory', {
			time: moment().format('MMM DD YY, h:mm a'),
			subject: Meteor.user(),
			action: 'Commented on an item',
			object: {item: item}
		});
	},
	decrItem: function(item) {
		if (--item.count === 0) return false;
		Items.update(item._id, {$inc: {count: -1}});
		
		//Create story
		Meteor.call('createStory', {
			time: moment().format('MMM DD YY, h:mm a'),
			subject: Meteor.user(),
			action: 'Decreased an item',
			object: {item: item}
		});
		
		return true;
	},
	incrItem: function(item) {
		Items.update(item._id, {$inc: {count: 1}, $set: {available: true}});
		
		//Create story
		Meteor.call('createStory', {
			time: moment().format('MMM DD YY, h:mm a'),
			subject: Meteor.user(),
			action: 'Increased an item',
			object: {item: item}
		});
	},
	borrowItem: function(item) {
		var me = Meteor.users.findOne(this.userId);
		if (_.findWhere(item.requesters, {_id: me._id})) return false;
		if (_.findWhere(item.borrowers, {_id: me._id})) return false;
		Items.update(item._id, {$push: {requesters: me}});
		
		//Create story
		Meteor.call('createStory', {
			time: moment().format('MMM DD YY, h:mm a'),
			subject: me,
			action: 'Requested an item',
			object: {item: item}
		});
		
		return true;
	},
	giveItem: function(request) {
		if (request.user._id === this.userId) return false; //RS cannot give to self
		Items.update(request.item._id, 
			{
				$pull: {requesters: request.user}, //Remove user from requesters
				$push: {borrowers: request.user}, //Add user to borrowers
				$inc: {count: -1}, //Decrement count
				$set: {available: --request.item.count === 0 ? false : true} //New count + number of borrowers = available
			}
		);
		
		//Create story
		Meteor.call('createStory', {
			time: moment().format('MMM DD YY, h:mm a'),
			subject: Meteor.user(),
			action: 'Gave an item to',
			object: {user: request.user, item: request.item}
		});
		
		return true;
	},
	rejectItem: function(request) {
		Items.update(request.item._id, {$pull: {requesters: request.user}});
		
		//Create story
		Meteor.call('createStory', {
			time: moment().format('MMM DD YY, h:mm a'),
			subject: Meteor.user(),
			action: 'Rejected an item to',
			object: {user: request.user, item: request.item}
		});
	},
	collectItem: function(collect) {
		Items.update(collect.item._id, 
			{
				$pull: {borrowers: collect.user}, //Remove user from borrowers
				$inc: {count: 1}, //Increment counnt
				$set: {available: true} //Change availability of item
			}
		);
		
		//Create story
		Meteor.call('createStory', {
			time: moment().format('MMM DD YY, h:mm a'),
			subject: Meteor.user(),
			action: 'Collected an item from',
			object: {user: collect.user, item: collect.item}
		});
	}
});

/******************/
/*    STORIES     */
/******************/
Stories = new Meteor.Collection('stories');
Meteor.methods({
	createStory: function(story) {
		//{time: Date, subject: user, action: string, object: user/item}
		Stories.insert(story);
	}
});


/******************/
/*      USERS     */
/******************/

Meteor.methods({
	requestRSAccess: function() {
		Meteor.users.update(this.userId, {$set: {requestRSAccess: true}});
	},
	grantRSAccess: function(user) {
		Meteor.users.update(user._id, {$unset: {requestRSAccess: true}, $set: {accessLevel: 1}});
	},
	rejectRSAccess: function(user) {
		Meteor.users.update(user._id, {$unset: {requestRSAccess: true}});
	},
	revokeRSAccess: function(user) {
		if (user._id === this.userId) return false; //Cannot revoke own access
		Meteor.users.update(user._id, {$unset: {accessLevel: 1}});
		return true;
	}
});

function titleCase(name) {
	var strs = name.split(' ');
	var normalizedName = '';
	for (var i = 0; i < strs.length; i++) {
		normalizedName += strs[i].charAt(0).toUpperCase() + strs[i].slice(1) + ' ';
	}
	return normalizedName.trim();
}