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

if (Meteor.isServer) {
	Router.map(function() {
	  return this.route('showImage', {
		path: '/show-image/:imageId',
		method: 'GET',
		where: "server",
		action: function() {
		  this.response.writeHead (200, {'Content-type': 'image/png'});
		  var buffer = ItemsFS.retrieveBuffer (this.params.imageId);
		  return this.response.end (buffer);
		}
	  });
	});
}