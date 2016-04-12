define(function(require, exports, module) {
	var Dialog, tpl, AjaxForm, loginBox, user, pwdencrypt;

	var EMAIL_PATTERN = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
	var NUMBER_PATTERN = /^[+-]?[1-9][0-9]*(\.[0-9]+)?([eE][+-][1-9][0-9]*)?$|^[+-]?0?\.[0-9]+([eE][+-][1-9][0-9]*)?$/;

	Dialog = require('dialog');
	AjaxForm = require('ajaxform');
	user = require('user');
	pwdencrypt = require('pwdencrypt');

	tpl = [
		'<div class="loginbox">',
		'<div class="external">',
		'<p class="title">使用合作账号登录<span>(推荐)</span></p>',
		'<ul>',
		'<li>',
		'<a href="<%=url%>/api/login/sina-auth" target="_blank" class="weibo" hidefocus>微博帐号</a>',
		'</li>',
		'<li>',
		'<a href="<%=url%>/api/login/qq-auth" target="_blank" class="qq" hidefocus>QQ帐号</a>',
		'</li>',
		'<li>',
		'<a href="<%=url%>/api/login/renren-auth" target="_blank" class="renren" hidefocus>人人账号</a>',
		'</li>',
		'<li>',
		'<a href="<%=url%>/api/login/baidu-auth" target="_blank" class="baidu" hidefocus>百度帐号</a>',
		'</li>',
		'</ul>',
		'<div class="loginbox-placehold">',
		'</div>',
		'<p class="text">快捷登录，无需注册</p>',
		'<p class="text">与你的朋友分享你的爱！</p>',
		'</div>',
		'<div class="site">',
		'<p class="title">音悦Tai账号登录</p>',
		'<form id="loginBoxForm" action="https://login.yinyuetai.com/login-ajax" method="post">',
		'<p class="errorinfo">错误信息提示</p>',
		'<div class="email focuss">',
		'<input type="text" name="email" placeholder="您的邮箱地址或绑定手机"/>',
		'</div>',
		'<div class="password">',
		'<input type="password" class="pwd" placeholder="请输入密码"/>',
		'</div>',
		'<div id="captcha">',
		'</div>',
		'<div>',
		'<p class="autologin"><input type="checkbox" id="autocheckbox" name="autologin" checked hidefocus/><label for="autocheckbox">下次自动登录</label></p>',
		'<a class="forgot" href="<%=url%>/forgot-password" target="_blank" hidefocus>忘记密码</a>',
		'</div>',
		'<div>',
		'<input class="submit" type="submit" hidefocus/>',
		'<p class="reg">还没有音悦Tai账号？<a href="<%=url%>/register" target="_blank" hidefocus>立即注册！</a></p>',
		'</div>',
		'</form>',
		'</div>',
		'</div>'
	].join('');

	loginBox = new Dialog(_.template(tpl, {url : 'http://login.yinyuetai.com'}), {
		width : 691,
		height : 342,
		isRemoveAfterHide : false,
		isAutoShow : false,
		draggable : false
	});
	/*标记是否极验验证通过*/
	var isLoginboxGeetest = false;
	var loginboxGeetest;

	function refreshGeetest(){
		loginboxGeetest.refresh();
		isLoginboxGeetest = false;
	}

	loginBox.on('show', function() {
		if(!loginboxGeetest){
			/*添加验证框*/
			loginboxGeetest = new window.Geetest({
				"gt":"cc34bd7df5c42f7d9c3f540fdfb671cf",
				"product":"float"
			})
			loginboxGeetest.appendTo(".loginbox #captcha");
			loginboxGeetest.onSuccess(function(){
				isLoginboxGeetest = true;
				var errorinfo = loginBox.$el.find('form').find('.errorinfo');
				if(errorinfo.html() == "拖动滑块完成验证"){
					errorinfo.css('visibility', 'hidden');
				}
			})
		}
		initForm(loginBox.$el.find('form'));
		// UA_Opt.reload();

		$.getJSON('http://www.yinyuetai.com/partner/get-partner-code?placeIds=reg_window&callback=?', function(data){
			if(data && data.reg_window){
				loginBox.$el.find('.loginbox-placehold').html(data.reg_window);
			}
		});
	});

	loginBox.on('hide', function() {
		var form = loginBox.$el.find('form');
		form.find('.errorinfo').css('visibility', 'hidden');
		form.find('[name=email],[name=password]').parent().removeClass('emailerror').removeClass('error');

		//去掉悦单播放页面中下载悦单的active效果
		$('.J_pop_download').removeClass('v_button_curv');
		setTimeout(function(){
			refreshGeetest();
		},500)
	});

	function initForm(form) {
		var errorinfo, email, password;

		errorinfo = form.find('.errorinfo');
		email = form.find('[name=email]');
		password = form.find('.pwd');
		setFocusEffect(email);
		setFocusEffect(password);

		new AjaxForm(form, {
			secretParam : function() {
				return [$.trim(email.val()) + $.trim(password.val())];
			},
			onRequest : function() {
				if (!validator(email, password, errorinfo)) {
					//refreshGeetest();
					return false;
				}

				if(!isLoginboxGeetest){
					var  errorText = "拖动滑块完成验证";
					errorinfo.text(errorText).css('visibility', 'visible');
					return false;
				}
				if (form.find('[name=encpsw]').length != 0) {
					form.find('[name=encpsw]').val(pwdencrypt(password.val()));
				} else {
					$('<input />').attr({
						type : 'hidden',
						name : 'encpsw',
						value : pwdencrypt(password.val())
					}).appendTo(form);
				}
				return true;
			},
			onComplete : function(data) {
				if (!data.error) {
					if (data.platFormRef) {
						location.href = 'http://login.yinyuetai.com/platform';
					} else {
						user.set(data);
						console.log(user);
						loginBox.trigger('hide');
					}
				} else {
					errorinfo.text(data.message).css('visibility', 'visible');
					refreshGeetest();
				}
			}
		});
	}

	function validator(email, password, errorinfo) {
		var emailVal, passwordVal;

		emailVal = $.trim(email.val());
		passwordVal = $.trim(password.val());

		if (emailVal.length === 0) {
			errorinfo.text('邮箱或手机不能为空').css('visibility', 'visible');
			email.parent().addClass('emailerror');
			return false;
		}
		if (!EMAIL_PATTERN.test(emailVal)) {
			if (NUMBER_PATTERN.test(emailVal)) {
				if (emailVal.length !== 11) {
					errorinfo.text('请输入正确的电子邮箱或手机').css('visibility', 'visible');
					email.parent().addClass('emailerror');
					return false;
				}
			} else {
				errorinfo.text('请输入正确的电子邮箱或手机').css('visibility', 'visible');
				email.parent().addClass('emailerror');
				return false;
			}
		}
		if (passwordVal.length === 0) {
			errorinfo.text('密码不能为空').css('visibility', 'visible');
			password.parent().addClass('error');
			return false;
		}
		if (passwordVal.length < 4 || passwordVal.length > 20) {
			errorinfo.text('密码长度必须大于4且小于20').css('visibility', 'visible');
			password.parent().addClass('error');
			return false;
		}

		return true;
	};

	function setFocusEffect(input) {
		if (input.attr('name') === 'email') {
			input.focus(function() {
				$(this).parent().addClass('emailfocus').removeClass('emailerror');
			});
			input.blur(function() {
				$(this).parent().removeClass('emailfocus');
			});
		} else {
			input.focus(function() {
				$(this).parent().addClass('focus').removeClass('error');
			});
			input.blur(function() {
				$(this).parent().removeClass('focus');
			});
		}
	};

	return loginBox;
});
