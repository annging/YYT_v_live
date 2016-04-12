/**
 hash.add(params)
 Add parameter to hash

 hash.add({ foo: "bar" });               // http://url.com#foo=bar
 hash.add({ car: "dar", sar: "par" });   // http://url.com#foo=bar&car=dar&sar=par
 hash.get(param) or hash.get()
 Returns value of paramter in hash. If param is undefined then all values are returned.

 var fooValue = hash.get('foo');         // fooValue == "bar"
 var allValues = hash.get();             // allValues == { foo: "bar", car: "dar", sar: "par"}
 hash.remove(param)
 Removes the value with name param.

 hash.remove('foo');                     // http://url.com#car=dar&sar=par
 hash.clear()
 Clears entire hash.

 hash.clear();                           // http://url.com#
 */
define(function(require, exports, module) {
	"use strict";
	var hash = (function() {

		var fromHash = function() {
			var params = window.location.hash ? window.location.hash.substr(1).split("&") : [],
					paramsObject = {};

			for (var i = 0; i < params.length; i++) {
				var a = params[i].split("=");
				paramsObject[a[0]] = decodeURIComponent(a[1]);
			}
			return paramsObject;
		};
		var toHash = function(params) {
			var str = [];
			for (var p in params) {
				str.push(p + "=" + encodeURIComponent(params[p]));
			}
			window.location.hash = str.join("&");
		};
		return {
			get : function(param) {
				var params = fromHash();
				if (param) {
					return params[param];
				} else {
					return params;
				}
			},
			set : function(param) {
				this.add(param);
			},
			add : function(newParams) {
				var params = fromHash();
				for (var p in newParams) {
					params[p] = newParams[p];
				}
				toHash(params);
			},
			remove : function(removeParams) {
				removeParams = (typeof(removeParams) == 'string') ? [removeParams] : removeParams;
				var params = fromHash();
				for (var i = 0; i < removeParams.length; i++) {
					delete params[removeParams[i]];
				}
				toHash(params);
			},
			clear : function() {
				toHash({});
			}
		};
	})();

	module.exports = hash;
});