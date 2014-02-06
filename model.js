/******************/
/*      ITEMS     */
/******************/
Items = new Meteor.Collection('items');
ItemsFS = new CollectionFS('items');

ItemsFS.allow({
  insert: function(userId, file) { return true; },
  update: function(userId, file, fields, modifier) {
    return true;
  },
  remove: function(userId, file) { return true; }
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
		item.count = item.count? parseInt(item.count): 1;
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
		
		//Create log
		Meteor.call('writeLog', {
			action: 'Added an item',
			object: {item: item}
		});
		
		return (storedItem === undefined || storedItem === null);
	},
	deleteItem: function(item) {
		ItemsFS.remove(item.imageId);
		Items.remove(item._id);
		
		//Create log
		Meteor.call('writeLog', {
			action: 'Removed an item',
			object: {item: item}
		});
	},
	changeItem: function(item) {
		//Check syntax of item
		//TODO
		item.count = parseInt(item.count);
		
		var itemId = item._id;
		delete item._id;
		Items.update(itemId, {$set: item});
		
		//Create log
		Meteor.call('writeLog', {
			action: 'Changed an item',
			object: {item: item}
		});
	},
	borrowItem: function(item) {
		var me = Meteor.users.findOne(this.userId);
		if (_.findWhere(item.requesters, {_id: me._id})) return false;
		if (_.findWhere(item.borrowers, {_id: me._id})) return false;
		Items.update(item._id, {$push: {requesters: me}});
		
		//Create log
		Meteor.call('writeLog', {
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
		
		//Create log
		Meteor.call('writeLog', {
			action: 'Gave an item to',
			object: {user: request.user, item: request.item}
		});
		
		return true;
	},
	rejectItem: function(request) {
		Items.update(request.item._id, {$pull: {requesters: request.user}});
		
		//Create log
		Meteor.call('writeLog', {
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
		
		//Create log
		Meteor.call('writeLog', {
			action: 'Collected an item from',
			object: {user: collect.user, item: collect.item}
		});
	}
});

/******************/
/*    STORIES     */
/******************/
Logs = new Meteor.Collection('logs');
Meteor.methods({
	writeLog: function(log) {
		var defaults = {
			subject: Meteor.user(),
			time: moment().format('MMM DD YY, h:mm a')
		};

		Logs.insert(_.extend(defaults, log));
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

/******************/
/*      CSV     */
/******************/
CSVFS = new CollectionFS('csvs');

CSVFS.allow({
  insert: function(userId, file) { return userId && file.owner === userId; },
  update: function(userId, file, fields, modifier) {
    return userId && file.owner === userId;
  },
  remove: function(userId, file) { return true }
});

if (Meteor.isServer) {
	CSVFS.fileHandlers({
		default1: function(options) {
			return { blob: options.blob, fileRecord: options.fileRecord };
		}
	});
}

Meteor.methods({
	generateItemsCSV: function() {
		CSVFS.remove(); //Remove all older csv files
		var fileId = null;
		if (Meteor.isServer) {
			var items = Items.find().fetch();
			var csvStr = JSON2CSV(items);
			var buffer = Buffer(csvStr.length);
			for (var i = 0; i < csvStr.length; i++) {
				buffer[i] = csvStr.charCodeAt(i);
			}
			fileId = CSVFS.storeBuffer('prinsepkiosk_items_' + (moment().format('YYMMDD_hhmm')) + '.csv', buffer, {
				contentType: 'text/plain',
				owner: this.userId,
				noProgress: true,
				metadata: { author: Meteor.user().services.facebook.name },
				encoding: 'utf-8'
			});
		}
		return fileId;
	}
});

/* Copied from jsFiddle */
function JSON2CSV(objArray) {
	var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
	var str = '';
	var line = '';
	var head = array[0];
	for (var index in array[0]) {
		var value = index + "";
		line += '"' + value.replace(/"/g, '""') + '",';
	}
	line = line.slice(0, -1);
	str += line + '\r\n';
	for (var i = 0; i < array.length; i++) {
		var line = '';
		for (var index in array[i]) {
			var value = array[i][index] + "";
			line += '"' + value.replace(/"/g, '""') + '",';
		}
		line = line.slice(0, -1);
		str += line + '\r\n';
	}
	return str;
}

function titleCase(name) {
	var strs = name.split(' ');
	var normalizedName = '';
	for (var i = 0; i < strs.length; i++) {
		normalizedName += strs[i].charAt(0).toUpperCase() + strs[i].slice(1) + ' ';
	}
	return normalizedName.trim();
}