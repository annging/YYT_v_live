/**
 * Created by Chen Zhiqiang on 2015/9/28
 *
 * 滚屏
 */
define(function (require, exports, module) {
    var DIRECT_LEFT = "0"; //向左滚
    var DIRECT_RIGHT = "1"; //右滚
    /**
     * container: 容器
     * sliderEl: element，必填
     * els: 轮播图片或其他元素，els == null，则是不规则元素的滚动
     * perWidth： 每次滚动的像素，必填
     * countInSight：初始索引值
     * preBtn：上一个按钮
     * nextBtn：下一个按钮
     * @param options
     */
    var Turn = function (container, opt) {
        this.container = container;
        this.options = _.extend({
            sliding: false
        }, opt);

        this.$slider = this.options.sliderEl;
        this.$els = this.options.els;
        this.countInSight = this.options.countInSight;
        this.perWidth = this.options.perWidth;
        this.$preBtn = this.options.preBtn;
        this.$nextBtn = this.options.nextBtn;
        this.init();
        this.addListener();
        this.toggleBtn();
        return this;
    };
    Turn.prototype.init = function () {
        this.perWidth = this.perWidth || 0;
        this.countInSight = this.countInSight ? this.countInSight : 1;
        this.widthInSight = this.countInSight * this.perWidth > 0 ? this.countInSight * this.perWidth : this.perWidth;
        this.totalWidth = this.$els ? getElsWidth(this.$els) : getChildWidth(this.$slider);
        this.count = Math.ceil(this.totalWidth / this.widthInSight);
        this.offset = 0;
        this.sliding = this.options.sliding;

        this.$slider.css({
            "width": this.totalWidth,
            "position": "absolute",
            "overflow": "hidden",
            "left": 0
        });
    };
    Turn.prototype.addListener = function () {
        var self = this;

        if(this.$preBtn){
            this.$preBtn.on("click", function () {
                if (!$(this).hasClass("disabled")){
                    self.scrollToggle("1");
                }
            });
        }
        if(this.$nextBtn){
            this.$nextBtn.on("click", function () {
                if (!$(this).hasClass("disabled")){
                    self.scrollToggle("0");
                }
            });
        }
    };
    Turn.prototype.toggleBtn = function () {
        if (this.offset > 0) {
            this.$preBtn.removeClass("disabled");
        } else {
            this.$preBtn.addClass("disabled");
        }

        if (this.offset <= this.count - 2) {
            this.$nextBtn.removeClass("disabled");
        } else {
            this.$nextBtn.addClass("disabled");
        }
    };
    Turn.prototype.scrollToggle = function (dir) {
        var self = this,
            _pos,
            offset = self.offset,
            count = self.count,
            w = self.widthInSight;

        if (dir == DIRECT_LEFT) {
            if (offset < count - 1) {
                _pos = -(offset + 1) * w;
                self.slideFx(_pos, offset + 1);
            }
        } else {
            if (offset > 0) {
                _pos = -(offset - 1) * w;
                self.slideFx(_pos, offset - 1);
            }
        }
    };
    Turn.prototype.scrollTo = function (index) {
        index = index ? index : 0;
        if (index != this.offset) {
            if (index >= 0 && index <= this.offset - 1) {
                var _pos = -index * this.widthInSight;

                this.slideFx(_pos, index);
            }
        }
    };
    Turn.prototype.slideFx = function (_pos, o) {
        var self = this;

        if (!this.sliding) {
            this.sliding = true;
            this.$slider.animate({"left": _pos}, 500, function () {
                self.offset = o;
                self.sliding = false;
                self.toggleBtn();
            });
        }
    };
    //index:位置的索引值，从0开始
    Turn.prototype.goto = function (index) {
        this.scrollTo(index);
    };

    function getElsWidth(els) {
        var w = 0;

        if (els && els.length > 0) {
            for (var i = 0; i < els.length; i++) {
                var item = els.eq(i);
                w += item.width() + parseFloat(item.css("margin-left").replace("px", "")) + parseFloat(item.css("margin-right").replace("px", ""));
            }
        }

        return w;
    }

    function getChildWidth(parent) {
        var w = 0;
        var children = parent.children();

        if (children && children.length > 0) {
            for (var i = 0; i < children.length; i++) {
                var item = children.eq(i);
                w += item.width() + parseFloat(item.css("margin-left").replace("px", "")) + parseFloat(item.css("margin-right").replace("px", ""));
            }
        }

        return w;
    }

    module.exports = Turn;
})
