define(function(require) {
	var Mask, style, doc, isIE6;

	doc = $(document);
	isIE6 = navigator.userAgent.indexOf("MSIE 6.0") !== -1;

	style = {
		'position' : isIE6 ? 'absolute' : 'fixed',
		'top' : 0,
		'left' : 0,
		'width' : '100%',
		'height' : isIE6 ? doc.outerHeight(true) : '100%',
		'display' : 'none',
		'z-index' : 998,
		'opacity' : 0.2,
		'background-color' : 'black'
	};

	Mask = Backbone.View.extend({
		initialize : function() {
			this.element = $('<iframe/>').attr({
				'frameborder' : 0,
				'scrolling' : 'no'
			}).css(style).appendTo(document.body);
		},
		show : function() {
			this.element.fadeIn();
		},
		hide : function() {
			this.element.fadeOut();
		}
	});

	return new Mask();
});