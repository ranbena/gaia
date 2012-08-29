(function (){
    var env = new Doat_Env(),
        info = env.getInfo(),
        envData = {
            "os": info.os,
            "platform": info.platform,
            "browser": info.browser,
            "userAgent": {"name": navigator.userAgent.toLowerCase()}
        };
    
    var data = window.__config;
        data.featureCfg = {};
     
    if (data && "features" in data) {
        mergeFeatureConfig(data.featureCfg, data.features, envData);

        if (data.redirectMode && data.featureCfg.redirect && data.featureCfg.redirect.url){
            location.href = data.featureCfg.redirect.url;
        }
    }
    
    function mergeFeatureConfig(local, cfg, envData){
        for (var key in cfg){
            var f = cfg[key],
                flag = true;

            for (var key in envData) {
                if (f.filters[key]){
                    var filter = f.filters[key];

                    if (filter.name && !Match.exec(filter.name, envData[key].name) ||
                        filter.version && !Match.exec(filter.version, envData[key].version)
                    ) {
                        flag = false;
                    }
                }
            }

            if (flag){
                for (var k in f.config){
                    local[k] = f.config[k];
                }
            }
        };
    }
        
})();
    
    