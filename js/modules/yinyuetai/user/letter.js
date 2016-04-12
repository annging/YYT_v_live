/**
 * Created with IntelliJ IDEA.
 * User: wei.jin@yinyuetai.com
 * Date: 13-6-24
 * Time: 下午5:55
 * @fileoverview 私信
 */


//------the css files relied:
//1.widget/mbox.css
//2.widget/card.css
/**
 //---Usage:
 letter(data,callback);----data必须参数,callback可不传

 //---Example:
 require(["letter"],function(letter){
			letter({
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

			totalNumber = require('modules/widget/textarea/totalNumber'),

	// tmpl = '<form action="http://i.yinyuetai.com/message/create-message" method="post">\
	// 			<input type="hidden" name="friendId" value="{{userId}}">\
	// 			<div class="p_letter clearfix">\
	// 				<span class="p_letter_arr">\
	// 					<img src="{{imgUrl}}" alt="{{name}}" width="100" height="100">\
	// 				</span>\
	// 				<div class="p_letter_right">\
	// 					<label class="c_6">给 <a href="http://i.yinyuetai.com/{{userId}}" class="special" target="_blank">{{userName}}</a> 发送短消息</label>\
	// 					<textarea id="message_content" name="content" cols="30" rows="3" class="com_area" placeholder="请输入信息"></textarea>\
	// 					<input type="submit" class="ico_save_btn" title="发送" value="发送">\
	// 				</div>\
	// 			</div>\
	// 		</form>',
			tmpl = '<form action="http://i.yinyuetai.com/message/create-message" method="post">\
						<input type="hidden" name="friendId" value="{{userId}}">\
						<div class="p_letter clearfix">\
							<span class="c_6 fl"><span class="fl">给</span><a href="http://i.yinyuetai.com/{{userId}}" class="special fl" target="_blank">{{userName}}</a><span class="fl">发送一条站内信</span></span>\
							<p class="fr inputWarn">您还可以输入<em class="number">1000</em>字</p>\
							<textarea id="message_content" name="content" cols="30" rows="3" class="com_area" placeholder="请输入信息"></textarea>\
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

			textarea = this.form.find("textarea");
			count = totalNumber(textarea, {
				number : 1000,
				tip : this.form.find(".inputWarn")
			});
			textarea.focus(function() {
				count.start();
			});

			textarea.blur(function() {
				window.setTimeout(function() {
					count.stop();
				}, 400);
			});


		},

		show : function() {
			var html = juicer.to_html(tmpl, this.data);

			this.dialog = new Dialog(html, {
				width : 406,
				height : 170,
				title : "站内信",
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
					var $field = $form.find('[name=content]'),
							val = $.trim($field.val());
					if (val == "") {
						alertify.error("请输入消息内容");
						$field.focus();
						return false;
					}
					/*if (val.length > 1000) {
					 alertify.error("消息内容不能超过1000字");
					 $field.focus();
					 return false;
					 }*/
					alertify.loading("正在传送消息 ，请稍候……");
					return true;
				},
				onComplete : function(data) {
					alertify.hide();
					if (!data.error) {
						alertify.success("消息发送成功！");
						self.hide();
						self.callback && self.callback();
					} else {
						alertify.error(data.message || "消息发送失败！");
					}
				}
			});
		}
	};

	return msg;

});