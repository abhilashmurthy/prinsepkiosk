Accounts.loginServiceConfiguration.remove({
	service: "facebook"
});

Accounts.loginServiceConfiguration.insert({
	service: "facebook",
	appId: Meteor.settings.fb.appId,
	secret: Meteor.settings.fb.secret
});

Accounts.onCreateUser(function(options, user){
	if (isHMT(user.services.facebook.id))
		user.accessLevel = 2;
	return user;
});

function isHMT(fbId) {
	//[Abhilash, Ian, Shira, Neth, Cho, Melanie, Prof Tim]
	var HMT_FACEBOOK_IDS = ['524305752', '538477023', '515189471', '1030504678', '1065980324', '761305117', '524231821'];
	var TEST_USERS = HMT_FACEBOOK_IDS.push('100007662518897'); //Ian Hostelmanage
	return _.findWhere(HMT_FACEBOOK_IDS, fbId);
}