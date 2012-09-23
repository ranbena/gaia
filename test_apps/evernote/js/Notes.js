
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
        note.setNotebook(_this);
        notes[note.getId()] = note;
        numberOfNotes++;
    };
    
    this.removeNote = function(note) {
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
        el = null, notebook = null,
        id = "", content = "", image = "",
        dateCreated = null, dateUpdated = null;
        
    function init(options) {
        !options && (options = {});
        
        id = options.id || "id_" + Math.round(Math.random()*100000);
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
        
        createElement();
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

    this.setContent = function(_content) {
        content = _content;
        dateUpdated = new Date();
        
        _this.updateElement();
    };

    this.updateElement = function() {
        el.innerHTML = _this.getHTML();
        if (content) {
            el.classList.remove("empty");
        } else {
            el.classList.add("empty");
        }
    };

    function createElement() {
        el = document.createElement("li");
        el.className = "note";
        el.objNote = _this;
        _this.updateElement();
    }
    
    this.getHTML = function() {
        return '<div class="name">' + _this.getName() + ' <span class="time">' + prettyDate(dateUpdated.getTime()) + '</span></div>' +
                '<div class="content">' + content + '</div>' +
                (image? '<div class="image" style="background-image: url(' + image + ')"></div>' : '');
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
    this.getName = function() {
        if (!content) return "";
        
        var name = content.split("\n");
        
        return name[0];
    };
    this.getContent = function() { return content; };
    this.getElement = function() { return el; };
    this.getDateCreated = function() { return dateCreated.getTime(); };
    this.getDateUpdated = function() { return dateUpdated.getTime(); };
    
    init(_options);
};


/* taken from the email app */
function prettyDate(time) {
  switch (time.constructor) {
    case String:
      time = parseInt(time);
      break;
    case Date:
      time = time.getTime();
      break;
  }
  
  var f = navigator.mozL10n? new navigator.mozL10n.DateTimeFormat() : null;
  var diff = Date.now() - time;
  var day_diff = Math.floor(diff / 86400);
  var actualDate = new Date();
  actualDate.setTime(time);
  
  if (isNaN(day_diff))
    return '(incorrect date)';

  if (day_diff < 0 || diff < 0) {
    // future time
    return f.localeFormat(new Date(time), _('shortDateTimeFormat'));
  }
  
  return day_diff == 0 && (
    diff < 60 && 'Just now' ||
    diff < 86400 && (actualDate.getHours() + ":" + actualDate.getMinutes()) ||
    day_diff == 1 && 'yesterday' ||
    day_diff < 7 && f.localeFormat(new Date(time), '%A') ||
    (f? f.localeFormat(new Date(time), '%x') : new Date(time)));
}