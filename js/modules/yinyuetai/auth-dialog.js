define(function(require, exports, module) {
	var ajax = require("ajax"),
		juicer = require("juicer"),
		alertify = require("alertify"),
		Dialog = require("dialog");

	var dialog, dialogConfig;
	var tmpl = {
		init: '<div class="auth_dialog_content J_auth_dialog_content"><div class="auth_dialog_loading">验证码加载中...</div></div>',
		content: [
			'<div class="auth_dialog_component auth_dialog_grid">',
			'<div class="auth_dialog_grid_head clearfix">',
			'<div class="auth_dialog_title">请输入图片中的文字：</div>',
			'<div class="auth_dialog_input_wrap">',
			'<div class="auth_dialog_grid_input">',
			'<div style=""></div>',
			'<div style=""></div>',
			'<div style=""></div>',
			'<div style=""></div>',
			'<div class="auth_dialog_backspace J_captcha_backspace"></div>',
			'</div>',
			'</div>',
			'</div>',
			'<div class="auth_dialog_grid_content">',
			'<span class="auth_dialog_img" style="background-image: url(http://i.yinyuetai.com{{imgUrl}})"></span>',
			'<a class="vCodeUpdate J_authcode_change" href="javascript:;">看不清?</a>',
			'<div class="auth_dialog_help">',
			'点击框内文字输入上图中',
			'<span class="c_c00">汉字</span>',
			'对应汉字',
			'</div>',
			'<div class="auth_dialog_buttons clearfix">',
			'{@each images as it,k}',
			'<a href="javascript:;" data-id="{{it}}" data-classname="auth_dialog_btn_{{k}}" class="J_pick">',
			'<div class="auth_dialog_btn_{{k}}" data-pos-x="{@if k%3 == 0}-10px{@else if k%3 == 1}-50px{@else}-90px{@/if}" data-pos-y="{@if k<3}-54px{@else if k<6}-94px{@else}-134px{@/if}" style="background-image: url(http://i.yinyuetai.com{{imgUrl}})"></div>',
			'</a>',
			'{@/each}',
			'</div>',
			'</div>'
		].join('')
	};

	var Authentication = Backbone.View.extend({
		initialize: function() {
			this.getCodeImageAndProcessResult();
		},
		getCodeImageAndProcessResult: function() {
			var self = this;
			ajax.getJSON('http://i.yinyuetai.com/writing/vote-code-image-list?callback=?', {_t : new Date()}, function(data) {
				if (!data.error) {
					self.render(data);
					dialog.resize();
					self.initAuth(data);
				} else {
					alertify.error(data.message);
				}
			});
		},
		render: function(data) {
			this.$(".J_auth_dialog_content").html(juicer(tmpl.content, data));
		},
		initAuth: function(data) {
			this.pickNum = 0;
			this.pickChars = [];
			this.imgUrl = data.imgUrl;
		},
		events: {
			"click .J_pick": "selectChars",
			"click .J_captcha_backspace": "deleteSelectedChars",
			"click .J_authcode_change": "reloadAuthImage"
		},
		selectChars: function(e) {
			var that = $(e.currentTarget);
			if ( this.pickNum == 4 ) return;
			$('.auth_dialog_grid_input div').eq(this.pickNum).css('background',
					'url(http://i.yinyuetai.com' + this.imgUrl +
							') no-repeat {x} {y}'.replace('{x}', that.children().attr('data-pos-x')).replace('{y}',
									that.children().attr('data-pos-y')));

			this.pickNum++;
			this.pickChars.push(that.data('id'));

			if (this.pickNum == 4) {
				this.selectComplete(this.pickChars.join(','));
			}
		},
		deleteSelectedChars: function() {
			$('.auth_dialog_grid_input div').attr('style', '');
			this.pickNum = 0;
			this.pickChars = [];
		},
		reloadAuthImage: function() {
			this.getCodeImageAndProcessResult();
		},
		selectComplete: function(pickChars) {
			dialogConfig.complete && dialogConfig.complete(pickChars);
			moduleInterface.complete && moduleInterface.complete(pickChars);
		}
	});

	var authentication;

	var moduleInterface = {
		status : 'hide',
		show: function(config) {
			if ( typeof config == "function" ) {
				dialogConfig = {
					complete: config
				}
			} else {
				dialogConfig = config || {};
			}
			dialog = new Dialog(tmpl.init, _.extend({
				width: 300,
				height: 300,
				title: "验证码",
				className: "auth-dialog"
			}, dialogConfig));
			authentication = new Authentication({
				el: dialog.$el
			});
			this.status = 'show';
		},
		reload: function() {
			this.status = 'show';
			authentication.getCodeImageAndProcessResult();
		},
		hide: function() {
			dialog.hide();
			this.status = 'hide';
		}
	};

	//接口说明：
	/*
	 moduleInterface接口接受三个方法：
	    show: 显示验证码弹窗
	    hide: 关闭弹窗
	    complete: 选择指定的字符后会主动回调这个方法，选择的结果会作为参数传入
	    reload: 重新获取验证码弹窗

	 ps: show方法接受config配置，config也可以传入complete方法，用如上。
	 */
	return moduleInterface;
});