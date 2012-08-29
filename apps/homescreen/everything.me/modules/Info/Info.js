var Info = new function() {
    var _name = "Info", _this = this,
        $el = null, $linkParent = null, $link = null, $linkClose = null, $title = null, $home = null, $pages = null, $pagesBack = null,
        scroll = null, linkText = "", storageKey = "openedInfoPage", opened = false, hideTimeout;
        
    this.init = function(options) {
        !options && (options = {});     
        
        $el = options.$el;
        $linkParent = options.$linkParent;
        $linkClose = options.$linkClose;
        $title = options.$title;
        $home = options.$home;
        $pages = options.$pages;
        $pagesBack = options.$pagesBack;
        
        linkText = options.linkText;
        opened = Storage.get(storageKey);
        
        if (options.tagline) {
            $title.html(options.tagline);
        }
        
        $link = $('<div id="info-link"></div>');
        
        if (!opened) {
            $link.addClass("new");
        }
        $link.addClass("visible");
        $linkParent.append($link);
        
        $el.find(".buttons").children().bind("touchstart", function(e) {
            e.preventDefault();
            _this.showPage($(this).attr("data-page"));
        });
        
        $pagesBack.bind("touchstart", _this.showHome);
        $link.bind("touchstart", linkClick);
        $linkClose.bind("touchstart", linkCloseClick);
        
        scroll = new Scroll($("#info-page-new")[0], {
            "hScroll": false,
        });
        
        EventHandler.trigger(_name, "init");
    };
    
    this.showHome = function() {
        $($pages[0]).parent().removeClass("visible");
        $home.addClass("visible");
        
        window.setTimeout(function(){
            $pages.removeClass("visible");
        }, 500);
        
        cbHomeShown();
    };
    
    this.showPage = function(id) {
        $home.removeClass("visible");
        
        var $page = $pages.filter("#info-page-" + id);
        $pages.removeClass("visible");
        $page.addClass("visible");
        $page.parent().addClass("visible");
        
        cbPageShown(id, $page);
    };
    
    this.refreshScroll = function() {
        if ($pages.filter(".visible").attr("id") == "info-page-new") {
            scroll.refresh();
        }
    };
    
    this.enablePagesAnimation = function() {
        $home.removeClass("noanimation");
        $pages.parent().removeClass("noanimation");
    };
    
    this.disablePagesAnimation = function() {
        $home.addClass("noanimation");
        $pages.parent().addClass("noanimation");
    };
    
    this.hide = function(){
        hideTimeout = setTimeout(function(){
            $el.addClass("hidden");
        }, 1000);
    };
    
    this.show = function(cb){
        hideTimeout && clearTimeout(hideTimeout);
        $el.removeClass("hidden");
        
        setTimeout(cb, 100);
    };
    
    function needToShowLinkText() {
        return !Storage.get(storageKey);
    }
    
    function cbHomeShown() {
        EventHandler.trigger(_name, "homeShown");
    }
    
    function cbPageShown(id, $page) {
        EventHandler.trigger(_name, "pageShown", {
            "id": id,
            "$el": $page
        });
    }
    
    function linkClick(e) {
        e.preventDefault();
        
        _this.disablePagesAnimation();
        
        if (!opened) {
            Storage.set(storageKey, true);
            opened = true;
            _this.showPage("new");
            window.setTimeout(function(){
                $link.removeClass("new");
            }, 500);
        } else {
            _this.showHome();
        }
        
        window.setTimeout(_this.enablePagesAnimation, 100);
        
        EventHandler.trigger(_name, "linkClick", {
            "e": e
        });
    }
    
    function linkCloseClick(e) {
        e.preventDefault();
        
        EventHandler.trigger(_name, "linkCloseClick", {
            "e": e
        });
    }
};