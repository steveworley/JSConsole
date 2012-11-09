/*
 * JSConsole
 * ---------
 * @author: Steve Worley
 * @description: 		adds a console like element to the page so you can debug
 * 
 * ==================================================================================
 * TODO
 * 	FUCK OFF DANE I'M NOT ADDING ANYTHING ELSE!
 */
var isLoaded = false;

function consoleInit() {
	if (typeof jQuery == 'undefined') {
		if (!isLoaded) {
			isLoaded = true;
			var script = document.createElement('script');
			script.src = 'http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js';
			document.getElementsByTagName('head')[0].appendChild(script);
		}
		setTimeout("consoleInit()", 50);
	} else {

		jQuery(function($){
			JSConsole.init();
		});

	}
}


JSConsole = {
	date: new Date().getTime(), // Unique string for elements
	$input:'',				// $input 		object 			jQuery object for the input element
	$output:'',				// $output 		object 			jQuery object for the output element
	commandLog:[],			// commandLog   array			Array to store previously entered commands
	localVars:{},			// localVars	object			object of local variables
	documentTags:[],
	map:[],
	inspector:'',
	helper:/^(border|reset|dim|inspect)/,	
	init:function(){
		var self = this;
		self.commandLog = self.cookies('get');
		var inputHtml = self.buildElement({
			'name':'js-input-' + self.date, 
			'type':'textarea', 
			'styles' : 'width:49%; float: left; height: 150px; resize: none; padding: 5px; border: 1px solid #d8d8d8; font-size: 13px; font-family: monospace; outline: none;'
		});
		var outputHtml = self.buildElement({
			'name':'js-output-' + self.date,
			'type':'div',
			'content':'',
			'styles':'width: 49%; float: right; height: 150px; background: #fafafa; padding: 5px; border: 1px solid #d8d8d8; font-size: 12px; font-family: monospace; overflow-y: scroll'
		});
		var container = self.buildElement({
			'name':'js-container-' + self.date,
			'type':'div',
			'content':'<div style="padding: 10px; overflow: hidden;"><div><a style="margin-right: 5px; border:0;" title="Reset your console" href="#reset-output"><img style="border:0;" src="http://cdn1.iconfinder.com/data/icons/fatcow/32x32_0060/arrow_rotate_anticlockwise.png" width="16" height="16" /></a><a style="margin-right: 5px; border: 0;" title="Add a border to elements" href="#border"><img style="border:0;" src="http://cdn1.iconfinder.com/data/icons/fatcow/32x32/table_select_big.png" height="16" width="16" /></a><a style="margin-right: 5px; border: 0;" title="Open/close the inspector" href="#inspectToggle"><img style="border:0;" src="http://cdn1.iconfinder.com/data/icons/fatcow/32x32/document_inspect.png" height="16" width="16" /></a></div>' + inputHtml + outputHtml + '</div>',
			'styles':'background: #fafafa; border-top: 1px solid #dedede; position: fixed; bottom: 0; left: 0; width:100%; z-index;'
		});				
		
		$.when($('body').append(container)).done(function(){
			$('body').css('padding-bottom', '183px');
			self.$input = $('[name="js-input-' + self.date + '"]');
			self.$output = $('[name="js-output-' + self.date + '"]');
			
			// Bind our inputs
			self.binds();
		});
		self.helpers({name:'inspect'});
	},
	/*
	 * Binds
	 * binds sets up any binds that we need when the console is initialised
	 */
	binds:function(){
		var self = this;
		self.$input.bind('keyup', function(ev){
			var count = ($(this).data('count') != undefined) ? parseInt($(this).data('count')) : -1;
			switch (ev.which) {
				case 38 :
					// scroll upwards through commands
					$(this).val(self.getCommand('up', count));
					break;
				case 40 :
					// scroll backwards through commands
					$(this).val(self.getCommand('down', count));
					break;
				case 13 :
					// eval command
					ev.preventDefault();
					self.checkCommand($(this).val());
					return false;
					break;
				default:
					return false;
					break;
			}
			return false;
		});

		$('[name="js-container-' + self.date + '"]" a[href^="#"]').bind('click', function(ev){
			var $el = $(this);
			var func = $el.attr('href').replace('#', '');
			var options = {name:func, params:[]};

			switch(func){
				case 'border':
					var selector = prompt('Enter your selector', 'body');
					var color = prompt('Please enter your color', 'red');
					options.params.push(selector);
					options.params.push(color);
				default:
					break;
			}
			self.helpers(options);

			ev.preventDefault();
		});
	},
	/*
	 * Get Command
	 * getCommand will attempt to get a stored command and update the textarea with its value
	 *
	 * @param: 		direction 		string 		a direction to cycle through the commandLog, up or down
 	 * @param: 		count 			int 		current index to search for
 	 *
 	 * @return: 	string 			Command at [count] position in the commandLog
	 */
	getCommand:function(direction, count){
		var self = this;
		var commandLog = self.commandLog;
		var count = (direction=='up') ? count + 1 : count -1;

		if (direction == 'up' && (count) <= commandLog.length ) {
			self.$input.data('count', count);
			return commandLog[count];
		}
		if (direction =='down' && count > -1) {
			self.$input.data('count', count); 
			return commandLog[count];
		}

	},
	/*
	 * Check Command
	 * checkCommand vlaidates the input into the textarea. Based on the value this method will attempt
	 * to evalute Javascript and output results in the output field.
	 *
	 * @param 		command 	string 		input value
	 * @return 		evaluted javascript code and message
	 */
	checkCommand:function(command){
		var self = this;
		var output = false;
		
		if (command.search(/^console\.(log|warn|error)/g) != -1 ) {
			// Check to see if the command is a console command
			var string = command.replace(/console\.(log|warn|error)/, '');
			string = string.match(/\((.*)\)/)[1];

			// Check to see if we're trying output elements
			if (string.search(/^(\$)/) > -1) 
				output = eval(string);
		
			// Check to see if it is a simple string console log
			if (string.search(/^(\'|\")/) > -1)
				output = string.replace(/(\'|\")/g, '');

			// Check to see if it is a variable output
			if (typeof(window[$.trim(string)]) != 'undefined')
				output = window[$.trim(string)];

		} else if (command.search(/var/) != -1) {
			// set vars
			var string = command.replace('var', '');
			var key = '';
			var element = '';

			// Set
			string = string.split('=');
			key = $.trim(string[0]);
			element = $.trim(string[1].replace(/('|")/g, ''));
				
			window[key] = element;
			output = command;

		} else if (command.search(self.helper) > -1) {
			// use our helper
			var name = command.match(self.helper)[0];
			var params = command.match(/\((.*)\)/)[1].split(',');
			var options = {'name':'','params':[]};

			options['name'] = name;

			$.each(params, function(key, param){
				options['params'].push(param.replace(/(\'|\")/g, ''));
			});

			self.helpers(options);
			output = '<span style="color:#458b00">' + command + '</span>';

		} else {
			// lets assume its a command
			try {
				$.when(eval(command)).done(function(){
					output = '<span style="color:#458b00">' + command + '</span>';
					self.$output.append(output + '<br />');
					self.$input.val('');
					self.commandLog.push($.trim(command));
					self.cookies('set');
					return true;
				});
			} catch (err) {
				self.$output.append('<span style="color:#f00">' + err + '</span><br />');
			}
			
			return true;
		}

		if ( output !== false ) {
			self.$output.append(output + '<br />');
			self.$input.val('');
			self.commandLog.push($.trim(command));
			self.cookies('set');
			return true;
		}
	},
	/*
	 * Build Element
	 * Builds a HTML element based on the options passed to the method.
	 *
	 * @param 	options 	object 	
	 * 		type: 		string 		type of element to build	
	 * 		styles: 	string 		styles to apply to the element
	 * 		name: 		string 		name of the element
	 * 		content: 	string 		text value of the element
	 *
	 * @return 	string 		html 	the elements html
	 */
	buildElement:function(options) {
		var self = this;
		var html = "";

		if (typeof options != 'object' ) return false;

		switch (options['type']) {
			case "div":
				html = '<div class="__jsconsole" style="' + options['styles'] + '" name="' + options['name'] + '">' + options['content'] + '</div>';
				break;
			case "textarea":
				html = '<textarea class="__jsconsole" style="' + options['styles'] + '" name="' + options['name'] + '"></textarea>';
				break;
			case 'p':
				html = '<div class="__jsconsole" style="' + options['styles'] + '" name="' + options['name'] + '">' + options['content'] + '</p>';
		}

		return html;
	},
	/*
	 * Cookies
	 * Wrapper for accessing document cookies for the JSConsole.
	 *
	 * @params 	method 		string 		method for manipulating the console; can only be set, get or reset
	 * @return 	commands 	array 		array of stored commands
	 */
	cookies:function(method){
		var self = this;

		if (method.search(/(set|get|reset)/) == -1) return false;

		switch(method){
			case 'set':
				document.cookie='__jsconsolecommands=' + self.commandLog.join('|');
				break;
			case 'get':
				var cookies = document.cookie.split(';');
				var commands = [];
				$.each(cookies, function(key, cookie){
					if (cookie.search('__jsconsolecommands') > -1) {
						commands = cookie.replace('__jsconsolecommands=','').split('|');
					}
				});
				return commands;
				break;
			case 'reset':
				self.commandLog = [];
				document.cookie='__jsconsolecommands=;';
			default:
				break;
		}
	},
	/*
	 * Helpers
	 * Helpers are some quick functions that you can enter into the console to get some quick functionlity
	 *
	 * @param 	options 	object 		
	 * 		name: 		string 		name of the helper to use
	 * 		params: 	object 		object of parameters to pass to the name 
	 * @return  evaluted helper
	 */
	helpers:function(options){
		var self = this;

		if ( typeof options != 'object') {
			var options = {name:options};
		}

		var params = options['params'];

		switch(options['name']) {
			// function Border
			// @param 		selector 	string 	 	a string selector for a page element
			// @param 		color 		string 	 	a colour for the border
			// @action 		add a border to the element
			case 'border':
				var el = $(params[0]); // select our element
					if (el.length > -1)
						el.css('border', '1px solid ' + params[1]);
				break;
			// function Reset
			// @param 		selector 	string 	 	a string selector for a page element
			// @action 		remove any inline styles and reset the element back to default style
			case 'reset':
				var el = $(params[0]);
				if (el.length > -1)
					el.removeAttr('style');
				break;
			// function Dim
			// @param 		selector 	string 	 	a string selector for a page element
			// @action 		returns height and width of selected element
			case 'dim':
				var el = $(params[0]);

				if (el.length > -1)
					self.$output.append(params[0] + ' width: ' + el.width() + ', height: ' + el.height() + '<br />');
				break;
			case 'inspect':
				var output = '';
				var container = self.buildElement({
					'name':'js-inspector-' + self.date,
					'type':'div',
					'content':'<div style="padding: 10px; overflow: hidden;"><strong>Inspector</strong><br />{output}</div>',
					'styles':'background: #fafafa; border-top: 1px solid #dedede; position: fixed; top: 0; right: 0; width:250px; height: 400px; overflow-y: scroll; font-family: sans-serif; font-size: 11px; line-height: 16px; display: none;'
				});	;
				var html = self.buildElement({
					'name':'parent-{lvl}',
					'type':'div',
					'content':'<span class="parent" data-index="{index}" style="cursor:pointer; display: block;">&lt;{tagname}{class}&gt;</span><div class="children" style="display:none;">{children}</div>',
					'styles':''
				})

				// Build a list
				self.inspector({func:'children',el:$('body'),level:0});

				$.each(self.documentTags, function(key, element){
					var tmp = html.replace(/({lvl}|{tagname}|{class}|{index})/g, function(match){
						switch (match) {
							case '{lvl}':
								return (element['level'] !== undefined) ? element['level'] : '';
								break;
							case '{tagname}':
								return (element['tagname'] !== undefined) ? element['tagname'] : '';
								break;
							case '{class}':
								return (element['class'] !== undefined) ? ' class="' +element['class'] + '"' : '';
								break;
							case '{index}':
								return (element['obj'] !== undefined) ? '' : '';
								break;
							default:
								break;
						}

					});

					if (element['child'].length > -1)
						tmp = tmp.replace(/({children})/, self.inspector({
								func:'displayChildren',
								el:element['child'],
								span:'<span class="level-{lvl}" data-index="{index}" style="margin-left:{margin}px; cursor:pointer; display: block;">&lt;{tagname}{class}&gt;</span>'
							})
						);
				
					output += tmp;
				});

				container = container.replace(/({output})/, output);

				if (output != '') {
					$.when($('body').append(container)).done(function(){
						var elements = $('body').children();

						$('[name="js-inspector-' + self.date + '"] span').each(function(key, element){
							var $el = $(element);
							var bgColor = 'none';
							var domEl = self.map[key];

							$el.bind({
								mouseenter: function(){
									bgColor = domEl.css('background-color');
									domEl.css('background-color', '#DBE6FF');
									$el.css('background-color', '#dbe6ff');
								},
								mouseleave: function(){
									domEl.css('background-color', bgColor);
									$el.css('background-color', 'transparent');
								},
								click: function() {
									$(this).parent().find('.children').slideToggle('slow');
								}
							});
						});
					});
				}

				break;
			case 'inspectToggle':
				$('[name="js-inspector-' + self.date + '"]').toggle('slow');
				break;
			case 'reset-output':
				self.cookies('reset');
				self.$output.html('Cookies have been cleared');
				break;
			default:
				self.$output.append(options['name'] + ' is not a supported command<br />');
				break;
		}

	},
	inspector:function(options){
		var self = this;
		switch(options.func){
			case 'children':
				var el = options.el;
				if (el.children().length > 0) {
					// Loop over children generate object for it
					$.each(el.children(), function(key, element){
						var $child = $(element);
						var tmpObj = {'tagname':'','class':'','obj':'','level':options.level, 'child':''}

						self.map.push($child);

						if ($child.hasClass('__jsconsole')) {
							// skip
						} else {

							tmpObj['tagname'] = $child.prop('tagName').toLowerCase();
							tmpObj['class'] = $child.attr('class');
							tmpObj['obj'] = $child;

							// self.documentTags.push(tmpObj);

							// Loop over the children						
							if ($child.children().length > 0) {
								tmpObj['child'] = self.inspector({func:'getchildren',el:$child, level:options.level+1});
							}

							self.documentTags.push(tmpObj);

						}
					})

				} else {
					return false;
				}
				break;
			case 'getchildren':
				var el = options.el;
				var docTags = [];
				$.each(el.children(), function(key, element){
					var $child = $(element);
					var tmpObj = {'tagname':'','class':'','obj':'','level':options.level, 'child':''}

					self.map.push($child);

					if ($child.hasClass('__jsconsole')) {
						// skip
					} else {

						tmpObj['tagname'] = $child.prop('tagName').toLowerCase();
						tmpObj['class'] = $child.attr('class');
						tmpObj['obj'] = $child;

						// Loop over the children						
						if ($child.children().length > 0) {
							tmpObj['child'] = self.inspector({func:'getchildren',el:$child, level:options.level+1});
						}
						
						docTags.push(tmpObj);

					}
				})

				return docTags;
				break;
			case 'displayChildren':
				var child = options.el;
				var span = options.span;
				var output = '';
				$.each(child, function(key, element){
					// '<span class="level-{lvl}">&lt;{tagname}{class}&gt;</span>'
					output += span.replace(/({lvl}|{tagname}|{class}|{margin}|{index})/g, function(match){
						switch (match) {
							case '{lvl}':
								return (element['level'] !== undefined) ? element['level'] : '';
								break;
							case '{tagname}':
								return (element['tagname'] !== undefined) ? element['tagname'] : '';
								break;
							case '{class}':
								return (element['class'] !== undefined) ? ' class="' +element['class'] + '"' : '';
								break;
							case '{margin}':
								return (element['level'] !== undefined) ? parseInt(element['level']) * 10:'0';
							case '{index}':
								return (element['obj'] !== undefined) ? '' : '';
								break;
							default:
								break;
						}
					});
					if (element['child'].length > -1)
						output += self.inspector({func:'displayChildren',el:element['child'],span:'<span class="level-{lvl}" style="margin-left:{margin}px; cursor:pointer; display: block;">&lt;{tagname}{class}&gt;</span>'});

				});
				return output;
				break;
			case 'map':
			default:
				return false;
				break;
		}
	},
	stringify:function(obj){
		var self = this;
		var t = typeof (obj);
	    if (t != "object" || obj === null) {
	        // simple data type
	        if (t == "string") obj = '"'+obj+'"';
	        return String(obj);
	    }
	    else {
	        // recurse array or object
	        var n, v, json = [], arr = (obj && obj.constructor == Array);
	        for (n in obj) {
	            v = obj[n]; t = typeof(v);
	            if (t == "string") v = '"'+v+'"';
	            else if (t == "object" && v !== null) v = self.stringify(v);
	            json.push((arr ? "" : '"' + n + '":') + String(v));
	        }
	        return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
	    }
	}
}

consoleInit();