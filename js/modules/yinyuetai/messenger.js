define(function(require, exports, module) {
	var Messenger, clientConfigUrl, PushStream, oldMessengerUrl, pushStateUrl, setpushStateUrl, cookie, prober, user;

	user = require('user');
	cookie = require('cookie');
	prober = require('prober');
	PushStream = require('pushstream');
	oldMessengerUrl = 'http://i.yinyuetai.com/wb/online/notify.action';
	clientConfigUrl = 'http://login.yinyuetai.com/long-connect-setting';
	pushStateUrl = 'http://i.yinyuetai.com/settings/get-access-push';
	setpushStateUrl = 'http://i.yinyuetai.com/settings/set-access-push';

	Messenger = Backbone.View.extend({
		initialize : function() {
			var self = this;

			this.timer = 0;
			this.lastNotifyTime = 0;
			this.data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
			this.newdata = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
			this.notification = this.$el.find('.notification');
			this.number = this.notification.find('.number');
			this.list = this.notification.find('ul');
			this.userPanel = this.$el.find('.userinfo .user');
			this.msgclose = this.$el.find('.userinfo .msg_close_li a');

			if (cookie.get('pushState') == undefined) {
				$.getJSON(pushStateUrl + '?callback=?', function(data) {
					cookie.set('pushState', data.state, {
						domain : '.yinyuetai.com',
						expires : 365,
						path : '/'
					});
					self.getClientConfig(self.getOldMessenger);
					self.getClientConfig(self.initLongConnection);
				});
			} else {
				this.getClientConfig(this.getOldMessenger);
				this.getClientConfig(this.initLongConnection);
			}

			this.bindClose();
			this.userPanelHover();
			this.msgPanelHover();
		},
		getClientConfig : function(callback) {
			var self = this;
			$.getJSON(clientConfigUrl + '?callback=?', function(data) {
				if (!data.error) {
					callback.call(self, data.clientConfig);
				}
			});
		},
		initLongConnection : function(clientConfig) {
			var self = this;
			var pushstream = new PushStream({
				host : clientConfig.host,
				port : 80,
				modes : "longpolling",
				longPollingUseJSONP : true,
				extraParams : function() {
					return {
						s : clientConfig.s,
						key : clientConfig.key
					}
				}
			});

			pushstream.onmessage = function(json, id, channel) {
				self.onMessage(json, id, channel)
			};
			pushstream.addChannel(clientConfig.channel);
			pushstream.connect();

			$(window).on('beforeunload', function() {
				pushstream && pushstream.disconnect();
			});
		},
		getOldMessenger : function(clientConfig) {
			var self = this;

			$.getJSON(oldMessengerUrl + '?callback=?&channel=' + clientConfig.channel, function(data) {
				if (data.code && data.code == 1) {
					self.onMessage({
						type : "wb",
						body : data.result.notify,
						time : data.result.time
					}, 0, clientConfig.channel, function(options) {
						self.data = options.data;
						self.newdata = options.data;
						//if (cookie.get('pushState') == 'true') {
						//	self.dataShow(options.data);
						//}
					});
				}
			});
		},
		onMessage : function(json, id, channel, callback) {
			var data, time, count;

			if (json == null) {return;}

			if (typeof json == "object" && json.type == "wb") {
				data = json.body;
				time = json.time;
			} else if (typeof json == "string" && json.length > 0) {
				try {
					json = $.parseJSON(json);
					data = json.body;
					time = json.time;
				} catch (e) {
					throw new TypeError('Invalid JSON:' + json);
				}
			} else {
				return;
			}

			if (time) {
				if (this.lastNotifyTime < time) {
					this.lastNotifyTime = time;
				} else {
					return;
				}
			}

			this.render(data, callback);
		},
		render : function(data, callback) {
			var count = 0;

			if (data != null && data.length > 0) {
				//计算消息总数
				$(data).each(function(index, item) {
					count += item;
				});

				count = count - data[1];

				if (count > 0) {
					this.number.removeClass('hide');
				} else {
					this.number.addClass('hide');
				}

				if (callback) {
					callback({
						data : data
					});
				} else {
					if (cookie.get('pushState') == 'true') {
						this.data = data;
						this.newdata = data;
						//this.dataShow(data);
					} else {
						this.newdata = mergeData(data, this.data);
						//this.dataShow(this.newdata);
					}
					$.getJSON(setpushStateUrl + '?callback=?&state=0', function(data) {
						cookie.set('pushState', true, {
							domain : '.yinyuetai.com',
							expires : 365,
							path : '/'
						});
					});
				}
			}
		},
		dataShow : function(data) {
			var html = '';

			data[9] = data[9] || 0; //at我的评论

			//私信
			if (data[2] > 0) {
				html +=
						'<li><a href="http://i.yinyuetai.com/news/private" class="link"><strong>{privateNum}</strong> 条新私信</a></li>'.replace('{privateNum}',
								data[2]);
			}

			//评论
			if (data[3] > 0) {
				html +=
						'<li><a href="http://i.yinyuetai.com/news/comment" class="link"><strong>{comment}</strong> 条新评论</a></li>'.replace('{comment}',
								data[3]);
			}

			//@我
			if (data[4] > 0 || data[9] > 0) {
				var acCountHref;
				if (data[4] > 0) {
					acCountHref = '/news/attention';
					if (data[9] > 0) {
						acCountHref += '?count=' + data[9];
					}
				} else {
					acCountHref = '/news/atcomment';
				}

				html += '<li><a href="http://i.yinyuetai.com{href}" class="link"><strong>{at}</strong> 条@我</a></li>'.replace('{href}',
								acCountHref)
						.replace('{at}', data[4] + data[9]);
			}

			//粉丝
			if (data[5] > 0) {
				html +=
						'<li><a href="http://i.yinyuetai.com/{uid}/friend/fans" class="link"><strong>{friend}</strong> 位新粉丝</a></li>'.replace('{uid}',
										user.get('userId'))
								.replace('{friend}', data[5]);
			}

			//饭团消息
			if (data[6] > 0) {
				html +=
						'<li><a href="http://i.yinyuetai.com/news/balls" class="link"><strong>{system}</strong> 条饭团消息</a></li>'.replace('{system}',
								data[6]);
			}

			//系统提醒
			if (data[7] > 0) {
				html +=
						'<li><a href="http://i.yinyuetai.com/news/system" class="link"><strong>{bulletin}</strong> 条系统提醒</a></li>'.replace('{bulletin}',
								data[7]);
			}

			//留言
			if (data[8] > 0) {
				html +=
						'<li><a href="http://i.yinyuetai.com/{uid}/gossip" class="link"><strong>{fan}</strong> 条新留言</a></li>'.replace('{uid}',
										user.get('userId'))
								.replace('{fan}', data[8]);
			}

			//站内公告
			if (data[0] > 0) {
				html +=
						'<li><a href="http://i.yinyuetai.com/news/bulletin" class="link"><strong>{msg}</strong> 条站内公告</a></li>'.replace('{msg}',
								data[0]);
			}

			//新MV
			if (data[10] && data[10] > 0) {
				html +=
						'<li><a href="http://i.yinyuetai.com/{uid}/mv/new-published" class="link"><strong>{mv}</strong> 首MV更新</a></li>'.replace('{uid}',
										user.get('userId'))
								.replace('{mv}', data[10]);
			}
			if (html != '') {
				html = $(html);
				$(html[html.length - 1]).find('a').addClass('fillet');
				this.list.html(html);
				this.createIframeShim();
				this.list.removeClass('hide');
				this.notification.addClass('hover');
				this.msgclose.removeClass('hide');
			} else {
				this.list.html('');
				this.msgclose.addClass('hide');
				this.notification.removeClass('hover');
				this.iframeshim && this.iframeshim.removeClass('hide');
			}
		},
		createIframeShim : function() {
			if (this.iframeshim) {
				this.iframeshim.css({
					height : this.list.find('li').length * 33 - 4
				});
				return;
			}
			this.iframeshim = $('<iframe />').attr({
				'frameborder' : 0,
				'scrolling' : 'no',
				'class' : 'iframeshim'
			}).css({
						position : 'absolute',
						top : '41px',
						width : '110px',
						height : this.list.find('li').length * 33 - 4,
						left : 'auto',
						right : '55px'
					}).appendTo(this.$el.find('.content'));
		},
		bindClose : function() {
			var self = this;
			this.msgclose.click(function() {
				$.getJSON(setpushStateUrl + '?callback=?&state=1', function(data) {
					cookie.set('pushState', false, {
						domain : '.yinyuetai.com',
						expires : 365,
						path : '/'
					});
				});
				$(this).addClass('hide');
				self.notification.removeClass('hover');
				self.newdata = self.data;
				self.list.html('');
				self.iframeshim && self.iframeshim.addClass('hide');
			});
		},
		userPanelHover : function() {
			var self = this;

			this.userPanel.mouseenter(function() {
				if (self.notification.hasClass('hover')) {
					self.msgclose.addClass('hide');
					self.notification.removeClass('hover');
					self.iframeshim && self.iframeshim.addClass('hide');
				}
			});

			this.userPanel.mouseleave(function() {
				if ($.trim(self.list.html()) != '') {
					self.msgclose.addClass('hide');
					self.notification.addClass('hover');
					self.iframeshim && self.iframeshim.addClass('hide');
				}
			});
		},
		msgPanelHover : function() {
			var self = this;

			this.notification.find('.messenger').on('mouseenter', function(e) {
				self.dataShow(self.data);
			});

			this.notification.find('.messenger').on('mouseleave', function(e) {
				self.timer = setTimeout(function() {
					if (self.userPanel.is(':hover')) {
						return;
					}
					self.list.addClass('hide');
					self.msgclose.addClass('hide');
					self.iframeshim && self.iframeshim.addClass('hide');
				}, 200);
			});

			this.notification.find('ul').on('mouseenter', function(e) {
				clearTimeout(self.timer);
			});

			this.notification.find('ul').on('mouseleave', function(e) {
				if (self.userPanel.is(':hover')) {
					return;
				}
				self.list.addClass('hide');
				self.msgclose.addClass('hide');
				self.iframeshim && self.iframeshim.addClass('hide');
			});
		}
	});

	function mergeData(data, olddata) {
		var len = data.length, arr = [];

		for (var i = 0; i < len; i++) {
			if (data[i] != olddata[i]) {
				arr[i] = data[i];
			} else {
				arr[i] = 0;
			}
		}

		return arr;
	}

	new Messenger({
		el : $('.topbar')
	});
});
