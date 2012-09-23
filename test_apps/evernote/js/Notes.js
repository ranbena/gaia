var Notebook = function(_options) {
    var _this = this,
        id = "", name = "",
        notes = [];

    function init(options) {
        !options && (options = {});
        
        id = new Date().getTime() + "_" + Math.random();
        name = options.name || "";
    }
    
    this.addNote = function(note) {
        if (!note) return;
        
        note.setNotebook(_this);
        notes.push(note);
    };
    
    this.removeNote = function(note) {
        if (!note) return;
        
        for (var i=0; i<notes.length; i++) {
            if (notes[i].getId() == note.getId()) {
                notes.splice(i, 1);
            }
        }
    };
    
    this.setName = function(_name) {
        if (_name && _name != name) {
            name = _name;
        }
        return _this;
    };
    
    this.getNumberOfNotes = function(bIncludeTrashed) {
        return _this.getNotes(bIncludeTrashed).length;
    };
    this.getNotes = function(bIncludeTrashed) {
        if (bIncludeTrashed) {
            return notes;
        }
        
        var _notes = [];
        for (var i=0; i<notes.length; i++) {
            if (!notes[i].isTrashed()) {
                _notes.push(notes[i]);
            } 
        } 
        return _notes;
    };
    this.getTrashedNotes = function() {
        var _notes = [];
        for (var i=0; i<notes.length; i++) {
            if (notes[i].isTrashed()) {
                _notes.push(notes[i]);
            } 
        } 
        return _notes;
    };
    
    this.getId = function() { return id; };
    this.getName = function() { return name; };

    init(_options);
};

var Note = function(_options) {
    var _this = this,
        notebook = null, trashed = false,
        id = "", name = "", content = "", image = "",
        dateCreated = null, dateUpdated = null;
        
    function init(options) {
        !options && (options = {});
        
        id = options.id || "id_" + Math.round(Math.random()*100000);
        name = options.name || "";
        content = options.content || "";
        image = options.image || "";
        trashed = options.trashed || false;
        dateCreated = options.dateCreated || new Date();
        dateUpdated = options.dateUpdated || new Date();
        
        if (typeof dateCreated == "number") {
            dateCreated = new Date(dateCreated);
        }
        if (typeof dateUpdated == "number") {
            dateUpdated = new Date(dateUpdated);
        }
    }

    this.update = function() {

    };
    
    this.remove = function() {
        return notebook.removeNote(_this);
    };
    
    this.setTrashed = function(_trashed) {
        trashed = _trashed;
    };
    
    this.setNotebook = function(_notebook) {
        notebook = _notebook;
        return _this;
    };
    
    this.setName = function(_name) {
        name = _name;
        return _this;
    }

    this.setContent = function(_content) {
        content = _content;
        dateUpdated = new Date();
    };
    
    this.getProperty = function(prop) {
        switch(prop) {
            case "dateUpdated":
                return dateUpdated;
            case "dateCreated":
                return dateCreated;
            case "title":
                return _this.getName();
            case "notebookId":
                return notebook.getId();
            case "city":
                return "";
            case "country":
                return "";
        }
        
        return id;
    };
    
    this.isTrashed = function() { return trashed; };

    this.getId = function() { return id; };
    this.getContent = function() { return content; };
    this.getImage = function() { return image; };
    this.getDateCreated = function() { return dateCreated.getTime(); };
    this.getDateUpdated = function() { return dateUpdated.getTime(); };
    this.getNotebook = function() { return notebook; };
    this.getName = function() { return name; };
    
    init(_options);
};