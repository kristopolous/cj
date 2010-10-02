/*
 * cj JavaScript Library
 *   http://github.com/kristopolous/cj
 *   
 *   Copyright 2010, Chris McKenzie
 *    Dual licensed under the MIT or GPL Version 2 licenses.
 */

var VARTABLE = {
	name: {},
	text: {}
},
    TYPE = {
	"INPUT": 1,
	"TEXTAREA": 2,
	"DATE": 3,
	"NUMBER": 4
};

String.prototype.trim = function() {
	return this.replace(/^\s*/g, "")
}
Number.prototype.padLeft = function(m){
	return (this + Math.pow(10, m)).toString().substr(1);
}

var $cj = {
	// in:
	// 	obj such as {
	// 		a: valA,
	// 		b: valB,
	// 		...
	// 		z: valz
	// 	}
	//
	// 	fieldList such as 
	// 		['a', 'b', 'c']
	// out:
	// 	{a:'valA', b:'valB', c:'valC'}
	//


	safeCall: function () {
		var cback = {};

		return function () {
			var args = Array.prototype.slice.call(arguments),
			    timeout = 10;

			if(args.length > 0) {
				if(cback[args[0]]) {
					return cback[args.shift()](args);
				} else {
					var ival = setInterval(function () {
						if(cback[args[0]]) {
							clearInterval(ival);
							return cback[args.shift()](args);
						} else {
							timeout--;

							if(timeout == 0) {
								alert('giving up');
								clearInterval(ival);
							}
						}
					}, 100);
				}
			}	

			return cback;
		}
	},


	postParams: function(obj) {
		var 	ret = {}, 
			el;

		for(el in obj) {
			ret[el] = JSON.stringify(obj[el]);
		}

		return ret;
	},

	lcaseSort: function (a, b) {
		return a.toLowerCase() > b.toLowerCase();
	},

	loadJson: function (file, cb) {
		busy.start();

		$.get(file, function(f) {
			busy.end();
			var ref = this.url.split('.')[0];

			try{
				eval("self." + ref + " = " + f);
				after.exec(this, ref);
			} catch (ex){
				alert([this.url, ex, f].join());
			}
			cb();
		}, 'text');
	},

	semaphore: (function(){
		var 	pub = {},
			semSet = {},
			semFunc = {},
			cbList = {};

		pub.$set = function(name) {
			var cbTmp, cb;
			if(cbList.hasOwnProperty(name)) {
				cbTmp = cbList[name];
				while(cb = cbTmp.shift()) {
					cb();
				}
			}

			semSet[name] = true;
		}

		pub.$waitOn = function(name, cb) {
			if(semSet[name]) {
				return cb();
			} else if(!cbList.hasOwnProperty(name)) {
				cbList[name] = [];
			}

			cbList[name].push(cb);

			// check to see if a helper function has
			// been registered for this name
			if(semFunc.hasOwnProperty(name)) {
				semFunc[name]();
			}
		}

		pub.$setFunction = function(name, cb) {
			semFunc[name] = cb;
		}

		return pub;
	})(),

	waitOn: function(toEval, cb) {
		var ival = setInterval(function(){
			var tmp;
			eval ('tmp = ' + toEval);

			if(typeof tmp !== 'undefined' && tmp != null) {
				clearInterval(ival);
				cb();
			}
		}, 100);
	},

	// return time in a format
	// fmt is of type
	// 	%[Y|M|N|D|W|H|h|m|s]
	// 		Y = year, such as 2010
	// 		N = Named month, such as Feb
	// 		M = month, such 02
	// 		W = Week day, such as Tue
	// 		D = Day, such as 24
	// 		H = hour base 12
	// 		h = hour
	// 		m = minute
	// 		s = second

	time: function (fmt) {
		var d = new Date(),
		    t = {
			Y: d.getFullYear(),
			M: (d.getMonth() + 1).padLeft(2),
			D: d.getDate().padLeft(2),
			H: ( ((d.getHours() + 1) % 12) - 1),
			h: d.getHours().padLeft(2),
			m: d.getMinutes().padLeft(2),
			s: d.getSeconds().padLeft(2)
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
	// goes to parent nodes until the attr is defined
	// 
	bubbleattr: function(start, attr) {
		var val;
		
		do{
			val = start.getAttribute(attr);
			if(val !== null) {
				return val;
			}
			start = start.parentNode;
		} while(start);

		return null;
	},

	dlHack: (function(){
		var 	iframe;

		function init(){
			if(!iframe) {
				iframe = $("<iframe style=visibility:hidden></iframe");
				iframe.appendTo(document.body);
			}
		}

		function ret(url) {
			init();
			iframe.attr('src', url);
		}

		return ret;
	})(),	

	reload: function(){
		window.location = window.location.toString();
	},

	newTab: (function () {
		var 	form, 
			input;

		function init() {
			if(!form) {
				form = $('<form id=newtab target=_blank method=get></form>');
				$(document.body).append(form);
			} 
		}

		function modify(o) {
			for(k in o) {
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
					ix = 0,
					url = optList.shift(),
					opts = {},
					len = optList.length;

				for(; ix < len; ix +=2 ) {
					opts[optList[ix]] = optList[ix + 1];
				}

				$lib.newTab.setUrl(url, opts);

				setTimeout(function () {
					$lib.newTab.create();
				},1);
			},

			create: function () {
				document.getElementById('newtab').submit();
			}
		}
	})(),



	filler: function () {
		$(".filler").each(function (f) {
			this.innerHTML = this.innerHTML.replace(/##(.*?)##/g, function (str, p1) {
				return eval(p1);
			});
			
			this.style.visibility = 'visible';
		});
	},

	onEnter: function (div, callback) {
		$(div).keyup(function (e) {
			var kc;

			if (window.event) kc = window.event.keyCode;
			else if (e) kc = e.which;
			else return true;

			if (kc == K.enter) {
				callback.apply(this);
			}

			return true;
		});
	},
	// takes a va_list and returns the first valid element
	valid: function () {
		var 	i, 
			args = Array.prototype.slice.call(arguments);

		for(i in args) {
			if( (typeof (args[i]) !== 'undefined') && (args[i] !== null) ) {
				return args[i];
			}	
		}

		return "";
	},


	callback: function() {
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
				while(ret_real(directive.pop(), func));
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

	loadLibEx: (function() {
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
	})(),

};

$cj.dom = function(o) {
	var pub = {
		$build: function (el, obj) {
			var 	ix, 
				len = obj.length, 
				cur, 
				ret;

			for(ix = 0; ix < len; ix++) {
				cur = obj[ix];

				if(cur.length > 2) {
					if(typeof cur[2] == 'string') {
						ret = pub.$ap(el, cur[0], cur[1], cur[2]);
						if(cur.length > 3) {
							// recurse for children
							// the FOURTH argument is the children
							pub.$build(ret, cur[3]);
						} 
					} else { // children
						ret = pub.$ap(el, cur[0], cur[1]);

						// recurse for children
						pub.$build(ret, cur[2]);
					}
				} else {
					pub.$ap(el, cur[0], cur[1]);
				}
			}
		},

		$root: function (type, name, html) {
			var tmp = document.createElement(type);

			if(name) {
				tmp.className = name;
				this[name] = tmp;
			}

			if(html) {
				tmp.innerHTML = html;
			}
		},

		// this doesn't do the class creation ... it just
		// creates the object
		$simple: function (el, type, name, html) {
			var tmp = el.appendChild(document.createElement(type));

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
							Gdb("build: " + name);
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
		$ap: function (el, type, name, html) {
			var 	tmp = el.appendChild(document.createElement(type)),
				scope;

			if(name) {
				// implicit scopes
				var nameList = name.split('.');

				// make the class name space separated for CSS ease
				tmp.className = nameList[nameList.length - 1];

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
							Gdb("build: " + name);
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

		$apTbl: function (el, tableName, nameList) {
			var 	tr = document.createElement('tr'),
				len = nameList.length;

			pub.$ap(el, 'table', tableName);

			for(var ix = 0; ix < len; ix++) {
				pub.$ap(tr, 'td', nameList[ix]);
			}

			pub[tableName].appendChild(tr);
		}
	}

	pub = $cj.obj.merge(o, pub);

	return pub;
};

$cj.html = {
	// this is similar to 
	// el.childNodes, but it takes care of the 
	// #text that comes up from whitespace.
	// It returns an array
	children: function(el) {
		var 	o = [], 
			tmp = el.firstChild;
	
		do {
			if(tmp.nodeName.charAt(0) != '#') {
				o.push(tmp);
			}
		} while(tmp = tmp.nextSibling);

		return o;
	},

	//
	// Goes into DOM and looks for objects with classnames in fieldList
	//
	grabValues: function(DOM, fieldList) {
		var data = {},
		    ix,
		    len = fieldList.length,
		    field;

		for(ix = 0; ix < len; ix++) {
			field = fieldList[ix];
			$("." + field, DOM).each(function(){
				var ret = [];

				switch(this.nodeName) {
					case "B":
						data[field] = $(this).html();
						break;

					case "INPUT":
						if(this.getAttribute('type') == 'checkbox') {
							if(this.checked) {
								data[field] = this.checked;
							}
						} else {
							data[field] = $(this).val();
						}

						break;

					case "TEXTAREA":
						data[field] = $(this).val();
						break;

					case "SELECT":
						var str = this.childNodes.item(this.selectedIndex + 1).innerHTML;

						if(str.charAt(0).match(/[0-9]/)) {
							data[field] = str;
						} else {
							data[field] = this.selectedIndex;
						}

						break;
						
					case "SPAN":
						$("input", this).each(function(){
							if(this.checked) {
								data[field] = this.value;
							}
						});	
						break;

					case "DIV":
						//
						// we need to take the expanded fields and then
						// collapse them again into the comma separated
						// list in order to do the post back
						//
						$("input", this).each(function(){
							ret.push('"' + this.value.replace(/\"/g, "\\\"") + '"');
						});

						data[field] = '[' + ret.join() + ']';

						break;
				}
			});
		}

		return data;
	},

	// input:
	//  ["term1", "term2", ... "termN"]
	// output:
	//  <input class="term1"></input>
	//  <input class="term2"></input>
	//  ...
	//  <input class="termN"></input>
	emitInput: function(termList) {
		var	ret = [],
			input,
			ix,
			text,
			term,
			type,
			varTable = VARTABLE.name,
			len = termList.length;

		for(ix = 0; ix < len; ix++) {
			term = termList[ix];
			try{
				type = varTable[term].type;
			} catch(ex) {
				alert(term + " is not defined! Please add this now!");
				$template.varNew(term);
			}
			text = '<span>' + varTable[term].text + '</span>';

			if(type == TYPE['INPUT']) {
				input = '<input type=text class="' + term + '"></input>';

			} else if(type == TYPE['TEXTAREA']) {
				input = '<textarea class="' + term + '"></textarea>';

			} else if(type == TYPE['DATE']) {
				input = '<input type=text class="' + term + ' date"></input>';

			} else if(type == TYPE['NUMBER']) {
				input = '<input type=text class="' + term + ' number"></input>';
			}

			ret.push(text + input);
		}

		return ret.join('<br>');
	},

	emitTuple: function(tuple, opts) {
		var 	ret = [],
			tmp,
			newlinecount,
			o,
			type,
			cb = [''],
			className,
			len = tuple.length,
			ix = 0;

		if(!opts) {
			for(;ix < len; ix++) {
				ret[ix] ='<td>' + tuple[ix][0] + '</td>' +
					'<td>' + tuple[ix][1] + '</td>';
			}
		} else {
			for(o in opts) {
				if(o.substr(0, 2) == 'on') {
					cb.push(o + '="' + opts[o] + '"');
				}
			}

			cb = cb.join(' ');

			// make it boxes that can be modified
			if(opts.editable) {
				for(;ix < len; ix++) {
					tmp = tuple[ix];
					className = tmp[0].toLowerCase();
					
					tmp[1] = tmp[1].replace(/<br>/g, '\n');

					newlinecount = tmp[1].split(/\n/).length;

					if(newlinecount > 1 || 
						(VARTABLE.name[className] && 
						 VARTABLE.name[className].type == TYPE.TEXTAREA) 
					){
						tmp[1] = '<textarea ' + [
								'class=' + className,
								cb,
								'rows=' + Math.min(15, newlinecount + 1)
							].join(' ') + '>' + 
							tmp[1] + '</textarea>';
					} else {
						// replace " with 0d34
						tmp[1] = [
							'<input',
								'type=text',
								'class=' + className,
								cb,
								'value="' + tmp[1].replace(/'"'/, '&#34;') + '"',
							'>'
						].join(' ');
					}

					ret[ix] = '<td>' + tmp[0] + '</td>' +
						  '<td>' + tmp[1] + '</td>';
				}
			}
		}

		return '<table><tr>' + ret.join('</tr><tr>') + '</tr></table>';
	}
};

// text library
$cj.txt = {
	// nice decoding thing that handles UTF8, \' and UTF16
	utf8: function (d) {
		if(!d) {
			return '';
		}

		d = d.replace(/\\u([0-9a-f]*)/g, '&#x$1;');
		return d.replace(/\\([\\'"])/g, '$1');
	},

	//
	// BUGBUG: 'proto://host.dom.tld/req.ext?search.' will make the link encapsulate the last dot
	// 	But wait there, speedy regexer, look at all the other dots.  Gotta be careful!
	//
	rich: function (f) {
		f = f ? f.replace ? f.replace(/[a-z]+:\/\/[^\s^<]+/g, '<a href="$&" target=_blank>$&</a>') : f : f;
		//f = f ? f.replace ? f.replace(/\ /g, '&nbsp;') : f : f;
		return f;
	},

	plain: function(f) {
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
	},

	plural: function (w) {
		if(w[w.length - 1] == 's') {
			return w + "'";
		} else {
			return w + "'s";
		}
	},

	postfix: function (n) {
		var table = [
			"st", 
			"nd", 
			"rd"];

		if(n > table.length) { 
			return n + 'th';
		} else {
			return n + table[n - 1];
		}
	},
};


// the global event model
// Lots of functionality was cut out (like the ability to deregister)
// in the interest of speed and simplicity -cjm 2009.10.14
// 
// (string)  .getName() : get name of namespace
// (handle)  .createNS{str) : create a new namespace
//
// (handle)  .register(ev, func, [opts]) : register a func to be called when ev is fired
// 		opts:
// 			ref: reference handle for supression
// 			last[false]: make last
//
// (handle)  .registerNS(ns, ev, func) : register a func to be called when ev is fired in namespace ns
//
// (handle)  .runOnce(ev, func) : run a function for an event one time and deregister it immediately
//
// (void)    .deregister(handle) : remove the function from the callback
//
// (mixed)   .fire(ev, ops) : fire an event with a list of options for each function
// (mixed)   .fireNS(ev, ops) : fire an event in namespace NS with a list of options for each function
//
// (handle)  .disable(handle) : temporarily disable a function
// (void)    .enable(handle) : enable a previously disabled function
//
// Other:
// 	cb : cb object for debugging
// 	ns : namespace object for debugging
// 	dump : used in the debugger
//
// return C.EV.STOP to stop propagation
//
// TODO: There needs to be more of an audit trail
//       and record of what is going on here
$cj.ev = (function (nameIn) {
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
		delete fList[handle];
		delete fMap[handle];

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

			if(offset == -1) {
				G.err('error disabling ' + handle);
				Gdb.stack();
			}

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
		delete fMap[handle];
		delete fList[handle];
	}

	// }

	pub.fire = function (ev, data) {
		var 	ix, 
			handle,
			removeList = [],
			ret = [], 
			tmp;

		name.length > 0 && Gdb(name,ev) || Gdb(ev);

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
					G.err('error firing ' + handle);
				}

				if(tmp) {
					if(tmp == C.EV.STOP) {
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

		return '<pre>' + o.join('<br>') + '</pre>';
	}
	    
	return pub;
})();
// the cross reference for enabling and disabling of functions is a global map
$cj.ev.xRefMap = {};

// as is the function handle counter
$cj.ev.fHandle = 0;

// and the even cross reference, which stores the namespaces
$cj.ev.fMap = {};

$cj.list = {
	obj: function(list) {
		var 	map = {},
			len = list.length;

		for(var ix; ix < len; ix+=2) {
			map[list[ix]] = list[ix + 1];
		}

		return map;
	}

	unique: function(list) {
		var	obj = {},
			len = list.length;

		for(var ix = 0; ix < len; ix++) {
			obj[list[ix]] = 0;
		}

		return $cj.obj.keys(obj);
	}
};

$cj.obj = {
	extract: function (obj, fieldList) {
		var 	field,
			ret = {},
			len = fieldList.length;
		
		for(var ix = 0; ix < len; ix++) {
			ret[fieldList[ix]] = obj[fieldList[ix]];
		}

		return ret;
	},

	keys: function (obj) {
		var	ret = [];
		
		for(var el in obj) {
			ret.push(el);
		}
			
		return ret;
	},

	values: function (obj) {
		var	ret = [];
		
		for(var el in obj) {
			ret.push(obj[el]);
		}
			
		return ret;
	},

	remove: function (obj, fieldList) {
		var 	field,
			ret = new Object(obj),
			len = fieldList.length;
		
		for(var ix = 0; ix < len; ix++) {
			field = fieldList[ix];

			try {
				delete ret[field];
			} catch(ex){}
		}

		return ret;
	},

	merge: function() {
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

	// Similar to the above routine but it
	// it returns a bool if it's changed
	changed: function(objNew, objOld) {
		for(var el in objNew) {
			if(!el in objOld || objNew[el] != objOld[el]) {
				return true;
			}
		}

		for(el in objOld) {
			if(!el in objNew) {
				return true;
			}
		}

		return false;
	},

	copy: function(to, from) {
		to = {};

		for(var el in from) {
			to[el] = from[el];
		}
	},

	list: function(obj) {
		var 	tuple = [],
			ix = 0;
		
		for(var el in obj) {
			tuple[ix] = [el, obj[el]];
			ix++;
		}

		return tuple;
	}
};
