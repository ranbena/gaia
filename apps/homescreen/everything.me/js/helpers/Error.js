var ErrorHandler = new function() {
    var _this = this, arr =[],
        debugMode,
        loggerReady = false;
    
    this.init = function(cfg) {
        debugMode = cfg.debugMode;
        additionalLogger = cfg.additionalLogger;
        History.init(cfg.muteTimeout || 10000);
    };
    
    this.add = function(ex) {
        if (typeof ex == "string") {
            ex = {
                "message": arguments[0],
                "href": arguments[1],
                "lineNo": arguments[2]
            }
        }
        
        // dispatch if last time was long ago (muteTimeout)
        History.isValid(ex) && dispatch({
            "type": "Unhandled Exception",
            "message": ex.message || "",
            "source": ex.href || ex.fileName || "",
            "line": ex.lineNo || ex.lineNumber || "",
            "stack": ex.stack || ""
        });

        return false;
    };
    
    this.setLoggerReady = function() {
        loggerReady = true;
        arr.forEach(dispatch);
    };
    
    function dispatch(ex) {
        if (debugMode) {
            alert(ex.message);
            alert("line:"+ex.line+", source:"+ex.source);
        } else {
            if (loggerReady) {
                EventHandler.trigger("Core", "error", ex);
            } else {
                if (additionalLogger) {
                    additionalLogger(ex);
                } else {
                    arr.push(ex);
                }
            }    
        }
    }
    
    var History = new function() {
        var items = {}, min;
        
        this.init = function(_min) {
            min = _min;
        };
        
        this.isValid = function(ex) {
            var ts = items[ex.message],
                now = new Date().getTime();
            
            if (!ts || now-ts > min) {
                items[ex.message] = now;
                return true;
            }
            return false;
        }
    };
}