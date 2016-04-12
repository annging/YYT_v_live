(function(win){
	win.YYTApi = api = function(player){
		var REMOATE_URL = "https://api.yinyuetai.com",
			SECRET_KEY = "";

		var NEWVV_URL = "http://v.stats.yinyuetai.com/newvv"; //newvv统计接口

		var self = this;

		self.player = player;
		player.on("start_play", function(dur, url){
			sendNewvv(this.videoInfo, dur, url);
			//setTimeout(function(){
            //
			//}, parseInt(dur) * 0.8 * 1000);
		});

		function sendNewvv(info, dur, url){
			var url = NEWVV_URL + "?vid=" + info.coreVideoInfo.videoId +
					"&ptp=h5" + "&vdur=" + dur + "&rd=" + location.href + "&vurl=" + url;

			var img = $("<img>");
			img.attr("src", url);
			img.css({
				"width": "1px",
				"height": "1px",
				"position": "absolute",
				"left": "-200px"
			});
			img.appendTo($("body"));
		}
	};
})(window);
