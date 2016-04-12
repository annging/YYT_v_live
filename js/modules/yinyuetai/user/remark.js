/**
 * Created with IntelliJ IDEA.
 * User: wei.jin@yinyuetai.com
 * Date: 13-6-24
 * Time: 下午5:55
 * @fileoverview 用户名备注
 */

//------the css files relied:
//1.widget/mbox.css
//2.widget/card.css
/**
 //---Usage:
 remark(data,callback);----参数opt可不传

 //---Example:
 require(["remark"],function(remark){
			remark({
				userId:1234,
				remarkName:"xxx",//如果已经有备注，要默认显示在input里
			},function(){});
		});
 */

define(function(require) {

	var juicer = require("juicer"),
			Dialog = require("dialog"),

			AjaxForm = require("ajaxform"),

			strUtil = require('modules/util/str'),

			tpl = '<form action="http://i.yinyuetai.com/person/set-remark" method="post">\
							<div class="p_album pd_20">\
							<input type="hidden" name="userId" value="{{userId}}">\
							<input type="text" class="com_text" style="width: 274px" value="{{remarkName}}" placeholder="请输入备注" name="remarkName">\
						</div>\
						<div class="popup_btn mr_lrb">\
							<button title="取消" type="button" class="ico_ccd_btn fl J_close">取消</button>\
							<input title="保存" type="submit" class="ico_save_btn fr" value="保存">\
						</div>\
					</form>',

			remark = function(data, callback) {

				if (!(this instanceof remark)) {
					return new remark(data, callback);
				}

				data || (data = {});
				callback || (callback = function(data) {});

				if (!data["userId"]) {
					throw new Error("User's ID is needed!");
				}

				this.data = data;
				this.callback = callback;

				this.init();
			};

	remark.prototype = {

		constructor : remark,

		init : function() {

			var popupBox,
					self = this;

			this.show(); //显示弹层

			popupBox = this.dialog.$el;
			this.form = popupBox.find("form");

			self.bindSubmit(); //绑定ajaxform
		},

		hide : function() {
			this.dialog && this.dialog.hide()
		},

		show : function() {
			var html = juicer.to_html(tpl, this.data);

			this.dialog = new Dialog(html, {
				title : '设置备注',
				width : 328,
				height : 120
			});

			this.dialog.show();
		},

		bindSubmit : function() {
			var self = this,
					$form = self.form;

			new AjaxForm($form, {
				onRequest : function() {
					var $field = $form.find('[name=remarkName]');
					var length = strUtil.getLength($.trim($field.val()));
					if (length > 30) {
						require(['alertify'], function(alertify) {
							alertify.error("备注长度过长，不能超过30个字符或15个汉字~");
							$field.focus();
						});
						return false;
					}
					return true;
				},
				onComplete : function(data) {
					if (!data.error) {
						require(['alertify'], function(alertify) {
							alertify.success("设置备注成功！");
						});
						self.hide();
						self.callback(data);
					} else {
						require(['alertify'], function(alertify) {
							alertify.error(data.message);
						});
					}
				}
			});

		}
	};

	return remark;

});