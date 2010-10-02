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
	objExtract: function (obj, fieldList) {
		var 	ix,
			field,
			ret = {},
			len = fieldList.length;
		
		for(ix = 0; ix < len; ix++) {
			ret[fieldList[ix]] = obj[fieldList[ix]];
		}

		return ret;
	},

	arrayUnique: function(list) {
		var	ix,
			obj = {},
			len = list.length;

		for(ix = 0; ix < len; ix++) {
			obj[list[ix]] = 0;
		}

		return $lib.objKeys(obj);
	},

	objKeys: function (obj) {
		var	ret = [],
			el;
		
		for(el in obj) {
			ret.push(el);
		}
			
		return ret;
	},

	objValues: function (obj) {
		var	ret = [],
			el;
		
		for(el in obj) {
			ret.push(obj[el]);
		}
			
		return ret;
	},


	objRemove: function (obj, fieldList) {
		var 	ix,
			field,
			ret = new Object(obj),
			len = fieldList.length;
		
		for(ix = 0; ix < len; ix++) {
			field = fieldList[ix];

			try{
				delete ret[field];
			} catch(ex){}
		}

		return ret;
	},

	objMerge: function() {
		var 	args = Array.prototype.slice.call(arguments),
			ret = args.shift(),
			len = args.length,
			tmp,
			el,
			ix;

		for(ix = 0; ix < len; ix++) {
			tmp = args[ix];

			for(el in tmp) {
				ret[el] = tmp[el];
			}
		}

		return ret;
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

	toggle: function(el){
		if(el.checked) {
			$("#" + el.className).css('display','block');
		} else {
			$("#" + el.className).css('display','none');
		}
	},

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

	obj2tuple: function(obj) {
		var 	tuple = [],
			ix = 0,
			el;
		
		for(el in obj) {
			tuple[ix] = [el, obj[el]];
			ix++;
		}

		return tuple;
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
	},

	plainText: function(f) {
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

	// a generic callback stack framework
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
			if(typeof directive == 'string') {
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

	GezObj: function(o) {
		var pub = {
			$build: function(el, obj) {
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

			// create a root node of type type
			$root: function(type, name, html) {
				var tmp = document.createElement(type);

				if(name) {
					tmp.className = name;
					this[name] = tmp;
				}

				if(html) {
					tmp.innerHTML = html;
				}

				return tmp;
			},
			// this doesn't do the class creation ... it just
			// creates the object
			$simple: function(el, type, name, html) {
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
								alert("You fucking blew it with " + name);
							}

							scope[name] = tmp;
						} 

						break;
					}
				}

				if(html) {
					tmp.innerHTML = html;
				}
			},

			// this supports scopes...
			$ap: function(el, type, name, html) {
				var 	tmp = el.appendChild(document.createElement(type)),
					scope;

				if(name) {
					// implicit scopes
					var nameList = name.split('.');

					// make the class name space separated for CSS ease
					tmp.className = nameList.join(' ');

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
								alert("You fucking blew it with " + name);
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

			$apTbl: function(el, tableName, nameList) {
				var 	ix = 0,
					tr = document.createElement('tr'),
					len = nameList.length;

				pub.$ap(el, 'table', tableName);

				for(; ix < len; ix++) {
					pub.$ap(tr, 'td', nameList[ix]);
				}

				pub[tableName].appendChild(tr);
			}
		}

		if(o) {
			pub = $lib.objMerge(pub, o);
		}

		return pub;
	}
};
