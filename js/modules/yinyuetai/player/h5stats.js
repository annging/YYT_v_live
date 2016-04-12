/*
 * vid 	    videoId
 * vna	    videoName
 * vurl     videoUrl
 * rd		referdomain 访问来源
 * btr		bitrate 码流大小 值432
 * rdip     重定向之后的ip
 * ctype    客户端的类型(ipad, iphone 等)
 */
define(function(require, exports, module) {
	var XHR = require('ajax'),
			Uri = require('uri'),
			uuid = require('modules/util/uuid');

	var stats = function(data) {
		var param = $.extend({}, data, videoModel);
		XHR.post('http://v.stats.yinyuetai.com/newvv?t=' + new Date().getTime(), param, function() {}, 'json');
	};
	var video, $video, videoModel = {
		vid : 0,
		vna : '',
		vurl : '',
		rd : 'yinyuetai.com',
		btr : 0,
		rdip : 0,
		ctype : ''
	};
	//mv播放-缓冲状态
	var mvStatus = {
		reqid : 3,   //统计代号
		sta : '',   //当前状态
		buffcout : 0//卡断次数
	};

	return {
		init : function(el, data) {
			video = el;
			$video = $(video);
			videoModel = $.extend(videoModel, data);
			videoModel.uuid = uuid.uuid();

			var context = this;

			//数据请求完毕后
			context.loaded(1);
			//测试
			//this.test();
			//第一次加载及切换码流时触发
			$video.on('loadstart', function() {
				videoModel.vurl = video.src;
				context.loaded(2);
			});
			$video.on('ended', $.proxy(this.ended, this));

			//状态改变，错误信息
			$video.on('error', function() {
				mvStatus.sta = '066';//streamnotfound
				context.statusChanged();
			});
			$video.on('stalled', function() {//卡断,网络延迟
				mvStatus.sta = "05";//buffering
				mvStatus.buffcout++;
				context.statusChanged();
			});
		},
		loaded : function(reqid) {
			var uri = new Uri(videoModel.vurl),
					host = uri.host(),
					path = uri.path(),
					br = uri.getQueryParamValue('br');
			if (host.match(/([a-z0-9]+)\.yinyuetai\.com/) && path.indexOf('uploads') > -1) {
				$.ajax({
					dataType : 'jsonp',
					jsonp : 'callback',
					type : 'get',
					url : videoModel.vurl,
					data : 'jsonp=1',
					success : function(result) {
						videoModel.rdip = result.info.ip;
						videoModel.vurl = result.url;
						videoModel.btr = br;
						stats({reqid : reqid});
					}
				});
			} else {
				stats({reqid : reqid});
			}
		},
		test : function() {
			consolePlayer();
			function eventTester(e) {
				video.addEventListener(e, function() {
					console.log(e + '\n');
				}, false);
			}

			function consolePlayer() {
				eventTester("loadstart");   //客户端开始请求数据
				eventTester("progress");    //客户端正在请求数据
				eventTester("suspend");     //延迟下载，progress后触发，可以播放稍后再下载
				eventTester("abort");       //客户端主动终止下载（不是因为错误引起），
				eventTester("error");       //请求数据时遇到错误
				eventTester("stalled");     //网速失速，网络延时,卡断
				eventTester("play");        //play()和autoplay开始播放时触发
				eventTester("pause");       //pause()触发
				eventTester("loadedmetadata");  //成功获取资源长度
				eventTester("loadeddata");  //
				eventTester("waiting");     //等待数据，并非错误
				eventTester("playing");     //开始回放
				eventTester("canplay");     //可以播放，但中途可能因为加载而暂停
				eventTester("canplaythrough"); //可以播放，歌曲全部加载完毕
				eventTester("seeking");     //寻找中
				eventTester("seeked");      //寻找完毕
				eventTester("timeupdate");  //播放时间改变
				eventTester("ended");       //播放结束
				eventTester("ratechange");  //播放速率改变
				eventTester("durationchange");  //资源长度改变
			}
		},
		started : function() {
			stats({reqid : 2});
		},
		statusChanged : function() {
			stats(mvStatus);
		},
		ended : function() {
			stats({reqid : 4, endplay : 1});
			$(video).one('play', $.proxy(this.started, this));//重播
		}
	}
});