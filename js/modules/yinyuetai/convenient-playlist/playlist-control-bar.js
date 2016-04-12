define(function(require, exports, module) {
	var juicer = require('juicer');

	var tmpl = {
		main: '<div class="mvs-control-bar-content">'+
				'<a title="上一首" class="group_pre3 mvs-control-bar-button" href="javascript:;">上一首</a>'+
				'<a title="下一首" class="group_next3 mvs-control-bar-button" href="javascript:;">下一首</a>'+
				'<div class="mvs-control-bar-box">'+
				'<div class="mvs-control-bar-slider">'+
				'</div>'+
				'</div>'+
				'</div>'+
				'<iframe frameborder="0" scrolling="no" class="mvs-control-bar-iframe-overlay"></iframe>'+
			'</div>',
		item: '<a href="javascript:void(0);" class="mvs-control-bar-item">'+
				'<span class="mvs-control-bar-item-box">'+
					'<img width="160" height="90" alt="White Christmas (A Very Gaga Thanksgiving) 现场版 中英字幕" src="http://img4.yytcdn.com/video/mv/131224/839939/53C60143209C34A2919E8508AC5C2B91_240x135.jpeg">'+
					'<span class="mvs-control-bar-item-information">'+
						'<span class="mvs-control-bar-item-song">White Christmas (A Very Gaga Thanksgiving) 现场版 中英字幕</span>'+
						'<span class="mvs-control-bar-item-singer c_cf9">Lady Gaga</span>'+
					'</span>'+
					'<span class="icon-play"></span>'+
				'</span>'+
			'</a>'
	};

	function init() {

	}

	init();

	module.exports = {

	};
});