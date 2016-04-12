define(function(require, exports, module) {
	var noFlashHtml = "<p style='line-height:500px;text-align: center'>您的浏览器不支持Flash,<a style='font-size: 18px;' href='http://get.adobe.com/cn/flashplayer/' target='_target'>立即下载</a></p>";

	var isIE = navigator.userAgent.indexOf("MSIE") !== -1;

	return {
		render : function(elementId, options) {
			options = $.extend(true, {
				swfUrl : '',
				properties : {
					id : 'yinyuetaiplayer',
					width : '100%',
					height : '100%'
				},
				vars : {
					local : true,
					amovid : '5f4ffbc12418024',
					refererdomain : ''
				},
				params : {
					wmode : 'window',
					quality : "high",
					allowScriptAccess : "always",
					allowFullScreen : 'true',
					menu : 'false',
					loop : 'true',
					bgcolor : '#000000'
				}
			}, options);
			var params = options.params,
					flashvars = $.param(options.vars),
					properties = options.properties;
			var flashCode = '';
			if (isIE) {
				flashCode = '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" ' +
						'codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=10,0,0,0" ' +
						'type="application/x-shockwave-flash"' +
						'width="' + properties.width + '" height="' + properties.height + '" id="' + properties.id + '" name="' +
						properties.id + '">' +
						'<param name="allowScriptAccess" value="always" />' +
						'<param name="allowFullScreen" value="true" />' +
						'<param name="movie" value="' + options.swfUrl + '" />' +
						'<param name="wmode" value="' + (params.IEwmode || params.wmode) + '" />' +
						'<param name="quality" value="high" />' +
						'<param name="bgcolor" value=' + params.bgcolor + ' />' +
						'<param name="flashvars" value="' + flashvars + '" />' +
						'</object>';
			} else {
				flashCode =
						'<embed pluginspage="http://www.macromedia.com/go/getflashplayer" type="application/x-shockwave-flash" width="' +
								properties.width + '" height="' + properties.height + '" flashvars="' + flashvars +
								'" bgcolor="' + params.bgcolor + '" allowfullscreen="true" allowscriptaccess="always" wmode="' +
								params.wmode + '" id="' +
								properties.id + '" name="' + properties.id + '" src="' + options.swfUrl + '" />';
			}

			if (elementId) {
				$('#' + elementId).html(flashCode);
			}

			return flashCode;
		}
	}
});
