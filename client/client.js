Meteor.subscribe("prinsepusers");
Meteor.subscribe("items");

//////////////////////////////////////////////////////////////////////////////////////////////////////////// NAVBAR
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
		Meteor.call('requestRSAccess', function(err, data){
			if (err) console.log(err);
			Session.set('requestId', data);
		});
		setTimeout(
			function(){
				if (Session.get('requestId')) {
					$('#requestRSBtn').attr('disabled', 'disabled');
				}
			}, 500);
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////// USERS
Template.users.users = function() {
	return Meteor.users.find({});
}

Template.users.events = {
	'click .approveBtn': function(e) {
		Meteor.call('grantRSAccess', this, function(err, data){
			if (err) console.log(err);
		});
	},
	'click .rejectBtn': function(e) {
		Meteor.call('rejectRSAccess', this, function(err, data){
			if (err) console.log(err);
		});
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
			title: "Add Item",
			callback: function(confirm) {
				if (!confirm) return;
				var item = $('#addform').serializeObject();
				Meteor.call('createItem', item);
			}
		});
	},
	'click .deleteItemBtn': function(e) {
		Meteor.call('deleteItem', this);
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
		setTimeout(function(){if (!Session.get('giveable')) notify('Cannot', 'You give the item to yourself, genius');}, 500);
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