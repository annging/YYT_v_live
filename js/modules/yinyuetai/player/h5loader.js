define(function(require, exports, module) {
	var H5stats = require('modules/yinyuetai/player/h5stats'),
			pwdencrypt = require('pwdencrypt'),
			XHR = require('ajax');

	return {
		loadVideo : function(elementId, options) {
			options = $.extend(true, {
				properties : {
					id : 'yinyuetaiplayer',
					name : 'yinyuetaiplayer',
					width : '100%',
					height : '100%'
				},
				vars : {
					videoId : 0,
					playlistId : 0
				},
				callback : false
			}, options);

			var properties = options.properties, vars = options.vars, callback = options.callback;

			var build = '<video ' + (options.autostart ? 'autoplay' : '') + 'preload controls x-webkit-airplay="allow"', $container = $('#' + elementId);
			for (var property in properties) {
				build += " " + property + '="' + properties[property] + '"';
			}
			build += '></video>';//todo 保证video存在，避免其他已经在用的地方出错
			$container.html(build);
			var $videoplayer = $container.find('video'), videoplayer = $videoplayer[0], context = this;
			var v = "html5", videoId = vars.videoId, t = +new Date;
			var sc = pwdencrypt(videoId + "-" + t + "-" + v);
			var url = "http://www.yinyuetai.com/api/info/get-video-urls?json=true&videoId=" + videoId + "&t=" + t + "&v=" + v + "&sc=" + sc;
			XHR.getJSON(url, '', function(result) {
				if (!result.error && result.hcVideoUrl) {
					build += ' src="' + result.hcVideoUrl + '">' + '</video>';
					$videoplayer.html('<source src="' + result.hcVideoUrl + '" type="video/mp4"/>').attr('src', result.hcVideoUrl);
					videoplayer.load();
                    if(options.autostart){
                        videoplayer.play();
                    }
					context.statisticsHtml5(videoplayer, {
						vid : options.vars['videoId'],
						vurl : result['hcVideoUrl'],
						ctype : options.device,
						rd : options.vars['refererdomain']
					});
				} else {//版权限制
					$videoplayer.hide();
					$("<div style='width:100%;height:100%;font-size:14px;color: #ccc;text-align: center;line-height: 200px'>" +
							result.message + "（</div>").appendTo($container);
				}
				callback && callback($videoplayer, result);
			});
			return videoplayer;
		},
		statisticsHtml5 : function(video, opts) {
			H5stats.init(video, opts);
		}
	}
});
