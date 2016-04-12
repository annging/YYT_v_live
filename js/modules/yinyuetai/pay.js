define(function(require, exports, module) {
	var Dialog = require('dialog');
	var frameCommonAttr = ' scrolling="no" frameborder="0" ';

	function extractUrlParameters(param) {
		var param = param || {},
			result = [];

		_.each(param, function(value, name) {
			result.push(name+"="+encodeURIComponent(value));
		});

		return result.length ? "?"+result.join("&") : "";
	}

	module.exports = {
		payVip: function(config) {
			var config = config || {};
			var iframe = $('<iframe src="http://pay.yinyuetai.com/virtual/vip'+extractUrlParameters(config.urlParameters)+'" width="700" height="550" '+frameCommonAttr+'></iframe>');
			new Dialog(iframe, {
				width : 700,
				height : 550,
				onHide: function() {
					config.hide && config.hide();
				}
			});
		},
		payFanpiao: function(config) {
			var config = config || {};
			var iframe = $('<iframe src="http://pay.yinyuetai.com/virtual/fanpiao'+extractUrlParameters(config.urlParameters)+'" width="640" height="503" '+frameCommonAttr+'></iframe>');
			new Dialog(iframe, {
				width : 640,
				height : 503,
				onHide: function() {
					config.hide && config.hide();
				}
			});
		},
		payAwardVip : function(config){
			var config = config || {};
			var iframe = $('<iframe src="http://pay.yinyuetai.com/virtual/award-vip'+extractUrlParameters(config.urlParameters)+'" width="700" height="550" '+frameCommonAttr+'></iframe>');
			new Dialog(iframe, {
				width : 700,
				height : 550,
				onHide: function() {
					config.hide && config.hide();
				}
			});
		},
		tianYiVip : function(config){
			var config = config || {};
			var iframe = $('<iframe src="http://pay.yinyuetai.com/virtual/tianyivip'+extractUrlParameters(config.urlParameters)+'" width="700" height="550" '+frameCommonAttr+'></iframe>');
			new Dialog(iframe, {
				width : 700,
				height : 550,
				onHide: function() {
					config.hide && config.hide();
				}
			});
		}
	};
})