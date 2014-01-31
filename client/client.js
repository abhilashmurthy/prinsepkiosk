Meteor.subscribe("items");
Meteor.subscribe('itemsFiles');

//////////////////////////////////////////////////////////////////////////////////////////////////////////// NAVBAR
Template.navbar.isHMT = function() {
	return Meteor.user().accessLevel && Meteor.user().accessLevel === 2;
}

Template.navbar.events = {
	'click .login-display-name': function(e) {
		window.open(Meteor.user().services.facebook.link, '_blank');
	}
}

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
			className: "itemModal",
			callback: function(confirm) {
				if (!confirm) return;
				var item = $('#addform').serializeObject();
				var image = $('.fileUploader')[0].files[0];
				if (!image) notify("Cannot", "Please upload a picture of this item");
				var imageId = ItemsFS.storeFile(image);
				item.imageId = imageId;
				Meteor.call('createItem', item);
			}
		});
	},
	'click .deleteItemBtn': function(e) {
		Meteor.call('deleteItem', this);
	},
	'click .commentItemBtn': function(e) {
		var item = this;
		bootbox.confirm({
			message: Spark.render(Template.commentitem),
			title: "<h2>Comment</h2>",
			className: "itemModal",
			callback: function(confirm) {
				if (!confirm) return;
				var update = $('#commentform').serializeObject();
				Meteor.call('commentItem', _.extend(item, update));
			}
		});
		setTimeout(function(){
			$('.modal-body').find('.itemname').html('<b>' + item.name + '</b>');
			$('.modal-body').find('.comment').val(item.comment).change();
		}, 500);
	},
	'click .decrementItemBtn': function(e) {
		Meteor.call('decrItem', this, function(err, response){
			if (err) console.log(err);
			Session.set('decrementable', response);
		});
		setTimeout(function(){if (!Session.get('decrementable')) notify('Cannot', 'Cannot have 0 items');}, 500);
	},
	'click .incrementItemBtn': function(e) {
		Meteor.call('incrItem', this);
	},
	'click .borrowBtn': function(e) {
		Meteor.call('borrowItem', this, function(err, response){
			if (err) console.log(err);
			Session.set('borrowable', response);
		});
		setTimeout(function(){if (!Session.get('borrowable')) notify('Cannot', 'You cannot borrow the same thing twice');}, 500);
	},
	'click .giveBtn': function(e) {
		var itemId = $(e.currentTarget).closest('tr').attr('id');
		var item = Items.findOne(itemId);
		Meteor.call('giveItem', {item:item, user:this}, function(err, response){
			if (err) console.log(err);
			Session.set('giveable', response);
		});
		setTimeout(function(){if (!Session.get('giveable')) notify('Cannot', 'You cannot give the item to yourself, genius');}, 500);
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
	}
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