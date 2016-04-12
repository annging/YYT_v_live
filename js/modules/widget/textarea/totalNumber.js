define(function() {
	var Class;

	Class = Backbone.View.extend({
		options : {
			number : 200,
			tip : null,
			tipText : '您还可以输入<span class="number">{num}</span>字',
			errorText : '已经超出<span class="number">{num}</span>字',
			success : function() {},
			error : function() {}
		},
		_emit : function() {
			var self, element, number, tipText, tip, errorText, success, error;

			self = this;
			element = this.$el;
			tip = this.options.tip;
			number = this.options.number;
			tipText = this.options.tipText;
			errorText = this.options.errorText;
			success = this.options.success;
			error = this.options.error;

			this.Timer = setInterval(function() {
				self.num = checkNumber($.trim(element.val()));
				if (self.num > number) {
					tip.html(errorText.replace('{num}', self.num - number)).css('color', '#c00');
					error();
				} else {
					tip.html(tipText.replace('{num}', number - self.num)).css('color', '#999');
					success();
				}
			}, 400);
		},
		start : function() {
			this._emit();
		},
		stop : function() {
			clearInterval(this.Timer);
		}
	});

	function checkNumber(str) {
		var s = 0;
		for (var i = 0; i < str.length; i++) {
			if (str.charAt(i).match(/[\u0391-\uFFE5]/)) {
				s += 2;
			} else {
				s++;
			}
		}
		return parseInt(s / 2);
	}

	function checkTextNumber(element, options) {
		options = options || {};
		options.el = element;
		return new Class(options);
	}

	return checkTextNumber;
});