function __load(__resources, useCache, version, callback) {
    if (typeof __resources !== "undefined" && __resources instanceof Array) {
        var loaded = 0,
            to = document.getElementsByTagName("head")[0];
        var responses = {},
            _requests = {};
        
        var CACHE_KEY_VERSION = "jscacheversion",
            CACHE_KEY_SCRIPTS = "scripts",
            REQUESTS_TIMEOUT = 20000;
        
        if (useCache) {
            var userVersion = Storage.get(CACHE_KEY_VERSION) || 0;
            if (userVersion < version) {
                Storage.set(CACHE_KEY_VERSION, version);
                Storage.remove(CACHE_KEY_SCRIPTS);
            } else {
                responses = Storage.get(CACHE_KEY_SCRIPTS) || "{}";
                try {
                    responses = JSON.parse(responses);
                } catch(ex) {
                    responses = {};
                }
            }
        }
        
        
        function loadScript(src) {
            if (!useCache) {
                createScript(null, src);
                return;
            }
            
            var content = responses[src] || null;
            
            if (content) {
                createScript(content, src);
            } else {
                var request = new XMLHttpRequest();
                
                _requests[src] = {
                    "request": request,
                    "timeout": window.setTimeout(function(){
                        cancelRequest(src);
                    }, REQUESTS_TIMEOUT)
                };
                
                request.open("GET", src, true);
                request.onreadystatechange = function(e) {
                    if (request.readyState == 4) {
                        window.clearTimeout(_requests[src].timeout);
                        
                        if (request.status != 200 || request.responseText == "") {
                            InfoLogger && InfoLogger.postLog({
                                "type": "resource load fail",
                                "file": src,
                                "requestStatus": request.status,
                                "responseText": request.responseText
                            });
                            createScript(null, src);
                        } else {
                            var response = request.responseText;
                            if (response) {
                                responses[src] = response;
                                createScript(response, src);
                            }
                        }
                    }
                };
                request.send();
            }
        }
        
        function cancelRequest(src) {
            var request = _requests[src].request;
            request.onreadystatechange = function(){};
            request.abort();
            InfoLogger && InfoLogger.log({
                "type": "resource load timeout",
                "file": src
            });
        }
        
        function createScript(content, src) {
            var el = document.createElement("script");
            el.setAttribute("type", "text/javascript");
            
            if (content) {
                if ("text" in el) {
                    el.text = content;
                } else {
                    el.innerHTML = content;
                }
            } else {
                el.src = src;
                el.addEventListener("load", scriptLoaded);
            }
            
            to.appendChild(el);
            
            if (content) {
                scriptLoaded();
            }
        }
        
        function scriptLoaded() {
            loaded++;
            
            if (loaded == __resources.length-1) {
                // Loaded all scripts but the last (common), load it now to start the app
                loadScript(__resources[__resources.length-1]);
            } else if (loaded == __resources.length) {
                
                InfoLogger && InfoLogger.log({
                    "type": "resource load complete"
                });
                
                callback && callback();
                
                // Finished loading all the scripts, insert the responses into the cache for next time
                if (useCache) {
                    try {
                        responses = JSON.stringify(responses);
                        Storage.add(CACHE_KEY_SCRIPTS, responses);
                    } catch(ex) {
                        
                    }
                }
            }
        }
        
        if (__resources.length == 1) {
            loadScript(__resources[0]);
        } else {
            for (var i=0; i<__resources.length-1; i++) {
                loadScript(__resources[i]);
            }
        }
    }
}