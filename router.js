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
	this.route('stories', {
		path: '/stories'
	});
	this.route('map', {
		path: '/map'
	});
});