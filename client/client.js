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

/////////////////////////////////////////////////////////////////////////////////////////////////////////// ITEMS
Template.items.isRS = function() {
	return Meteor.user().accessLevel && Meteor.user().accessLevel > 0;
}

Template.items.events = {
	'click .createItemBtn': function(e) {
		//Bootbox create item
		var fields = [
			{label: 'name', type: 'text'},
			{label: 'id', type: 'text'},
			{label: 'type', type: 'select', values:['Electronic', 'Sport', 'Board']},
			{label: 'description', type: 'text'},
			{label: 'price', type: 'text'},
			{label: 'available', type: 'radio', values:['Yes', 'No']},
			{label: '', type: 'button', values:['success', 'OK']} //first value in array is button type, next is button text
		];
		var $table = createInputTable(fields);
		$(e.target).after($table);
	},
	'click .updateItemBtn': function(e) {
		//Bootbox update item
	},
	'click .deleteItemBtn': function(e) {
		//Delete item
	}
}

function createInputTable(fields) {
	//fields in arrays of {label:name, type:input type, values:array of values}
	return $(document.createElement('table'))
			.addClass('table table-bordered table-hover')
			.addClass('abhitable')
			.append(function(){
				var $trArray = new Array();
				for (var i = 0; i < fields.length; i++) {
					$trArray.push(
						$(document.createElement('tr'))
							.append($(document.createElement('td'))
										.html("<b>" + (capsLetters(fields[i].label)) + "</b>"))							
							.append($(document.createElement('td'))
										.append(function() {
											switch (fields[i].type){
												case 'text':
													return $(document.createElement('input'))
														.attr('type', 'text')
														.attr('name', fields[i].label)
														.attr('id', fields[i].label)
														.addClass('createItemInput');
												case 'password':
													return $(document.createElement('input'))
														.attr('type', 'password')
														.attr('name', fields[i].label)
														.attr('id', fields[i].label)
														.addClass('createItemInput');
												case 'checkbox':
													var $returnArray = new Array();
													for (var j = 0; j < fields[i].values.length; j++) {
														$returnArray.push(
															$(document.createElement('input'))
																.attr('type', 'checkbox')
																.attr('name', fields[i].label)
																.attr('value', fields[i].values[j])
																.addClass('createItemInput')
														);
														$returnArray.push(fields[i].values[j] + '<br/>');
													}
													return $returnArray;
												case 'radio':
													var $returnArray = new Array();
													for (var j = 0; j < fields[i].values.length; j++) {
														$returnArray.push(
															$(document.createElement('input'))
																.attr('type', 'radio')
																.attr('name', fields[i].label)
																.attr('value', fields[i].values[j])
																.addClass('createItemInput')
														);
														$returnArray.push(fields[i].values[j] + '<br/>');
													}
													return $returnArray;
												case 'select':
													return $(document.createElement('select'))
														.attr('id', fields[i].label)
														.attr('name', fields[i].label)
														.addClass('createItemInput')
														.append(function(){
															var $optionArray = new Array();
															for (var j = 0; j < fields[i].values.length; j++) {
																$optionArray.push(
																	$(document.createElement('option'))
																		.attr('value', fields[i].values[j].replace(' ', ''))
																		.html(fields[i].values[j])
																);
															}
															return $optionArray;
														});
												case 'multiselect':
													return $(document.createElement('select'))
														.attr('id', fields[i].label)
														.attr('name', fields[i].label)
														.addClass('createItemInput')
														.attr('multiple' , 'multiple')
														.append(function(){
															var $optionArray = new Array();
															for (var j = 0; j < fields[i].values.length; j++) {
																$optionArray.push(
																	$(document.createElement('option'))
																		.attr('value', fields[i].values[j].replace(' ', ''))
																		.html(fields[i].values[j])
																);
															}
															return $optionArray;
														});
												case 'button':
													return $(document.createElement('button'))
														.attr('id', fields[i].label)
														.attr('name', fields[i].label)
														.addClass('createItemInput')
														.addClass('btn btn-' + fields[i].values[0])
														.html(fields[i].values[1]);
											}
										})
									)
					)
				}
				return $trArray;
			});
}

function capsLetters(string) {
	var words = string.split(" ");
	if (words.length > 1) {
		var newString = "";
		for (var i = 0; i < words.length; i++) {
			newString += words[i].charAt(0) + words[i].slice(1) + " ";
		}
		return newString.trim();
	} else {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}
}