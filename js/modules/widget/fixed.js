define(function(require, exports) {

	var ua = (window.navigator.userAgent || "").toLowerCase(),
		isIE6 = ua.indexOf("msie 6") !== -1;

	function Fiexed(element, options) {
		this.element = $("<div></div>");
	}

	exports.appendFixedElement = function(element, options) {

	};

});