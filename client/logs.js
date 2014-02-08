Meteor.subscribe("logs");

/////////////////////////////////////////////////////////////////////////////////////////////////////////// LOGS
Template.logs.logs = function() {
	if (Meteor.user().accessLevel && Meteor.user().accessLevel > 0) //If RS or HMT
		return Logs.find();
	else
		return Logs.find({$where: function(){return this.object.user !== undefined && this.action.indexOf('Rejected') === -1}});
}

Template.logs.events = {
	'click #downloadCSV': function(e) {
		Meteor.call('generateLogsCSV', function(err, csvId){
			if (err) console.log(err);
			console.log('Got fileId: ' + csvId);
			CSVFS.retrieveBlob(csvId, function(fileItem){
				var file = CSVFS.findOne(csvId);
				if (fileItem.blob) saveAs(fileItem.blob, file.filename);
				else if (fileItem.file) saveAs(fileItem.file, file.filename);
			});
		});
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////// PLUGINS
//Pnotify settings
$.pnotify.defaults.hilog = false;
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

Template.logs.rendered = function() {
	$('#logTable').dataTable({
		"sDom": "<'row-fluid'<'span6'l><'span6'f>r>t<'row-fluid'<'span6'i><'span6'p>>",
		"sPaginationType": "bootstrap",
		"oLanguage": {
			"sLengthMenu": "_MENU_ records per page"
		}
	});
}