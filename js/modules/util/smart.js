//Deprecated
define(function(require, exports, module) {
	var smart = {};
	smart.events = function() {
		this.listeners = {};
	}
	smart.events.prototype = {
		on : function(event, listener) {
			var listeners = this.listeners[event], len;
			if (!listeners) {
				listeners = this.listeners[event] = [];
			}
			len = listeners.length
			if (len > 0) {
				for (var i = 0; i < len; i++) {
					if (listeners[i].callback == listener) {
						return this;
					}
				}
			}
			listeners.push({callback : listener});
			return this;
		},
		trigger : function(event) {
			var listeners = this.listeners[event], len = listeners && listeners.length;
			if (len > 0) {
				for (var i = 0; i < len; i++) {
					listeners[i].callback.apply(this, Array.prototype.slice.call(arguments, 1));
					if (listeners[i].once) {
						listeners.splice(i, 1);
						i--;
						len--;
					}
				}
			}
			return this;
		},
		once : function(event, listener) {
			var listeners = this.listeners[event], len;
			if (!listeners) {
				listeners = this.listeners[event] = [];
			}
			len = listeners.length
			if (len > 0) {
				for (var i = 0; i < len; i++) {
					if (listeners[i].callback == listener) {
						return this;
					}
				}
			}
			listeners.push({
				callback : listener,
				once : true
			});
			return this;
		},
		off : function(event, listner) {
			if (listner) {
				var listeners = this.listeners[event], len = listeners.length;
				if (len > 0) {
					for (var i = 0; i < len; i++) {
						if (listeners[i].callback == listner) {
							listeners.splice(i, 1);
							return this;
						}
					}
				}
			} else {
				this.listeners[event] = [];
			}
			return this;
		},
		constructor : smart.events
	}

	smart.inherits = function(Sub, Base) {
		Sub.prototype = new Base;
	}

	smart.ViewHandler = function(options) {
		$.extend(this, options);
		this.$el = this.el ? $(this.el) : $('body');
		this.el = this.$el[0];
		var self = this;

		var events = this.events;
		if (events) {
			for (var p in events) {
				if (events.hasOwnProperty(p)) {
					var i = p.indexOf(' ');
					(function(p) {
						self.$el.on(p.substring(0, i), p.substring(i + 1), function(e) {
							self[events[p]].call(self, e)
						});
					})(p)
				}
			}
		}
		this.initialize && this.initialize();

	};
	smart.inherits(smart.ViewHandler, smart.events);

	smart.getLength = function(str) {
		var result = 0;
		var length = str.length;
		while (length--) {
			if (/^[\u0000-\u00ff]$/.test(str.charAt(length))) {
				result += 1;
			} else {
				result += 2;
			}
		}
		return result;
	}

	module.exports = smart;
});