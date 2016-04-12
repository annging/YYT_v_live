define(function(require, exports, module) {
	var user = require('user'),
			xhr = require('ajax');
	var alertify = require('alertify');

	return {
		joinFan : function(fanId, callback) {
			user.login(function() {
				xhr.post(Y.domains.fanSite + "/join-fan-club", {fanId : fanId},
						function(action) {
							if (action.error) {
								alertify.error(action.message);
							} else {
								if (callback) {
									callback(action);
								} else {
									alertify.success('加入饭团成功!');
								}
							}
						});
			});
		},
		quitFan : function(fanId, callback) {
			user.login(function() {
				xhr.post(Y.domains.fanSite + "/quit-fan-club", {fanId : fanId}, function(action) {
					if (action.error) {
						alertify.error(action.message);
					} else {
						if (callback) {
							callback(action);
						} else {
							alertify.success('退出饭团成功!');
						}
					}
				});
			});
		}
	}
});