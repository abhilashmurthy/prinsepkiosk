Session.setDefault('itemQuery', '');
Deps.autorun(function(){
	var itemQuery = Session.get('itemQuery', itemQuery);
	Meteor.subscribe('items', itemQuery);
});
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
	'click .giveBtn': function(e) {
		var itemId = $(e.currentTarget).closest('tr').attr('id');
		var item = Items.findOne(itemId);
		Meteor.call('giveItem', {item:item, user:this}, function(err, giveable){
			if (err) console.log(err);
			if (!giveable) notify('Cannot', 'You cannot give the item to yourself, genius')
		});
	},
	'click .rejectBtn': function(e) {
		var itemId = $(e.currentTarget).closest('tr').attr('id');
		var item = Items.findOne(itemId);
		Meteor.call('rejectItem', {item:item, user:this});
	},
	'click .collectBtn': function(e) {
		var itemId = $(e.currentTarget).closest('tr').attr('id');
		var item = Items.findOne(itemId);
		Meteor.call('collectItem', {item:item, user:this});
	},
	'keyup .search-query': function(e) {
		var itemQuery = $(e.currentTarget).val();
		Session.set('itemQuery', itemQuery);
	}
}

Template.changeitem.item = function(){
	var itemId = Session.get('changeItemId');
	return Items.findOne(itemId);
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