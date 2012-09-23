var Notebook = function(_options) {
    var _this = this,
        id = "", name = "",
        notes = {}, numberOfNotes = 0;

    function init(options) {
        !options && (options = {});
    
        id = new Date().getTime() + "_" + Math.random();
        name = options.name || "";
    }
    
    this.addNote = function(note) {
        if (!note) return;
        
        note.setNotebook(_this);
        notes[note.getId()] = note;
        numberOfNotes++;
    };
    
    this.removeNote = function(note) {
        if (!note) return;
        
        delete notes[note.getId()];
        numberOfNotes--;
    };
    
    this.setName = function(_name) {
        if (_name && _name != name) {
            name = _name;
        }
        return _this;
    };
    
    this.getNumberOfNotes = function() { return numberOfNotes; };
    this.getNotes = function() {
        var arrNotes = [];
        for (var id in notes) {
            arrNotes.push(notes[id]);
        } 
        return arrNotes;
    };
    this.getId = function() { return id; };
    this.getName = function() { return name; };

    init(_options);
};

var Note = function(_options) {
    var _this = this,
        notebook = null,
        id = "", name = "", content = "", image = "",
        dateCreated = null, dateUpdated = null;
        
    function init(options) {
        !options && (options = {});
        
        id = options.id || "id_" + Math.round(Math.random()*100000);
        name = options.name || "";
        content = options.content || "";
        image = options.image || "";
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
        // remove note element
        return notebook.removeNote(_this);
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

    this.getId = function() { return id; };
    this.getContent = function() { return content; };
    this.getImage = function() { return image; };
    this.getDateCreated = function() { return dateCreated.getTime(); };
    this.getDateUpdated = function() { return dateUpdated.getTime(); };
    this.getNotebook = function() { return notebook; };
    this.getName = function() { return name; };
    
    init(_options);
};