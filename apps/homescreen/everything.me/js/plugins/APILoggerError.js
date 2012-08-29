/*
 * APILoggerError class
 */
function APILoggerError(Sandbox){
    var _this = this, config, logger, processedItems, report = Sandbox.Logger.error, tempEventArr = [], enabled = true, interval, item_count = 0, templatesStr = "",
        DISABLE_THRESHOLD_ITEM_COUNT = 4,
        DISABLE_THRESHOLD_INTERVAL = 60000,
        blacklistRegExp,
        templates = {
            "Core_error": {
                "text": "{text}",                
                "error_type": "{type}",
                "error_message": "{message}",
                "error_source": "{source}",
                "error_line": "{line}",
                "error_client_identifier": "{ua}",
                "error_platform": "{platform}"
            },
             "Core_initError": {
                "text": "{text}",
                "object": "{objectName}"
            },
             "Core_initLoadFile": {
                "text": "{text}",
                "object": "{objectName}"
            }
        };
        
    this.name = "APILoggerError";
    
    this.init = function(_config, _logger){
        // set config
        config = _config;
        logger = _logger;
        
        // add common params
        for (var k in templates){
            templates[k]["elapsed"] = "{elapsed}";
        }
        
        // stringify templates
        templatesStr = stringify(templates);
        
        interval = setInterval(function(){
            item_count = 0;
            enabled = true;
        }, DISABLE_THRESHOLD_INTERVAL);
        
        if (config.blacklist) {
            blacklistRegExp = new RegExp(config.blacklist, "g");
        }

        // log 
        logger.debug(_this.name+".init(",config,")");
    };
    
    function stringify(old){
        var temp = {};
        
        for (key in old){
            var value = old[key];
                value = JSON.stringify(value);
            temp[key] = value;
        }
        
        return temp;
    }
    
    // actual report
    this.dispatch = function(items){
        determineDisableThreshold(items.length);
        
        // leave if disabled or is no items provided
        if (!enabled || !items.length) { return false;}
        
        // process
        items = process(items);
        
        if (items.length){
            // increment item_count
            item_count += items.length;
            
            // report
            report({
                "params": "["+ items.toString()+"]"
            });
        
            // log
            logger.debug(_this.name+".dispatch(", items,")");
        }
    };
    
    function process(items){
        processedItems = [];
        
        // make into an array if not
        if (!(items instanceof Array)){
            items = [items];
        }
        
        // process
        items.forEach(function(item){
            
            // authenticate
            if (authenticate(item)) {
                
                // render template
                var template = templatesStr[item["class"]+"_"+item["event"]]
                    data = renderTemplate(template, item["data"]);
                
                data && processedItems.push( data );
            }
        });
        
        return processedItems;
    }
    
    function determineDisableThreshold(){
        if (item_count >= DISABLE_THRESHOLD_ITEM_COUNT){
            enabled = false;
        }
    }
    
    function authenticate(item){
        var method = item["class"]+"_"+item["event"];
        if (!(method in templates)) {
            return false;
        }
        
        if (blacklistRegExp && blacklistRegExp.test(item.data.message)) {
            return false
        }
        
        return true;
    }
    
    // template rendering
    function renderTemplate(str, attrArr) {
        if (str && attrArr) {
            for ( var key in attrArr ) {
                str = str.replace("{" + key + "}", attrArr[key]);
            }
        }
        return str;
    };
}

