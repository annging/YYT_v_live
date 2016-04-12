/**
 * Created with IntelliJ IDEA.
 * User: zhangyan
 * Date: 13-7-2
 * Time: 上午10:19
 * @fileoverview flash相关的api
 */

define(function(require, exports, module) {

	var prober = require('prober'),
		alertify = require("alertify"),
		user = require('user');

	var win = window, $doc = $(document);

    var nextVideoInfo = {};

	//获取播放器
	function getPlayer(playerId) {
		playerId = playerId || 'yinyuetaiplayer';
		return $('#' + playerId)[0];
	}

	/****************播放器接口********************/

	function jsLight(flag) {//开关灯
		var $flashOverlay = $('#flashOverlay'),
				$vPlay = $('#vPlay'),
				$win = $(window),
				player = getPlayer();
		if (!$flashOverlay.length) {
			$flashOverlay = $('<div id="flashOverlay" class="flash_overlay"></div>').css({
				height : $(document.body).height() + 'px'
			}).html('<a class="close_button">关闭</a>').appendTo(document.body);
			var $close = $flashOverlay.find('.close_button');
			$close.on('click', function() {
				try {
					player.light('off');
				} catch (e) {}
				jsLight('on');
			});

			if (prober.browser.ie6) {
				$win.scroll(function() {
					if (flag == 'off') {
						$close.css('top', ($win.scrollTop() + 31) + 'px');
					}
				});
			}
		}
		if (flag == 'off') {
			$flashOverlay.fadeIn();
			$vPlay.addClass("v_play_close_light");
			$vPlay.css('z-index', 1000);
			$doc.on('keydown', function(event) {
				if (event.which == 27) {
					try {
						player.light('off');
					} catch (e) {}
					jsLight('on');
					$doc.off('keydown');
				}
			});
		} else if (flag == 'on') {
			$vPlay.css('z-index', 1);
			$flashOverlay.fadeOut();
		}
		return false;
	}

	//播放器上的评论
	function jsComment() {
		try {
			getPlayer().light('off');
		} catch (e) {}
		jsLight('on');
		var $comment = $('.comment');
		var to = $comment.offset().top + $(win).scrollTop();
		$("body,html").animate({
			scrollTop : to
		}, 500);
		$comment.find('textarea[name=content]').focus();
	}

	//视频截图功能不能浏览器不同的帮助连接
	function ToCaptureVideoPlayerServicePage() {
		var userAgent = navigator.userAgent.toLowerCase();
		var issogou = /se 2.x/.test(userAgent);
		var ismaxthon = /maxthon/.test(userAgent);
		if (prober.browser.ie) {
			window.open('http://www.yinyuetai.com/service/problem#tabid=17&index=59');
		} else {
			if (issogou) {
				window.open('http://www.yinyuetai.com/service/problem#tabid=17&index=60');
			} else if (ismaxthon) {
				location.href = 'http://www.yinyuetai.com/service/problem#tabid=17&index=60';
			} else if (prober.engine.webkit) {
				window.open('http://www.yinyuetai.com/service/problem#tabid=17&index=61');
			}
		}
	}

	//720p以上的视频需要登录才能观看
	function checkUserLogined() {
		return user.isLogined();
	}

	function checkIsVipUser(){
		return user.isVipUser();
	}

	function requestPopupLogin(success, cancel) {
		if(!user.isLogined()){
			getPlayer()["pauseItem"];
		}

		user.checkVIP(function() {
			try {
				getPlayer()[success]();
			} catch (e) {}
		}, function() {
			getPlayer()[cancel]();
			getPlayer()["displayPromptbarMsg"]({
				"message": "<font color='#ffffff'>尊享1080P视觉体验&nbsp;请</font> <a href='http://vip.yinyuetai.com' target='_blank'><u><font color='#ccff99'>开通会员</font></u></a>",
				"autohide": true
			});
		});
	}

	Y.flash = Y.flash || {};//flash接口相关的命名空间
	Y.flash.popupLogin = function(callback) {//保存截图
		user.login(function() {
			user.checkEmail(function() {
				try {
					getPlayer()[callback](user.get('userId'));
				} catch (e) {}
			});
		})
	};

	//弹窗播放
	var MINI_PLAYWERID = 'yinyuetaiplayer_mini';

	function jsPopupWindowPlayer(b) {
		if ($('#' + MINI_PLAYWERID).length > 0) {
			return;
		}
		try {
			getPlayer().light('off');
		} catch (e) {}
		jsLight('on');
		var width = 500;
		if (!(b > 0)) {
			b = 16 / 9;
		}
		var height = 500 / b;
		var maxHeight = screen.height * 0.8;
		if (height > maxHeight) {
			width = width * maxHeight / height;
			height = maxHeight;
		}
		var loadFlash = function(flashloader) {
			flashloader.render('yinyuetaiplayer_mini_box', {
				swfUrl : Y['swfs']['mvplayer'],
				vars : {
					videoId : Y.video.id,
					sendsnaplog : true,
					usepromptbar : true,
                    amovid : "5f4ffbc12418024a8714ab798b6c58ca"
				},
				properties : {
					id : MINI_PLAYWERID,
					name : MINI_PLAYWERID
				}
			});
		};

		var setPos = function($el) {
			$el.css({
				left : 'auto',
				top : 'auto',
				marginLeft : 'auto',
				marginTop : 'auto',
				right : '70px',
				bottom : 0
			});
		};

		require(['dialog', 'drag', 'modules/yinyuetai/player/flashloader'], function(Dialog, Drag, flashloader) {
			var html = '<div style="position:relative;z-index:2;height:' + height + 'px" id="yinyuetaiplayer_mini_box"></div>';
			new Dialog(html, {
				title : '<em class="icon20_v_dialog"></em>' + Y.video.title,
				width : width,
				height : height,
				hasMark : false,
				isAutoShow : true,
				isRemoveAfterHide : true,
				className : 'player_dialog',
				onShow : function() {
					var $el = this;
					loadFlash(flashloader);
					setPos($el);
					new Drag($el.find('.J_title'), {
						target : $el
					});
					try {
						getPlayer().pauseItem();
					} catch (e) {}

				},
				onHide : function() {
					try {
						var miniPlayer = getPlayer(MINI_PLAYWERID);
						var position = miniPlayer.getVideoPosition();
						getPlayer().seek(position);
					} catch (e) {}
				}
			});
		});
	}

	//播放器开始播放时调用
	function jsGetMediaMetaData(videoId, objectId) {
		if (objectId === MINI_PLAYWERID) {
			var miniPlayer = getPlayer(MINI_PLAYWERID);
			var position = getPlayer().getVideoPosition();
			miniPlayer.seek(position);
		}
		jsGetMediaMetaDataCallbacks.fire(videoId, objectId);
	}

	//播放器播放状态更改时调用，参数｛type:'mvplayerReady',objectId:''｝
	function flashPlayerEventFunc(obj) {
		if (obj["type"] == "mvplayerReady") {
			getPlayer(obj["objectId"]).addStateListener('mvplayerPlayerState', 'playerState');
		}
		flashPlayerEventFuncCallbacks.fire(obj);
	}

	//参数state值：PAUSED|PLAYING|BUFFERING
	function playerState(oldState, newState, objectId) {
		if (oldState == 'PAUSED' && newState == 'PLAYING') {
			if (objectId == MINI_PLAYWERID) {
				try {
					getPlayer().pauseItem();
				} catch (e) {}
			} else {
				try {
					var miniPlayer = getPlayer(MINI_PLAYWERID);
					miniPlayer && miniPlayer.pauseItem();
				} catch (e) {}
			}
		}

		if(newState == "PLAYING"){
			scrollWinPopPlayer();
		}
		playerStateCallbacks.fire(oldState, newState, objectId);
	}

	//mv或者悦单播放完毕时调用， obj:(videoId/playlistId, objectId)
	function yytVideoComplete(videoId, objectId) {
		yytVideoCompleteCallbacks.fire(videoId, objectId);
	}

	function playerErrorHandler() {
		playerErrorHandlerCallbacks.fire();
	}

    function playerVideoComingToEnd(){
        var dat = getNextVideoInfo();
        if(dat){
            var videoname = dat["video"];
            var artist = dat["artist"];

            var str = "<font color='#ffffff' size='14' face='微软雅黑'>即将为您自动播放下一首MV，" + "<font color='#ffffff' size='16'>《" + videoname + "》" + "---" + artist + "</font>" + "</font>";
            nextVideoInfo = {"message":str, "autohide":false, "duration":20};

            getPlayer().displayComToEndMessage(nextVideoInfo);
        }
    }



    /**
     * 页面滚动到看不到播放器的时候弹出小播放器
     */
    function scrollWinPopPlayer(){
        var hasPop = false,
            vplayerContainer,
            scrollAnchorY;
        var cover = '<div class="pop_player_cover" style="display: none; position: absolute; top: 10px; width: 420px; height: 225px; background-color: #333; cursor: move">' +
            '<div style="width: 420px; height: 30px; line-height: 30px;color: #ccc;font-size: 16px;text-align: center;margin-top: 90px;">点击鼠标可拖动视频位置</div>' +
            '</div>';
        var $cover;

        vplayerContainer = $("#vPlay");
        scrollAnchorY  = vplayerContainer.offset().top + vplayerContainer.height();

        $(window).scroll(function(){
            checkPlayerPos();
        });


        //检测播放器是否不可见，如果不可见，则弹出小播放器
        function checkPlayerPos(){
            if($(window).scrollTop() > scrollAnchorY){
                if(!hasPop){
                    hasPop = true;
					vplayerContainer.addClass("v_play_popwin");
                    vplayerContainer.append(cover);
                    $cover = vplayerContainer.find(".pop_player_cover");

                    $(".video_bg").css("overflow", "inherit");

                    vplayerContainer.on("mouseover", function(){
                        $("#yinyuetaiplayer").css("visibility", "hidden");
                        $cover.css("display", "block");
                    });

                    vplayerContainer.on("mouseout", function(){
                        $("#yinyuetaiplayer").css("visibility", "");
                        $cover.css("display", "none");
                    });

                    vplayerContainer.on("mousedown", function(e){
                        var startx = e.clientX - (vplayerContainer.offset().left - $(window).scrollLeft()),
                            starty = e.clientY - (vplayerContainer.offset().top - $(window).scrollTop());


                        vplayerContainer.on("mousemove", function(event){
                            var clientx = event.clientX,
                                clienty = event.clientY;

                            vplayerContainer.css({
                                "bottom": $(window).height() - clienty + starty - (vplayerContainer.height() + 20),
                                "right": $(window).width() - clientx + startx - (vplayerContainer.width() + 20)
                            });

                        });

                        $(window).on("mouseup", function(){
                            vplayerContainer.off("mousemove");
                            $(window).off("mouseup");
                        });
                    });
                }
            }else{
                if(hasPop){
					vplayerContainer.removeClass("v_play_popwin");
					vplayerContainer.attr("style", "");
                    $(".video_bg").css("overflow", "hidden");

                    $("#yinyuetaiplayer").css("visibility", "");

                    if($cover){
                        $cover.remove();
                    }

                    vplayerContainer.off("mouseover");
                    vplayerContainer.off("mouseout");
                    vplayerContainer.off("mousedown");
                    vplayerContainer.off("mousemove");
                    hasPop = false;
                }
            }
        }
    }

	win['jsLight'] = jsLight;
	win['jsComment'] = jsComment;
	win['ToCaptureVideoPlayerServicePage'] = ToCaptureVideoPlayerServicePage;
	win['checkUserLogined'] = checkUserLogined;
	win['checkIsVipUser'] = checkIsVipUser;
	win['requestPopupLogin'] = requestPopupLogin;
	win['jsPopupWindowPlayer'] = jsPopupWindowPlayer;
	win['jsGetMediaMetaData'] = jsGetMediaMetaData;
	win['flashPlayerEventFunc'] = flashPlayerEventFunc;
	win['playerState'] = playerState;
	win['yytVideoComplete'] = yytVideoComplete;
	win['playerErrorHandler'] = playerErrorHandler;
    win['playerVideoComingToEnd'] = playerVideoComingToEnd;

	var jsGetMediaMetaDataCallbacks = $.Callbacks(),
			playerStateCallbacks = $.Callbacks(),
			flashPlayerEventFuncCallbacks = $.Callbacks(),
			yytVideoCompleteCallbacks = $.Callbacks(),
			playerErrorHandlerCallbacks = $.Callbacks();

	module.exports = {
		jsGetMediaMetaDataCallbacks : jsGetMediaMetaDataCallbacks,
		playerStateCallbacks : playerStateCallbacks,
		flashPlayerEventFuncCallbacks : flashPlayerEventFuncCallbacks,
		yytVideoCompleteCallbacks : yytVideoCompleteCallbacks,
		playerErrorHandlerCallbacks : playerErrorHandlerCallbacks
	};
});
