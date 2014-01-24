//Abhilash's ID: 524305752

Meteor.subscribe("prinsepusers");

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