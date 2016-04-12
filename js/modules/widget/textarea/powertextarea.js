define(function(require, exports, module) {
	var util = require('modules/util/str');
	var At = require('modules/widget/textarea/at');
	var PowerTextarea = function(element, options) {
		var $el = this.$el = $(element);
		this.reset = function() {
			if (options.count) {
				cutValue($el);
			}
		}
		if (options.count) {
			var countBox = $(options.count.countBox), max = options.count.max, type = options.count.type, min = options.count.min;
		}
		var required = options.required;
		if (!min && required) {
			min = 1;
		}
		if (options.button) {
			var enableClass = options.button.enableClass, disableClass = options.button.disableClass,
					button = options.button.element;
		}
//		if (options.resize) {
//			var container = $el.getParent(), resize = options.resize;
//			resize.lineHeight = resize.lineHeight || parseInt($el.getStyle('line-height'));
//			var contentDiv = container.getElement('[name=contentDiv]');
//			if (!contentDiv) {
//				contentDiv = new Element('div', {
//							'name' : 'contentDiv',
//							'class' : 'dynamicDiv',
//							'styles' : {
//								'width' : $el.getStyle('width')
//							}
//						}
//				).inject(container);
//			}
//		}
		if (options.at) {
			this.at = new At($el);
		}
		var timer;
		$el.focus(function() {
			timer = setInterval(function() {
				if (options.count) {
					cutValue($el);
				}
//				if (options.resize) {
//					dynamicTextareaHeight($el, contentDiv, resize.lineHeight, resize.minHeight, resize.maxHeight);
//				}
				if (options.callback) {
					options.callback($el);
				}
			}, 250)
		}).blur(function() {
			clearInterval(timer);
		}).click(function(e) {
			e.stopPropagation();
		});
		//初始化执行一次
		if (options.count) {
			cutValue($el);
		}
		function cutValue($el) {
			var val = $el.val();
			if (!(options.trim === false)) {
				val = $.trim(val);
			}
			var tmpVal = val.replace(/[\u4E00-\u9FFF\u3002\uff1b\uff0c\uff1a\u201c\u201d\uff08\uff09\u3001\uff1f\u300a\u300b]/g, ',,');
			var currentLength = util.getLength(val);
			var len = Math.ceil(currentLength / 2);
			if (len > max) {
				tmpVal = tmpVal.substring(0, max * 2);
				tmpVal = tmpVal.replace(/,,/g, ';');
				$el.value = val.substring(0, tmpVal.length);
				//return;
			}
			if (countBox) {
				var count = Math.ceil(currentLength / 2);
				if (type == 'showLeftCount') {
					if (max * 2 - currentLength >= 0) {
						countBox.html("还可以输入<strong>" + (max - count) + '</strong>字');
					} else {
						countBox.html("已经超过<strong class='c_c00'>" + (count - max) + '</strong>字');
					}
				}
				else {
					countBox.html(count);
				}
				if (button && enableClass && disableClass) {
					if ((min && count < min) || (max && count > max)) {
						button.removeClass(enableClass).addClass(disableClass);
					}
					else {
						button.removeClass(disableClass).addClass(enableClass);
					}
				}
			}
		}
	}
	module.exports = PowerTextarea;
})