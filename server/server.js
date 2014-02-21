//Publish all users
Meteor.publish("prinsepusers", function () {
  return Meteor.users.find();
});

//Publish all items
Meteor.publish("items", function(){
	return Items.find({}, {sort: {interactions: -1}});
});
Meteor.publish('itemsFiles', function() {
    return ItemsFS.find();
});

//Publish all stories
Meteor.publish("logs", function() {
	return Logs.find();
});

//Publish all CSVs
Meteor.publish("csvs", function() {
	return CSVFS.find();
});

function titleCase(name) {
	var strs = name.split(' ');
	var normalizedName = '';
	for (var i = 0; i < strs.length; i++) {
		normalizedName += strs[i].charAt(0).toUpperCase() + strs[i].slice(1) + ' ';
	}
	return normalizedName.trim();
}