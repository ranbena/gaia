var DB = new function() {
    var _this = this,
        tables = {
            "Note": {},
            "Notebook": {},
            "NoteResource": {}
        };
    
    this.get = function() { return tables; };
    
    this.getNotebooks = function(filters, c, e) { get("Notebook", filters, c, e); };
    this.getNotes = function(filters, c, e) { get("Note", filters, c, e); };
    this.getNoteResources = function(filters, c, e) { get("NoteResource", filters, c, e); };
    
    this.addNotebook = function(obj, c, e) { add("Notebook", obj, c, e); };
    this.addNote = function(obj, c, e) { add("Note", obj, c, e); };
    this.addNoteResource = function(obj, c, e) { add("NoteResource", obj, c, e); };
    
    this.updateNotebook = function(obj, c, e) { update("Notebook", obj, c, e); };
    this.updateNote = function(obj, c, e) { update("Note", obj, c, e); };
    this.updateNoteResource = function(obj, c, e) { update("NoteResource", obj, c, e); };
    
    this.removeNotebook = function(obj, c, e) { _this.remove("Notebook", {"id": obj.getId()}, c, e); };
    this.removeNote = function(obj, c, e) { _this.remove("Note", {"id": obj.getId()}, c, e); };
    this.removeNoteResource = function(obj, c, e) { _this.remove("NoteResource", {"id": obj.getId()}, c, e); };
    
    this.remove = function(table, filters, c, e) {
        for (var id in tables[table]) {
            var obj = tables[table][id],
                ok = true;
                
            for (var k in filters) {
                if (obj['data_' + k] !== filters[k])  {
                    ok = false;
                    break;
                }
            }
            
            if (ok) {
                delete tables[table][id];
            }
        }
        
        Console.log("DB remove from -" + table + "-: ", filters);
        
        c && c();
    };
    
    this.write = function() {
        var _db = {};
        
        for (var tableName in tables) {
            var table = tables[tableName];
            
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
            
            tables[tableName] = {};
            
            for (var itemKey in table) {
                var itemData = table[itemKey],
                    item = new window[tableName](itemData);
                
                tables[tableName][itemKey] = item;
            }
        }
        
        return tables;
    };
    
    function get(table, filters, c, e) {
        var ret = [];
        
        for (var id in tables[table]) {
            var obj = tables[table][id],
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
        tables[table][obj.getId()] = obj;
        Console.log("DB: add to -" + table + "-: ", obj);
        c && c(obj);
    }
    
    function update(table, obj, c, e) {
        tables[table][obj.getId()] && (tables[table][obj.getId()] = obj);
        Console.log("DB update -" + table + "-: ", obj);
        c && c(obj);
    }
};

var User = new function() {
    var _this = this;
    
    this.data_id = "";
    
    this.init = function(options, cbSuccess) {
        updateObject(_this, options);
        validate();
        
        localStorage["userId"] = _this.data_id;
        DB.read();
        
        cbSuccess && cbSuccess();
    };
    
    this.newNotebook = function(options, cbSuccess, cbError) {
        options.userId = _this.getId();
        
        var notebook = new Notebook(options);
        DB.addNotebook(notebook, function(){
            cbSuccess && cbSuccess(notebook);
        });
    };
    
    this.getNotebooks = function(cbSuccess, cbError) {
        DB.getNotebooks({"userId": _this.data_id}, cbSuccess, cbError);
    };
    
    this.getTrashedNotes = function(cbSuccess, cbError) {
        DB.getNotes({"trashed": true}, cbSuccess, cbError);
    };
    
    this.getNotes = function(filters, cbSuccess, cbError) {
        DB.getNotes(filters, cbSuccess, cbError);
    };
    
    this.getId = function() { return _this.data_id; };
    
    function validate() {
        if (!_this.data_id) {
            _this.data_id = "user_" + Math.round(Math.random()*100000);
        }
    }
};

var Notebook = function(_options) {
    var _this = this;
    
    this.data_numberOfNotes = 0;
    this.data_numberOfTrashedNotes = 0;
    
    this.data_id = "";
    this.data_name = "";
    this.data_userId = "";
    
    function init(options) {
        updateObject(_this, options);
        validate();
    }
    
    this.set = function(options, cbSuccess, cbError) {
        updateObject(_this, options);
        validate();
        
        DB.updateNotebook(_this, cbSuccess, cbError);
        
        return _this;
    };
    
    this.newNote = function(options, cbSuccess, cbError) {
        !options && (options = {});
        
        options.notebookId = _this.getId();
        
        var note = new Note(options);
        
        DB.addNote(note, function(){
            _this.data_numberOfNotes++;
            cbSuccess && cbSuccess(note);
        });
    };
    
    this.getNotes = function(bIncludeTrashed, cbSuccess, cbError) {
        var filters = {
            "notebookId": _this.getId()
        };
        if (!bIncludeTrashed) {
            filters.trashed = false;
        }
        
        DB.getNotes(filters, cbSuccess, cbError);
        
        return _this;
    };
    this.getTrashedNotes = function(cbSuccess, cbError) {
        var filters = {
            "notebookId": _this.getId(),
            "trashed": true
        };
        
        DB.getNotes(filters, cbSuccess, cbError);
        
        return _this;
    };
    
    this.remove = function(cbSuccess, cbError) {
        DB.remove("Note", {"notebookId": _this.getId()}, function onSuccess() {
            DB.removeNotebook(_this, cbSuccess, cbError);
        }, function onError() {
            
        });
    };
    
    this.getId = function() { return _this.data_id; };
    this.getName = function() { return _this.data_name; };
    this.getUserId = function() { return _this.data_userId; };
    this.getNumberOfNotes = function() { return _this.data_numberOfNotes; };
    this.getNumberOfTrashedNotes = function() { return _this.data_numberOfTrashedNotes; };

    init(_options);
    
    function validate() {
        if (!_this.data_id){
            _this.data_id = "nb_" + new Date().getTime() + "_" + Math.round(Math.random()*100000);
        }
        
        (_this.data_numberOfNotes < 0) && (_this.data_numberOfNotes = 0);
        (_this.data_numberOfTrashedNotes < 0) && (_this.data_numberOfTrashedNotes = 0);
    }
};

var Note = function(_options) {
    var _this = this;
    
    this.data_id = "";
    this.data_name = "";
    this.data_content = "";
    this.data_dateCreated = null;
    this.data_dateUpdated = null;
    this.data_trashed = false;
    this.data_notebookId = null;
        
    function init(options) {
        updateObject(_this, options);
        validate();
    }
    
    this.set = function(options, cbSuccess, cbError) {
        updateObject(_this, options);
        validate();
        
        _this.data_dateUpdated = new Date().getTime();
        
        DB.updateNote(_this, cbSuccess, cbError);
        
        return _this;
    };
    
    this.trash = function(cbSuccess, cbError) {
        if (_this.data_trashed) return;
        
        _this.data_trashed = true;
        
        _this.getNotebook(function(notebook){
            notebook.set({
                "numberOfNotes": notebook.getNumberOfNotes()-1,
                "numberOfTrashedNotes": notebook.getNumberOfTrashedNotes()+1
            }, cbSuccess, cbError);
        }, cbError);
    };
    
    this.restore = function(cbSuccess, cbError) {
        if (!_this.data_trashed) return;
        
        _this.data_trashed = false;
        
        _this.getNotebook(function(notebook){
            notebook.set({
                "numberOfNotes": notebook.getNumberOfNotes()+1,
                "numberOfTrashedNotes": notebook.getNumberOfTrashedNotes()-1
            }, cbSuccess, cbError);
        }, cbError);
    };
    
    this.remove = function(cbSuccess, cbError) {
        DB.removeNote(_this, function() {
            _this.getNotebook(function(notebook){
                notebook.set({
                    "numberOfNotes": notebook.getNumberOfNotes() - (_this.data_trashed? 0 : 1),
                    "numberOfTrashedNotes": notebook.getNumberOfTrashedNotes() - (_this.data_trashed? 1 : 0)
                }, cbSuccess, cbError);
            }, cbError);
        }, cbError);
    };
    
    this.getNotebook = function(cbSuccess, cbError) {
        DB.getNotebooks({"id": _this.getNotebookId()}, function(notebooks){
            cbSuccess && cbSuccess(notebooks[0]);
        }, cbError);
    };
    
    
    this.getResources = function(cbSuccess, cbError) {
        DB.getNoteResources({"noteId": _this.getId()}, cbSuccess, cbError);
    };
    
    this.newResource = function(options, cbSuccess, cbError) {
        options.noteId = _this.getId();
        
        var noteResource = new NoteResource(options);
        DB.addNoteResource(noteResource, function() {
            cbSuccess && cbSuccess(noteResource);
        });
    };
    
    this.getId = function() { return _this.data_id; };
    this.getName = function() { return _this.data_name; };
    this.getContent = function() { return _this.data_content; };
    this.getDateCreated = function() { return _this.data_dateCreated; };
    this.getDateUpdated = function() { return _this.data_dateUpdated; };
    this.getNotebookId = function() { return _this.data_notebookId; };
    this.isTrashed = function() { return _this.data_trashed; };
    
    init(_options);
    
    function validate() {
        if (!_this.data_id) {
            _this.data_id = "note_" + new Date().getTime() + "_" + Math.round(Math.random()*100000);
        }
        
        if (!_this.data_dateCreated) {
            _this.data_dateCreated = new Date().getTime();
        }
        
        if (!_this.data_dateUpdated) {
            _this.data_dateUpdated = new Date().getTime();
        }
    }
};

function NoteResource(_options) {
    var _this = this;
    
    this.data_id = '';
    this.data_name = '';
    this.data_src = '';
    this.data_size = -1;
    this.data_type = '';
    this.data_noteId = '';
        
    function init(options) {
        updateObject(_this, options);
        validate();
    }
    
    function validate() {
        if (!_this.data_id) {
            _this.date_id = "nr_" + new Date().getTime() + "_" + Math.round(Math.random()*100000);
        }
    }
    
    this.set = function(options, cbSuccess, cbError) {
        updateObject(_this, options);
        validate();
        
        DB.updateNoteResource(_this, cbSuccess, cbError);
        
        return _this;        
    };
    
    this.getId = function() { return _this.data_id; };
    this.getName = function() { return _this.data_name; };
    this.getSrc = function() { return _this.data_src; };
    this.getSize = function() { return _this.data_size; };
    this.getType = function() { return _this.data_type; };
    this.getNoteId = function() { return _this.data_noteId; };
    
    init(_options);
}

var ResourceTypes = {
    "IMAGE": "image"
};

function updateObject(obj, options) {
    if (!options) return;
    for (var k in options) {
        obj['data_' + k] = options[k];
    }
}