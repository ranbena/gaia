/*
 * APILoggerWarn class
 */
function APILoggerWarn(Sandbox){
    var _this = this, config, logger, processedItems, report = Sandbox.Logger.warn, tempEventArr = [], enabled = true, interval, item_count = 0,
        DISABLE_THRESHOLD_ITEM_COUNT = 4,
        DISABLE_THRESHOLD_INTERVAL = 60000,
        template =  {
            "text": "{text}",
            "request_url": "{url}",
            "api_method": "{method}",
            "response_time": "{responseTime}",
            "processing_time": "{processingTime}",
            "connection_type": "{connectionType}",
            "elapsed": "{elapsed}"
        };
        
    this.name = "APILoggerWarn";
    
    this.init = function(_config, _logger){
        // set config
        config = _config;
        logger = _logger;
        
        // stringify templates
        template = JSON.stringify(template);
        
        interval = setInterval(function(){
            item_count = 0;
            enabled = true;
        }, DISABLE_THRESHOLD_INTERVAL);

        // log 
        logger.debug("APILoggerWarn.init(",config,")");
    };
    
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
            logger.debug("APILoggerWarn.dispatch(", items,")");
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
                var data = renderTemplate(template, item["data"]);                
                data && processedItems.push( data );
            }
        });
        
        return processedItems;
    }
    
    function determineDisableThreshold(){
        if (item_count >= DISABLE_THRESHOLD_ITEM_COUNT){
            enabled = false;
            //console.log("enabled = false");
        }
    }
    
    function authenticate(item){
        return (item["class"] === "Logger" && item["event"] === "warn");
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

