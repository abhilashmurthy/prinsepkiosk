Meteor.subscribe("prinsepusers");

/////////////////////////////////////////////////////////////////////////////////////////////////////////// USERS
Template.users.users = function() {
	return Meteor.users.find({});
}

Template.users.events = {
	'click .approveBtn': function(e) {
		Meteor.call('grantRSAccess', this);
	},
	'click .rejectBtn': function(e) {
		Meteor.call('rejectRSAccess', this);
	},
	'click .revokeBtn': function(e) {
		Meteor.call('revokeRSAccess', this, function(err, revokable){
			if (err) console.log(err);
			if (!revokable) notify('Cannot', 'Cannot revoke own access');
		});
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