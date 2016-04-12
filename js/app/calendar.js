define(function (require,exports,module) {
	var videoTotal,pageNum,listType,PageNow;
	listType = 1;
	PageNow = 1;
	var user = require('user');
	var alertify = require('alertify');

	//接口
	var host = 'http://beta.yinyuetai.com:9026',
		UPCOMING_LIST_URL = host+'/upcoming/list.json';//获取定于频道列表/video/mysub_list.json?offset=20&size=20;翻页偏移量，每页数量
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
		return Y + '年' + toD(M) + '月' + toD(D) + '日 ' + toD(h) + ':' + toD(s);
	}
	function App() {
		this.init();
	}
	App.prototype = {
		construct : App,
		init : function () {
			this._var();
			this.getlist();
			this.tabTips();
		},
		_var : function () {
			this.$listBox = $('.program-oneday-list');
		},
		getlist : function () {
			var self = this;
			var params = {offset:0 ,size:100};
			params = _.extend(params,deviceinfo);
			$.ajax({
				url: UPCOMING_LIST_URL,
				type: 'get',
				dataType: 'jsonp',
				data: params,
			})
			.done(function(data) {
				if(data.msg=='SUCCESS'){
					var data_Arr = data.data.schedules;
					var htmlArr = [];
					$.each(data_Arr, function(index, val) {
						htmlArr.push(self.tplProgram(val));
					});
					self.$listBox.html(htmlArr.join(''));
				}
				console.log("success");
			})
			.fail(function() {
				console.log("error");
			})
			.always(function() {
				console.log("complete");
			});
			
		},
		tabTips : function () {
			this.$listBox.on('click','.tips',function () {
				var $self = $(this),
				$clickBox = $self.siblings('.clickBox');
				$clickBox.show();
			});
			this.$listBox.on('click','.shadow',function () {
				var $self = $(this),
				$clickBox = $self.parent('.clickBox');
				$clickBox.hide();
			});
		},
		tplProgram : function (info) {
			var html;
			html = '<li class="program-oneday-li clearfix">'+
						'<div class="videoBox">'+
							'<img src="'+info.posterPic+'" alt="">'+
							// '<span class="palytime">50:00</span>'+
						'</div>'+
						'<div class="program-msg">'+
							'<h4 class="title">'+info.liveName+'</h4>'+
							'<span class="time">'+dateToYMD(info.onAirTime)+'</span>'+
						'</div>'+
						'<div class="tips"></div>'+
						'<div class="clickBox">'+
							'<div class="shadow"></div>'+
							'<div class="erweima"></div>'+
						'</div>'+
					'</li>';
			return html;
		}
	}
	return new App();
});