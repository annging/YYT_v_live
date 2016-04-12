/**
 * Created by Chen Zhiqiang on 2015/9/28
 * 瀑布流
 *
 * 使用：
 * var f = new WaterFail(el, opt);
 * f.updateLayout(elements);
 *      elements:   类型：Array
 *                  需要插入的元素（html元素，不是jquery元素），；
 * f.reset();   瀑布流重置，清空元素
 * f.reLayout(); 重新排列已有元素
 */
define(function (require, exports, module) {
    var checkScrollTimeId,
        waterFailLayoutTimeId,
        oBoxesHeights = [];

    /**
     * @param el  瀑布流容器，html元素，**必填
     * @param opt  配置
     *      perWidth：    每列宽度，**必填
     *      knownHeight： 图片高度是否已知
     *      onScrollEnd： 滚到最底部的回调函数
     *      onComplete:  瀑布流执行结束的回调函数
     * @constructor
     */
    var WaterFail = function (el, opt) {
        this.el = el;
        this.options = opt;
        this.imgLoadingNum = 0;
        this.init();
        return this;
    };
    WaterFail.prototype.updateLayout = function (arr) {
        var self = this;

        self.loadingImgs = arr;
        self.imgLoadingNum = arr.length;

        this.removeScroll();
        if (this.options.knownHeight) {
            this.layoutByKnownHeight(arr);
        } else {
            this.layoutByNoHeight(arr);
        }
    };
    WaterFail.prototype.updateChildLayout = function(){
        var _arr = this.el.childNodes;

        for (var i = 0; i < _arr.length; i++) {
            this.updateElementLayout(_arr[i]);
        }
        this.el.style.height = Math.max.apply(null, oBoxesHeights) + "px";
    };
    WaterFail.prototype.init = function () {
        this.initStyle();
        this.addImageListener();
        this.setupScroll();
        this.initData();
    };
    WaterFail.prototype.initStyle = function () {
        this.el.className = this.el.className + " waterfail-container clearfix";
        this.el.style.position = "relative";
        this.el.style.overflow = "hidden";
    };
    WaterFail.prototype.initData = function () {
        var len = Math.floor(this.el.offsetWidth / this.options.perWidth);

        oBoxesHeights = [];
        for (var i = 0; i < len; i++) {
            oBoxesHeights.push(0);
        }

        this.imgLoadingNum = 0;
        this.loadingImgs = [];
    };
    WaterFail.prototype.addImageListener = function () {
        var self = this;

        window.imgOnLoad = function () {
            self.imgLoadingNum--;
            if (self.imgLoadingNum == 0) {
                clearTimeout(waterFailLayoutTimeId);
                self.loadImgsComplete();
            }
        };
        window.imgOnError = function () {
            self.imgLoadingNum--;
            if (self.imgLoadingNum == 0) {
                clearTimeout(waterFailLayoutTimeId);
                self.loadImgsComplete();
            }
        };
    };
    WaterFail.prototype.setupScroll = function () {
        var self = this;

        window.onscroll = function () {
            clearTimeout(checkScrollTimeId);
            checkScrollTimeId = setTimeout(function () {
                if (checkScrollSide(self.el)) {
                    if (self.options.onScrollEnd) {
                        self.options.onScrollEnd();
                    }
                }
            }, 500);
        };
    };
    WaterFail.prototype.removeScroll = function () {
        window.onscroll = null;
    };
    WaterFail.prototype.layoutByKnownHeight = function (arr) {
        var self = this;

        for (var i = 0; i < arr.length; i++) {
            self.appendElement(arr[i]);
        }
        this.el.style.height = Math.max.apply(null, oBoxesHeights) + "px";
        this.setupScroll();
        this.options.onComplete && this.options.onComplete();
    };
    WaterFail.prototype.layoutByNoHeight = function (arr) {
        var self = this;

        for (var j = 0; j < arr.length; j++) {
            self.el.appendChild(arr[j]);
            var img = arr[j].getElementsByTagName("img")[0];
            img.setAttribute("onload", "imgOnLoad()");
            img.setAttribute("onerror", "imgOnError()");
        }

        clearTimeout(waterFailLayoutTimeId);
        waterFailLayoutTimeId = setTimeout(function () {
            self.loadImgsComplete();
        }, arr.length * 3 * 1000);
    };
    WaterFail.prototype.loadImgsComplete = function () {
        for (var k = 0; k < this.loadingImgs.length; k++) {
            this.appendElement(this.loadingImgs[k]);
        }
        this.el.style.height = Math.max.apply(null, oBoxesHeights) + "px";
        this.setupScroll();
        this.options.onComplete && this.options.onComplete();
    };
    WaterFail.prototype.appendElement = function (ele) {
        var min = getMinByArray(oBoxesHeights);

        ele.style.float = "left";
        ele.style.position = "absolute";
        ele.style.left = this.options.perWidth * (min.index % oBoxesHeights.length) + "px";
        ele.style.top = min.data + "px";
        this.el.appendChild(ele);
        oBoxesHeights[min.index] += ele.offsetHeight;
    };
    WaterFail.prototype.updateElementLayout = function(ele){
        var min = getMinByArray(oBoxesHeights);

        ele.style.float = "left";
        ele.style.position = "absolute";
        ele.style.left = this.options.perWidth * (min.index % oBoxesHeights.length) + "px";
        ele.style.top = min.data + "px";
        oBoxesHeights[min.index] += ele.offsetHeight;
    };
    WaterFail.prototype.reset = function(){
        this.el.innerHTML = "";
        this.el.style.height = "0px";
        this.initData();
    };
    WaterFail.prototype.reLayout = function(){
        this.initData();
        this.updateChildLayout();
    };


    function getMinByArray(arr) {
        var idx = 0,
            temp = arr[0];

        for (var i = 0; i < arr.length; i++) {
            if (temp > arr[i]) {
                temp = arr[i];
                idx = i;
            }
        }

        return {
            index: idx,
            data: temp
        }
    }

    function checkScrollSide(ele) {
        var lastPinH = ele.offsetTop + Math.floor(ele.offsetHeight);
        var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        var documentH = document.documentElement.clientHeight;
        return (lastPinH < scrollTop + documentH + 100) ? true : false;
    }

    module.exports = WaterFail;
});
