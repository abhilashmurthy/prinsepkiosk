Router.configure({
  layoutTemplate: 'layout'
});

Router.map(function() {
	this.route('page', {
		path: '/'
	});
	this.route('users', {
		path: '/users'
	});
	this.route('logs', {
		path: '/logs'
	});
	this.route('map', {
		path: '/map'
	});
});