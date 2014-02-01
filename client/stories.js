Meteor.subscribe("stories");

/////////////////////////////////////////////////////////////////////////////////////////////////////////// STORIES
Template.stories.stories = function() {
	if (Meteor.user().accessLevel && Meteor.user().accessLevel > 0) //If RS or HMT
		return Stories.find();
	else
		return Stories.find({$where: function(){return this.object.user !== undefined && this.action.indexOf('Rejected') === -1}});
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

Template.stories.rendered = function() {
	$('#storyTable').dataTable({
		"sDom": "<'row-fluid'<'span6'l><'span6'f>r>t<'row-fluid'<'span6'i><'span6'p>>",
		"sPaginationType": "bootstrap",
		"oLanguage": {
			"sLengthMenu": "_MENU_ records per page"
		}
	});
}