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
  remove: function(userId, file) { return false; }
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
		},
		size40x40: function(options) {
			var destination = options.destination();
			var features = Imagemagick.identify(destination.serverFilename);
			console.log(features);
			// Imagemagick.resize({
				// srcData: options.blob,
				// dstPath: destination.serverFilename, // Imagemagick will create the file for us.
				// width: 40,
				// height: 40
			// });
			// console.log('I am handling: ' + options.fileRecord.filename + ' to '. destination.serverFilename);
			// return destination.fileData;
			return { blob: options.blob, fileRecord: options.fileRecord };
		},
		// size100x100gm: function(options) {
			// if (options.fileRecord.contentType != 'image/jpeg')
				// return null; // jpeg files only  
			// var destination = options.destination();
			// var dest = destination.serverFilename;
			// // Uses meteorite graphicsmagick
			// gm(options.blob, dest).resize(40, 40).quality(90).write(dest, function(err) {
				// if (err) {
					// console.log('GraphicsMagick error ' + err);
					// return false;
					// // False will trigger rerun, could check options.sumFailes
					// // if we only want to rerun 2 times (default limit is 3,
					// // but sumFailes is reset at server idle + wait period)
				// } else {
					// console.log('Finished writing image.');
					// return destination('jpg').fileData.url; // We only return the url for the file, no blob to save since we took care of it
				// }
			// });
			// // I failed to deliver a url for this, but don't try again
			// return null;
		// },
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
		// check(item, {
			// name: NonEmptyString,
			// type: String,
			// location: NonEmptyString
		// });
		if (item.name.length > 100)
		  throw new Meteor.Error(413, "Name too long");
		if (item.location.length > 1000)
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
		var itemId  = null;
		var storedItem = Items.findOne({name: item.name});
		if (storedItem) itemId = Items.update(storedItem._id, {$inc: {count: 1}});
		else itemId = Items.insert(item);
		
		//Create story
		Meteor.call('createStory', {
			time: moment().format('MMM DD YY, h:mm a'),
			subject: Meteor.user(),
			action: 'Added an item',
			object: {item: item}
		});
		
		return itemId
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
		if (_.findWhere(item.requests, {_id: me._id})) return false;
		if (_.findWhere(item.borrowers, {_id: me._id})) return false;
		Items.update(item._id, {$push: {requests: me}});
		
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
				$pull: {requests: request.user}, //Remove user from requests
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
		Items.update(request.item._id, {$pull: {requests: request.user}});
		
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