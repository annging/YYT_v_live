define(function (require,exports,module) {
	var videoTotal,pageNum,listType,PageNow;
	listType = 1;
	PageNow = 1;
	var user = require('user');
	var alertify = require('alertify');

	//接口
	var host = 'http://beta.yinyuetai.com:9026',
		SUBSCRIBE_URL = host+'/channel/subscribe.json',//订阅 /channel/subscribe.json?channelId=XXX;
	 	UNSUBSCRIBE_URL = host+'/channel/unsubscribe.json',//取消订阅 /channel/unsubscribe.json?channelId=XXXX;
		mysub_list_URL = host+'/video/mysub_list.json';//获取定于频道列表/video/mysub_list.json?offset=20&size=20;翻页偏移量，每页数量
		home_list_URL = host+'/video/home_list.json';//获取定于频道列表/video/mysub_list.json?offset=20&size=20;翻页偏移量，每页数量
	var token = {access_token:'web-'+user.getToken()};
	var deviceinfo = {deviceinfo : '{"aid":"30001001"}'};

	function toD(n) {
		return n >= 10 ? '' + n : '0' + n;
	}
	function dateToYMD(timestamp) {
		var date = new Date() , Y , M , D , h ,s;
		date.setTime(timestamp);
		Y = date.getFullYear();
		M = date.getMonth()+1;
		D = date.getDate();
		h = date.getHours();
		s = date.getSeconds();
		return Y + '年' + toD(M) + '日' + toD(D) + ' ' + toD(h) + ':' + toD(s);
	}
	function App() {
		this.init();
	}
	App.prototype = {
		construct : App,
		init : function () {
			this._var();
			this.home_list();
			this.subscribe();
			this.tab_list();
			
			this.choosePage();
		},
		_var : function () {
			this.$programlist = $('.programlist');
			this.$pageBox = $('.pageBox');
			this.$pageBtn = null;
		},
		tab_list : function () {
			var $channelnav = $('.channelnav'),
				self = this;
			$channelnav.on('click', 'li' , function () {
				var $self = $(this);
				if($self.hasClass('on')) return;
				listType = $self.index()+1;
				$self.addClass('on').siblings('li').removeClass('on');
				if($self.hasClass('mysub')){
					self.mysub_list();
					return ;
				}
				self.home_list({sortType : this.dataset.sorttype});
			});
		},
		home_list : function (options) {
			var self = this;
			this.$programlist.html('');
			var params = {sortType:listType,offset:1,size:9};
			params =  _.extend(params,options,deviceinfo);
			$.ajax({
				url: home_list_URL,
				type: 'get',
				dataType: 'jsonp',
				data: params,
			})
			.done(function(data) {
				console.log(data);
				if(data.msg === 'SUCCESS'){
					var rq_data = data.data;
					if(rq_data.videos.length >= 0){
						var htmlArr = [];
						$.each(rq_data.videos, function(index, val) {
							htmlArr.push(self.tplProgram(val));
						});
						self.$programlist.append(htmlArr.join(''));
					}
					self.pageBoxPlugin(data.data.size);
				}
			})
			.fail(function() {
				console.log("error");
			})
			.always(function() {
				console.log("complete");
			});
		},
		mysub_list : function (options) {
			var self = this;
			this.$programlist.html('');
			var params = {offset:1,size:9};
			params =  _.extend(params,options,deviceinfo,token);
			$.ajax({
				url: mysub_list_URL,
				type: 'get',
				dataType: 'jsonp',
				data: params,
			})
			.done(function(data) {
				console.log(data);
				if(data.msg === 'SUCCESS'){
					var rq_db_arr = data.data;
					if(rq_db_arr.length >= 0){
						var htmlArr = [];
						$.each(rq_db_arr, function(index, val) {
							htmlArr.push(self.tplProgram(val));
						});
						self.$programlist.append(htmlArr.join(''));
					}
					self.pageBoxPlugin(data.data.size);
					return data.data.size;
				}
			})
			.fail(function() {
				console.log("error");
			})
			.always(function() {
				console.log("complete");
			});
		},
		subscribe : function () {//订阅
			function subscribe() {
				var $self = $(this),
					jqXHR,
					url;
				if($self.hasClass('disabled')){
					url = UNSUBSCRIBE_URL;
				}else{
					url = SUBSCRIBE_URL;
				}
				var params = _.extend({channelId: this.dataset.channelid},deviceinfo,token);
				jqXHR = $.ajax({
					url: url,
					type: 'get',
					dataType: 'jsonp',
					data: params,
				})
				.done(function(data) {
					if(data.msg == 'SUCCESS'){
						if(url == SUBSCRIBE_URL){
							alertify.success('关注成功');
							$self.html('已关注');
							$self.addClass('disabled');
						}else{
							alertify.success('取消关注成功');
							$self.html('关注');
							$self.removeClass('disabled');
						}
					};
				})
				.fail(function() {
					console.log("error");
				})
				.always(function() {
					console.log("complete");
				});
			}
			this.$programlist.on('click','.meet',subscribe);
		},
		tplProgram : function (info) {
			var bSubscribed = info.channel.subscribed , status , statusText , link , html , videoType , playlong;
			videoType = info.videoType;
			if(!bSubscribed){
				status = '';
				statusText = '关注';
			}else{
				status = 'disabled';
				statusText = '已关注';
			}
			if(videoType=='LIVE'){
				playlong = '';
			}else{
				playlong = '<span class="viedo_time">'+dateToYMD(info.playtime).split(' ')[1]+'</span>';
			}
			link = 'living.html?videoId='+info.videoId+'&channelid='+info.channel.channelId+'&videoType='+info.videoType;
			html = '<li class="program" data-channelid="'+info.channel.channelId+'">'+
					'<h3 class="program-top">'+
						'<img src="'+info.channel.profileImg+'" alt="" class="avator">'+
						'<span class="name">'+info.channel.channelName+'</span>'+
						'<span class="meet '+status+'" data-channelid="'+info.channel.channelId+'">'+statusText+'</span>'+
					'</h3>'+
					'<a href="'+link+'"><div class="viedoBox">'+
						'<img src="'+info.posterPic+'" alt="" class="videoImg">'+
						'<div class="shadow"></div>'+
						'<div class="play_ico"></div>'+
						playlong+
					'</div></a>'+
					'<div class="program_msg">'+
						'<a href="'+link+'" class="title">'+info.videoName+'</a>'+
						'<div class="program_time">'+dateToYMD(info.onAirStartTime)+'</div>'+
						'<div class="program_support clearfix">'+
							'<span class="program_people">'+info.onlineCount+'</span>'+
							'<span class="program_love">'+info.likeCount+'</span>'+
						'</div>'+
					'</div>'+
				'</li>';
			return html;
		},
		pageBoxPlugin : function (videoTotal) {
			this.$pageBox.html('');
			if(videoTotal<=9)return;
			pageNum = Math.ceil(videoTotal/9);

			var pre , next , allPage , num , numArr;

			pre = '<span class="pre" style="display: none;">上一页</span>';
			next = '<span class="next">下一页</span>';
			allPage = '<em class="allPage">共'+pageNum+'页</em>';
		 	num = $('<div class="num"></div>');
		 	numArr = [];

			for (var i = 0; i < pageNum; i++) {
				var str ;
				if(i==0){
					str = '<span class="now">'+(i+1)+'</span>';
				}else if(i>=10){
					str = '<span style="display:none;">'+(i+1)+'</span>';
				}else{
					str = '<span>'+(i+1)+'</span>';
				}
				numArr.push(str);
			}
			num.append(numArr.join(''));

			this.$pageBox.append(pre);
			this.$pageBox.append(num);
			this.$pageBox.append(next);
			this.$pageBox.append(allPage);
			this.$pageBtn = $('.num span');
			this.$pre = this.$pageBox.find('.pre');
			this.$next = this.$pageBox.find('.next');

			this.$pageBox.on('mouseover','span',function () {
				var $self = $(this);
				$self.addClass('hover');
			});

			this.$pageBox.on('mouseout','span',function () {
				var $self = $(this);
				$self.removeClass('hover');
			});
		},
		choosePage : function () {
			var self = this;
			function numChange() {
				self.$pageBtn.eq(PageNow-1).addClass('now').siblings('span').removeClass('now');
				if(PageNow!=1){
					self.$pre.show();
				}else{
					self.$pre.hide();
				}

				if(PageNow!=pageNum){
					self.$next.show();
				}else{
					self.$next.hide();
				}

				if(PageNow>5){
					
				}
				if(listType==3){
					// self.mysub_list({offset : PageNow});
				}else{
					// self.home_list({offset : PageNow});
				}
			}

			this.$pageBox.on('click','.num span',function () {
				var $self = $(this);
				PageNow = parseInt(this.innerHTML);
				numChange();
			});
			this.$pageBox.on('click','.pre',function () {
				var $self = $(this);
				PageNow -= 1;
				numChange();
			});
			this.$pageBox.on('click','.next',function () {
				var $self = $(this);
				PageNow += 1;
				numChange();
			});
		}

	}
	return new App();
});