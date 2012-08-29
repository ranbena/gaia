var ObjectManager = new function() {
    var _this = this, featureCfg, readyCallback, failCallback,
        objectRequiredCount = 0,
        objectReadyCount = 0,
        objectDefaults = {
            "type": "class",
            "required": true
        },
        objectPaths = {
            "class": "/js/{name}.js",
            "module": "/modules/{name}/{name}.js",
            "plugin": "/js/plugins/{name}.js",
            "external": "/js/external/{name}.js",
            "api": "/js/api/{name}.js",
            "helper": "/js/helpers/{name}.js"
        },
        objectPathRegExp = new RegExp("{name}", "g"),
        timeouts = [];
    
    this.init = function(cfg){
        featureCfg = cfg.featureCfg;
        readyCallback = cfg.success;
        fileLoadCallback = cfg.fileLoad;
        failCallback = cfg.error;
    };
    
    this.initObjects = function(arr){
        arr.forEach(function(objectData){
            if (!("required" in objectData)) {
                objectData.required = objectDefaults.required;
            }
            
            if (objectData.required){ objectRequiredCount++; }
        });
        arr.forEach(initObject);
    };
    
    function initObject(objectData){
        var objectName = objectData.name;

        // do nothing if disabled by config
        if (featureCfg[objectName] === false){ return false; }
        
        checkObjectExists(objectData, onObjectLoadError);
    };
    
    function onObjectReady(){
        objectReadyCount++;
        if (objectReadyCount == objectRequiredCount){
            readyCallback();
        }
    }
    
    function onObjectLoadSuccess(objectData){        
        (objectData.name in timeouts) && clearTimeout(timeouts[objectData.name]);
        
        var object = window[objectData.name],
            featureConfig = featureCfg[objectData.name];
            
        // if feature config isn't boolean, pass it to the object init
        if (featureConfig !== undefined && !(featureConfig instanceof Boolean)){
            !objectData.config && (objectData.config = {});
            objectData.config.features = featureConfig;
        }
        
        // init object
        var success = object.init(objectData.config);
        
        if (success != false){
            objectData.required && onObjectReady();
            
            // success callback
            objectData.success && objectData.success(object);    
        }
    }
    
    function onObjectLoadError(objectData){
        if (objectData.required){
            
            var type = objectData.type || objectDefaults.type;
            var path = objectPaths[type].replace(objectPathRegExp, objectData.name);
            
            // load
            loadObject(path, function(){
                checkObjectExists(objectData, failCallback, fileLoadCallback);
            }, function(){
                failCallback(objectData);
            });
        }
    }
    
    function checkObjectExists(objectData, cbError, cbSuccess){
        // Checks object existence
        if (objectData.name in window){
            cbSuccess && cbSuccess(objectData);
            onObjectLoadSuccess(objectData);
        }
        else{
            cbError && cbError(objectData);
        }
    }
    
    function loadObject(src, cb){
        var script = document.createElement("script");
        script.src = src;
        script.onload = cb;
        script.onerror = cb;
        document.getElementsByTagName("head")[0].appendChild(script);
    }
}