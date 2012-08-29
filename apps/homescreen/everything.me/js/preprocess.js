(function(){
    var DEFAULT_TAB = "shortcuts",
        SCREEN_ACTIVE_CLASS = "active",
        hash = window.location.hash,
        page = hash.match(/#!\/([^\/]*)/);
    
    if (page && page.length > 1) {
        page = page[1];
    }
    
    if (hash.indexOf("#!/") === -1) {
        window.location.href = "#!/" + DEFAULT_TAB;
        page = DEFAULT_TAB;
    }
    
    if (page) {
        $("#" + page).addClass(SCREEN_ACTIVE_CLASS);
    }
    
    // Galaxy S3 fix - don't ask
    var $el = $('<div style="-webkit-transition: all .01s ease; position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 0; pointer-events: none;"></div>');
    $(document.body).append($el);
    window.setTimeout(function(){
        $el.css("-webkit-transform", "translate3d(100px, 0, 0)");
        window.setTimeout(function(){
            $el.remove();
        }, 100);
    }, 0);
    
    
    if (window.ErrorHandler){
        var errorHandlerConfig = {
            "debugMode": (__config && __config["debugMode"]) || false 
        };
    
        if (__config["infoLogger"] && window.InfoLogger){
            errorHandlerConfig["additionalLogger"] = function(ex){
                InfoLogger.log({
                    "type": "Unhandled exception",
                    "error_message": ex.message,
                    "error_line": ex.line,
                    "error_source": ex.source
                });
            };
        };
        ErrorHandler.init(errorHandlerConfig);
        window.onerror = ErrorHandler.add;
    }
    
    if (__config["infoLogger"] && window.InfoLogger){
        InfoLogger.init(__config.apiHost, {
            "apiKey": __config && __config.apiKey || "52cc036690b7bc874213a425f7f617b9",
            "v": __config && __config.appVersion || ""
        });
        InfoLogger.log({"type": "preprocess"});
    }
})();