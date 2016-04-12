define(function(require, exports, module) {
	var user = require('user');
	var binded = false;
	var writingAuthCode = function(inputSelector, getContainer) {
		user.logined(function() {
			bind(inputSelector, getContainer);
		});
	};
	var bind = function(inputSelector, getContainer) {
		if (!binded) {
			user.getUserInfo('isUseWritingAuthCode', function(isUseWritingAuthCode) {
				if (isUseWritingAuthCode) {
					$(document.body).on('focus', inputSelector, function(e) {
						renderAuthCode($(e.currentTarget), getContainer);
					})
				}
			})
			binded = true;
		}
	}
	var renderAuthCode = function($target, getContainer) {
		var html = [
			'验证码：',
			'<input type="text" class="com_text" value="" name="vercode"/>',
			'<a href="javascript:;">',
			'<img class="authCode" width="70" height="24" src="' + Y.domains.commentSite + '/writing/auth-code-image?t=' +
					new Date().getTime(),
			'" alt="验证码" onclick="$(\'.authCode\').attr(\'src\', Y.domains.commentSite + \'/writing/auth-code-image?\' + new Date().getTime());"/></a>'
		].join('');
		var container = getContainer($target);
		if (!container || container.find('[name=vercode]').length > 0) {
			return;
		}
		container.html(html);
	}

	exports.init = writingAuthCode;
	exports.render = renderAuthCode;
})