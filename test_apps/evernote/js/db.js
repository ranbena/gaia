var DB = new function() {
    var _this = this,
        db = {},
        schema = {
            "notes": {
                "objectName": "Note",
                "fields": ["id", "name", "content", "date_created", "date_updated", "trashed", "notebookId"]
            },
            "noteResource": {
                "objectName": "NoteResource",
                "fields": ["id", "name", "src", "size", "type", "noteId"]
            },
            "notebooks": {
                "objectName": "Notebook",
                "fields": ["id", "name", "userId", "date_created", "date_updated", "trashed", "numberOfNotes", "numberOfTrashedNotes"]
            },
            "users": {
                "objectname": "User",
                "fields": ["id", "date_created"]
            }
        };
        
    for (var table in schema) {
        db[table] = {};
    }
    
    this.get = function() { return tables; };
    
    this.getNotebooks = function(filters, c, e) { get("notebooks", filters, c, e); };
    this.getNotes = function(filters, c, e) { get("notes", filters, c, e); };
    this.getNoteResources = function(filters, c, e) { get("noteResource", filters, c, e); };
    
    this.addNotebook = function(obj, c, e) { add("notebooks", obj, c, e); };
    this.addNote = function(obj, c, e) { add("notes", obj, c, e); };
    this.addNoteResource = function(obj, c, e) { add("noteResource", obj, c, e); };
    
    this.updateNotebook = function(obj, c, e) { update("notebooks", obj, c, e); };
    this.updateNote = function(obj, c, e) { update("notes", obj, c, e); };
    this.updateNoteResource = function(obj, c, e) { update("noteResource", obj, c, e); };
    
    this.removeNotebook = function(obj, c, e) { _this.remove("notebooks", {"id": obj.getId()}, c, e); };
    this.removeNote = function(obj, c, e) { _this.remove("notes", {"id": obj.getId()}, c, e); };
    this.removeNoteResource = function(obj, c, e) { _this.remove("noteResource", {"id": obj.getId()}, c, e); };
    
    this.remove = function(table, filters, c, e) {
        for (var id in db[table]) {
            var obj = db[table][id],
                ok = true;
                
            for (var k in filters) {
                if (obj['data_' + k] !== filters[k])  {
                    ok = false;
                    break;
                }
            }
            
            if (ok) {
                delete db[table][id];
            }
        }
        
        Console.log("DB remove from -" + table + "-: ", filters);
        
        c && c();
    };
    
    this.update = function(table, filters, update, c, e) {
        for (var id in db[table]) {
            var obj = db[table][id],
                ok = true;
                
            for (var k in filters) {
                if (obj['data_' + k] !== filters[k])  {
                    ok = false;
                    break;
                }
            }
            
            if (ok) {
                for (var k in update) {
                    db[table][id]["data_" + k] = update[k];
                }
            }
        }
        
        Console.log("DB update -" + table + "-: ", filters, update);
        
        c && c();
    }
    
    this.write = function() {
        var _db = {};
        
        for (var tableName in db) {
            var table = db[tableName];
            
            _db[tableName] = {};
            
            for (var itemKey in table) {
                var item = table[itemKey],
                    obj = {};
                
                for (var prop in item) {
                    if (prop.indexOf("data_") == 0) {
                        obj[prop.replace(/data_/gi, "")] = item[prop];
                    }
                }
                
                _db[tableName][itemKey] = obj;
            }
        }
        
        localStorage["db"] = JSON.stringify(_db);
        
        return _db;
    };
    
    this.read = function() {
        var _db = JSON.parse(localStorage["db"] || "{}");
        
        for (var tableName in _db) {
            var table = _db[tableName];
            
            db[tableName] = {};
            
            for (var itemKey in table) {
                var itemData = table[itemKey],
                    item = new window[schema[tableName].objectName](itemData);
                
                db[tableName][itemKey] = item;
            }
        }
        
        return db;
    };
    
    function get(table, filters, c, e) {
        var ret = [];
        
        for (var id in db[table]) {
            var obj = db[table][id],
                ok = true;
                
            for (var k in filters) {
                if (obj['data_' + k] !== filters[k])  {
                    ok = false;
                    break;
                }
            }
            
            ok && ret.push(obj);
        }
        
        Console.log("DB: get from -" + table + "-: ", filters, ret);
        
        c && c(ret);
    }
    
    function add(table, obj, c, e) {
        db[table][obj.getId()] = obj;
        Console.log("DB: add to -" + table + "-: ", obj);
        c && c(obj);
    }
    
    function update(table, obj, c, e) {
        db[table][obj.getId()] && (db[table][obj.getId()] = obj);
        Console.log("DB update -" + table + "-: ", obj);
        c && c(obj);
    }
};