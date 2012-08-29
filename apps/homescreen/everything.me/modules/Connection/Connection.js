var Connection = new function() {
    var _name = "Connection", _this = this,
            $el = null,
            hasConnection = true;
            
    var EL_ID = "connection-message",
        CLASS_NO_CONNECTION = "connection-error",
        DEFAULT_MESSAGE = "FROM CONFIG";
    
    this.init = function(options) {
        !options && (options = {});
        
        $parent = $("#doat-container");
        
        DEFAULT_MESSAGE = "You need to be connected to the internet to use this app";
        
        EventHandler.trigger(_name, "init");
    };
    
    this.on = function() {
        return hasConnection;
    };
    
    this.show = function(message) {
        !message && (message = DEFAULT_MESSAGE);
        
        if (!$el) {
            $el = $('<div id="' + EL_ID + '"></div>');
            $parent.append($el);
        }
        
        $el.html(message);
        $el.css("margin-top", -$el.height()/2 + "px");
        
        hasConnection = false;
        $parent.addClass(CLASS_NO_CONNECTION);
        EventHandler.trigger(_name, "show");
    };
    
    this.hide = function() {
        $el && $el.remove();
        hasConnection = true;
        $parent.removeClass(CLASS_NO_CONNECTION);
        EventHandler.trigger(_name, "hide");
    };
};