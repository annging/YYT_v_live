define(function(require, exports, module) {
	var CHECK_VIP_SERVICE = "http://vip.yinyuetai.com/vip/check-vip";
	var Cookie, User, Yajax;

	Cookie = require('cookie');
	Yajax = require('ajax');

	User = Backbone.Model.extend({
		defaults : {
			userName : '',
			userId : 0 ,
			headImg : ''
		},
		isLogined : function() {
			return parseInt(this.get('userId')) ? true : false;
		},
		onLogin : function(callback) {
			this.on('logined', callback);
		},
		logined : function(callback) {
			if (this.isLogined()) {
				callback();
			} else {
				this.on('logined', callback);
			}
		},
		login : function(callback, onCancel) {
			var self = this;

			if (this.isLogined()) {
				callback();
			} else {
				this.on('login', callback);
				require(['loginBox'], function(loginBox) {
					loginBox.trigger('show');
					loginBox.once('hide', function() {
						self.off('login');
						onCancel && onCancel();
					});
				});
			}
		},
		emit : function() {
			var token, u_inf;

			token = Cookie.get('token');
			u_inf = Cookie.get('u_inf');

			if (token != null) {
				if (u_inf != null && u_inf.length > 0) {
					readUserInfoForCookie(u_inf);
				} else {
					readUserInfoForDB();
				}
			}
		},
		//@param key 可以不传，直接传callback则表示user的全部字段都要
		getUserInfo : function(key, callback) {
			if (this.isLogined()) {
				var context = this;
				var getParam = function() {
					if (typeof key === 'function') {
						return context.toJSON();
					} else {
						return context.get(key);
					}
				};
				if (context.has('isEmailVerified')) {//login-info已发送
					callback && callback(getParam());
				} else {
					readUserInfoForDB(function() {
						callback && callback(getParam());
					});
				}
			}
		},
		checkEmail : function(callback) {
			this.getUserInfo('isEmailVerified', function(isEmailVerified) {
				if (!isEmailVerified) {
					var con = '<div style="padding: 20px 30px;">' +
							'<p>您好像还没有进行邮箱验证。</p>' +
							'<p>为不影响部分功能的使用，请先进行 <a href="' + Y.domains.homeSite +
							'/settings/bind" target="_blank" class="special f14">邮箱验证</a></p>' +
							'</div>';
					require(['dialog'], function(Dialog) {
						new Dialog(con, {
							title : '邮箱验证',
							width : 400,
							height : 100,
							isAutoShow : true
						})
					});
				} else if (callback) {
					callback();
				}
			})
		},

		//判断是否是vip用户
		checkVIP: function(success, cancel){
			if(!this.isLogined()){
				this.login(function(){
					fetchVIPInfo(success, cancel);
				}, cancel);
			}else{
				if(user.get("vipInfo")){
					var info = user.get("vipInfo");

					if(info && !info.error &&
						info.realVip && parseInt(info.realVip) > 0){
						success(info);
					}else{
						cancel();
					}
				}else{
					fetchVIPInfo(success, cancel);
				}
			}
		},

		//同步判断是否是vip用户
		isVipUser: function(){
			var token = Cookie.get('token');

			if(token){
				var list = token.split(".");
				var val;

				if(list.length > 2){
					val = list[2];
					return parseInt(val[0]) > 0;
				}
			}

			return false;
		},

		getToken: function(){
			return Cookie.get("token");
		}
	});

	function readUserInfoForCookie(u_inf) {
		var splitChar, users;

		splitChar = String.fromCharCode(2);
		u_inf = decodeURIComponent(u_inf);
		users = u_inf.split(splitChar);
		user.set({
			userId : users[0] * 1,
			userName : users[1] ,
			headImg : users[4]
		});
	}

	function readUserInfoForDB(callabck) {
		Yajax.getJSON(Y.domains.loginSite + '/login-info', '', function(data) {
			user.set(data);
			callabck && callabck();
		});
	}

	function fetchVIPInfo(success, cancel){
		$.ajax({
			url: CHECK_VIP_SERVICE,
			type: "get",
			dataType: "jsonp",
			jsonp: "callback",
			success: function(result){
				if (result && !result.error) {
					if ((result.realVip && parseInt(result.realVip) > 0) || result.isWo) {
						user.set("vipInfo", result);
						success(result);
						return;
					}
				}

				cancel();
			},
			error: function(){
				cancel();
			}
		});
	}

	var user = new User();
	user.on('change:userId', function() {
		user.trigger('logined');
		user.trigger('login');
	});
	user.emit();

	return user;
});
