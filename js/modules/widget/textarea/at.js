define(function(require, exports, module) {
	var getImageServerUrl = require("modules/yinyuetai/imageserverurl"),
			juicer = require("juicer"),
			ajax = require("ajax"),
			user = require("user");

	juicer.register('getImageServerUrl', getImageServerUrl);

	//单个好友Model对象
	var Friend = Backbone.Model;

	var Friends = Backbone.Collection.extend({
		model : Friend,
		url : "http://i.yinyuetai.com/follow/attention",
		maxNumber : 10,
		getUserId : function() {
			return user.get("userId");
		},
		filterData : function(str) {
			var count = 0;
			this.results = [];
			this.each(function(model) {
				if ( count >= this.maxNumber ) return false;
				var user = model.toJSON();
				if (user.userFullName.indexOf(str) !== -1) {
					this.results.push(user);
					count++;
				}
			}, this);
			this.appView.render();
		},
		fetch : function(str) {
			var self = this;
			ajax.get(this.url, 'userId=' + this.getUserId() + '&q=' + str + '&maxResults=' + this.maxNumber, function(data) {
				if (data.code == 1) {
					self.formateData(data.result.follows, str);
				} else if (!data.error) {
					self.formateData(data.follows, str);
				}
			});
		},
		formateData : function(follows, str) {
			if (follows.length <= 0) {
				return;
			}
			var i, len;
			for (i = 0, len = follows.length; i < len; i = i + 3) {
				var userId = follows[i],
						userFullName = follows[i + 1],
						userIconSrc = follows[i + 2],
						userName = userFullName.split(";")[0],
						userNameAndId = userName + "(" + userId + ")";
				this.push({
					userId : userId,
					userName : userName,
					userFullName : userFullName,
					userIconSrc : userIconSrc,
					userNameAndId : userNameAndId
				});
			}
			this.filterData(str);
		},
		prepareData : function(str) {
			if (this.length > 0) {
				this.filterData(str);
				return;
			}
			this.fetch(str);
		}
	});

	//单个好友View对象
	var FriendView = Backbone.View.extend({
		tagName : "li",
		template : '<a txt="{{userName}}({{userId}})" href="javascript:;"><img width="20" height="20" src="{{userIconSrc|getImageServerUrl}}">{{userName}}({{userId}})</a>',
		render : function() {
			var html = juicer(this.template, this.friend);
			this.$el.html(html);
			return this;
		},
		initialize : function(data) {
			this.friend = data.friend;
		}
	});

	//好友下拉列表
	var AppView = Backbone.View.extend({
		className : "p_com_name user_name_down",
		tip : '<p class="popup_text">选择最近聊过天的好友或直接输入</p>',
		listsCtn : $("<ul></ul>"),
		listOn : false,
		hoverClass : "hover",
		countTime: null,
		initialize : function(param) {
			this.friends = param.friends;
			this.placeholderDiv = param.placeholderDiv;
			this.textareaView = param.textareaView;
			this.$el.appendTo(document.body);
		},
		render : function() {
			this.$el.empty();
			if (this.friends.results.length > 0) {
				this.listsCtn.empty();
				this.$el.append(this.tip);
				this.listsCtn.appendTo(this.$el);
				_.each(this.friends.results, function(friend) {
					var view = new FriendView({friend : friend});
					view.render().$el.appendTo(this.listsCtn);
				}, this);
			} else {
				this.$el.html('<p class="popup_text">没有匹配结果</p>');
			}
			this.show();
		},
		show : function() {
			clearTimeout(this.countTime);
			this.currentIndex = 0;
			this.$el.find("li").removeClass().eq(this.currentIndex).addClass(this.hoverClass);
			this.listOn = true;
			this.$el.css(this.placeholderDiv.getPosition()).show();
		},
		hide : function() {
			var self = this;
			this.countTime = setTimeout(function() {
				self.listOn = false;
				self.$el.hide();
			}, 300);
		},
		events : {
			"click ul" : "itemSelect"
		},
		itemSelect : function(e) {
			this.textareaView.insertValue($(e.target));
			this.hide();
		}
	});

	var PlaceholderDiv = Backbone.View.extend({
		className : "com_holder",
		flagChar : "@",
		selectionStart : 0,
		fontFamily : "Tahoma,宋体",
		initialize : function($ele) {
			var spans;
			this.$el.html('<span></span><span></span><span></span>');
			spans = this.$el.find("span");
			this.contEl = spans.eq(0);
			this.flagEl = spans.eq(1);
			this.contEndEl = spans.eq(2);
			this.flagEl.text(this.flagChar);
			this.$el.appendTo(document.body);
			this.$textarea = $ele;
			this.setData();
		},
		setData : function() {
			var fontSize = this.$textarea.css("font-size"),
				widthSize = this.$textarea.width(),
				heightSize = this.$textarea.height(),
				paddingLeftSize = this.$textarea.css("paddingLeft"),
				paddingTopSize = this.$textarea.css("paddingTop");
			this.$el.css({
				width : widthSize+"px",
				height : heightSize+"px",
				paddingLeft: paddingLeftSize,
				paddingTop: paddingTopSize,
				lineHeight : this.$textarea.css("line-height"),
				fontSize : fontSize,
				fontFamily : this.fontFamily,
				display : "block"
			});
			this.$textarea.css("font-family", this.fontFamily);
			this.$el.css(this.$textarea.offset());      //初始定位
			this.offsetDistance = parseInt(fontSize) + 5;
		},
		fillCont : function() {
			if (this.selectionStart <= 0) {
				return;
			}

			var textareaVal = this.$textarea.val(),
					startVal = textareaVal.substring(0, this.selectionStart),
					endVal = textareaVal.substring(this.selectionStart + 1, textareaVal.length),
					regExp = {
						"<" : "&lt;",
						">" : "&gt;",
						" " : '<span style="white-space:pre-wrap;' + this.fontFamily + '"> </span>',
						"(\r\n)|\n" : "<br>"
					};

			for (var reg in regExp) {
				if (regExp.hasOwnProperty(reg)) {
					startVal = startVal.replace(new RegExp(reg, "ig"), regExp[reg]);
					endVal = endVal.replace(new RegExp(reg, "ig"), regExp[reg]);
				}
			}
			this.contEl.html(startVal);
			this.contEndEl.html(endVal);
		},
		getPosition : function() {
			this.$el.css(this.$textarea.offset());
			this.fillCont();
			this.$el.scrollTop(this.$textarea.scrollTop());
			var offset = this.flagEl.offset();
			return {
				left : offset.left,
				top : offset.top + this.offsetDistance
			};
		}
	});

	var TextareaView = Backbone.View.extend({
		flagChar : "@",
		flagStart : -1,
		selectionStart : 0,     //当前光标位置
		selectionRange : null,
		initialize : function($ele) {
			if ($ele.length <= 0) {
				return;
			}
			this.$el = $ele;
			this.placeholderDiv = new PlaceholderDiv($ele);
			this.friends = new Friends();
			this.appView = new AppView({
				friends : this.friends,
				placeholderDiv : this.placeholderDiv,
				textareaView : this
			});
			this.friends.appView = this.appView;
		},
		events : {
			"keyup" : "decideChange",
			"click" : "onChange",
			"blur" : "setAppViewHidden"
		},
		setAppViewHidden: function() {
			this.appView.hide();
		},
		decideChange : function(e) {
			if (e.keyCode == 38 || e.keyCode == 40 || e.keyCode == 13) {
				this.selectItem(e);
			} else {
				this.onChange();
			}
		},
		selectItem : function(e) {
			if (!this.appView.listOn) {
				return;
			}

			switch (e.keyCode) {
				//向上
				case 38:
					e.preventDefault();
					if (this.appView.currentIndex === 0) {
						this.appView.currentIndex = this.friends.results.length - 1;
					} else {
						this.appView.currentIndex--;
					}
					this.appView.$el.find("li").removeClass().eq(this.appView.currentIndex).addClass(this.appView.hoverClass);
					break;
				//向下
				case 40:
					e.preventDefault();
					if (this.appView.currentIndex === this.friends.results.length - 1) {
						this.appView.currentIndex = 0;
					} else {
						this.appView.currentIndex++;
					}
					this.appView.$el.find("li").removeClass().eq(this.appView.currentIndex).addClass(this.appView.hoverClass);
					break;
				//回车事件
				case 13:
					e.preventDefault();
					this.insertValue(this.appView.$el.find("li").eq(this.appView.currentIndex).children("a"));
					this.appView.hide();
					break;
			}
		},
		getSelectionStart: function() {
			var textarea = this.$el[0],
				selectionStart = 0;     //获取光标的当前位置
			this.$el.focus();
			if (document.selection) { //ie
				this.selectionRange = document.selection.createRange().duplicate();
				if (this.selectionRange.parentElement() == textarea) {
					var beforeRange = document.body.createTextRange();
					beforeRange.moveToElementText(textarea);
					beforeRange.setEndPoint('EndToStart', this.selectionRange);
					var beforeText, untrimmedBeforeText;
					beforeText = untrimmedBeforeText = beforeRange.text;
					while (beforeRange.compareEndPoints('StartToEnd', beforeRange) != 0) {
						beforeRange.moveEnd('character', -1);
						if (beforeText == beforeRange.text) {
							untrimmedBeforeText += '\r\n';
						}
					}
					selectionStart = untrimmedBeforeText.length;
				}
			} else {
				selectionStart = textarea.selectionStart;
			}
			return selectionStart;
		},
		setCursorStart: function(startPos) {
			var textarea = this.$el[0],
				start = startPos,
				end = startPos;
			if(textarea.createTextRange){
				var oTextRange = textarea.createTextRange();
				var LStart = start;
				var LEnd = end;
				var start = 0;
				var end = 0;
				var value = textarea.value;
				for(var i=0; i<value.length && i<LStart; i++){
					var c = value.charAt(i);
					if(c!='\n'){
						start++;
					}
				}
				for(var i=value.length-1; i>=LEnd && i>=0; i--){
					var c = value.charAt(i);
					if(c!='\n'){
						end++;
					}
				}
				oTextRange.moveStart('character', start);
				oTextRange.moveEnd('character', -end);
				oTextRange.select();
				textarea.focus();
			}else{
				textarea.select();
				textarea.selectionStart=start;
				textarea.selectionEnd=end;
			}
		},
		onChange : function() {
			this.selectionStart = this.placeholderDiv.selectionStart = this.getSelectionStart();
			var before = this.$el.val().substring(0, this.selectionStart);
			this.flagStart = before.lastIndexOf(this.flagChar);
			if (this.flagStart != -1) { //找到@的位置
				var str = before.substring(this.flagStart + 1, this.selectionStart);
				if (str.indexOf(' ') == -1 && str.indexOf('\n') == -1) {
					this.friends.prepareData(str);
				} else {
					this.appView.hide();
				}
			} else {
				this.appView.hide();
			}
		},
		autoChange: function() {
			var textareaVal = this.$el.val(),
				selectionStart = this.getSelectionStart(),
				before = this.$el.val().substring(0, selectionStart),
				lastChar = before.substring(selectionStart-1),
				pos = selectionStart;

			if (lastChar !== this.flagChar) {
				var startVal = textareaVal.substring(0, selectionStart),
					endVal = textareaVal.substring(selectionStart + 1, textareaVal.length);
				this.$el.val(startVal+this.flagChar+endVal).focus();
				pos = startVal.length+1;
			}
			this.setCursorStart(pos);
			this.onChange();
		},
		insertValue : function($e) {
			var $link = $e;
			var input = this.$el[0], val = this.$el.val();
			var before = val.substring(0, this.flagStart + 1); //加1是@
			var after = val.substring(this.selectionStart, val.length);
			var middle = val.substring(this.flagStart + 1, this.selectionStart);
			var newMiddle = $link.attr("txt") + ' ';
			if (document.selection) {
				this.selectionRange.moveStart('character', -middle.length);
				this.selectionRange.text = newMiddle;
				this.selectionRange.select();
			} else {
				input.focus();
				var restoreTop = input.scrollTop;
				this.$el.val(before + newMiddle + after);
				if (restoreTop > 0) {
					input.scrollTop = restoreTop;
				}
				input.selectionEnd = input.selectionStart = this.flagStart + 1 + newMiddle.length;
			}
		}
	});

	module.exports = TextareaView;
});