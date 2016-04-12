define(function(require, exports, module) {
	module.exports = function(options) {
		var $slider = options.sliderEl,
				$els = options.els,
				perWidth = options.perWidth,
				countInSight = options.countInSight,
				$preBtn = options.preBtn,
				$nextBtn = options.nextBtn;
		var widthInSight = countInSight * perWidth,
				count = $els.length,
				totalWidth = perWidth * count,
				offset = 0,
				sliding = false;

		$slider.css('width', totalWidth);
		function toggleBtn() {
			if (offset <= 0) {
				$preBtn.hide();
			} else {
				$preBtn.show();
			}
			if (offset >= totalWidth - widthInSight) {
				$nextBtn.hide();
			} else {
				$nextBtn.show();
			}
		}

		$preBtn.click(function() {
			if (sliding) {
				return;
			}
			var toMargin = Math.min(-offset + widthInSight, 0);
			slideFx(toMargin);
		})

		$nextBtn.click(function() {
			if (sliding) {
				return;
			}
			var toMargin = Math.max(-offset - widthInSight, widthInSight - totalWidth);
			slideFx(toMargin);
		})

		function slideFx(toMargin) {
			sliding = true;
			$slider.stop(true, true).animate({'margin-left' : toMargin}, 800, function() {
				sliding = false;
				offset = -toMargin;
				toggleBtn();
			});
		}

		toggleBtn();

		this.goto = function(index) {
			var position = index * perWidth;
			if (position <= offset) {
				slideFx(Math.min(-position + perWidth, 0));
			} else if (position >= (offset + (countInSight - 1) * perWidth)) {
				slideFx(Math.max(-position + (countInSight - 2) * perWidth, widthInSight - totalWidth + perWidth));
			}
		}

	}
})
