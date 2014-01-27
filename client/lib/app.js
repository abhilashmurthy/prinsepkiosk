/* AUTHOR: ABHILASH */

//Converts forms to json objects directly
$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

//Creates input tables
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