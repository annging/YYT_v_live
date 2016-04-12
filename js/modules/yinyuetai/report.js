define(function(require, exports, module) {
	var PowerTextarea = require('modules/widget/textarea/powertextarea');
	var AjaxForm = require('ajaxform');
	var alertify = require('alertify');
	var Dialog = require('dialog');
	var juicer = require('juicer');
	var user = require('user');
	var template = [
		'<form class="p_content" action="http://www.yinyuetai.com/report/create-report">',
		'<div class="select_area">',
		'<a href="javascript:;" class="g_select J_select">',
		'<span class="g_select_l"></span>',
		'<span class="con">选择举报类型</span>',
		'<span class="g_select_r"></span>',
		'</a>',
		'<ul class="select_area_down J_option_list">',
		'<li><a href="javascript:;" class="J_option" data-value="politics">时政违法</a></li>',
		'<li><a href="javascript:;" class="J_option" data-value="advertising">广告违法</a></li>',
		'<li><a href="javascript:;" class="J_option" data-value="vulgar">低俗违法</a></li>',
		'<li><a href="javascript:;" class="J_option" data-value="others">其他违法内容</a></li>',
		'</ul>',
		'</div>',
		'<div class="com_area_box ">',
		'<textarea class="com_area f14" name="reportDesc" placeholder="请输入5-500字的举报理由"></textarea>',
		'<span class="num c_6 J_count">还可以输入<strong>500</strong>字</span>',
		'</div>',
		'<p class="submit c_9"><button class="fr ico_not_release ico_ct_release">发 布</button>若您还有其他的意见或建议，请',
		'<a href="http://i.yinyuetai.com/2798004" class="special" target="_blank">联系管理员</a>',
		'</p>',
		'</form>'];
	var successTemplate = [
		'<p class="p_report_info">您的举报信息已收到，我们会尽快处理。<br/>',
		'音悦台鼓励以音乐出发的讨论，但不赞赏人身攻击，谩骂等不良行为。<br/>',
		'一片音乐净土需要你我共建!<br/> ',
		'音悦台感谢你的不间断支持。</p>'
	];
	var reportType;
	$(document).click(function() {
		$('.J_option_list').hide();
	})
	$(document.body).on('click', '.J_select', function(e) {
		var $target = $(e.currentTarget);
		var $optionList = $target.next();
		if ($optionList.css('display') == 'none') {
			e.stopPropagation();
			$('J_option_list').hide();
			$optionList.show();
		}
	})
	$(document.body).on('click', '.J_option', function(e) {
		var $target = $(e.currentTarget);
		$target.parents('.select_area').find('.con').html($target.html());
		reportType = $target.data('value');
	});
	exports.show = function(params) {
		function addParam(key, value) {
			var $input = $(form[key]);
			if ($input.length == 0) {
				$input = $('<input type="hidden">').attr('name', key).appendTo($form);
			}
			$input.attr('value', value);
		};
		reportType = undefined;
		var $form = $(juicer.to_html(template.join(''))),
				form = $form[0], $textarea = $form.find('textarea');
		var dialog = new Dialog($form, {
			width : 320,
			title : '向音悦Tai举报违规内容',
			className : 'dialog p_report',
			height : 'auto'
		});

		new AjaxForm($form, {
			onRequest : function() {
				if (!user.isLogined()) {
					user.login(function() {
						$form.find('button').click();
					})
					return false;
				}
				if ($form.find('button').hasClass('ico_not_release')) {
					setTimeout(function() {
						$textarea.addClass('err_input');
					}, 25);
					setTimeout(function() {
						$textarea.removeClass('err_input');
					}, 1000);
					return false;
				}
				if (!reportType) {
					alertify.error("请选择举报类型");
					return false;
				}
				var key = _.keys(params)[0];
				if (params && key && !form[key]) {
					_.each(params, function(value, key) {
						addParam(key, value);
					})
				}
				addParam('reportType', reportType);
				return true;
			},
			onComplete : function(result) {
				if (!result.error) {
					$textarea.val('');
					powerTextarea.reset();
					dialog.$el.removeClass('p_report').addClass('info');
					$form.replaceWith($(successTemplate.join('')));
				} else {
					alertify.error(result.message);
				}
			}
		});
		var powerTextarea = new PowerTextarea($textarea, {
			count : {
				max : 500,
				min : 5,
				countBox : $form.find('.J_count'),
				type : "showLeftCount"
			},
			button : {
				element : $form.find('button'),
				enableClass : 'ico_ct_release',
				disableClass : 'ico_not_release'
			}
		})
	}
})

