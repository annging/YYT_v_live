define(function(require, exports, module) {
	var juicer = require("juicer");

	var tpl = ['<span class="fl v_share_link" >',
		'<a class="weibo17 J_sharelink" target="_blank" title="分享到新浪微博" href="http://v.t.sina.com.cn/share/share.php?appkey=2817290261&url={{url}}&title={{title}}&content=gb2312&pic={{pic}}&ralateUid=1698229264"></a>',
		'<a class="qzone17 J_sharelink" target="_blank" title="分享到QQ空间" href="http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url={{url}}&desc={{content}}&pics={{pic}}"></a>',
		'<a class="tencent17 J_sharelink" target="_blank" title="分享到腾讯微博" href="http://v.t.qq.com/share/share.php?title={{title}}&url={{url}}&pic={{pic}}"></a>',
		'<a class="qq17 J_sharelink" target="_blank" title="分享到QQ" href="http://connect.qq.com/widget/shareqq/index.html?url={{url}}&showcount=1&desc={{content}}&summary={{content}}&title={{title}}&site=音悦台&pics={{pic}}&style=201&width=39&height=39"></a>',
		'</span>'
	].join("");

	/*
	 data的内容
	 data: {
	 element : dom,
	 title: "",
	 url: "",
	 content: "",
	 pic: ""
	 }
	 */
	exports.getShare = function(data) {
		var _data = {}, html;
		$.extend({
			element : '',
			title : '',
			url : '',
			content : '',
			pic : ''
		}, data);

		for (var v in data) {
			_data[v] = encodeURIComponent(data[v]);
		}

		html = juicer(tpl, _data);
		if (data.element) {
			$(data.element).eq(0).html(html).on('click', '.J_sharelink', function(e) {
				e.preventDefault();
				var windowWidth = $(window).width();
				var windowHeight = $(window).height();
				var offsetX, offsetY;
				var width = 800;
				var height = 700;
				var url = $(e.target).attr('href');

				if (width >= windowWidth) {
					offsetX = 0;
					width = windowWidth;
				} else {
					offsetX = (windowWidth - width) / 2;
				}
				if (height >= windowWidth) {
					offsetY = 0;
					height = windowHeight;
				} else {
					offsetY = (windowHeight - height) / 2;
				}
				window.open(url, 'newwindow',
						'height=' + height + ',width=' + width +
								',left=' + offsetX + ',top=' + offsetY +
								',toolbar=no,menubar=no,scrollbars=no,resizable=no,location=no,status=no');
			});
		} else {
			return html;
		}
	};
});