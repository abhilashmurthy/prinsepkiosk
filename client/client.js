Meteor.subscribe('items');
Meteor.subscribe('itemsFiles');

//////////////////////////////////////////////////////////////////////////////////////////////////////////// DEFAULTS
Template.navbar.isHMT = function() {
	return Meteor.user().accessLevel && Meteor.user().accessLevel === 2;
}

Template.navbar.isRS = function() {
	return Meteor.user().accessLevel && Meteor.user().accessLevel > 0;
}

Template.navbar.events = {
	'click .login-display-name': function(e) {
		window.open(Meteor.user().services.facebook.link, '_blank');
	}
}

Template.user_loggedout.events({
	'click #login': function(e) {
		$('.login2').show();
		Meteor.loginWithFacebook(function(err){
			if (err) console.log(err);
			else console.log('Logged in!');
		});
	}
});

Template.user_loggedin.events({
	'click #logout': function(e) {
		Meteor.logout(function(err){
			if (err) console.log(err);
		});
	}
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////// PAGE
Template.page.isHMT = function() {
	return Meteor.user().accessLevel && Meteor.user().accessLevel === 2;
}

Template.page.hasRequestedAccess = function() {
	return Meteor.user().accessLevel || Meteor.user().requestRSAccess; //Don't show request access button when accessLevel > 0 or when user has already requested access
}

Template.page.events = {
	'click #requestRSBtn': function(e) {
		Meteor.call('requestRSAccess');
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////// ITEMS
Template.items.items = function() {
	return Items.find({});
}

Template.items.isRS = function() {
	return Meteor.user().accessLevel && Meteor.user().accessLevel > 0;
}

Template.items.events = {
	'click .createItemBtn': function(e) {
		bootbox.confirm({
			message: Spark.render(Template.additem),
			title: "<h2>Add Item</h2>",
			callback: function(confirm) {
				if (!confirm) return;
				var item = $('#addform').serializeObject();
				var image = $('.fileUploader')[0].files[0];
				if (!image) notify("Cannot", "Please upload a picture of this item");
				var imageId = ItemsFS.storeFile(image);
				item.imageId = imageId;
				Meteor.call('createItem', item, function(err, firstEntry){
					if (!firstEntry) ItemsFS.remove(imageId); //Remove stored image if not first entry
				});
			}
		});
	},
	'click .deleteItemBtn': function(e) {
		Meteor.call('deleteItem', this);
	},
	'click .changeItemBtn': function(e) {
		var item = this;
		Session.set('changeItemId', item._id);
		bootbox.confirm({
			message: Spark.render(Template.changeitem),
			title: "<h2>Change</h2>",
			callback: function(confirm) {
				if (!confirm) return;
				var update = $('#changeform').serializeObject();
				var image = $('.fileUploader')[0].files[0];
				if (image) {
					ItemsFS.remove(item.imageId); //Remove old image
					var imageId = ItemsFS.storeFile(image);
					update.imageId = imageId;
				}
				console.log(_.extend(item, update));
				Meteor.call('changeItem', _.extend(item, update));
			}
		});
		setTimeout(function(){
			$('.modal-body').find('.type').val(item.type).change(); //Handlebars cannot change so changing here
			$('.modal-body').find('.location').val(item.location).change(); //Handlebars cannot change so changing here
		}, 500);
	},
	'click .borrowBtn': function(e) {
		Meteor.call('borrowItem', this, function(err, borrowable){
			if (err) console.log(err);
			if (!borrowable) notify('Cannot', 'You cannot borrow the same thing twice');
		});
	},
	'click .requester': function(e) {
		if (!Template.items.isRS()) return false;
		var requester = this;
		var itemId = $(e.currentTarget).closest('.itemthumbnail').attr('id');
		var item = Items.findOne(itemId);
		Session.set('requesterId', requester._id);
		Session.set('requesterItemId', itemId);
		bootbox.dialog({
			message: Spark.render(Template.managerequest),
			title: "<h2>Grant</h2>",
			buttons: {
				"Give": {
					className: "btn-success",
					callback: function() {
						Meteor.call('giveItem', {item:item, user:requester}, function(err, giveable){
							if (err) console.log(err);
							if (!giveable) notify('Cannot', 'You cannot give the item to yourself, genius')
						});
					}
				},
				"Reject": {
					className: "btn-danger",
					callback: function() {
						Meteor.call('rejectItem', {item:item, user:requester});
					}
				}
			}
		});
	},
	'click .borrower': function(e) {
		if (!Template.items.isRS()) return false;
		var borrower = this;
		var itemId = $(e.currentTarget).closest('.itemthumbnail').attr('id');
		var item = Items.findOne(itemId);
		Session.set('requesterId', borrower._id);
		Session.set('requesterItemId', itemId);
		bootbox.dialog({
			message: Spark.render(Template.managerequest),
			title: "<h2>Ask</h2>",
			buttons: {
				"Collect": {
					className: "btn-primary",
					callback: function() {
						Meteor.call('collectItem', {item:item, user:borrower});
					}
				},
				"Cancel": {
					className: "btn-default",
					callback: false
				}
			}
		});
	}
}

Template.changeitem.item = function(){
	var itemId = Session.get('changeItemId');
	return Items.findOne(itemId);
}

Template.managerequest.requester = function(){
	var requesterId = Session.get('requesterId');
	return Meteor.users.findOne(requesterId);
}

Template.managerequest.item = function(){
	var requesterItemId = Session.get('requesterItemId');
	return Items.findOne(requesterItemId);
}

//////////////////////////////////////////////////////////////////////////////////////////////// PLUGINS
//Pnotify settings
$.pnotify.defaults.history = false;
$.pnotify.defaults.delay = 3000;
function notify(title, message) {
	$.pnotify({
		title: title,
		text: message,
		type: "warning",
		icon: false,
		sticker: false,
		mouse_reset: false,
		animation: "fade",
		animate_speed: "fast",
		before_open: function(pnotify) {
			pnotify.css({
			  top: "52px",
			  left: ($(window).width() / 2) - (pnotify.width() / 2)
			});
		}
	});
}