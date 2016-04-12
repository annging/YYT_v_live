/**
 * Created by Chen Zhiqiang on 2015/8/31
 */
define(function (require, exports, module) {
    /**
     * 省份城市选择器
     *
     * 用法： new Selector(el, opt)
     *
     * 参数： el: 包含选择器的跟对象，jquery对象
     *       opt: 配置，provinceId：省份id，cityId: 城市id
     *
     * 提供的方法：getData
     *          return obj{provinceId: xxx, cityId: xxx}
     */
    var CITY_INFO_URL = "http://shop.yinyuetai.com/get-city-area";

    var Selector = function (el, opt) {
        this.url = "http://shop.yinyuetai.com/get-city-area";
        this.$el = el;
        this.option = opt;
        this.$province = this.$el.find("select[name=province]");
        this.$city = this.$el.find("select[name=city]");

        this.init();
    };
    Selector.prototype.init = function () {
        var self = this;

        this.addChangeListener();
        if (this.option && this.option.provinceId) {
            this.fetchInfo(this.option.provinceId, this.$province, function () {
                self.updateValue(self.$province);
            });
        } else {
            this.fetchInfo(0, this.$province, function () {
                self.updateValue(self.$province);
            });
        }
    };
    Selector.prototype.addChangeListener = function () {
        var self = this;
        this.$province.on("change", function () {
            var val = self.updateValue($(this));

            if (self.$city.siblings(".select-cover").find(".select-val").data("value") != val) {
                self.fetchInfo(val, self.$city, function () {
                    self.updateValue(self.$city);
                });
            }
        });
        this.$city.on("change", function () {
            self.updateValue($(this));
        });
    };
    Selector.prototype.updateValue = function ($selector) {
        var $opt = $($selector[0].options[$selector[0].selectedIndex]);
        var val = $opt.val();
        var text = $opt.text();
        var $cover = $selector.siblings(".select-cover");

        $cover.find(".select-val").text(text).attr("data-value", val);

        return val;
    };
    Selector.prototype.fetchInfo = function (id, container, callback) {
        var areaId = id || 0;

        $.ajax({
            url: CITY_INFO_URL,
            type: "get",
            dataType: "jsonp",
            jsonp: "callback",
            data: {areaId: areaId},
            success: function (result) {
                if (result && !result.error) {
                    var tpl = "<option value='0'>请选择</option>",
                        areas = result.areas;
                    for (var i = 0; i < areas.length; i++) {
                        tpl += "<option value=" + areas[i].id + ">" + areas[i].name + "</option>";
                    }

                    container.html(tpl);
                    callback && callback(areas);
                }
            }
        });
    };
    Selector.prototype.getData = function () {
        return {
            provinceId: this.$province.siblings(".select-cover").find(".select-val").data("value"),
            province: this.$province.siblings(".select-cover").find(".select-val").text(),
            cityId: this.$city.siblings(".select-cover").find(".select-val").data("value"),
            city: this.$city.siblings(".select-cover").find(".select-val").text()
        }
    };

    module.exports = Selector;
});
