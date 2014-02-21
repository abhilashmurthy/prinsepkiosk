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
			imageId: String,
			count: ConvertedNumber
		});
		if (item.name.length > 100)
		  throw new Meteor.Error(413, "Name too long");
		if (item.location.length > 1000)
		  throw new Meteor.Error(413, "Description too long");
		if (!Meteor.user())
		  throw new Meteor.Error(403, "You must be logged in");
		
		//Default parameters
		item.count = parseInt(item.count);
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
		Items.update(item._id, {
			$push: {requesters: me},
			$inc: {interactions: 1} 
		});
		
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
		Items.update(request.item._id, {
			$pull: {requesters: request.user},
			$inc: {interactions: -1}
		});
		
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
				$inc: {count: 1, interactions: -1}, //Increment count and reduce interactions
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
/*    LOGS        */
/******************/
Logs = new Meteor.Collection('logs');

Meteor.methods({
	writeLog: function(log) {
		var defaults = {
			subject: Meteor.user(),
			time: moment().format('MMM DD YY, h:mm a')
		};

		Logs.insert(_.extend(defaults, log));
	},
	removeLogs: function(specs) {
		if (Meteor.user().accessLevel && Meteor.user().accessLevel > 1)
			Logs.remove(specs);
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
			var csvStr = ItemJSON2CSV(items);
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
	},
	generateLogsCSV: function() {
		CSVFS.remove(); //Remove all older csv files
		var fileId = null;
		if (Meteor.isServer) {
			var logs = Logs.find().fetch();
			var csvStr = LogJSON2CSV(logs);
			var buffer = Buffer(csvStr.length);
			for (var i = 0; i < csvStr.length; i++) {
				buffer[i] = csvStr.charCodeAt(i);
			}
			fileId = CSVFS.storeBuffer('prinsepkiosk_log_' + (moment().format('YYMMDD_hhmm')) + '.csv', buffer, {
				contentType: 'text/plain',
				owner: this.userId,
				noProgress: true,
				metadata: { author: Meteor.user().services.facebook.name },
				encoding: 'utf-8'
			});
		}
		return fileId;
	},
});

/* Copied and modified from jsFiddle */
function LogJSON2CSV(objArray) {
	var fields = ['subject', 'time', 'action', 'object'];
	var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
	var str = '';
	var line = '';
	var head = array[0];
	for (var index in fields) {
		var value = fields[index] + "";
		line += '"' + value.replace(/"/g, '""') + '",';
	}
	line = line.slice(0, -1);
	str += line + '\r\n';
	for (var i = 0; i < array.length; i++) {
		var line = '';
		array[i] = _.pick(array[i], fields);
		for (var index in array[i]) {
			//Custom code
			var value = null;
			if (typeof array[i][index] === 'object') {
				if (array[i][index].services) value = array[i][index].services.facebook.name; //Is user
				else if (array[i][index].item && array[i][index].user) value = array[i][index].item.name + " : " + array[i][index].user.services.facebook.name; //Item + User
				else if (array[i][index].item) value = array[i][index].item.name;
				else value = JSON.stringify(array[i][index]);
			}
			else value = array[i][index] + "";
			line += '"' + value.replace(/"/g, '""') + '",';
		}
		line = line.slice(0, -1);
		str += line + '\r\n';
	}
	return str;
}

function ItemJSON2CSV(objArray) {
	var fields = ['name', 'type', 'location', 'count', 'comment'];
	var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
	var str = '';
	var line = '';
	for (var index in fields) {
		var value = fields[index] + "";
		line += '"' + value.replace(/"/g, '""') + '",';
	}
	line = line.slice(0, -1);
	str += line + '\r\n';
	for (var i = 0; i < array.length; i++) {
		var line = '';
		array[i] = _.pick(array[i], fields);
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