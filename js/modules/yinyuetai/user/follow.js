/**
 * Created with IntelliJ IDEA.
 * User: Administrator
 * Date: 13-6-24
 * Time: 下午5:55
 * @fileoverview 关注与取消关注
 */
define(function(require, exports, module) {
	var user = require('user'),
			xhr = require('ajax');
	var alertify = require('alertify'), $doc = $(document);
	var init = function() {
		$doc.on('mouseenter', '.J_followed,.J_mutualFollowed',function() {
			$(this).html('取消关注');
		}).on('mouseleave', '.J_followed',function() {
					$(this).html('已关注');
				}).on('mouseleave', '.J_mutualFollowed', function() {
					$(this).html('互相关注');
				});
	};
	init();
	return {
		bind : function() {
			var context = this;
			$doc.on('click', '.J_follow',function(e) {
				var $target = $(e.currentTarget);
				var userId = $target.data('userId');
				context.follow(userId, undefined, function(action) {
					$target.removeClass('ico_card_follow J_follow').addClass('ico_card_has J_followed');
					$target.html('已关注');
				});
			}).on('click', '.J_followed,.J_mutualFollowed', function(e) {
						var $target = $(e.currentTarget);
						var userId = $target.data('userId');
						context.removeFollow(userId, undefined, function(action) {
							$target.removeClass('ico_card_has J_followed').addClass('ico_card_follow J_follow');
							$target.html('加关注');
						});
					})
		},
		follow : function(userId, callback, always) {
			user.login(function() {
				xhr.post(Y.domains.homeSite + "/follow/follow", {friendId : userId},
						function(action) {
							if (action.error) {
								alertify.error(action.message);
							} else {
								if (callback) {
									callback(userId, action.isFriend);
								}
							}
							always && always(action);
						});
			});
		},
		removeFollow : function(userId, callback, always) {
			user.login(function() {
				xhr.post(Y.domains.homeSite + "/follow/remove-follow", {friendId : userId}, function(action) {
					if (action.error) {
						alertify.error(action.message);
					} else {
						if (callback) {
							callback(userId);
						}
					}
					always && always(action);
				});
			});
		}
	}
});