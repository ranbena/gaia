/*
 * Counter class
 */
var Counter = new function() {
    var _this = this, arr = {}, idle,
        STORAGE_KEY_PREFIX = "counter", blacklistRegExp,
        _init = {};
    
    // default values.
    // overridden by ../config/config.php
    var options = {
        "enabled": true,
        "logger": console,
        "idleDelay": 200
    };
    
    this.TYPES = {
        "PAGE_SESSION": "PAGE_SESSION",
        "DOAT_SESSION": "DOAT_SESSION",
        "ALLTIME": "ALLTIME"
    };
    
    this.init = function(_options) {
        // override defaults
        for (i in _options){ options[i] = _options[i]; }
        
        // if enabled
        if (options.enabled){
            for (var type in _this.TYPES) {
                arr[type] = Storage.get(getStorageKey(type)) || {};
            }
            
            // Idle
            idle = new Idle();
            idle.init({
                "callback": store,
                "delay": options.idleDelay
            });
            
            if (options.blacklist){
                blacklistRegExp = new RegExp("("+options.blacklist.join("|")+")");
            }
            
            EventHandler && EventHandler.bind(onEvent);
        }
    };
    
    function onEvent(obj, evt){
        if (!(obj && evt)){ return;}
        
        var name = getEventName(obj, evt);
        
        if (evt == "init") { addInit(obj); }
        if (blacklistRegExp.test(name)){ return; }
        
        idle.reset();
        
        increment(name);
        
        shouldStoreNow(name) && idle.flush();
    }
     
    function increment (name) {
        for (var type in arr) {
            if (!arr[type][name]) {
              arr[type][name] = 1;
            } else {
                arr[type][name]++;
            }
        }
        
        //logger.info("Counter increment "+name);
    };
    
    function addInit(obj) {
        _init[obj] = true;
    }
    
    this.isInit = function(obj) {
        return _init[obj];
    };
    
    this.get = function(obj, evt, type) {
        if (!(obj && evt)){ return;}
        !type && (type = _this.TYPES.SESSION);
        
        var name = getEventName(obj, evt);
        return arr[type][name] || 0;
    };
    
    this.clear = function(type, newEvents) {
        arr[type] = {};
        Storage.remove(getStorageKey(type));
        
        if (newEvents){
            newEvents.forEach(function(event){
                var name = getEventName(event.obj, event.evt);
                arr[type][name] = 1;
            });
        }
    };
    
    this.storeNow = function(){
        idle.flush();
    };
    
    this.increment = onEvent;
    
    function getEventName(o, e) {
        return o+"_"+e;
    }
    
    function getStorageKey(type) {
        return STORAGE_KEY_PREFIX+"-"+type;
    }

    function store(){
        // leave if not idle or there are no items to dispatch
        if (!idle.isIdle) { 
            return false;
        }
        
        for (var type in arr) {
            // do not store page session
            if (type !== _this.TYPES.PAGE_SESSION && arr[type]) {
                // store using Storage object
                Storage.set(getStorageKey(type), arr[type]);    
            }
        }
        //logger.info("Counter store");
    }
    
    function shouldStoreNow(evtName){
        return options.immediateEvent && evtName === options.immediateEvent;
    }
}