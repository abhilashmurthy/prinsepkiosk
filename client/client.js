//Abhilash's ID: 524305752

Meteor.subscribe("prinsepusers");

//////////////////////////////////// NAVBAR
Template.navbar.events = {
	'click .login-display-name': function(e) {
		window.open(Meteor.user().services.facebook.link, '_blank');
	}
}

/////////////////////////////////// PAGE
Template.page.isHMT = function() {
	return Meteor.user() && Meteor.user().accessLevel && Meteor.user().accessLevel === 2;
}

/////////////////////////////////// USERS
Template.users.users = function() {
	return Meteor.users.find({});
}

Template.users.hasRequestedAccess = function() {
	return Template.page.isHMT || Meteor.user().requestRSAccess;
}

Template.users.events = {
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