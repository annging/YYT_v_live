define(function(require, exports, module) {
	var juicer = require('juicer');
	var Page = Backbone.View.extend({
		initialize : function(options) {
			this.SHOW_MAX = 9;
			this.SHOW_SP = 3;
		},
		tpl : ['{@if maxShowPage>1}',
			'<div class="page_group page_right">',
			'{@if pageNo>1}',
			'<a href="javascript:;" class="page_pre J_page" data-page="{{+pageNo-1}}"><',
			'上一页</a>',
			'{@/if}',
			'{@each pages as it,index}',
			'{@if it.type=="link"}',
			'<a href="javascript:;" class="page_num J_page" data-page="{{it.value}}">{{it.value}}</a>',
			'{@else if it.type=="plain"}',
			'<span class="page_cur">{{it.value}}</span>',
			'{@else}',
			'<span class="page_ellipsis">...</span>',
			'{@/if}',
			'{@/each}',
			'{@if pageNo < maxShowPage}',
			'<a class="page_next J_page" href="javascript:;" data-page="{{+pageNo+1}}">下一页></a>',
			'{@/if}',
			'<span class="page_total">共{{pageMax}}页</span>',
			'</div>',
			'{@/if}'],
		_generate : function(pageNo) {
			if (this.pageMax < this.SHOW_MAX) {
				for (var i = 1; i <= this.pageMax; i++) {
					this.pages.push({
						value : i,
						type : i == pageNo ? 'plain' : 'link'
					})
				}
			} else {
				if (+pageNo - 1 - 1 <= this.SHOW_SP) {
					for (var i = 1; i <= this.SHOW_MAX - 1; i++) {
						this.pages.push({
							value : i,
							type : i == pageNo ? 'plain' : 'link'
						})
					}
					this.pages.push({
						value : 0,
						type : 'sep'
					});
				} else if (this.pageMax - +pageNo - 1 <= this.SHOW_SP) {
					this.pages.push({
						value : 1,
						type : 'link'
					});
					this.pages.push({
						value : 0,
						type : 'sep'
					});
					for (var i = this.pageMax - this.SHOW_MAX + 2; i <= this.pageMax; i++) {
						this.pages.push({
							value : i,
							type : i == pageNo ? 'plain' : 'link'
						})
					}
				} else {
					this.pages.push({
						value : 1,
						type : 'link'
					});
					this.pages.push({
						value : 0,
						type : 'sep'
					});
					for (var i = +pageNo - this.SHOW_SP; i <= +pageNo + this.SHOW_SP; i++) {
						this.pages.push({
							value : i,
							type : i == +pageNo ? 'plain' : 'link'
						})
					}
					this.pages.push({
						value : 0,
						type : 'sep'
					});
				}
			}
		},
		render : function(pageMax, pageNo, maxShowPage) {
			var maxShowPage = maxShowPage || pageMax;
			this.pages = [];
			this.pageMax = pageMax;
			this._generate(pageNo);
			var self = this;
			var html = juicer(this.tpl.join(''), {
				pageNo : pageNo,
				pageMax : self.pageMax,
				pages : self.pages,
				maxShowPage : maxShowPage
			});
			return html;
		}
	});

	module.exports = Page;
})
