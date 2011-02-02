/*
 * cj JavaScript Library
 *   http://github.com/kristopolous/cj
 *   
 *   Copyright 2010, 2011, Chris McKenzie
 *   Dual licensed under the MIT or GPL Version 2 licenses.
 */

// try to avoid polluting the global namespace
if(! window.$cj) {
  var $cj = {};
}

$cj.async = {
	callback: function() {
		/* {{ 
		 * Description:
		 * 	A generic callback framework.
		 *
		 * Usage:
		 * 	$cj.callback (directive, function);
		 * 	$cj.callback.exec (pointer, directive, options);
		 *
		 * Details:
		 * 	directive (required): Any text value or array of text values
		 * 	pointer (required): A context for the callback
		 * 	function (optional): A callback associated with the directive
		 * 	options (optional): An array of options to pass to the function
		 *
		 * Example:
		 * 	Say I had 3 dialog boxes, named 'Send Mail',
		 * 	'Get Account Info', and 'Login'.
		 * 	
		 * 	Pretend I wanted to be able to hook an 
		 * 	event when they close.  Here is
		 * 	how you would do it.
		 *
		 * 	var dialogOnClose = $cj.callback();
		 *
		 * 	Then we could do the following:
		 *
		 * 	dialogOnClose('Send Mail', function(){
		 * 		alert("Your mail has been sent");
		 * 	});
		 *
		 * 	Now in my generic function
		 *
		 * 	function Dialog(type) {
		 * 	}
		 *
		 * 	which has a generic close
		 *
		 * 	Dialog.close = function()
		 *
		 * 	I can do this...
		 *
		 * 	Dialog.close = function(){
		 *		$cj.callback.exec(this, type);
		 *	}
		 *
		 * 	and if any callbacks are registered for the 
		 * 	generic type, then they would run there.
		 * 	This allows for a rather strong decoupling
		 * 	of complex code and an ability to isolate
		 * 	them into an arbitrary event model.
		 * 	
		 * See Also:
		 * 	$cj.ev
		 * }}
		 */
		var cbackMap = {},
		    ix;

		function ret_real(directive, func) {
			if(!directive) {
				return false;
			}

			if(! (directive in cbackMap) ) {
				cbackMap[directive] = [];
			}

			cbackMap[directive].push(func);

			return true;
		}

		function ret(directive, func) {
			if(typeof directive == 'string' || typeof directive == 'number') {
				ret_real(directive, func);
			} else {
				while(ret_real(directive.pop(), func)) {};
			}
		}

		ret.exec = function(pointer, directive, opts){
			var ret = true;

			if(directive in cbackMap) {
				for(ix = 0; ix < cbackMap[directive].length; ix++) {
					pointer.$directive = directive;
					ret &= cbackMap[directive][ix].call(pointer, opts);
				}
			}

			return ret;
		}

		return ret;
	},

	mutex: (function(){
		/* {{ 
		 * Description:
		 * 	A generic named mutex
		 *
		 * Usage:
		 * 	$cj.mutex.set (name)
		 * 	$cj.mutex.waitOn (name, function)
		 *
		 * Details:
		 * 	name (required): A mutex name
		 * 	function (optional): A callback function
		 *
		 * Example:
		 * 	Pretend that you asynchronously load
		 * 	a json object and have code that depends
		 * 	on it.
		 *
		 * 	We'll use the following names for
		 * 	this demonstration:
		 *
		 * 	vartable: required object
		 * 	loadjson: asynchronous function that loads vartable
		 *	dependency: code that requires vartable
		 *
		 *	$cj.mutex.waitOn('vartable', dependency);
		 *
		 *	function loadjson() {
		 *		...
		 *		$cj.mutex.set('vartable');
		 *		...
		 *	}
		 *
		 *	It is worth noting that this isn't a true mutex
		 *	since there are actually no locks acquired and
		 *	you can't unset it.
		 *
		 *	However, it is conceptually similar to a mutex in
		 *	that functions will not execute until the named
		 *	'mutex' is set.  And then all future functions
		 *	that are assigned on it will just pass thru
		 *	and execute without waiting.
		 *	
		 *	If you can think of a better name for this construct
		 *	please contact me.
		 * }}
		 */
		var 	pub = {},
			mutSet = {},
			mutFunc = {},
			cbList = {};

		pub.set = function(name) {
			var 	cbTmp, 
				cb;

			if(cbList.hasOwnProperty(name)) {
				cbTmp = cbList[name];

				while(cb = cbTmp.shift()) {
					cb();
				}
			}

			mutSet[name] = true;
		}

		pub.waitOn = function(name, cb) {
			if(mutSet[name]) {
				return cb();
			} else if(!cbList.hasOwnProperty(name)) {
				cbList[name] = [];
			}

			cbList[name].push(cb);

			// check to see if a helper function has
			// been registered for this name
			if(mutFunc.hasOwnProperty(name)) {
				mutFunc[name]();
			}
		}

		return pub;
	})(),

	lazyLoad: (function() {
		/* {{ 
		 * Description:
		 * 	A clean way to load additional libraries
		 *
		 * Usage:
		 * 	$cj.lazyLoad (filename, function, options);
		 * 	$cj.lazyLoad.fire (filename);
		 *
		 * Details:
		 * 	filename (required): A script to load, such as http://hostname/script.js
		 * 	function (optional): A function that requires this file
		 * 	options (optional): See Below
		 *
		 * Example:
		 * 	This is similar to the mutex above and should probably
		 * 	be folded into it eventually.  It was written at a different
		 *	time, so it duplicates a lot of the code.
		 *
		 * 	Pretend that we depend on a large library that is broken up
		 * 	into many files.  We have ui.js or intl.js for the UI
		 * 	and internationalization frameworks.  We want to load this
		 * 	only if they are required.
		 *
		 * 	We will use "ui.js" as our example here.  At the bottom of
		 * 	ui.js we place the following like
		 *
		 * 	$cj.lazyLoad.fire('ui.js');
		 *
		 * 	to announce that the file is loaded.
		 *
		 * 	Then, throughout the code, you can have dependencies such
		 * 	as
		 *
		 * 	$cj.lazyLoad('ui.js', required);
		 * }}
		 */
		var // a wrapper div to hold our script tags
			wrapper,

			// wait 5 seconds to load the library
			timeout = 5000,

			// functions to be run if the library loads
			callbackMap = {},

			// functions to be run if the library fails to load
			failureMap = {},

			// a cache so we don't load the library more then once
			existMap = {};
		
		var ret = function (file, callback, options) {

			// Check to see if we have loaded this library before.
			if(existMap[file])  {

				// if so, we just fire the callback
				callback();
			}

			// If this is our first time here, 
			// we'll need to create the wrapper div
			// and inject it into the document.body
			if(!wrapper) {
				wrapper = document.createElement('div');
				wrapper.setAttribute('class', 'lazyloader');

				document.body.appendChild(wrapper);
			}

			// We create the script tag to inject below.
			// However, we don't load it quite yet.  If it loads
			// too fast (unlikely), then our handlers won't be called.
			//
			// However, if we have too much overhead (very unlikely)
			// then our failure case may be called when it wasn't really
			// needed.  Either way, this justifies the injection at the
			// last possible moment.
			var script = document.createElement('script');
			script.src = file;


			// add the callback to a list, if applicable
			if(! callbackMap[file]) {
				callbackMap[file] = [];
			}

			callbackMap[file].push(callback);


			// add the failure to a list, if applicable
			if(options && options.failure) {

				if(! failureMap[file]) {
					failureMap[file] = [];

					// We'll have timeout milliseconds to
					// request and load the script.  I have a lenient
					// default of 5 seconds.  You can put it as high
					// or as low as you want, depending on use.  
					//
					// Or, as in the example, you may not feel obliged
					// to specify failure cases at all, in which case,
					// this doesn't apply.
					//
					// We drop the code path in here because we don't want to
					// accidentally register the setTimeout function more then
					// once.  Even if we do, we are detroying the failureMap,
					// so this ought not be a problem.  
					//
					// However, Array.prototype.shift is unlikely to be necessarily
					// atomic so it's best to avoid any potential resource issues that
					// may arise as a result of some likely future browser bugs.
					setTimeout(function() {

						// Exit if the library has been loaded in this
						// time period.
						if(existMap[file]) {
							delete failureMap[file];
							return;
						}

						// execute the failure code in order
						while(failureMap[file]) {
							(failureMap[file].shift()) ();
						}
					}, timeout);
				}

				failureMap[file].push(options.failure);
			}

			// Here is where we inject into the DOM
			wrapper.appendChild(script);
		}

		ret.fire = function(file) { 

			// Cache the library as loaded
			existMap[file] = true;

			// Delete the fail callbacks.
			// This is just a matter of memory
			// management.
			if(failureMap[file]) {
				delete failureMap[file];
			}

			if(callbackMap[file]) {

				// Execute the success code in order
				while(callbackMap[file].length) {
					(callbackMap[file].shift()) ();
				}
			}
		}

		return ret;
	})()
};

$cj.dom = function(o) {
	/* {{ 
	 * Description:
	 * 	An integrated DOM builder. This is conceptually new
	 * 	but quite useful
	 *
	 * Usage:
	 * 	$cj.dom.el {}
	 * 	$cj.dom.build (dom, obj)
	 * 	(el) $cj.dom.root (type, name, html)
	 *	(el) $cj.dom.simple (dom, type, name, html) 
	 *	(el) $cj.dom.ap (dom, type, name, html) 
	 *	(el) $cj.dom.apTbl (dom, tableName, list) 
	 *
	 * Details:
	 * 	el: The constructed element
	 * 	dom (required): The element to attach to
	 * 	type (required): The DOM type of the element to contstruct, such as 'span' or 'input'
	 * 	name (optional): The name of the element to construct, can be null or omitted
	 * 	html (optional): Text or html to place inside of the element, can be null or omitted
	 *
	 * Example:
	 * 	TODO
	 * }}
	 */
	function create(type){
		try{
			var tmp = document.createElement(type);
		} catch(ex){
			Gdb(type);
			Gdb.stack();
		}

		if(pub.genid) {
			tmp.id = ['gezobj',G.iter()].join('-');
		}

		return tmp;
	}
	var pub = {
		el: {},
		build: function (el, obj) {
			if(!obj) {
				obj = el;
				el = pub.root();
			}

			var 	len = obj.length, 
				cur, 
				ret;

			for(var ix = 0; ix < len; ix++) {
				cur = obj[ix];

				if(cur.length > 2) {
					if(typeof cur[2] == 'string') {
						ret = pub.ap(el, cur[0], cur[1], cur[2]);

						if(cur.length > 3) {
							// recurse for children
							// the FOURTH argument is the children
							pub.build(ret, cur[3]);
						} 
					} else { // children
						ret = pub.ap(el, cur[0], cur[1]);

						// recurse for children
						pub.build(ret, cur[2]);
					}
				} else {
					pub.ap(el, cur[0], cur[1]);
				}
			}
			return el;
		},

		root: function (type, name, html) {
			var tmp = create(type || 'div');

			if(name) {
				tmp.className = name;
				this.el[name] = tmp;
			} else {
				this.el.root = tmp;
			}

			if(html) {
				tmp.innerHTML = html;
			}
			return tmp;
		},

		// this doesn't do the class creation ... it just
		// creates the object
		simple: function (el, type, name, html) {
			var tmp = el.appendChild(create(type));

			if(name) {
				// implicit scopes
				var nameList = name.split('.');

				scope = this;

				for(;;) {
					name = nameList.shift();

					// check if there are more names
					if(nameList.length > 0) {

						// if so, create a scope
						if( !(name in scope) ) {
							scope[name] = {};
						}

						scope = scope[name];
						continue;

					} else if(name) {
						if(name in scope) {
							alert(name);
						}

						scope[name] = tmp;
					} 

					break;
				}
			}

			if(html) {
				tmp.innerHTML = html;
			}

			return tmp;
		},

		// this supports scopes...
		ap: function (el, type, name, html) {
			var 	tmp = el.appendChild(create(type)),
				scope;

			if(name) {
				// implicit scopes
				var nameList = name.split('.');

				// make the class name space separated for CSS ease
				tmp.className = nameList[nameList.length - 1];

				scope = this.el;

				for(;;) {
					name = nameList.shift();

					// check if there are more names
					if(nameList.length > 0) {
						// if so, create a scope
						if( !(name in scope) ) {
							scope[name] = {};
						}
						scope = scope[name];

						continue;

					} else if(name) {
						if(name in scope) {
							alert(name);
						}

						scope[name] = tmp;
					} 

					break;
				}
			}

			if(html) {
				tmp.innerHTML = html;
			}

			return tmp;
		},

		apTbl: function (el, tableName, nameList) {
			var 	tr = create('tr'),
				len = nameList.length;

			pub.ap(el, 'table', tableName);

			for(var ix = 0; ix < len; ix++) {
				pub.ap(tr, 'td', nameList[ix]);
			}

			pub.el[tableName].appendChild(tr);
		},

    // unrelated dom functions
    create: function(opts) {
      var el = document.createElement(opts.type);
      if (opts.attr) {
        $cj.attr(el, opts.attr);
      }
      if (opts.css) {
        $cj.css(el, opts.css);
      }
      return el;
    },

    attr: function(dom, attrList) {
      for (var key in attrList) {
        dom.setAttribute(key, attrList[key]);
      }
      return dom;
    },

    css: function(dom, attrList) {
      for (var key in attrList) {
        dom.style [key] = attrList[key];
      }
      return dom;
    }
	}

	pub = $cj.obj.merge(o, pub);

	return pub;
};

// text library
$cj.txt = {
  trim: function (str) {
    return str.replace(/^\s+/,'').replace(/\s+$/,'');
  },

	utf8: function (d) {
		/* {{ 
		 * Description:
		 * 	Nice decoding thing that handles UTF8, \' and UTF16
		 *
		 * Usage:
		 *	(htmlText) $cj.text.utf8 (slashedText)
		 *
		 * Details:
		 *	slashedText (required): input text
		 *	htmlText: &#... formatted HTML
		 *
		 * Example:
		 * 	Sometimes text will be emitted like so
		 *
		 * 	Hello,\u000aHow are you?
		 *
		 * 	This takes that and converts it to
		 *
		 * 	Hello,&#x000a;How are you?
		 *
		 * }}
		 */

		return d ? 
			d.replace(/\\([\\'"])/g, '$1').replace(/\\u([0-9a-f]*)/g, '&#x$1;') :
			'';
	},

	padLeft: function(num, width){
		/* {{ 
		 * Description:
		 *	Pads a number with 0s
		 *
		 * Usage:
		 *	(text) $cj.txt.padLeft(number, width)
		 *
		 * Details:
		 *	text: The outputted text
		 *	number (required): The number to pad
		 *	width (required): The width of the number
		 *
		 * Example:
		 * 	Oftentimes, you are dealing with formatting
		 * 	issues where you want to do the following:
		 *
		 * 	1.001
		 * 	1.002
		 *
		 * 	etc. But how the math works out, you start emitting
		 *
		 * 	1.1
		 *
		 * 	for 1.001 and 
		 *
		 * 	1.100
		 *
		 * 	for actually, 1.1
		 *
		 * 	This is of course, because you can't just padleft with zeros.
		 *	now you can.  Take that and do this
		 *
		 *	$cj.text.padLeft(number, 3);
		 *
		 *	And you will always get something 3 characters wide.  About Time!
		 *
		 * }}
		 */
		return (num + Math.pow(10, width)).toString().substr(1);
	},

	time: function (fmt) {
		/* {{ 
		 * Description:
		 * 	return time in a format
		 *
		 * Usage:
		 *	(text) $cj.txt.time(format)
		 *
		 * Details:
		 *	format (optional): Is of the form %[Y|M|N|D|W|H|h|m|s]
		 * 		Y = year, such as 2010
		 * 		N = Named month, such as Feb
		 * 		M = month, such 02
		 * 		W = Week day, such as Tue
		 * 		D = Day, such as 24
		 * 		H = hour base 12
		 * 		h = hour
		 * 		m = minute
		 * 		s = second
		 * Example:
		 * 	fmt is of type
		 * 
		 * }}
		 */
		var d = new Date(),
		    t = {
			Y: d.getFullYear(),
			M: $cj.txt.padLeft((d.getMonth() + 1), 2),
			D: $cj.txt.padLeft(d.getDate(), 2),
			H: ( ((d.getHours() + 1) % 12) - 1),
			h: $cj.txt.padLeft(d.getHours(), 2),
			m: $cj.txt.padLeft(d.getMinutes(), 2),
			s: $cj.txt.padLeft(d.getSeconds(), 2)
		}, post = '';

		if(!fmt) {
			fmt = "%Y-%M-%D %h:%m:%s";
		}

		return fmt.replace(/%(.)/g, function(f, m) {
			if(m == 'H') {
				post = [' AM', ' PM'][Math.floor(t.h / 12)];
			}

			return t[m];
		}) + post;
	},

	//
	// BUGBUG: 'proto://host.dom.tld/req.ext?search.' will make the link encapsulate the last dot
	// 	But wait there, speedy regexer, look at all the other dots.  Gotta be careful!
	//
	rich: function (f) {
		/* {{ 
		 * Description:
		 *	Wraps a link in an href tag
		 *
		 * Usage:
		 *	(richText) $cj.text.rich(plainText)
		 *
		 * Details:
		 *	plainText (required): Text to html-ify
		 *	richText: output html text with links
		 *
		 * Example:
		 * 	$cj.text.rich('You should try http://www.google.com.  It's a nice search engine.')
		 *
		 * 	Would emit:
		 *
		 *	You should try <a href="http://www.google.com">http://www.google.com</a>. It's a nice
		 *	search engine.
		 * }}
		 */
		return f ? f.replace ? f.replace(/[a-z]+:\/\/[^\s^<]+/g, '<a href="$&" target=_blank>$&</a>') : f : f;
	},

	plain: function(f) {
		/* {{ 
		 * Description:
		 *	Returns the plaintext within a block of html
		 *
		 * Usage:
		 *	(plaintext) $cj.txt.plain(html)
		 *
		 * Details:
		 *	html: dom.innerHTML to sift through
		 *	plaintext: plaintext representation
		 *
		 * Example:
		 * 	try alert($cj.txt.plain(document.body));
		 * }}
		 */
		if(f && f.replace) {
			f = f.replace(/<[^>]*>/g, '');
			// swap out the newlines to preserve them
			f = f.replace(/\n/g, '<br>');
				f = f.replace(/\s+/g, ' ');
				f = f.replace(/^\s*/, '');
				f = f.replace(/\s*$/, '');
			f = f.replace(/<br>/g, '\n');
		} else {
			return '';
		}

		return f;
	}
};

$cj.list = {
  each: function(list, cb) {
    var len = list.length;
    for(var ix = 0; ix < len; ix++) {
      cb(list[ix]);
    }
  },

  add: function(key, value) {
    if (! (value in key) ) {
      key[value] = [];
    }
    return function(param) {
      key[value] = key[value].concat(param);
    }
  },

	obj: function(list) {
		/* {{ 
		 * Description:
		 * 	Unflattens a serialized list that was
		 * 	created with $cj.obj.list
		 *
		 * Usage:
		 *	(obj) $cj.list.obj(list)
		 *
		 * Details:
		 *	list (required): Array to unflatten
		 *	obj: Resulting object
		 *
		 * Example:
		 *	var obj = {
		 *		a: 1,
		 *		b: 2,
		 *		c: 3
		 *	}
		 *
		 * 	If we got this
		 *	var flattened = $cj.obj.list(obj)
		 *
		 * 	which results in this:
		 *	['a', 1, 'b', 2, 'c', 3]
		 *
		 *	Then, we can go backwards as follows:
		 *
		 *	$cj.list.obj(flattened)
		 *
		 *	And get our original object
		 * }}
		 */
		var 	map = {},
			len = list.length;

		for(var ix = 0; ix < len; ix += 2) {
			map[list[ix]] = list[ix + 1];
		}

		return map;
	},

	fromString: function(toCheck, delim) {
		if(toCheck instanceof Array) {
			return toCheck;
		} else {
			return toCheck.split(delim || ',');
		}
	},

	unique: function(list) {
		/* {{ 
		 * Description:
		 *	Removes duplicates from an array.  Does not maintain order
		 *	Side Effect free.
		 *
		 * Usage:
		 *	(newList) $cj.list.unique(list)
		 *
		 * Details:
		 *	list (required): Array to process
		 *	newList: Unique elements
		 *
		 * Example:
		 *	Self-explanatory 
		 * }}
		 */
		var	obj = {},
			len = list.length;

		for(var ix = 0; ix < len; ix++) {
			obj[list[ix]] = 0;
		}

		return $cj.obj.keys(obj);
	}
};

$cj.obj = {
  // use an object as a bitmap set of flags
  set: function(key, value) {
    key[value] = true;
    return value;
  },
  
  inc: function(key, value) {
    if(value in key) {
      key[value]++;
    } else {
      key[value] = 1;
    }
  },

  create: function(key, value) {
     if(! (value in key) ){
       key[value] = {};
     }
     return key[value];
  },
	extract: function (obj, fieldList) {
		/* {{ 
		 * Description:
		 *	Returns a new object, with just the fields
		 *	in fieldList
		 *
		 * Usage:
		 * 	(newobj) $cj.obj.extract(obj, fieldList)
		 *
		 * Details:
		 * 	obj (required): Source object
		 *	fieldList (required): Array of fields to extract
		 *
		 * Example:
		 *	Pretend I had the following object
		 *	var obj = {
		 *		name: "John Doe",
		 *		Age: "21",
		 *		SSN: "555-55-5555",
		 *		CCV: "1012",
		 *	}
		 *
		 *	And I want just the name and age, I can do the following:
		 *
		 *	var clean = $cj.obj.extract(obj, ['name', 'age']);
		 *
		 *	which would emit:
		 *		{
		 *			name: "John Doe",
		 *			Age: "21"
		 *		}
		 *
		 *	But also keep obj unmodified.
		 * }}
		 */
		var 	field,
			ret = {},
			len = fieldList.length;
		
		for(var ix = 0; ix < len; ix++) {
			ret[fieldList[ix]] = obj[fieldList[ix]];
		}

		return ret;
	},

	remove: function (obj, fieldList) {
		/* {{ 
		 * Description:
		 *	Removes a number of fields from an object, if they are defined	
		 *	This is side effect free and doesn't modify the original object
		 *
		 * Usage:
		 *	(newobj) $cj.obj.remove(obj, fieldList)
		 *
		 * Details:
		 * 	newobj: Obj without the elements in fieldList
		 *	obj (required): The object to modify
		 *	fieldList (required): An array of elements to remove from obj
		 *
		 * Example:
		 *	Pretend I had the following object
		 *	var obj = {
		 *		name: "John Doe",
		 *		Age: "21",
		 *		SSN: "555-55-5555",
		 *		CCV: "1012",
		 *	}
		 *
		 *	And I want to easily remove the SSN and the CCV in
		 *	one compact call, and not havee to worry about whether
		 *	they may or may not be defined.  Here it is
		 *	
		 *	var clean = $cj.obj.remove(obj, ['SSN', 'CCV']);
		 *
		 *	which would emit:
		 *		{
		 *			name: "John Doe",
		 *			Age: "21"
		 *		}
		 *
		 *	But also keep obj unmodified.
		 * }}
		 */
		var 	field,
			ret = $cj.obj.copy(obj),
			len = fieldList.length;
		
		for(var ix = 0; ix < len; ix++) {
			field = fieldList[ix];

			try {
				delete ret[field];
			} catch(ex){}
		}

		return ret;
	},

	keys: function (obj) {
		/* {{ 
		 * Description:
		 *	Returns an array of the keys of an object
		 *
		 * Usage:
		 *	(array)	$cj.obj.keys(obj)
		 *
		 * Details:
		 *	array: The keys of the object
		 *	obj (required): The object to get the keys of
		 *
		 * Example:
		 *	var obj = {
		 *		a: 1,
		 *		b: 2,
		 *		c: 3
		 *	}
		 *
		 *	$cj.obj.keys(obj);
		 *
		 *	would emit:
		 *
		 *	['a', 'b', 'c']
		 * }}
		 */
		var	ret = [];
		
		for(var el in obj) {
			ret.push(el);
		}
			
		return ret;
	},

	values: function (obj) {
		/* {{ 
		 * Description:
		 *	Returns an array of the values of an object
		 *
		 * Usage:
		 *	(array)	$cj.obj.values(obj)
		 *
		 * Details:
		 *	array: The values of the object
		 *	obj (required): The object to get the values of
		 *
		 * Example:
		 *	var obj = {
		 *		a: 1,
		 *		b: 2,
		 *		c: 3
		 *	}
		 *
		 *	$cj.obj.values(obj);
		 *
		 *	would emit:
		 *
		 *	['1', '2', '3']
		 * }}
		 */
		var	ret = [];
		
		for(var el in obj) {
			ret.push(obj[el]);
		}
			
		return ret;
	},

	merge: function() {
		/* {{ 
		 * Description:
		 *	Merges 1 or more object.
		 *
		 * Usage:
		 *	(merged) $cj.obj.merge(obj1, obj2, objN);
		 *
		 * Details:
		 * 	merged: All the K/Vs of obj1, obj2, objN merged a fold Right
		 *
		 * Example:
		 * 
		 * 	var obj1 = {
		 * 		a: 1,
		 * 		b: 2,
		 * 		c: 3
		 * 	}, 
		 * 	obj2 = {
		 * 		x: 1,
		 * 		y: 2,
		 * 		z: 3
		 * 	}
		 *
		 * 	$cj.obj(merge(obj1, obj2)
		 *
		 * 	would emit:
		 *
		 * 	{
		 * 		a: 1,
		 * 		b: 2,
		 * 		c: 3,
		 * 		x: 1,
		 *		y: 2,
		 *		z: 3
		 *	}
		 * }}
		 */
		var 	args = Array.prototype.slice.call(arguments),
			ret = args.shift(),
			len = args.length,
			tmp;

		for(var ix = 0; ix < len; ix++) {
			tmp = args[ix];

			for(var el in tmp) {
				ret[el] = tmp[el];
			}
		}

		return ret;
	},

	changed: function(obj1, obj2) {
		/* {{ 
		 * Description:
		 *	Looks for changes between two objects
		 *	and returns a boolean
		 *
		 * Usage:
		 *	(boolean) $cj.obj.changed(obj1, obj2)
		 *
		 * Details:
		 *	obj1 (required): First object to check
		 *	obj2 (required): Object to compare against
		 *
		 * Example:
		 *	Self-explanatory 
		 * }}
		 */
		for(var el in obj1) {
			if(!el in obj2 || obj1[el] != obj2[el]) {
				return true;
			}
		}

		for(el in obj2) {
			if(!el in obj1) {
				return true;
			}
		}

		return false;
	},

	copy: function(obj) {
		/* {{ 
		 * Description:
		 *	Returns a copy of obj, not a reference
		 *
		 * Usage:
		 *	(newObj) $cj.obj.copy(obj)
		 *
		 * Details:
		 *	obj (required): Object to copy
		 *	newObj: The copy of the object
		 *
		 * Example:
		 * 	Self explanatory.
		 * }}
		 */
		var copy = {};

		for(var el in obj) {
			copy[el] = obj[el];
		}

		return copy;
	},

	tuples: function(obj) {
		/* {{ 
		 * Description:
		 *	Creates a list of tuples from an object
		 *	This is similar to what happens in python
		 *
		 * Usage:
		 *	(tuple) $cj.obj.list(obj)
		 *
		 * Details:
		 *	obj (required) : Object to process
		 *	tuple: Array of K/V tuples
		 *
		 * Example:
		 *	var obj = {
		 *		a: 1,
		 *		b: 2,
		 *		c: 3
		 *	}
		 *
		 *	$cj.obj.list(obj);
		 *
		 *	would emit:
		 *	[
		 *		['a', 1],
		 *		['b', 2],
		 *		['c', 3],
		 *	]
		 * }}
		 */
		var 	tuple = [];
		
		for(var el in obj) {
			tuple.push([el, obj[el]]);
		}

		return tuple;
	},

	// make a list iterable
	fromList: function(list) {
		list = $cj.list.fromString(list);

		var 	len = list.length,
			map = {};
		
		for(var ix = 0; ix < len; ix++) {
			map[list[ix]] = true;
		}

		return map;
	},

	list: function(obj) {
		/* {{ 
		 * Description:
		 *	Creates a flattened, serialized array of an object
		 *
		 * Usage:
		 *	(list) $cj.obj.list(obj)
		 *
		 * Details:
		 *	obj (required): Object to process
		 *	list: Array of K/V tuples
		 *
		 * Example:
		 *	var obj = {
		 *		a: 1,
		 *		b: 2,
		 *		c: 3
		 *	}
		 *
		 *	$cj.obj.list(obj);
		 *
		 *	would emit:
		 *	['a', 1, 'b', 2, 'c', 3]
		 * }}
		 */
		var 	list = [];
		
		for(var el in obj) {
			list.push(el);
			list.push(obj[el]);
		}

		return list;
	}
};

$cj.ev = (function (nameIn) {
	/* Description:
	 *
	 * 	A generic namespace driven event model
	 *	This has some design differences over the
	 *	generic DOM event model that is wrapped by
	 *	Jquery and may be more suited for specific
	 *	purposes.
	 *
	 *	For one thing, using the DOM limits one
	 *	to the native DOM model of say, 
	 *
	 *	 * order of function calls 
	 *	 * calling convention
	 *	 * parameter passing
	 *	 * propogation models 
	 *	 * handling of return values
	 *	 * stack tracing and auditing of functions
	 *	 * customizing a context of an instantiation
	 *	 * setting prioritization and stack orders
	 *	 * avoiding event cycles
	 *	 * setting sentinals on number of times called
	 *	 * tracking instances and doing counters
	 *	 * generalizing a call 
	 *
	 *	For all those reasons and more, a custom event
	 *	model is needed.
	 *
	 * Usage:
	 * (string)  $cj.ev.getName() : get name of namespace
	 * (handle)  $cj.ev.createNS{str) : create a new namespace
	 *
	 * (handle)  $cj.ev.register(ev, func, [opts]) : register a func to be called when ev is fired
	 * 		opts:
	 * 			ref: reference handle for supression
	 * 			last[false]: make last
	 *
	 * (handle)  $cj.ev.registerNS(ns, ev, func) : register a func to be called when ev is fired in namespace ns
	 *
	 * (handle)  $cj.ev.runOnce(ev, func) : run a function for an event one time and deregister it immediately
	 *
	 * (void)    $cj.ev.deregister(handle) : remove the function from the callback
	 *
	 * (mixed)   $cj.ev.fire(ev, ops) : fire an event with a list of options for each function
	 * (mixed)   $cj.ev.fireNS(ev, ops) : fire an event in namespace NS with a list of options for each function
	 *
	 * (handle)  $cj.ev.disable(handle) : temporarily disable a function
	 * (void)    $cj.ev.enable(handle) : enable a previously disabled function
	 *
	 * Other:
	 * 	cb : cb object for debugging
	 * 	ns : namespace object for debugging
	 * 	dump : used in the debugger
	 *
	 * return $cj.ev.STOP to stop propagation
	 *
	 * Details:
	 * Example:
	 * TODO: 
	 * 	There needs to be more of an audit trail and record of what is going on here
	 * }}
	 */
	var 	cb = {},

		fList = {},
		fOnceList = {},

		// whether the event is already raised
		rChk = {},

		pub = {},

		// namespaces
		ns = {},
		name = nameIn || '',
		mycode = arguments.callee;

	// exposed for various parts of the system
	pub.cb = cb;
	pub.ns = ns;
	pub.fList = fList;

	// fairly implementation 
	// independent wrapper functions {
	pub.getName = function () {
		return name;
	}

	pub.createNS = function (name) {
		if(name) {
			ns[name] = mycode(name);
			return ns[name];
		} else {
			return mycode();
		}
	}

	pub.registerNS = function (name, ev, func, opts) {
		if(ns[name]) {
			ns[name].register(ev, func, opts);
		}
	}

	pub.runOnceNS = function (name, ev, func, opts) {
		if(ns[name]) {
			return ns[name].runOnce(ev, func, opts);
		}
	}

	pub.fireNS = function (name, ev, data) {
		if(ns[name]) {
			return ns[name].fire(ev, data);
		} 
	}
	// }


	// registering {
	pub.register = function (ev, func, opListIn) {
		var opList = opListIn || {};

		if(!cb.hasOwnProperty(ev)) {
			cb[ev] = [];
			rChk[ev] = false;
		}

		// save this function in the (ns) global list
		$cj.ev.fHandle++;
		fList[$cj.ev.fHandle] = func;

		// state that this function is mapped to the event specified
		$cj.ev.fMap[$cj.ev.fHandle] = [name, ev];

		// add the numeric reference to the 
		// function to the callback list
		if(opList.first) {
			cb[ev].unshift($cj.ev.fHandle);
		} else {
			cb[ev].push($cj.ev.fHandle);
		}

		// cross references for group deregistration
		if(opList.ref) {
			if(!$cj.ev.xRefMap.hasOwnProperty(opList.ref)) {
				$cj.ev.xRefMap[opList.ref] = {e: true, f: [$cj.ev.fHandle]};
			} else {
				$cj.ev.xRefMap[opList.ref].f.push($cj.ev.fHandle); 
			}
		}

		return $cj.ev.fHandle;
	}

	pub.runOnce = function (ev, func, opts) {
		// we actually register this as if it is recurring
		// and remember the handle
		var handle = pub.register(ev, func, opts);

		// now we remove it from the map and the list
		delete $cj.ev.fList[handle];
		delete $cj.ev.fMap[handle];

		// and add it to the one shot list
		fOnceList[handle] = func;

		return handle;
	}

	pub.disable = function (handle) {
		var ev,
		    ns,
		    my_cb,
		    offset;

		if(typeof handle != 'number') {
			if($cj.ev.xRefMap[handle] && $cj.ev.xRefMap[handle].e) {
				
				var tmp = $cj.ev.xRefMap[handle].f, 
				    len = tmp.length,
				    h;

				for(h = 0; h < len; h++) {
					arguments.callee(tmp[h]);
				}

				$cj.ev.xRefMap[handle].e = false;
			}
		} else {
			// get the event that the handle is associated with
			ns = $cj.ev.fMap[handle][0];
			ev = $cj.ev.fMap[handle][1];

			if(ns.length) {
				my_cb = $cj.ev.ns[ns].cb;
			} else {
				my_cb = cb;
			}
			// find the offset of the function in the event list
			offset = my_cb[ev].indexOf(handle);

			// remove the function from the event list
			my_cb[ev].splice(offset, 1);

			// return the function handle 
			return handle;
		}

		return false;
	}

	pub.enable = function (handle) {
		var ev,
		    ns,
		    my_cb;

		if(typeof handle != 'number') {
			if($cj.ev.xRefMap[handle] && !$cj.ev.xRefMap[handle].e) {

				var tmp = $cj.ev.xRefMap[handle].f, 
				    len = tmp.length,
				    h;

				for(h = 0; h < len; h++) {
					arguments.callee(tmp[h]);
				}

				$cj.ev.xRefMap[handle].e = true;
			}
		} else {
			// Get the event for this handle
			ns = $cj.ev.fMap[handle][0];
			ev = $cj.ev.fMap[handle][1];

			if(ns.length) {
				my_cb = $cj.ev.ns[ns].cb;
			} else {
				my_cb = cb;
			}

			// inject the function back in the list
			my_cb[ev].push(handle);
		}
	};

	pub.deregister = function (handle) {
		// disable the function to delete it from the event list
		pub.disable(handle);

		// remove the function from the map and list
		delete $cj.ev.fMap[handle];
		delete $cj.ev.fList[handle];
	}

	// }

	pub.fire = function (ev, data) {
		var 	ix, 
			handle,
			removeList = [],
			ret = [], 
			tmp;

		// make sure this event is register and not
		// currently being fired
		if(cb.hasOwnProperty(ev) && rChk[ev] == false) {
			rChk[ev] = true;

			for(ix = 0; ix < cb[ev].length; ix++) {
				// get the numeric handle reference
				// to the fList
				handle = cb[ev][ix];

				// see if this is a recurring function
				// or a one shot function

				// recurring
				if(fList.hasOwnProperty(handle)) {
					tmp = fList[handle](data);
				// one shot function
				} else if(fOnceList.hasOwnProperty(handle)) {
					tmp = fOnceList[handle](data);

					// We need to preserve the index of the cb array
					// throughout the execution.  If we splice it here
					// then this will drop a function.  So we need to
					// push the index on to a remove list
					removeList.push(ix);
					
					// we can still delete it from the onceList, despite this
					delete fOnceList[handle];
				} else {
					alert('error firing ' + handle);
				}

				if(tmp) {
					if(tmp == $cj.ev.STOP) {
						break;
					}

					ret = ret.concat(tmp);
				}
			}

			if(removeList.length) {
				while(removeList.length) {
					// we need to remove the one shot functions from
					// the callback list while preserving the index
					// offsets.  Since they were pushed on to the stack
					// numerically, then we can pop off the stack and
					// we'll get the indices to remove in a decreasing order

					cb[ev].splice(removeList.pop(), 1);
				}
				 
				if(cb[ev].length == 0) {
					delete cb[ev];
				}
			}

			rChk[ev] = false;
		}

		return ret;
	}

	pub.dump = function(args) {
		var 	ev,
			o = [],
			lns,
			tmp;

		function list(ns, name) {
			o.push(name + ':');

			for(ev in ns.cb) {
				o.push('[' + ns.cb[ev].join(',') + '] ' + ev);
			}
		}

		if(args) {
			if(args.search(':') > -1) {
				tmp = args.split(':');

				lns = tmp[0];
				ev = tmp[1];

				if(!(lns in ns)) {
					o.push('(0) ' + lns);
				} else {
					if(ev.length == 0) {
						list(ns[lns], lns);
					} else if(!(ev in ns[lns].cb)) {
						o.push('(0) ' + lns + ':' + ev);
					} else {
						for(tmp in ns[lns].cb[ev]) {
							o.push('(' + tmp + ') ' + ns[lns].fList[ns[lns].cb[ev][tmp]]);
						}
					}
				}
			} else {
				if(!(args in cb)) {
					o.push('(0) ' + args);
				}

				for(tmp in cb[args]) {
					o.push('(' + tmp + ':' + cb[args][tmp] + ') ' + fList[cb[args][tmp]]);
				}
			}
		} else { 
			list($cj.ev, "$cj.ev");

			for(ev in ns) {
				list(ns[ev], ev);
			} 
		}

		return  o.join('<br>');
	}
	    
	return pub;
})(null);
// the cross reference for enabling and disabling of functions is a global map
$cj.ev.xRefMap = {};

$cj.ev.STOP = Math.random();

// as is the function handle counter
$cj.ev.fHandle = 0;

// and the even cross reference, which stores the namespaces
$cj.ev.fMap = {};

$cj.extra = {
	postParams: function(obj) {
		/* {{ 
		 * Description:
		 *	Serialize an object
		 *
		 * Usage:
		 *
		 * Details:
		 *
		 * Example:
		 * 
		 * }}
		 */
		var 	ret = {}, 
			el;

		for(el in obj) {
			ret[el] = JSON.stringify(obj[el]);
		}

		return ret;
	},

	loadJson: function (file, cb) {
		/* {{ 
		 * Description:
		 *	Load a json object and apply it to self.
		 *
		 * Usage:
		 *	$cj.extra.loadJson(file, function)
		 *
		 * Details:
		 *	file (required): File to load, such as "{a:1,b:2}"
		 *	function (optional): A callback after the file is loaded
		 *
		 * Example:
		 * 
		 *
		 * }}
		 */
		$.get(file, function(f) {
			var ref = this.url.split('.')[0];

			try{
				eval("self." + ref + " = " + f);
			} catch (ex){
				alert([this.url, ex, f].join());
			}
			cb();
		}, 'text');
	},

	onEnter: function (sel, cb) {
		/* {{ 
		 * Description:
		 * 	Run a block of code when enter is pressed on a given element
		 *
		 * Usage:
		 * 	$cj.extra.onEnter(selector, function)
		 *
		 * Details:
		 * 	selector: Jquery selector
		 *	function: A callback to run when the enter button is presssed
		 *
		 * Example:
		 * 
		 * }}
		 */
		$(sel).keyup(function (e) {
			var kc;

			if (window.event) kc = window.event.keyCode;
			else kc = e.which;

			// enter is 13
			if (kc == 13) {
				cb.apply(this);
			}
		});
	},

	filler: function (sel) {
		/* {{ 
		 * Description:
		 *	Simple templating library
		 *
		 * Usage:
		 *	$cj.extra.filler(sel)
		 *
		 * Details:
		 *	sel: Jquery Selector
		 *
		 * Example:
		 * 	The template format here is ##(javascript statement)##
		 * 	Such as
		 *
		 * 	Hey, you are using ##navigator.userAgent## - how about that.
		 * 	
		 *	As a convention, leave the elements visibility:hidden until
		 *	you run this to avoid exposing the raw code.
		 * }}
		 */
		$(sel).each(function (f) {
			this.innerHTML = this.innerHTML.replace(/##(.*?)##/g, function (str, p1) {
				return eval(p1);
			});
			
			this.style.visibility = 'visible';
		});
	},

	bubbleattr: function(start, attr) {
		/* {{ 
		 * Description:
		 * 	Goes iteratively to parent nodes until the attr is defined
		 *
		 * Usage:
		 *
		 * Details:
		 *
		 * Example:
		 * 
		 * }}
		 */
		var val;
		
		do {
			val = start.getAttribute(attr);

			if(val !== null) {
				return val;
			}

		} while(start = start.parentNode);

		return null;
	},

	download: function(url){
		/* {{ 
		 * Description:
		 *	Opens a hidden iframe for a download dialog
		 *
		 * Usage:
		 *	$cj.extra.download(filename)
		 *
		 * Details:
		 *	filename (required): file to download
		 *
		 * Example:
		 * 	$cj.extra.download('http://example.com/reallycool.mp3');
		 * }}
		 */
		var 	iframe = $("<iframe style=visibility:hidden></iframe>")
				.appendTo(document.body)
				.attr('src', url);

		// remove after 5 seconds.  The download window should have already appeared
		// by then.  Otherwise we are in trouble.
		//
		// Also, this helps keep the dom clean
		setTimeout(function(){
			iframe.remove();
		}, 5000);
	},	

	reload: function(){
		/* {{ 
		 * Description:
		 *	Forces a reload of a page
		 *
		 * Usage:
		 *	$cj.extra.reload()
		 *
		 * Details:
		 *
		 * Example:
		 * 	Self-explanatory
		 * }}
		 */
		window.location = window.location.toString();
	},

	newTab: (function () {
		/* {{ 
		 * Description:
		 *	Opens a URL in a new tab, avoiding popup blockers
		 *
		 * Usage:
		 *	$cj.extra.newTab.setUrl(url, options)
		 *	$cj.extra.newTab.modify(options)
		 *	$cj.extra.newTab.magic(url)
		 *	$cj.extra.newTab.create()
		 *
		 * Details:
		 *	url (required): Location to go to
		 *	options (optional): K/V list of get parameters to use
		 *
		 * Example:
		 * 	$cj.extra.newTab.setUrl('http://google.com/search', {q: 'weather'});
		 *	$cj.extra.newTab.create();
		 *
		 * 	Or:
		 *
		 * 	$cj.extra.newTab.magic('http://google.com');
		 * }}
		 */
		var 	form, 
			input;

		function init() {
			if(!form) {
				form = $('<form id=CJnt target=_blank method=get></form>').appendTo(document.body);
			} 
		}

		function modify(o) {
			for(var k in o) {
				form.append('<input name="' + k + '" value="' + o[k] + '">');
			}
		}

		return {
			setUrl: function (url, o) {
				init();
				form.attr('action', url);

				if(o) {
					modify(o);	
				}
			},

			modify: modify,

			magic: function (urlIn) {
				var 	optList = urlIn.split(/[=?&]/g),
					url = optList.shift(),
					opts = {},
					len = optList.length;

				for(var ix = 0; ix < len; ix +=2 ) {
					opts[optList[ix]] = optList[ix + 1];
				}

				$cj.extra.newTab.setUrl(url, opts);

				setTimeout($cj.extra.newTab.create,1);
			},

			create: function () {
				document.getElementById('CJnt').submit();
			}
		}
	})()
};
