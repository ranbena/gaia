var DB = new function() {
    var _this = this,
        
        indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
        
        db = null,
        DB_NAME = "EVME_Notes",
        DB_VERSION = 1,
        
        schema = {
            "notes": {
                "objectName": "Note",
                "indexes": ["notebook_id", "name"]
            },
            "noteResource": {
                "objectName": "NoteResource",
                "indexes": ["note_id"]
            },
            "notebooks": {
                "objectName": "Notebook",
                "indexes": ["user_id"]
            },
            "users": {
                "objectname": "User"
            }
        };
        
    this.init = function(onSuccess) {
        _this.open(onSuccess);
    };
    
    this.destroy = function() {
        var req = indexedDB.deleteDatabase(DB_NAME);
        
        req.onsuccess = function() {
            console.log("Database destroyed.")
        };
        req.onerror = req.onblocked = function(ev) {
            console.log("Database destroy failed: ", ev)
        };
    };
    
    this.open = function(cbSuccess) {
        var request = indexedDB.open(DB_NAME, DB_VERSION);
        Console.log("DB: Opening " + DB_NAME + "(" + DB_VERSION + ")...");
        
        request.onupgradeneeded = function(e) {
            Console.log("DB: Upgrading version...");
            
            var transaction = e.target.transaction;
            
            for (var table in schema) {
                var store = null,
                    indexes = schema[table].indexes || [];
                    
                if (transaction.objectStoreNames.contains(table)) {
                    store = transaction.objectStore(table);
                } else {
                    store = transaction.db.createObjectStore(table, {keyPath: "id"})
                }
                
                for (var i=0; i<indexes.length; i++) {
                    store.createIndex(indexes[i], indexes[i], {'unique': false});
                }
            }
            
            transaction.oncomplete = function() {
                Console.log("DB: Upgrade success!");
            };
            transaction.onfailure = _this.onerror;
        };
    
        request.onsuccess = function(e) {
            db = e.target.result;
            
            Console.log("DB: Open success!", db);
            
            cbSuccess && cbSuccess(db);
        };
        
        request.onfailure = _this.onerror;
    };
    
    this.onerror = function(e) {
        Console.error("DB: Error!", e);
    };
    
    
    
    this.get = function() { return db; };
    
    this.getNotebooks = function(filters, c, e) { get("notebooks", filters, c, e); };
    this.getNotes = function(filters, c, e) { get("notes", filters, c, e); };
    this.getNoteResources = function(filters, c, e) { get("noteResource", filters, c, e); };
    
    this.addNotebook = function(obj, c, e) { add("notebooks", obj, c, e); };
    this.addNote = function(obj, c, e) { add("notes", obj, c, e); };
    this.addNoteResource = function(obj, c, e) { add("noteResource", obj, c, e); };
    
    this.updateNotebook = function(obj, c, e) { update("notebooks", obj, c, e); };
    this.updateNote = function(obj, c, e) { update("notes", obj, c, e); };
    this.updateNoteResource = function(obj, c, e) { update("noteResource", obj, c, e); };
    
    this.removeNotebook = function(obj, c, e) { remove("notebooks", obj.getId(), c, e); };
    this.removeNote = function(obj, c, e) { remove("notes", obj.getId(), c, e); };
    this.removeNoteResource = function(obj, c, e) { remove("noteResource", obj.getId(), c, e); };
    
    function remove(table, key, c, e) {
        var store = db.transaction(table, IDBTransaction.READ_WRITE).objectStore(table),
            req = store["delete"](key);
            
        req.onsuccess = function(e) {
            c && c();
        };
        req.onfailure = onerror;
        
        Console.log("DB remove from -" + table + "-: ", key);
    };
    
    this.update = function(table, filters, update, c, e) {
        get(table, filters, function(items) {
            for (var i=0; i<items.length; i++) {
                var item = items[i];
                item.set(update);
            }
            
            c && c();
        });
        
        Console.log("DB update -" + table + "-: ", filters, update);
    }
    
    function get(table, filters, c, e) {
        var ret = [],
            req = db.transaction(table).objectStore(table).openCursor();
            
        req.onsuccess = function(e) {
            var cursor = e.target.result;
            if (cursor) {
                var obj = cursor.value,
                    ok = true;
                
                for (var k in filters) {
                    if (obj[k] !== filters[k])  {
                        ok = false;
                        break;
                    }
                }
                
                ok && ret.push(unserialize(obj, table));
                
                cursor["continue"]();
            } else {
                Console.log("DB: get from -" + table + "-: ", filters, ret);
                c && c(ret);
            }
        };
        req.onfailure = onerror;
    }
    
    function add(table, obj, c, e) {
        var transaction = db.transaction(table, IDBTransaction.READ_WRITE);
        
        transaction.oncomplete = function(e) {
            c && c(obj);
        };
        transaction.onfailure = onerror;
        
        var request = transaction.objectStore(table).add(serialize(obj));
        request.onsuccess = function(e) {};
        request.onfailure = function(e) {};
        
        Console.log("DB: add to -" + table + "-: ", obj);
    }
    
    function update(table, obj, c, e) {
        var transaction = db.transaction(table, IDBTransaction.READ_WRITE);
        
        transaction.oncomplete = function(e) {
            c && c(obj);
        };
        transaction.onfailure = onerror;
        
        var request = transaction.objectStore(table).put(serialize(obj));
        request.onsuccess = function(e) {};
        request.onfailure = function(e) {};
        
        Console.log("DB update -" + table + "-: ", obj);
    }
    
    // convert Object to storable data 
    function serialize(obj) {
        var data = {};
        
        for (var key in obj) {
            if (key.indexOf('data_') !== -1) {
                data[key.replace('data_', "")] = obj[key];
            }
        }
        
        return data;
    }
    // given data and table, return an object
    function unserialize(data, table) {
        var objName = schema[table].objectName;
        return new window[objName](data);
    }
};