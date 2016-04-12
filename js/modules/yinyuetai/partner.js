define(function(require, exports, module) {
	var XHR = require('ajax');

	var iframes = {}, $box;
	return {
		getCode : function(placeIds, callback, videoId) {
			if (typeof placeIds == 'string') {
				placeIds = [placeIds];
			}
			var json = {
				placeIds : placeIds.join(',')
			}

			if(videoId){
				json.videoId = videoId;
			}

			XHR.ajax({
				type : 'get',
				url : Y.domains.mainSite + '/partner/get-partner-code',
				data : json,
				success : function(data) {
					if (data && !data.error) {
						if (callback) {
							callback(data);
						} else {
							placeIds.each(function(item) {
								var con = data[item];
								if (con) {
									$('#' + item).html(con);
								}
							})
						}
					}
				}
			});
		},
		loadIframe : function(url, delay, random) {
			if (!random) {
				return;
			}
			random = Math.ceil(Math.random() * random);
			var self = this;

			if (random == 1) {
				if (!$box) {
					$box = $('<div></div>').css({
						'width' : 1,
						'height' : 1,
						'overflow' : 'hidden',
						'position' : 'absolute',
						'top' : '-10000px',
						'left' : '-10000px'
					}).appendTo(document.body);
				}
				setTimeout(function() {
					if (iframes[url] && iframes[url].length) {
						iframes[url].remove();
						iframes[url] = undefined;
					}
					iframes[url] = $('<iframe src="' + url + '"/>').css({'width' : 1,
						'height' : 1, 'overflow' : 'hidden'}).appendTo($box);
				}, delay * 10000);
			}
		},
		videoPagePartner : function(videoId) {
			var context = this;
			var special;

			if (window.top === window.self && document.domain != 'beta.yinyuetai.com') {
				var Ids = 'modulus';

				if(document.domain == 'v.yinyuetai.com'){
					Ids = 'modulus_play';
				}

				if(location.href.indexOf('http://v.yinyuetai.com/video/rec') !== -1){
					special = true;
					Ids = 'rec_modulus';
				}

				context.getCode(Ids, function(data) {
					data = data['modulus'] || data['modulus_play'] || data['rec_modulus'];

					if (data) {
						//data['modulus'] ='[{"page" : "http://mv.yinyuetai.com","rand" : 2},{"page" : "http://pl.yinyuetai.com","rand" : 1}]';
						if(special){
							try {
								var contents = $.parseJSON(data);
								$.each(contents, function(index, item) {
									context.loadIframe(item.page, 0, 1);
								});
							} catch (e) {}
						}else{
							try {
								var contents = $.parseJSON(data);
								var runTime = 0;
								var randTimeFun = function() {
									runTime++;
									$.each(contents, function(index, item) {
										context.loadIframe(item.page, index + 1, item.rand);
									});
								};
								randTimeFun();
							} catch (e) {}
						}
					}
				}, videoId);
			}
		}
	}
});