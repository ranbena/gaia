var Feed = new function() {
    var _name = "Feed", _this = this,
        $page = null, $scroller = null,
        scroll = null;
        
    this.init = function(options) {
        $page = options.$el;
        
        $scroller = $page.find(".scroll-wrapper");
        scroll = new Scroll($scroller[0], {
            "hScroll": false,
            "checkDOMChanges": false
        });
        
        EventHandler.trigger(_name, "init");
    };
    
    this.refreshScroll = function() {
        scroll.refresh();
    };
};