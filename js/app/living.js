define(function (require,exports,module) {
	var url = require('url');
	var urlHASH = url.parseSearch(location.search);
	var user = require('user');
	var alertify = require('alertify');
	var bScroll = true;
	//接口
	var host = 'http://beta.yinyuetai.com:9026',
		CHANNELHISTORY_URL = host+'/video/list_bychannel.json',
		COUNT_URL = host+'/video/count.json',
		VIDEO_URL = host+'/video/detail.json',
		SIG_GET_URL = host+'/user/sig_get.json';
	//需要参数
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
	function sec2time(sec) {
		if(sec == 'undefined'){
			return '00:00';
		}

		var m = parseInt(sec/60);
		var s = sec%60;
		console.log(toD(m)+':'+toD(s));
		console.log(s);
		return toD(m)+':'+toD(s);
	}

	function App (){
		this.init();
	}
	App.prototype = {
		construct : App ,
		init : function () {
			this.defineVar();
			this.getVideo();
			
			this.getHistory();
			this.submitLove();
			this.sendMsg();
			this.CtrlMsg();
		},
		defineVar : function () {
			this.$programlist = $('.programlist');
			this.chatroomId;
		},
		initTengxunIM : function () {
			var self = this;
			var params = {};
			params = _.extend(params,deviceinfo);
			var jqXHR = $.ajax({
				url: SIG_GET_URL,
				type: 'get',
				dataType: 'jsonp',
				data : params
			});
			var loginInfo,listeners,options = null;
			jqXHR.done(function (data) {
				if(data.msg=="SUCCESS"){
					var loginMsg = data.data;
					function callback(notifyInfo) {
			            console.log(notifyInfo);
			        }
					listeners = {
			            'onConnNotify': function (notifyInfo) {
			            	console.log('onConnNotify');
			               	console.log(notifyInfo);
			            },
			            'onMsgNotify': function (notifyInfo) {
			            	$.each(notifyInfo, function(index, val) {
			            		var $commentList = $('.commentList');
			            		var $con = $('.comment_con');
			            		var msg = val.elems[0].content.text.replace(/&quot;/g,'"');
			            		var msgArr = $.parseJSON(msg);
			            		$commentList.append(self.tplChat(msgArr));
			            		if(bScroll){
						        	$con.scrollTop(1000000);
						        }
			            	});
			            },
			            'onGroupInfoChangeNotify': function (notifyInfo) {
			            	console.log('onGroupInfoChangeNotify');
			                console.log(notifyInfo);
			            },
			            'groupSystemNotifys': {
			                "1": callback, //申请加群请求（只有管理员会收到）
			                "2": callback, //申请加群被同意（只有申请人能够收到）
			                "3": callback, //申请加群被拒绝（只有申请人能够收到）
			                "4": callback, //被管理员踢出群(只有被踢者接收到)
			                "5": callback, //群被解散(全员接收)
			                "6": callback, //创建群(创建者接收)
			                "7": callback, //邀请加群(被邀请者接收)
			                "8": callback, //主动退群(主动退出者接收)
			                "9": callback, //设置管理员(被设置者接收)
			                "10": callback, //取消管理员(被取消者接收)
			                "11": callback, //群已被回收(全员接收)
			                "255": callback //用户自定义通知(默认全员接收,暂不支持)
			            }
			        };
					loginInfo = {
						sdkAppID : loginMsg.imAppid,       //- String, 用户标识接入SDK的应用ID
						appIDAt3rd : loginMsg.imAppid,  //- String, App用户使用OAuth授权体系分配的Appid，和sdkAppID一样
						accountType : loginMsg.imAccountType,  // - int, 账号类型
						identifier : loginMsg.imIdentifier,   //- String, 用户帐号
						userSig : loginMsg.userSig      //- String, 鉴权Token
					};
					webim.init(loginInfo,listeners,options);
					webim.applyJoinGroup({GroupId:self.chatroomId},function (res) {
						if(res.ErrorCode==0){
							//初始化成功
							self.getSession(self.chatroomId);
						};
					});
					

				};
			});
		},
		getVideo : function () {
			var self = this;
			var $videoWin = $('.videoWin');
			var $avator = $videoWin.find('.avator'),
				$channelName = $videoWin.find('.anchorName'),
				$vidoeName = $videoWin.find('.title h3'),
				$onlineCount = $videoWin.find('.usersCount'),
				$likeCount = $videoWin.find('.lovesCount');
			var params = {
					videoId : urlHASH.videoId
				};
			params = _.extend(params,deviceinfo);
			$.ajax({
				url: VIDEO_URL,
				type: 'get',
				dataType: 'jsonp',
				data: params,
			})
			.done(function(data) {
				if(data.msg=='SUCCESS'){
					self.chatroomId = data.data.chatroomId;
					var rq_db_arr = data.data;
					if(rq_db_arr.videoType == 'LIVE'){
						$('.title img').show();
					}
					$avator.attr({'src':rq_db_arr.channel.profileImg});
					$vidoeName.html(rq_db_arr.videoName);
					$channelName.html(rq_db_arr.channel.channelName);
					$onlineCount.html(rq_db_arr.onlineCount);
					$likeCount.html(rq_db_arr.likeCount);
					self.initTengxunIM();

				}else{
					alertify.success(data.msg);
				}
			});
		},
		getHistory : function () {
			var params = {
					channelId : urlHASH.channelid,
					offset : 0,
					size : 3
				};
			params = _.extend(params,deviceinfo);
			var self = this;
			$.ajax({
				url: CHANNELHISTORY_URL,
				type: 'get',
				dataType: 'jsonp',
				data: params,
			})
			.done(function(data) {
				if(data.msg == 'SUCCESS'){
					var rq_db_arr = data.data;
					var htmlArr = [];
					$.each(rq_db_arr, function(index, val) {
						htmlArr.push(self.tplProgram(val));
					});
					self.$programlist.html(htmlArr.join(''));
					self.tabHistory();
				}
			});
		},
		getSession : function (chatroomId) {
			var session = webim.Session({type:'GROUP',id:chatroomId});
			console.log(session);
			webim.syncGroupMsgs({ReqMsgSeq:300,GroupId:chatroomId,ReqMsgNumber:300},function (data) {
			});
		},
		tabHistory : function () {
			var self = this;
			var $programCon = $('.programCon'),
				$programs = $programCon.find('.program')
				$btns = $programCon.find('.btn'),
				$lBtn = $programCon.find('.lBtn'),
				$rBtn = $programCon.find('.rBtn'),
				iNow = 0,
				len = $programs.length,
				onePlace = $programs.outerWidth()+6;
			this.$programlist.width(onePlace*len);
			$programCon.mouseover(function() {
				if(len>3){
					if(iNow!=0){
						$lBtn.show();
					}
					if(iNow!=len-3){
						$rBtn.show();
					}
				}
				$btns.stop().animate({
					opacity : 1
				}, 300);
			});
			$programCon.mouseout(function() {
				$btns.stop().animate({
					opacity : 0
				}, 300,function () {
					$btns.hide();
				});
			});
			$programCon.on('click','.btn',function () {
				var $self = $(this);
				if($self.hasClass('lBtn')){
					iNow--;
					if(iNow==0)$self.hide();
					$rBtn.show();
				}else{
					iNow++;
					if(iNow==len-3)$self.hide();
					$lBtn.show();
				}
				self.$programlist.stop().animate({
					left : -iNow*onePlace
				}, 300);
			});
		},
		submitLove : function () {
			var $loveBtn = $('.loveBtn');
			var params = {
						videoId : urlHASH.videoId,
						type : 6,
						count : 1
					};
			params = _.extend(params,deviceinfo,token);
			$loveBtn.click(function(event) {
				$.ajax({
					url: COUNT_URL,
					type: 'get',
					dataType: 'jsonp',
					data: params,
				})
				.done(function(data) {
					if(data.msg=='SUCCESS'){
						alertify.success(data.data.message);
					}
				});
			});
			
		},
		CtrlMsg : function () {
			var $clearScroll = $('.clearScroll'),$closeScroll = $('.closeScroll');
			$clearScroll.click(function () {
				$('.commentList').html('');
			});
			$closeScroll.click(function () {
				if(bScroll == true){
					bScroll = false;
					$closeScroll.html('开启滚屏');
					$closeScroll.addClass('on');
				}else{
					bScroll = true;
					$closeScroll.html('关闭滚屏');
					$closeScroll.removeClass('on');
				}
			});

		},
		sendMsg : function () {
			var self = this;
			var $commentList = $('.commentList'),
				$con = $('.comment_con'),
				$MsgInput = $('.input_comment'),
				$sendBtn = $('.button');

			$sendBtn.click(function () {
				if($MsgInput.val()=='')return;
				sendMsg(self.chatroomId);
			});
			$MsgInput.keydown(function (e) {
				if(e.keyCode == 13){
					if($MsgInput.val()=='')return false;
					sendMsg(self.chatroomId);
					return false;
				}
			});
			function sendMsg(chatroomId) {
		    	var selSess = null;
				if (!selSess) {
			        selSess = new webim.Session('GROUP', chatroomId, chatroomId, '', Math.round(new Date().getTime() / 1000));
			    }
				var msgJosn = {
					content : $MsgInput.val(),
					msgType : 0,
					nickName : $('.useInfo .name').html(),
					smallAvatar : $('.useInfo img').attr('src'),
					time : new Date().getTime(),
					videoId : urlHASH.videoId
				}
			    var msg = new webim.Msg(selSess, true);
			    console.log(JSON.stringify(msgJosn).replace(/\"/g,'&quot;'));
		    	var text_obj = new webim.Msg.Elem.Text(JSON.stringify(msgJosn));
		    	msg.addText(text_obj);
				webim.sendMsg(msg, function (resp) {
					if(resp.ActionStatus!='OK')return ;
			        $commentList.append(self.tplChat(msgJosn));
			        $MsgInput.val('');
			        if(bScroll){
			        	$con.scrollTop(1000000);
			        }
			        
			    }, function (err) {
			        console.log(err);
			    });
		    }
		},

		tplProgram : function (info) {
			var  status , statusText , link , html , videoType , playlong ;
			channelId = info.channel.channelId;
			if(info.videoType=='LIVE'){
				playlong = '';
			}else{
				playlong = '<span class="viedo_time">'+sec2time(info.playtime)+'</span>';
			}
			link = 'living.html?videoId='+info.videoId+'&channelid='+channelId+'&videoType='+info.videoType;
			html = '<li class="program" data-channelid="'+channelId+'">'+
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
							'<span class="program_love">'+info.visitCount+'</span>'+
						'</div>'+
					'</div>'+
				'</li>';
			return html;
		},
		tplChat : function (info) {
			console.log(info);
			var html , info = info||{};
			html = '<li class="commentMsg clearfix" data-time="'+info.time+'">'+
						'<img src="'+info.smallAvatar+'" alt="" class="com_avator">'+
						'<div class="con">'+
							'<h4 class="name">'+info.nickName+'</h4>'+
							'<p>'+info.content+'</p>'+
						'</div>'+
					'</li>';
			return html;
		}
	}


	return new App();
});