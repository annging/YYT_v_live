define(function(require, exports, module) {
	var PowerTextarea = require('modules/widget/textarea/powertextarea');
	var authDialog = require('modules/yinyuetai/auth-dialog');
	var juicer = require('juicer');
	var AjaxForm = require('ajaxform');
	var Ajax = require('ajax');
	var alertify = require('alertify');
	var user = require('user');
	var CommentForm = Backbone.View.extend({
		options : {
			curstomTpl : '',
			maxCount : 500,
			synInfo : true,
			action : Y.comment.createUrl,
			el : '<form class="ct_release clearfix J_reply_box" method="post"></form>'
		},
		events : {
			'click .J_syn' : 'toggleSyn',
			'click .ct_at' : 'showAt'
		},
		tpl : [
			'<span class="arrow"></span>',

			'<div class="com_area_box ">',
			'<textarea class="com_area f14" placeholder="" name="content"></textarea>',
			'</div>',
			'<div class="ct_share">',
			'{@if synInfo}',
			'<div class="fl share c_9 J_syn_box">',
			'同步到：',
			'</div>',
			'{@/if}',
			'<div class="fl ver J_authcode"></div>',
			'<button type="submit" class="fr ico_not_release" data-id="{{id}}" data-is-syn-i={{isSynI}} data-replied-id="{{repliedId}}" data-syn_qq="{{syn_qq}}" data-syn_renren="{{syn_renren}}" data-syn_sina="{{syn_sina}}">发 布</button>',
			'<a href="javascript:void(0);" class="fr ct_at" title="@悦友"><i></i>悦友</a>',
			//			'<a href="#" class="fr ico_ct_voice" title="语音">语音</a>',
			'<span class="fr c_6 J_count">还可以输入<strong>500</strong>字</span>',
			'<input type="hidden" name="authcode" value="" />',
			'<span class="fr c_c00 hide J_err_msg">请输入5字以上</span>',
			'</div>'],
		synTpl : [
			'{@if withSinaUser}',
			'{@if sinaVideoComment}',
			'<a href="javascript:;" class="ico_ct_sina ico_ct_cur J_syn" data-plat="sina" data-syn="true" title="同步到新浪微博">新浪微博<span ',
			'class="ico_ct_suc"></span></a>',
			'{@else}',
			'<a href="javascript:;" class="ico_ct_sina J_syn" data-plat="sina" title="同步到新浪微博">新浪微博<span ',
			'class="ico_ct_suc"></span></a>',
			'{@/if}',
			'{@else}',
			'<a href="http://i.yinyuetai.com/settings/bindsns" target="_blank" class="ico_ct_sina_gray" title="现在连接新浪微博">新浪微博</a>',
			'{@/if}',

			'{@if withQQLoginUserUser}',
			'{@if qqVideoComment}',
			'<a href="javascript:;" class="ico_ct_qq ico_ct_cur J_syn" data-plat="qq" data-syn="true" title="同步到腾讯微博">腾讯微博<span ',
			'class="ico_ct_suc"></span></a>',
			'{@else}',
			'<a href="javascript:;" class="ico_ct_qq J_syn" data-plat="qq" title="同步到腾讯微博">腾讯微博<span ',
			'class="ico_ct_suc"></span></a>',
			'{@/if}',
			'{@else}',
			'<a href="http://i.yinyuetai.com/settings/bindsns" target="_blank" class="ico_ct_qq_gray" title="现在连接腾讯微博">新浪微博</a>',
			'{@/if}',

			'{@if withRenrenUser}',
			'{@if renrenVideoComment}',
			'<a href="javascript:;" class="ico_ct_renren ico_ct_cur J_syn" data-plat="renren" data-syn="true" title="同步到人人网">人人网<span ',
			'class="ico_ct_suc"></span></a>',
			'{@else}',
			'<a href="javascript:;" class="ico_ct_renren J_syn" data-plat="renren" title="同步到人人网">人人网<span ',
			'class="ico_ct_suc"></span></a>',
			'{@/if}',
			'{@else}',
			'<a href="http://i.yinyuetai.com/settings/bindsns" target="_blank" class="ico_ct_renren_gray" title="现在连接人人网">人人网</a>',
			'{@/if}',

			'{@if commentVideo}',
			'<a href="javascript:;" class="ico_ct_yyt ico_ct_cur J_syn" data-plat="i" data-syn="true" title="同步到我的家">我的家<span ',
			'class="ico_ct_suc"></span></a>',
			'{@else}',
			'<a href="javascript:;" class="ico_ct_yyt J_syn" data-plat="i" title="同步到我的家">我的家<span ',
			'class="ico_ct_suc"></span></a>',
			'{@/if}'
		],
		initialize : function() {
			var self = this;
			this.render({synInfo : this.options.synInfo});
			this.platInfoBox = this.$el.find('.J_syn_box');
			if (!user.isLogined()) {
				this.renderPlatInfo();

				if(/iphone|ipod|android|blackberry|opera|mini|smartphone|iemobile/i.test(navigator.userAgent)){
					if(location.href.indexOf('clear2015/wap')!=-1){
						$('<div class="com_login">请先<a href="http://m.yinyuetai.com/login?redirect={redirect}">登录</a></div>'.replace('{redirect}', location.href)).appendTo($('.ct_release'));
						this.$el.find('.com_area').attr('placeholder','#清扬，无需隐藏，炫出自我！#');
					}
				}
			}

			if(/iphone|ipod|android|blackberry|opera|mini|smartphone|iemobile/i.test(navigator.userAgent)){
				if(location.href.indexOf('clear2015/wap')!=-1){
					this.$el.find('.com_area').attr('placeholder','#清扬，无需隐藏，炫出自我！#');
				}
			}
			user.logined(function() {
				if (!user.get('commentPlatInfo')) {
					Ajax.getJSON(Y.domains.commentSite + '/comment/get-platform-info', '', function(json) {
						user.set('commentPlatInfo', json);
						self.renderPlatInfo(json);
					})
				} else {
					self.renderPlatInfo(user.get('commentPlatInfo'))
				}
			});
			this.$textarea = this.$el.find('textarea');
			var countBox = this.$el.find('.J_count');
			this.powerTextarea = new PowerTextarea(this.$textarea, {
				count : {
					max : this.options.maxCount,
					min : 5,
					countBox : countBox,
					type : "showLeftCount"
				},
				at : true,
				button : {
					element : this.$el.find('button'),
					enableClass : 'ico_ct_release',
					disableClass : 'ico_not_release'
				}
			});
			this.$textarea.focus(function() {
				self.$el.find('.J_err_msg').addClass('hide');
				countBox.show();
			});
			if (this.options.action) {
				this.$el.attr('action', this.options.action);
			}
			new AjaxForm(this.$el, {
				onRequest : function() {
					if (!user.isLogined()) {
						user.login(function() {
							self.$el.submit();
						});
						return false;
					}
					if (!user.get('isEmailVerified')) {
						user.checkEmail(function() {
							self.$el.submit();
						});
						return false;
					}
					if (self.$el.find('button').hasClass('ico_not_release')) {
						if (countBox.find('strong').html() > 495) {
							countBox.hide();
							self.$el.find('.J_err_msg').removeClass('hide');
						}
						self.warning();
						return false;
					}
					var params = self.options.params, key = _.keys(params)[0];
					if (params && key && !self.el[key]) {
						_.each(params, function(value, key) {
							self.addParam(key, value);
						})
					}
					if (self.options.synInfo) {
						var syn_sina = self.$el.find('[data-plat=sina]').data('syn');
						var syn_qq = self.$el.find('[data-plat=qq]').data('syn');
						var syn_renren = self.$el.find('[data-plat=renren]').data('syn');
						var syn_i = self.$el.find('[data-plat=i]').data('syn');
						self.addParam('syn_sina', syn_sina);
						self.addParam('syn_qq', syn_qq);
						self.addParam('syn_renren', syn_renren);
						self.addParam('isSynI', syn_i);
						self.addParam('isSynIChange', syn_i != self.options.synInfo.commentVideo);
					}
					return true;
				},
				onComplete : function(result) {
					if (result && !result.error) {
						if (result.type === 'video') {
							//进入黑名单的用户，需要填写验证码
							if (result.actived === false) {
								if (authDialog.status == 'show') {
									authDialog.reload();
									alertify.error(result.message);
									return;
								}

								alertify.error(result.message);
								authDialog.show(function(pickChars) {
									self.$el.find('[name="authcode"]').val(pickChars);
									self.$el.submit();
								});

								return;
							}
						}

						if (authDialog.status == 'show') {
							authDialog.hide();
						}

						if(self.$el.attr('action') === 'http://comment.yinyuetai.com/mv/video-comment-create'){
							$.ajax({
								url : 'http://log.collect.yinyuetai.com/uo-stat',
								dataType : 'jsonp',
								data : {
									ot : 2,
									vid : self.options.params.belongId,
									aid : Y.video.artistId.replace(/,/ig,'-'),
									refer : encodeURIComponent(document.referrer)
								}
							});
						}else if(self.$el.attr('action') === 'http://comment.yinyuetai.com/mv/video-comment-reply'){
							$.ajax({
								url : 'http://log.collect.yinyuetai.com/uo-stat',
								dataType : 'jsonp',
								jsonp: "callback",
								data : {
									ot : 8,
									vid : self.options.params.belongId,
									aid : Y.video.artistId.replace(/,/ig,'-'),
									refer : encodeURIComponent(document.referrer)
								}
							});
						}

						alertify.success(result.message);
						self.$el.find('[name="authcode"]').val('');
						self.$textarea.val('');
						self.powerTextarea.reset();
						self.trigger('success', result);
					} else {
						if (self.options.errorCallback) {
							self.options.errorCallback(result);
						} else {
							alertify.error(result.message);
						}
					}
				}
			});
		},
		render : function(data) {
			var self = this;
			var tpl = '';
			if (this.options.curstomTpl) {
				tpl = this.options.curstomTpl.join('');
			} else {
				tpl = this.tpl.join('')
			}
			this.$el.html(juicer.to_html(tpl, data));
			if (this.options.withHeadImg) {
				if (!user.isLogined()) {
					self.$el.before('<span class="avatar"><img src="' + Y.domains.urlStatic +
							'/v2/images/base/ico/avatar.png" width="50" height="50" alt=""></span>')
				}
				user.logined(function() {
					user.getUserInfo('headImg', function(headImg) {
						self.$el.before('<a href="http://i.yinyuetai.com/' + user.get('userId') +
								'" class="avatar J_usercard" data-user-id="' + user.get('userId') +
								'"><img src="' + headImg + '" width="50" height="50" alt=""></a>')
					})
				})
			}
		},
		renderPlatInfo : function(data) {
			this.platInfoBox.html(juicer.to_html(this.synTpl.join(''), data));
		},
		addParam : function(key, value) {
			var $input = $(this.el[key]);
			if ($input.length == 0) {
				$input = $('<input type="hidden">').attr('name', key).appendTo(this.$el);
			}
			$input.attr('value', value);
		},
		toggleSyn : function(e) {
			user.login(function() {
				var $target = $(e.currentTarget);
				if ($target.data('syn')) {
					$target.data('syn', false);
					$target.removeClass('ico_ct_cur');
				} else {
					$target.data('syn', true);
					$target.addClass('ico_ct_cur');
				}
			})
		},
		warning : function() {
			var self = this;
			setTimeout(function() {
				self.$textarea.addClass('err_input');
			}, 25);
			setTimeout(function() {
				self.$textarea.removeClass('err_input');
			}, 1000);
		},
		showAt : function() {
			this.powerTextarea.at.autoChange();
		}
	})

	module.exports = CommentForm;
})

