require.config({
	baseUrl : Y.jsBaseUrl,
	paths : {
		// Libraries
		'jquery.lazyload' : 'lib/jquery.lazyload-1.8.4-min',
		'jquery.touchswap' : 'lib/jquery.touchswap-1.6.3-min',
        'jquery.atwho' : 'modules/widget/textarea/jquery.atwho.min',
        'jquery.caret' : 'modules/widget/textarea/jquery.caret.min',
		juicer : 'lib/juicer-0.6.5',
		cookie : 'modules/util/cookie',
		prober : 'modules/util/prober',
		dialog : 'modules/widget/dialog/dialog',
		loginBox : 'modules/yinyuetai/loginbox',
		ajax : 'modules/util/ajax',
		ajaxform : 'modules/util/ajaxform',
		uri : 'lib/uri',
		pushstream : 'lib/pushstream',
		scrollBar : 'lib/scrollBar',
		url : 'modules/url',

		//store.set('username', 'marcus')   Store 'marcus' at 'username'
		//store.get('username') Get 'username'
		//store.remove('username')  Remove 'username'
		//store.clear() Clear all keys
		//store.set('user', { name: 'marcus', likes: 'javascript' })    Store an object literal - store.js uses JSON.stringify under the hood
		//var user = store.get('user')  Get the stored object - store.js uses JSON.parse under the hood
		//store.getAll().user.name == 'marcus' Get all stored values
		store : 'lib/store.min',

		alertify : 'modules/widget/alertify',
		swfobject : 'lib/swfobject-2.0-min',
		page : 'modules/yinyuetai/page',
		drag : 'modules/interaction/drag',
		scrollbar : 'modules/widget/tinyscrollbar',
		pwdencrypt : 'modules/yinyuetai/passwordencrypt',
		user : 'modules/yinyuetai/user/user',
		impress : 'modules/widget/impress',
		placeholder : 'modules/widget/placeholder',
		fancard : 'modules/yinyuetai/fan/fancard',
		smart : 'modules/util/smart',
		fastclick : 'lib/fastclick.1.0.0',
		moment : 'app/vchart/awards2014/moment.min',

		//player
		h5mvplayer: 'modules/yinyuetai/player/h5/h5-mvplayer'
	},

	shim : {
		juicer : {
			exports : 'juicer'
		},
		uri : {
			exports : 'Uri'
		},
		pushstream : {
			exports : 'PushStream'
		},
		swfobject : {
			exports : 'swfobject'
		},
		impress : {
			exports : 'impress'
		}
	}
});
(function() {
	var decode, encode, Cookie = {};

	decode = decodeURIComponent;	//解码
	encode = encodeURIComponent;	//编码

	Cookie.get = function(key, options) {
		var cookies, converter, raw;

		validate(key);
		options = options || {};
		raw = options.raw || false;
		converter = options.converter || function(o) {return o;};

		cookies = parseCookie(document.cookie, !raw);
		return converter(cookies[key]);
	};

	Cookie.set = function(key, value, options) {
		var expires, domain, path, text, date;

		validate(key);
		options = options || {};
		expires = options['expires'];
		domain = options['domain'];
		path = options['path'];

		if (!options['raw']) {
			value = encode(String(value));
		}

		text = key + '=' + value;
		date = expires;

		if (typeof date === 'number') {
			date = new Date();
			date.setDate(date.getDate() + expires);
		}

		if (date instanceof Date) {
			text += '; expires=' + date.toUTCString();
		}

		if (domain && domain.length) {
			text += '; domain=' + domain;
		}

		if (path && path.length) {
			text += '; path=' + path;
		}

		//http://www.oschina.net/question/8676_3423 secure作用
		if (options['secure']) {
			text += '; secure';
		}

		document.cookie = text;
		return text;
	};

	Cookie.remove = function(key, options) {
		options = options || {};
		options['expires'] = new Date(0);
		return this.set(key, '', options);
	};

	Y.Cookie = Cookie;
//把document.cookie字符串解析为{cookieName : cookieValue}
	function parseCookie(text, shouldDecode) {
		var i, len, cookies, decodeValue, cookieParts, cookieName, cookieValue, cookieNameValue;

		cookies = {};
		decodeValue = shouldDecode ? decode : (function(o) {return o;});
		cookieParts = text.split(/;\s/g);

		for (i = 0, len = cookieParts.length; i < len; i++) {
			cookieNameValue = cookieParts[i].match(/([^=]+)=/i);
			if (cookieNameValue instanceof Array) {
				try {
					cookieName = decode(cookieNameValue[1]);
					cookieValue = decodeValue(cookieParts[i].substring(cookieNameValue[1].length + 1));
				} catch (e) {}
			} else {
				cookieName = decode(cookieParts[i]);
				cookieValue = '';
			}

			if (cookieName) {
				cookies[cookieName] = cookieValue;
			}
		}

		return cookies;
	}

	function validate(key) {
		if (!(key && key.length)) {
			throw new TypeError('Cookie name must be a non-empty string');
		}
	}

	/************cookie end *****************/
	/************wrap版跳转逻辑start *****************/
	//var UA = navigator.userAgent.toLowerCase();
	//var isIphone = /iphone/i.test(UA);
	//var isAndroid = /android/i.test(UA);
	//var loc = location.href, search = location.search, pathname = location.pathname;
	//var frompc = search.indexOf('frompc') === -1;//wap页点击电脑版按钮时传入
    //
	//if ((document.domain == "www.yinyuetai.com" && pathname === '/') ||
	//		(document.domain == "beta.yinyuetai.com" && pathname === '/')) {//首页跳转到pop页
	//	if (isAndroid || isIphone) {
	//		var isReadWap = Cookie.get('isReadWap');
	//		if (!isReadWap) {
	//			Cookie.set('isReadWap', 'yes', {
	//				domain : 'yinyuetai.com',
	//				path : '/'
	//			});
	//		}
	//		location.href = "http://m.yinyuetai.com";
	//	}
	//} else if (pathname.indexOf('/video/') == 0 && frompc) {
	//	if (isIphone || isAndroid) {
	//		location.href = loc.replace(/\/video\//, '/wap/video/');
	//	}
	//} else if (pathname.indexOf('/playlist/') == 0 && frompc) {
	//	if (isIphone || isAndroid) {
	//		location.href = loc.replace(/\/playlist\//, '/wap/playlist/');
	//	}
	//}
	/************wrap版跳转逻辑end *****************/


	/************广告逻辑start isLoadByPartner 判断当前页面是否是因刷广告pv而引入的*****************/
	Y.isLoadByPartner = (function() {
		var result = false;
		try {
			if (window.parent != window.self) {
				return true;
				/*if (document.domain == 'v.yinyuetai.com' || document.domain == 'v.beta.yinyuetai.com' || document.domain == 'vchart.yinyuetai.com' || document.domain == 'so.yinyuetai.com') {
					if (window.parent.Y && window.parent.Y.jsBaseUrl) {//是自己用来刷pv而造的iframe
						result = true;
					}
				} else {
					result = true;
				}*/
			}
		} catch (e) {}
		return result;
	})();
	/************广告逻辑end *****************/
	window.$config = window.$config || {};
	require(['fastclick'], function(fastClick) {
		fastClick.attach(document.body);
	})
})();
