/**
 * Created with IntelliJ IDEA.
 * User: Administrator
 * Date: 13-7-2
 * Time: 上午10:24
 * @fileoverview p2p相关
 * 流程说明：js先启动通过加载object对象启动浏览器插件，然后再由插件启动yyt进程，插件与yyt进程通信取到yyt的端口号（get_port）及版本号(get_yyt_version)
 * js判断yyt版本是否满足需求，然后告知flash yyt的端口号，flash拿到yyt的版本号才能开始走p2p
 * 备注：yyt的启动可能有延迟，所以由js来重试30次取yyt的端口号然后传给flash
 */
define(function(require, exports, module) {
	var Ajax = require('ajax');

	var isIe = navigator.userAgent.toLowerCase().indexOf("msie") !== -1;
	var win = window, isBuffering = false;

	var p2pInfo = {
		'v2' : '1.2.0.5',//音悦mini v2的起始版本，达到这个版本后可直接下载MV
		version : '', //由后台读取
		url : 'http://www.yinyuetai.com/dl/yinyue_plus',
		init : function() {
			var $div = $('#yyt_plugin');
			if (!$div.length) {
				$div = $('<div id="yyt_plugin"></div>').css({
					'width' : '1px',
					'height' : '1px',
					'overflow' : 'hidden',
					'position' : 'absolute'
				}).appendTo(document.body);
				load_plugin($div);
				getPluginPort();
			}
		}
	};

	$(function() {
		p2pInfo.init();
	});

	//加截p2p插件，由插件来启动yyt
	function load_plugin($ele) {
		var p2pPlugin, yinyuetaiplayer;

		if (isIe) {
			try {
				var YYT_ACTIVEX = new ActiveXObject("YYT_ACTIVEX.yyt_activexCtrl.1");
			} catch (e) {}
			if (YYT_ACTIVEX) {
				$ele.html('<object id=\"yinyuetai\" classid=\"clsid:264EDF5A-4276-4271-BBB4-5C1A5454A2D2\"  width=0 height=0 codebase=\"\"></object>');
			}
		} else {
			navigator.plugins.refresh(false);
			for (var a = navigator.plugins, b = a.length - 1; b >= 0; b--) {
				if (a[b].name.indexOf("YinYueTai Bolt") != -1) {
					$ele.html('<object id=\"yinyuetai\" type=\"application/x-yytbolt-plugin\" width=0 height=0 ></object>');
					break;
				}
			}
		}

		//强制升级功能
		//p2p插件升级会把自己杀死(进程)，然后自启，启动完成后会触发PluginSetPort事件
		p2pPlugin = document.getElementById('yinyuetai');
		if (p2pPlugin) {
			if (isIe) {
				p2pPlugin.attachEvent('PluginSetPort', onPluginPort);
			} else {
				p2pPlugin.addEventListener('PluginSetPort', onPluginPort, false);
			}
		}

		function onPluginPort(port) {
			try {
				yinyuetaiplayer = document.getElementById('yinyuetaiplayer');
				yinyuetaiplayer && yinyuetaiplayer.setPort(port * 1);
			} catch (e) { }
		}
	}

	//比较p2p当前的版本号与参数版本号version2，1代表大于，0代表=，-1代表小于
	function isPluginWorks(version2) {
		var p2pPlugin = document.getElementById("yinyuetai");
		var version1 = p2pPlugin.get_yyt_version().split('.');//version1为插件的当前版本号
		version2 = version2.split('.');

		for (var i = 0, len = version1.length; i < len; i++) {
			var item1 = version1[i] * 1, item2 = version2[i] * 1 || 0;
			if (item1 > item2) {
				return 1;
			} else if (item1 < item2) {
				return -1;
			}
		}
		return 0;
	}

	/*
	 * @param isFirst 是否播放器初始化时，此时提示不能关闭；缓冲时如果用户安装了p2p且是最新版才提示用户切换码流
	 */
	function jsGetPromptMsg(isFirst) {
		var p2pPlugin = document.getElementById("yinyuetai"),
				player = document.getElementById('yinyuetaiplayer');
		var down_url = p2pInfo.url;
		var template = _.template("<p align='left'><font size='15' face='微软雅黑' color = '#ffffff'><%= text0 %></font><font size='15' face='微软雅黑' color = '#99cc33'><a href='" +
				'<%= down_url %>' + "' target='_blank'><u><%= text1 %></u></a></font></p>");
		var downPageUrl = "<font size='15' color = '#99cc33' face='微软雅黑'> <a href='http://www.yinyuetai.com/apps/yinyue_p2p' target='_blank'><b>音悦加速器</b></a> </font>";

		var tip = '';
		var showTip = function() {
			if (tip) {
				var autohide = isFirst ? false : true;
				try {
					player.displaySetupP2PMsg({message : tip, autohide : autohide});
				} catch (e) {}
			}
		};
		if (p2pPlugin != null) {
			Ajax.getJSON('http://v.yinyuetai.com/p2p/get-version', '', function(result) {
				p2pInfo.version = result.clientPublish.versionInfo;
				if (isPluginWorks(p2pInfo.version) < 0) {
					tip = template({
						text0 : "建议您立即更新" + downPageUrl + "，享受极速高清体验。",
						text1 : '立即更新',
						down_url : down_url
					});
				} else if (!isFirst) {
					try {
						//卡的时候切清晰度,如果已经安装了加速器，而且也不用升级
						player.displaySwitchBitrateMsg({autohide : true});
					} catch (e) {}
				}
				showTip();
			});
		} else {
			if (!isFirst) {//todo 暂时去掉没装p2p时的默认提示
				var text0 = isFirst ? "推荐安装" + downPageUrl + "，体验极速观影快感！" : "您的网速不太给力，下载" + downPageUrl + "享受极速高清体验。";
				tip = template({
					text0 : text0,
					text1 : '立即安装',
					down_url : down_url
				});
				showTip();
			}
		}
	}

	//js重试30次取yyt的端口号
	function getPluginPort() {
		var port, timer, total = 0;
		timer = setInterval(function() {
			port = getPort();
			total++;
			if ((port && port > 0) || total > 30) {//停止
				clearInterval(timer);
				if ((port && port > 0)) {//取到端口号，一定是已经启动插件且启动了YYT
					if (isPluginWorks("1.0.2.12") > 0) {//低于2.12的不走p2p
						try {
							var yinyuetaiplayer = document.getElementById('yinyuetaiplayer');
							yinyuetaiplayer && yinyuetaiplayer.setPort(port.toInt());
						} catch (e) { }
					}
				}
			}
		}, 1000);
	}

	/********************flash相关接口 start********************/
	function hasPlugin() {
		var p2pPlugin = document.getElementById("yinyuetai");
		if (p2pPlugin != null) {
			return isPluginWorks("1.0.2.12") > 0 ? 'true' : 'false';
		}
		return 'false';
	}

	function getPort() {
		var yinyuetai = document.getElementById("yinyuetai");
		return yinyuetai && yinyuetai.get_port();
	}

	//播放器开始播放时调用
	function yytStartPlayMedia() {
		jsGetPromptMsg(true);
	}

	//缓冲的时候调用
	function videoBuffering() {
		isBuffering = true;
		setTimeout(function() {
			if (isBuffering) {
				jsGetPromptMsg(false);
			}
		}, 5000);
	}

	function videoPlaying() {
		isBuffering = false;
	}

	win['hasPlugin'] = hasPlugin;
	win['getPort'] = getPort;
	win['yytStartPlayMedia'] = yytStartPlayMedia;
	win['videoBuffering'] = videoBuffering;
	win['videoPlaying'] = videoPlaying;
	/********************flash相关接口 end********************/
	return {
		isv2 : function() {
			if (hasPlugin() == "true") {
				return isPluginWorks(p2pInfo.v2) >= 0;
			}
			return false;
		}
	};
});