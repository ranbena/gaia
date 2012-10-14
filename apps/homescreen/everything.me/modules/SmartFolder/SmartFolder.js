Evme.SmartFolder = function(_options) {
    var _this = this, _name = "SmartFolder",
        name = '', image = '', scroll = null, shouldFadeImage = false,
        $el = null, $elScreen = null, $elTitle = null,
        $elAppsContainer = null, $elApps = null,
        $elImage = null, $elImageOverlay = null, $elImageFullscreen = null,
        reportedScrollMove = false, onScrollEnd = null, onClose = null;
        
    var CLASS_WHEN_VISIBLE = 'visible',
        CLASS_WHEN_IMAGE_FULLSCREEN = 'full-image',
        CLASS_WHEN_ANIMATING = 'animate',
        CLASS_WHEN_MAX_HEIGHT = 'maxheight',
        TITLE_PREFIX = "Everything",
        LOAD_MORE_TEXT = "Loading...",
        SCROLL_TO_BOTTOM = "CALCULATED",
        SCROLL_TO_SHOW_IMAGE = 80,
        TRANSITION_DURATION = 400,
        LOAD_MORE_SCROLL_THRESHOLD = -30,
        MAX_HEIGHT = 520;
        
    this.init = function(options) {
        !options && (options = {});
        
        createElement();
        
        options.name && _this.setName(options.name);
        options.image && _this.setImage(options.image);
        options.parent && _this.appendTo(options.parent);
        (typeof options.maxHeight == "number") && (MAX_HEIGHT = options.maxHeight);
        
        onScrollEnd = options.onScrollEnd;
        onClose = options.onClose;
        
        _this.MoreIndicator.init({
            "text": LOAD_MORE_TEXT,
            "$parent": $elApps
        });
        
        Evme.EventHandler.trigger(_name, "init");
        
        return _this;
    };
    
    this.show = function() {
        window.setTimeout(function(){
            $el.addClass(CLASS_WHEN_VISIBLE);
            $elScreen.addClass(CLASS_WHEN_VISIBLE);
        }, 0);
        
        Evme.EventHandler.trigger(_name, "show");
        return _this;
    };
    
    this.hide = function() {
        $el.removeClass(CLASS_WHEN_VISIBLE);
        $elScreen.removeClass(CLASS_WHEN_VISIBLE);
        
        Evme.EventHandler.trigger(_name, "hide");
        
        return _this;
    };
    
    this.close = function(e) {
        e && e.preventDefault();
        e && e.stopPropagation();
        
        _this.hide();
        
        window.setTimeout(function(){
            $el && $el.remove();
            $elScreen && $elScreen.remove();
        }, 500);
        
        onClose && onClose(_this);
        
        Evme.EventHandler.trigger(_name, "close");
        return _this;
    };
    
    this.loadApps = function(options) {
        var apps = options.apps,
            iconsFormat = options.iconsFormat,
            offset = options.offset;
            
        var iconsResult = Evme.Utils.Apps.print({
            "apps": apps,
            "numAppsOffset": offset,
            "isMore": offset > 0,
            "iconsFormat": iconsFormat,
            "$list": $elApps,
            "onDone": function(group, appsList) {
                scroll.refresh();
                
                SCROLL_TO_BOTTOM = $elApps.height() - $elAppsContainer.height();
            }
        });
        
        Evme.EventHandler.trigger(_name, "load");
    };
    
    this.appendTo = function($elParent) {
        $elParent.append($el);
        $elParent.append($elScreen);
        
        if ($el.height() > MAX_HEIGHT) {
            $el.addClass(CLASS_WHEN_MAX_HEIGHT);
            $el.css({
                'height': MAX_HEIGHT + 'px',
                'margin-top': -MAX_HEIGHT/2 + 'px'
            });
        }
        
        return _this;
    };
    
    this.setName = function(_name) {
        if (!_name || _name == name) return _this;
        name = _name;
        $elTitle.html(TITLE_PREFIX + ' <span>' + name + '</span>');
        
        return _this;
    };
    
    this.setImage = function(_image) {
        if (!_image || _image == image) return _this;
        image = _image;
        
        $elImage.css('background-image', 'url(' + image.image + ')');
        
        $elImageFullscreen = Evme.BackgroundImage.getFullscreenElement(image, _this.hideFullscreen);
        $el.append($elImageFullscreen);
        
        return _this;
    };
    
    this.showFullscreen = function(e) {
        e && e.preventDefault();
        e && e.stopPropagation();
        
        $el.addClass(CLASS_WHEN_ANIMATING);
        window.setTimeout(function(){
            _this.fadeImage(0);
            $el.addClass(CLASS_WHEN_IMAGE_FULLSCREEN);
        }, 10);
    };
    
    this.hideFullscreen = function(e) {
        e && e.preventDefault();
        e && e.stopPropagation();
        
        $el.addClass(CLASS_WHEN_ANIMATING);
        window.setTimeout(function(){
            _this.fadeImage(1);
            $el.removeClass(CLASS_WHEN_IMAGE_FULLSCREEN);
            window.setTimeout(function(){
                $el.removeClass(CLASS_WHEN_ANIMATING);
            }, TRANSITION_DURATION);
        }, 10);
    };
    
    this.fadeImage = function(howMuch) {
        $elImageOverlay[0].style.opacity = howMuch;
        $elAppsContainer[0].style.opacity = howMuch;
        $elTitle[0].style.opacity = howMuch;
    };
    
    this.MoreIndicator = new function() {
        var _this = this,
            $el = null, $parent = null, spinner = null, text = '';
            
        this.init = function(options) {
            $parent = options.$parent;
            text = options.text;
            
            $el = $('<li class="loadmore"><span></span>' + text + '</li>');
            $parent.append($el)
        };
        this.show = function() {
            $parent.addClass("loading-more");
            
            var opts = {
              "lines": 8,
              "length": 2,
              "width": 3,
              "radius": 3,
              "color": "#fff",
              "speed": 1,
              "trail": 60,
              "shadow": false
            };
            spinner = new Spinner(opts).spin($el.find("span")[0]);
            
            scroll.refresh();
        };
        
        this.hide = function() {
            spinner.stop();
            $parent.removeClass("loading-more");
            scroll.refresh();
        };
    };
    
    this.getElement = function() { return $el; };
    this.getName = function() { return name; };
    this.getImage = function() { return image; };
    
    function createElement() {
        $elScreen = $('<div class="screen smart-folder-screen"></div>');
        $el = $('<div class="smart-folder">' +
                    '<h2></h2>' +
                    '<div class="evme-apps">' +
                        '<ul></ul>' +
                    '</div>' +
                    '<div class="image"><div class="image-overlay"></div></div>' +
                    '<b class="close"></b>' +
                '</div>');
                
        $elTitle = $el.find("h2");
        $elAppsContainer = $el.find(".evme-apps");
        $elApps = $elAppsContainer.find("ul");
        $elImage = $el.find(".image");
        $elImageOverlay = $el.find(".image-overlay");
        
        $el.find(".close").bind("touchstart", _this.close);
        $elAppsContainer.data("scrollOffset", 0);
        
        scroll = new Scroll($elApps.parent()[0], {
            "hScroll": false,
            "checkDOMChanges": false,
            "onScrollStart": onScrollStart,
            "onScrollMove": onScrollMove,
            "onTouchEnd": onTouchEnd
        });
    }
    
    function onScrollStart(data) {
        var y = scroll.y;
        
        $elAppsContainer.data("scrollOffset", y);
        shouldFadeImage = y >= -1;
        reportedScrollMove = false;
    }
    
    function onScrollMove(data) {
        var y = scroll.y;
        
        if (shouldFadeImage && y > 0) {
            var per = Math.round(Math.min(1-y/100, 1)*100)/100;
            _this.fadeImage(per);
        } else {
            if (!reportedScrollMove && SCROLL_TO_BOTTOM + y < LOAD_MORE_SCROLL_THRESHOLD) {
                reportedScrollMove = true;
                onScrollEnd && onScrollEnd(_this);
            }
        }
    }
    
    function onTouchEnd() {
        var y = scroll.y;
        
        $elAppsContainer.data("scrollOffset", y);
        
        if (shouldFadeImage && y > SCROLL_TO_SHOW_IMAGE) {
            _this.showFullscreen();
        } else {
            _this.hideFullscreen();
        }
    }
    
    _this.init(_options);
};