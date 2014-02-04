Meteor.subscribe('items', '');
Meteor.subscribe('csvs');

/////////////////////////////////////////////////////////////////////////////////////////////////////////// MAPS
Template.map.divrows = function(){
	var items = Items.find().fetch();
	var locGroups = _.pairs(_.groupBy(items, 'location'));
	var divrows = new Array();
	var row = new Array();
	for (var i = 0; i < locGroups.length; i++) {
		if (i%3 === 0) {
			divrows.push(row);
			row = new Array();
		}
		row.push({location: locGroups[i][0], items: locGroups[i][1]});
	};
	divrows.push(row);
	return divrows;
}

Template.map.events = {
	'click #downloadCSV': function(e) {
		Meteor.call('generateItemsCSV', function(err, csvId){
			if (err) console.log(err);
			console.log('Got fileId: ' + csvId);
			Session.set('csvId', csvId);
			bootbox.dialog({
				message: Spark.render(Template.downloadCSV),
				className: "itemModal"
			});
		});
	}
};

Template.downloadCSV.file = function(){
	var csvId = Session.get('csvId');
	return CSVFS.findOne(csvId);
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