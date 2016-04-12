define(function(require) {
	user = require('user');
	prober = require('prober');
	placeholder = require('placeholder');
	AutoComplete = require('modules/widget/autocomplete');

	var Topbar, user, prober, AutoComplete, placeholder,historyStoreArr;
	
	var host = 'http://beta.yinyuetai.com:9026',
		SEARCH_URL = host+'/search/suggest.json';//'search/suggest.json'?size=10&keyword=**&type='';
	var token = {access_token:'web-'+user.getToken()};
	var deviceinfo = {deviceinfo : '{"aid":"30001001"}'};

	

	if(localStorage.history){
		historyStoreArr = _.union(localStorage.history.split('**'));
	}else{
		historyStoreArr = [];
	}

	Topbar = Backbone.View.extend({
		initialize : function() {
			var self = this;
			this.$el = $('.topbar');
			this.$searchBox = $('.searchBox');
			$('body').on('click', '.J_login', function(e) {
				self._showLoginBox(e);
			});

			if (!user.isLogined()) {
				this._notLoginHandler();
			}

			user.logined(function() {
				$(window).off('focus');
				self._loginHandler();
			});

			this._menusHoverEffect();
			if(this.$searchBox.length == 1){
				this._searchInputFocusEffect();
				this._searchVideoChannel();
				this._initHistory();
			};
			
			
			$(window).resize(function() {
			});

			new AutoComplete(self.$el.find('[name=keyword]'), {
				source : 'http://so.yinyuetai.com/search/smart-search',
				container : self.$el.find('.autocomplete'),
				template : $('#autocompleteTpl').html()
			});

			if (location.href.indexOf('so.yinyuetai.com') != -1 || location.href.indexOf('i.yinyuetai.com/s') != -1) {
				self.$el.find('[name=keyword]').parents('form').attr('target', '');
			}

			createIframeShim.call(self);
		},
		_showLoginBox : function(e) {
			e.preventDefault();
			require(['loginBox'], function(loginBox) {
				if (loginBox.status() == 'hide') {
					loginBox.trigger('show');
				} else {
					loginBox.trigger('hide');
				}
			});
		},
		_menusHoverEffect : function() {
			var $useInfo = $('.useInfo'),
				$menu = $useInfo.find('.loglist');
			$useInfo.mouseover(function () {
				$menu.show();
			});
			$useInfo.mouseout(function () {
				$menu.hide();
			});
		},
		_searchInputFocusEffect : function() {  //搜索框状态
			var self = this;
			var $input = this.$searchBox.find('.searchWin'),
				$searchResultBox = this.$searchBox.find('.searchResultBox'),
				$cancelBtn = $('.searchCloseBtn');
			$input.focus(function() {
				$searchResultBox.show();
			});
			function searchResultBoxHide() {
				$searchResultBox.hide();
			}
			$('body').click(searchResultBoxHide)
			this.$searchBox.click(function(e) {
				e.stopPropagation();
			});
			$cancelBtn.click(function () {
				$input.val('');
				$input.focus();
			});
			$('.shadow').click(searchResultBoxHide);
		},
		_initHistory : function () {
			var $input = this.$searchBox.find('.searchWin'),
				$historyBox = this.$searchBox.find('.histortyBox'),
				$history = this.$searchBox.find('.history');
			$history.html(historyStoreArr.join(''));
		},
		_searchVideoChannel : function () {  //搜索结果显示
			var $input = this.$searchBox.find('.searchWin'),
				$historyBox = this.$searchBox.find('.histortyBox'),
				$result = this.$searchBox.find('.result');
				function searchAjax(val) {
					var self = this;
					var params = {size:10,keyword:val,type:''};
					params = _.extend(params,deviceinfo);
					$.ajax({
						url: SEARCH_URL,
						type: 'get',
						dataType: 'jsonp',
						data: params,
					})
					.done(function(data) {
						console.log(data);
						if(data.msg=='SUCCESS'){
							var rq_db_arr = data.data,
								htmlArr = [];
							$.each(rq_db_arr, function(index, val) {
								htmlArr.push(tplSearch(val));
								// historyStoreArr.push(tplSearch(val));
							});
							// localStorage.history = historyStoreArr.join('**');
							$result.html(htmlArr.join(''));
							$historyBox.hide();
						}
					})
					.fail(function() {
						console.log("error");
					})
					.always(function() {
						console.log("complete");
					});
				}
				var throttled = _.throttle(searchAjax, 100);
				$input.keyup(function () {
					throttled(this.value);
				});
				$result.on('click','a',function () {
					historyStoreArr.push(this.outerHTML);
					localStorage.history = historyStoreArr.join('**');
				});
		},
		_changeTabStatus : function () {
			var pramJson = {
				sortType : 1,//排序类型，1:按照时间，2:按照人气
				offset : 2 , //翻页偏移量
				size :   20 //每页数量，默认20
			}
			$.ajax({
				url: '../../../mock/home_list.json',
				type: 'get',
				dataType: 'json',
				data: {}
			})
			.done(function(data) {
				console.log("success");
			})
			.fail(function() {
				console.log("error");
			})
			.always(function() {
				console.log("complete");
			});
		},
		_notLoginHandler : function() {
			var flag, self;

			self = this;
			flag = 0;

			$(window).on('focus', function() {
				user.emit();
				if (user.isLogined() && flag == 0) {
					flag = 1;
					require(['loginBox'], function(loginBox) {
						if (loginBox.status() == 'show') {
							self.$el.find('.J_login').click();
						}
					});
				}
			});
		},
		_loginHandler : function() {   //登陆后的控制
			var userinfo, decoration, login;
			userinfo = this.$el.find('.useInfo');
			login = this.$el.find('.signOut').eq(0);
			userinfo.find('.name').text(subString(user.get('userName'), 10)).attr('title', user.get('userName')); //设置用户名
			userinfo.find('.avator').attr('src',user.get('headImg'));
			login.hide(); //隐藏登录注册
			userinfo.show();	//显示用户信息
		}
	});
	function tplSearch(info) {
		var info = info || {},
		    html = '<a href="search.html?id='+info.id+'&type='+info.type+'&keyword='+info.suggestName+'" class="li">'+info.suggestName+'</a>';
	    return html;
	}
	function subString(str, len, hasDot) {
		var newLength, newStr, chineseRegex, singleChar, strLength, i;

		newLength = 0;
		newStr = "";
		chineseRegex = /[^\x00-\xff]/g;
		singleChar = "";
		strLength = str.replace(chineseRegex, "**").length;

		for (i = 0; i < strLength; i++) {
			singleChar = str.charAt(i).toString();
			if (singleChar.match(chineseRegex) != null) {
				newLength += 2;
			}
			else {
				newLength++;
			}
			if (newLength > len) {
				break;
			}
			newStr += singleChar;
		}

		if (hasDot && strLength > len) {
			newStr += "...";
		}
		return newStr;
	}

	function createIframeShim() {
		var root = this.$el;

		iframe().css({
			width : '100%',
			height : '41px'
		}).insertAfter(root);

		var menushim = iframe().css({
			top : '41px',
			display : 'none'
		}).appendTo(root.find('.content'));

		root.find(".hoverhandler").hover(function() {
			var dropdownMenu = $(this).find('.dropdownmenu');
			menushim.css({
				display : 'block',
				width : (dropdownMenu.length > 0 && dropdownMenu.data('width')) || $(this).find('li').eq(0).width(),
				height : (dropdownMenu.length > 0 && dropdownMenu.data('height')) || $(this).find('li').length * 33 - 4,
				left : (dropdownMenu.length > 0 && dropdownMenu.offset().left) || $(this).offset().left
			})
		}, function() {
			menushim.css({
				display : 'none'
			})
		});
	}

	function iframe() {
		return $('<iframe />').attr({
			'frameborder' : 0,
			'scrolling' : 'no',
			'class' : 'iframeshim'
		});
	}

	new Topbar({
		$el : $('.topbar')
	});
});
