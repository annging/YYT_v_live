/**
 * Created with IntelliJ IDEA.
 * User: zhangyan
 * Date: 13-7-2
 * Time: 上午10:19
 * @fileoverview 加载播放器
 */
define(function(require, exports, module) {
	var prober = require('prober'),
			flashloader = require('modules/yinyuetai/player/flashloader'),
			h5loader = require('modules/yinyuetai/player/h5loader'),
			H5player = require('modules/yinyuetai/player/h5player');

	var supportVideoDevices = ['wp', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'playstation'],
			supportH5PlayerDevices = ['ipad', 'wp', 'blackberry', 'playstation'];

	var supportVideo = $.inArray(prober.device.name, supportVideoDevices) !== -1,
			supportH5Player = $.inArray(prober.device.name, supportH5PlayerDevices) !== -1,
			supportP2P = !supportVideo && prober.device.name != 'mac';

	var getReferrer = function() {
		if(location.host && location.host.indexOf("yinyuetai.com")>=0){
			return "yinyuetai.com";
		}
		var referrer = document.referrer || "yinyuetai.com";
		var p = referrer.indexOf("/", 9);
		if (p > 0) {
			referrer = referrer.substring(0, p);
		}
		p = referrer.indexOf(":");
		if (p > 0) {
			referrer = referrer.substring(p + 3);
		}
		return referrer;
	};

	return {
		load : function(elementId, options) {
			options = $.extend(true, {
				vars : {
					refererdomain : getReferrer(),
					domain:"yinyuetai.com"
				}
			}, options);
			if (supportVideo) {
				if (!options.vars || !options.vars.videoId || Y.isLoadByPartner) {
					return;
				}
				var type = 'h5video';
				if (supportH5Player) {
					options = $.extend(true, {
						callback : function(video, result) {
							if (!result.error) {
								new H5player($('#' + elementId), $.extend(true, options['vars'], result));
							}
						}
					}, options);
					type = 'h5player';
				}
				var video = h5loader.loadVideo(elementId, $.extend(true, options, {device : prober.device.name}));
				return {
					element : video,
					type : type
				}
			} else {
				if (Y.isLoadByPartner) {
					return;
				}
				var flashCode = flashloader.render(elementId, options);
				var flashapi = require('modules/yinyuetai/player/flashapi');
				if (false) {
					require(['modules/yinyuetai/player/p2p']);
				}
				return {
					element : $('#' + elementId).children()[0],
					type : 'flash',
					flashapi : flashapi,
					flashCode : flashCode
				};
			}
		}
	};
});
