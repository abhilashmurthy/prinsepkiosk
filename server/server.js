//Publish all users
Meteor.publish("prinsepusers", function () {
  return Meteor.users.find();
});

//Publish all items
Meteor.publish("items", function(itemQuery) {
	if (this.userId && Meteor.users.findOne(this.userId).accessLevel && Meteor.users.findOne(this.userId).accessLevel > 0) //If RS or HMT
		return Items.find({
			$or: [
				{name: {$regex: '.*' + titleCase(itemQuery) + '.*'}},
				{location: {$regex: '.*' + titleCase(itemQuery) + '.*'}},
				{comment: {$regex: '.*' + titleCase(itemQuery) + '.*'}}
			]
		});
	else 
		return Items.find({
			$or: [
				{name: {$regex: '.*' + titleCase(itemQuery) + '.*'}}
			]
		});
});
Meteor.publish('itemsFiles', function() {
    return ItemsFS.find();
});

//Publish all stories
Meteor.publish("stories", function() {
	return Stories.find();
});

function titleCase(name) {
	var strs = name.split(' ');
	var normalizedName = '';
	for (var i = 0; i < strs.length; i++) {
		normalizedName += strs[i].charAt(0).toUpperCase() + strs[i].slice(1) + ' ';
	}
	return normalizedName.trim();
}