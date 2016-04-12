/**
 * Created by Sam.li on 2016/3/16.
 */
define(function(require,exports,module){
    var AjaxForm = require('vendor/ajaxform'),
        alertify = require('vendor/alertify'),
        categoryId = $('.categoryId').val(),
        host = window.location.host;
    function App (){
        this.$searchIpnt = $('.search input');
        this.$goodsList = $('.goodsList');
        this.init();
    }
    App.prototype = {
        constructor : App ,
        init : function (){
            this.sortchange();
            this.tabSearch();
            this.search();
            if(_keyword){
                this.getAlllist({keyword:_keyword});
            }else{
                this.getAlllist({sort:1});
            }
        },
        getAlllist : function (options){
            var self = this,
                url = '/goods/search',
                keyword = options.keyword,
                sort = options.sort;
            var dataforRender = {
                categoryId : categoryId ,
                keyword : keyword,
                sort : sort
            };
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data : dataforRender
            })
            .done(function(data) {
                if(!data.error){
                    self.$goodsList.html('');
                    var rq_goods_arr = data.goods;
                    $.each(rq_goods_arr,function(index,val){
                        self.$goodsList.append(self.tplGoodsLi(val));
                    });
                };
            })
            .fail(function() {
                console.log("error");
            });
        },
        sortchange : function(){
            var self = this,
                priceSort = 0,
                $sortRab = $('.tabBox'),
                $triangle = $('.price span');
            $sortRab.on('click','li',function(){
                if(this.className == 'price'){
                    priceSort++;
                    priceSort%=2;
                    self.getAlllist({
                        sort : priceSort+2,
                        keyword : _keyword
                    });
                    if($triangle.hasClass('up')){
                        $triangle.addClass('down').removeClass('up');
                    }else{
                        $triangle.addClass('up').removeClass('down');
                    }

                }else{
                    self.getAlllist({
                        sort : this.dataset.sort,
                        keyword : _keyword
                    });
                    $triangle.addClass('up').removeClass('down');
                }
            });
        },
        tabSearch : function (){
            var self = this;
            this.gobackBtn  = $('.goback');
            this.searchBox = $('.searchBox');
            this.searchwin = $('.searchwin');
            this.closeSearch = $('.closeSearch');
            this.$searchIpnt.focus(function(){
                self.$searchIpnt.attr('placeholder','搜索');
                self.gobackBtn.hide();
                self.searchBox.addClass('on');
                self.searchwin.show();
                self.$goodsList.hide();
            });
            this.closeSearch.click(function(){
                self.$searchIpnt.removeAttr('placeholder');
                self.gobackBtn.show();
                self.searchBox.removeClass('on');
                self.searchwin.hide();
                self.$searchIpnt.val('');
                self.$goodsList.show();
            });
        },
        search : function (){
            var url = '/goods/search',
                self = this;
            this.$searchIpnt.keydown(function(e){
                var _self = this;
                if( e.keyCode == 13 ){
                    $.ajax({
                        url: url,
                        type: 'post',
                        dataType: 'json',
                        data: {
                            categoryId : categoryId ,
                            keyword : this.value,
                            sort : 'date'
                        }
                    })
                    .done(function(data) {
                        if(!data.error){
                            self.$goodsList.html('');
                            var rq_goods_arr = data.goods;
                            $.each(rq_goods_arr,function(index,val){
                                self.$goodsList.append(self.tplGoodsLi(val));
                            });
                            self.$searchIpnt.removeAttr('placeholder');
                            self.gobackBtn.show();
                            self.$goodsList.show();
                            self.searchBox.removeClass('on');
                            self.searchwin.hide();
                            _keyword = self.$searchIpnt.val();
                            self.$searchIpnt.val('');
                            _self.blur();
                        }
                    })
                    .fail(function() {
                    })
                    .always(function() {
                    });
                }
            });
            //this.searchIpnt.bind('keyup paste',function(){
            //    var dataforRender = {
            //        categoryId : categoryId ,
            //        keyword : this.value,
            //        sort : 'date'
            //    }
            //    $.ajax({
            //        url: url,
            //        type: 'post',
            //        dataType: 'json',
            //        data : dataforRender
            //    })
            //    .done(function(data) {
            //        if(!data.error){
            //            console.log(self.tplGoodsLi());
            //            console.log(data);
            //        };
            //    })
            //    .fail(function() {
            //        console.log("error");
            //    });
            //});
        },
        tplGoodsLi : function (info){
            var info = info || {},
                html = '<li>'+
                            '<a href="/goods/detail/'+info.goodsId+'">'+
                                '<div class="goodsPic">'+
                                    '<img src="'+info.headImg+'" alt=""/>'+
                                '</div>'+
                                    '<p class="goodsName">'+info.goodsName+'</p>'+
                                '<div class="goodsPrice">'+
                                    '<p class="price">￥'+info.price+' <span>￥'+info.origPrice+'</span></p>'+
                                    '<p class="time">'+info.timeDesc+'</p>'+
                                '</div>'+
                            '</a>'+
                        '</li>';
            return html;
        }
    }
    return App;
});
