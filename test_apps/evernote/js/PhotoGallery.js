var DeviceFilesTypes = {
    "PICTURES": "pictures",
    "VIDEOS": "videos",
    "MUSIC": "music"
};

var DeviceFiles = function(_options) {
    var _this = this, _listeners = {},
        folder = "", mediaType = "",
        storage = null, ready = false;
        
        
    this.EVENTS = {
        "AVAILABLE": "available",
        "UNAVAILABLE": "unavailable"
    };
        
    function init(options) {
        !options && (options = {});
        
        options.folder && (folder = options.folder);
        mediaType = options.type || DeviceFilesTypes.PICTURES;
        
        // autobind events in the init options (onavailable, onunavailable, etc.)
        for (var key in _this.EVENTS) {
            (options["on" + _this.EVENTS[key]]) && bind(_this.EVENTS[key], options["on" + _this.EVENTS[key]]);
        }
        
        initStorageObject();
        
        return _this;
    }
    
    this.get = function(onSuccess, onError) {
        if (!storage) {
            onError && onError("invalid media type '" + mediaType + "'");
        }
        
        var cursor = storage.enumerate(folder, {}),
            files = [];
            
        cursor.onsuccess = function() {
            var file = cursor.result;
            if (file) {
                if ("URL" in window) {
                    file.src = URL.createObjectURL(file)
                }
                files.push(file);
                cursor["continue"]();
            } else {
                onSuccess && onSuccess(files);
            }
        };
        
        cursor.onerror = function(e){
            onError && onError("cursor error");
        };
    };
    
    function initStorageObject() {
        storage = navigator.getDeviceStorage(mediaType);
        
        if (!storage) {
            return;
        }
        
        storage.onchange = function(e) {
            if (e.reason === 'available') {
                ready = true;
                trigger(_this.EVENTS.AVAILABLE);
            } else if (e.reason === 'unavailable' || e.reason === 'shared') {
                ready = false;
                trigger(_this.EVENTS.UNAVAILABLE, e.reason);
            }
        };
    }
    
    /* Event Handle methods - bind, unbind and trigger - both private and public */
    function bind(type, cb) {
        (!_listeners[type]) && (_listeners[type] = []);
        _listeners[type].push(cb);
        return _this;
    }
    function unbind(type, cb) {
        (!_listeners[type]) && (_listeners[type] = []);
        for (var i=_listeners[type].length-1; i>=0; i--) {
            var _cb = _listeners[type][i];
            (!cb || _cb == cb) && (delete _listeners[i]);
        }
        return _this;
    }
    function trigger(type) {
        (!_listeners[type]) && (_listeners[type] = []);
        var args = Array.prototype.slice.call(arguments, 0).splice(1);
        for (var i=0,l=_listeners[type].length; i<l; i++) {
            _listeners[type][i].apply(_this, args);
        }
        return _this;
    }
    this.bind = this.addEventListener = bind;
    this.unbind = this.removeEventListener = unbind;
    this.trigger = this.dispatch = trigger;
    
    init(_options);
};

var DeviceImagesGallery = new function() {
    var _this = this,
        ready = false, images = [],
        el = null, elList = null, elTitle = null, visible = false,
        title = "", onShow = null, onSelect = null, onClose = null;
        
    var THUMB_SIZE = "107px";
    
    this.show = function(options) {
        !options && (options = {});
        
        options.title && (title = options.title);
        options.onShow && (onShow = options.onShow);
        options.onSelect && (onSelect = options.onSelect);
        options.onClose && (onClose = options.onClose);
        
        if (!ready) {
            getImages(true);
            return;
        }
        
        elTitle.innerHTML = title;
        elTitle.style.display = title? "block" : "none";
        el.style.display = "block";
        
        visible = true;
        
        onShow && onShow(images);
    };
    
    this.hide = function() {
        el.style.display = "none";
        visible = false;
        onClose && onClose();
    };
    
    function getImages(bCreateUIWhenDone) {
        new DeviceFiles({
            "type": DeviceFilesTypes.PICTURES,
            "folder": "/"
        }).get(function(files){
            images = files;
            ready = true;
            bCreateUIWhenDone && createUI();
        }, function(error) {
            alert(error);
            ready = false;
        });
    }
    
    function createUI() {
        if (el) return;
        
        el = document.createElement("div");
        el.style.cssText = "position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 900; background: rgba(42, 42, 42,.95); margin: 0; padding: 0; display: none;";
        el.addEventListener("click", _this.hide);
        
        elTitle = document.createElement("div");
        elTitle.style.cssText = "margin: 0; padding: 12px 8px; color: #fff; font-weight: normal; font-size: 18px;";
        
        elList = document.createElement("ul");
        elList.style.cssText = "list-style-type: none; text-align: left; overflow: auto; margin: 0; padding: 0;";
        
        for (var i=0; i<images.length; i++) {
            var elItem = document.createElement("li");
            elItem.image = images[i];
            elItem.style.cssText = '-moz-box-sizing: border-box; width: ' + THUMB_SIZE + '; height: ' + THUMB_SIZE + '; float: left; border: 1px solid #000; margin: 0; padding: 0; background-size: contain; background: transparent url(' + images[i].src + ') 50% 50% no-repeat;';
            elItem.addEventListener("click", onImageElementclick);
            elList.appendChild(elItem);
        }
        
        el.appendChild(elTitle);
        el.appendChild(elList);
        
        document.body.appendChild(el);
        
        _this.show();
    }
    
    function onImageElementclick() {
        var image = this.image;
        onSelect && onSelect(image);
        window.setTimeout(_this.hide, 0);
    }
};