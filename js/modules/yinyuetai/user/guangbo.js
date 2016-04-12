/**
 * Created with IntelliJ IDEA.
 * User: wei.jin@yinyuetai.com
 * Date: 13-6-24
 * Time: 下午5:55
 * @fileoverview 广播
 */


//------the css files relied:
//1.widget/mbox.css
//2.widget/card.css
/**
 //---Usage:
 letter(data,callback);----data必须参数,callback可不传

 //---Example:
 require(["guangbo"],function(guangbo){
			guangbo({
				userName:"",//用户名
				userId:""//用户id
			},function(){}//回调
			);
		});
 */
define(function(require, exports, module) {
	var juicer = require("juicer"),
			Dialog = require("dialog"),
			AjaxForm = require("ajaxform"),
			user = require('user'),
			PowerTextarea = require('modules/widget/textarea/powertextarea'),
			tmpl = '<form action="http://i.yinyuetai.com/wb/post/doPost.action" method="post">\
						<input type="hidden" name="privacyxxx" value="all">\
						<div class="p_letter clearfix">\
							<span class="c_6 fl"><span class="fl">对</span><a href="http://i.yinyuetai.com/{{userId}}" class="special fl" target="_blank" title="{{userName}}">{{userName}}</a><span class="fl">说</span></span>\
							<p class="fr inputWarn">您还可以输入<em class="number">140</em>字</p>\
							<textarea id="message_content" name="content" cols="30" rows="3" class="com_area" placeholder="请输入信息">@{{userName}}({{userId}}) </textarea>\
							<input type="submit" class="ico_ct_release" title="发送" value="发布">\
						</div>\
					</form>',
			msg = function(data, callback) {
				//data:{"userId" "name" "imgUrl"}

				if (!(this instanceof msg)) {
					return new msg(data, callback);
				}

				this.data = data || {};
				this.callback = callback || function() {};

				this.init();
			};


	msg.prototype = {

		constructor : msg,

		init : function() {

			var self = this, textarea, count;

			this.show();

			this.popupBox = this.dialog.$el;
			this.form = this.popupBox.find("form");

			self.bindSubmit(); //绑定ajaxform

			this.textarea = textarea = this.form.find("textarea");

			new PowerTextarea(textarea, {
				count : {
					max : 140,
					min : 1,
					countBox : this.form.find(".inputWarn"),
					type : "showLeftCount"
				},
				at : true,
				button : {
					element : this.form.find('.ico_ct_release'),
					enableClass : 'ico_ct_release fr',
					disableClass : 'ico_not_release fr'
				}
			});
		},

		show : function() {
			var html = juicer.to_html(tmpl, this.data);

			this.dialog = new Dialog(html, {
				width : 406,
				height : 170,
				title : "广播",
				isAutoShow : true
			});
		},

		hide : function() {
			this.dialog && this.dialog.hide();
		},

		bindSubmit : function() {
			var self = this, $form = self.form, alertify;

			new AjaxForm($form, {
				onRequest : function() {
					if (!user.isLogined()) {
						user.login(function() {
							$form.submit();
						});
						return false;
					}
					alertify = require('alertify');
					if (self.form.find('[type=submit]').hasClass('ico_not_release')) {
						self.warning();
						return false;
					}
					alertify.loading("正在传送消息 ，请稍候……");
					return true;
				},
				onComplete : function(data) {
					alertify.hide();
					if (data.code == 1) {
						alertify.success("广播发送成功！");
						self.hide();
						self.callback && self.callback();
					} else {
						alertify.error(data.message || "广播发送失败！");
					}
				}
			});
		},
		warning : function() {
			var self = this;
			setTimeout(function() {
				self.textarea.addClass('err_input');
			}, 25);
			setTimeout(function() {
				self.textarea.removeClass('err_input');
			}, 1000);
		}
	};
	return msg;
});