define(function(require, exports, module) {

	//包装图片路径
	function getImageServerUrl(url) {
		try {
			if (url == null || url == "") {
				return "http://img1.yytcdn.com/default404.jpg";
			}
			if (url.indexOf("http") == 0) {
				return url;
			}

			var begin = url.lastIndexOf("/");
			var end = url.lastIndexOf(".");
			if (begin < 0 || end < 0) {
				return url;
			}
			var image = url.substring(begin + 1, end);
			if (image.length > 8) {
				var prefix = image.substring(0, 4);
				var suffix = image.substring(image.length - 4);
				image = prefix + suffix;
			}
			var result = parseInt(image, 36) % 5;
			return "http://img" + result + ".yytcdn.com" + url;

		} catch (ex) {

			return url;
		}
	}

	module.exports = getImageServerUrl;
});