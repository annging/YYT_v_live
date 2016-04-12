//---名片卡上medal

define(function(requrie,exports){

	function slide(container){
		if(!(this instanceof slide)){
			return new slide(container);
		}
        this.container = container;
        this.ITEM_SIZE = container.find(".items").length>0 && container.find(".items").find("img").length;
        this.PAGE_SIZE = 10;
        this.ITEM_WIDTH = 28;
        this.TOTAL_PAGE = Math.ceil(this.ITEM_SIZE / this.PAGE_SIZE);
        this.CUR_LEFT = 0;
        this.CUR_PAGE = 1; 
        this.isWaiting = false;
        this.toLastPage = false;
        this.dir = "left";
    }


    slide.prototype.move = function(){


        if(this.isWaiting) return;

        var self = this,
            container = this.container,
            medal_container = container.find(".medals"),
            modal_items = medal_container.find(".items"),
            container_width = parseInt(medal_container.css("width")),
            page_total = Math.ceil(medal_container.find("img").length / this.PAGE_SIZE),
            left_btn = container.find(".left"),
            right_btn = container.find(".right");


        var isLeft = (this.dir==="left"),
            delta;

        if((isLeft && this.CUR_PAGE == this.TOTAL_PAGE && this.toLastPage) || (!isLeft && this.CUR_PAGE == this.TOTAL_PAGE - 1 && !this.toLastPage)){
            delta = (this.ITEM_SIZE % this.PAGE_SIZE)*this.ITEM_WIDTH;
        }else{
            delta = this.PAGE_SIZE * this.ITEM_WIDTH;
        }
        
    
        modal_items.animate({
        	"left" : (isLeft ? self.CUR_LEFT += delta : self.CUR_LEFT -= delta) + "px"
        },500,function(){
        	
        	isLeft ? self.CUR_PAGE -= 1 : self.CUR_PAGE += 1;

            if(self.CUR_PAGE == self.TOTAL_PAGE)self.toLastPage = true;
            if(self.CUR_PAGE == 1)self.toLastPage = false;

    	    if(self.CUR_PAGE == 1) {
                left_btn.css("visibility","hidden"); 
                right_btn.css("visibility","");
            }else if(self.CUR_PAGE == page_total) {
                right_btn.css("visibility","hidden");
                left_btn.css("visibility","");
            }else{
                left_btn.css("visibility","");
                right_btn.css("visibility","");
            }
            self.isWaiting = false;

        });
        this.isWaiting = true;

    }

    slide.prototype.left = function(){
        this.dir = "left";
        this.move();
    }

    slide.prototype.right = function(){
        this.dir = "right";
        this.move();
    }

    return slide;
});
    