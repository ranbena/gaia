var App = new function() {
    var _this = this,
        cards = null, notebooks = [],
        $notebooksList = null;

    var TEXTS = {
        "NEW_NOTEBOOK": "Create Notebook",
        "NEW_NOTE": "New Note",
        "FIRST_NOTEBOOK_NAME": "My Notebook",
        "EMPTY_NOTEBOOK_NAME": "Notes"
    },
    ORDERS = {
        "dateUpdated": "Date updated",
        "dateCreated": "Date created",
        "title": "Title",
        "notebookId": "Notebook",
        "city": "City",
        "country": "Country"
    };
    
    this.init = function() {
        cards = new Cards();
        
        NotebookView.init({
            "container": document.getElementById("main"),
            "onClickNote": _this.showNote
        });
        NoteView.init({
            "container": document.getElementById("note")
        });
        Sorter.init({
            "orders": ORDERS,
            "container": document.getElementById("notebook-footer"),
            "onChange": function(order, desc) {
                NotebookView.showNotes(order, desc);
            }
        })
        
        $notebooksList = document.getElementById("notebooks-list");
        
        document.getElementById("button-new-notebook").addEventListener("click", _this.promptNewNotebook);
        
        document.getElementById("button-note-save").addEventListener("click", _this.saveNote);
        
        document.getElementById("button-notebook-add").addEventListener("click", function() {
            _this.newNote();
        });
        
        initUserNotes();
    };

    function initUserNotes() {
        var _notebooks = getUserNotes();
        
        if (!_notebooks || _notebooks.length == 0) {
            var notebook = _this.newNotebook(TEXTS.FIRST_NOTEBOOK_NAME);
            _this.newNote(notebook);
        } else {
            _this.refreshNotebooks();
        }
    }

    function getUserNotes() {
        return [];
    }
    
    this.showNote = function(note, notebook) {
        NoteView.show(note, notebook);
        cards.goTo(cards.CARDS.NOTE);
    };
    this.showNotes = function(notebook) {
        NotebookView.show(notebook);
        cards.goTo(cards.CARDS.MAIN);
    };

    this.refreshNotebooks = function() {
        $notebooksList.innerHTML = "";
        for (var i=0; i<notebooks.length; i++) {
            createNotebookEntry(notebooks[i]);
        }
    };
    function createNotebookEntry(notebook) {
        var el = getNotebookEntryElement(notebook);
        $notebooksList.appendChild(el);
    }
    function getNotebookEntryElement(notebook) {
        var el = document.createElement("li");
        el.innerHTML = notebook.getName() + " (" + notebook.getNumberOfNotes() + ")";
        el.objNotebook = notebook;
        el.addEventListener("click", clickNotebook);
        return el;
    }

    function clickNotebook(e) {
        _this.showNotes(this.objNotebook);
    }

    this.promptNewNotebook = function() {
        var notebookName = prompt(TEXTS.NEW_NOTEBOOK, "");
        if (notebookName) {
            _this.newNotebook(notebookName);
        }
    };

    this.newNotebook = function(name) {
        var notebook = new Notebook({
            "name": name
        });
        notebooks.push(notebook);
        
        createNotebookEntry(notebook);
        
        _this.showNotes(notebook);

        return notebook;
    };

    this.newNote = function(notebook) {
        _this.showNote(null, notebook || NotebookView.getCurrent());
    };

    this.saveNote = function() {
        NoteView.save(function(noteSaved){
            if (noteSaved) {
                _this.refreshNotebooks();
            }
            _this.showNotes();
        })
    };
    
    var Sorter = new function() {
        var _this = this,
            el = null,
            currentOrder = "", currentDesc = false, onChange = null;
            
        this.ORDER = {};
        
        this.init = function(options) {
            this.ORDER = options.orders;
            onChange = options.onChange;
            createElement(options.container);
        };
        
        this.show = function() {
            
        };
        
        function createElement(parent) {
            if (el) return;
            
            el = document.createElement("select");
            
            el.addEventListener("blur", select);
            
            var html = '';
            for (var key in _this.ORDER) {
                html += '<option value="' + key + '">' + _this.ORDER[key] + '</option>';
            }
            el.innerHTML = html;
            
            parent.appendChild(el);
        }
        
        function select() {
            if (el.value == currentOrder) {
                currentDesc = !currentDesc;
            } else {
                currentDesc = false;
            }
            
            currentOrder = el.value;
            
            onChange && onChange(currentOrder, currentDesc)
        }
    };
    
    this.sortNotes = function(sort, isDesc) {
        NotebookView.showNotes(sort, isDesc);
    };

    var NoteView = new function() {
        var currentNote = null, currentNotebook = null,
            el = null, elContent = null;
            
        this.init = function(options) {
            el = options.container;

            elContent = el.querySelector("textarea");

            elContent.addEventListener("focus", onContentFocus);
            elContent.addEventListener("blur", onContentBlur);
        };

        this.show = function(note, notebook) {
            if (note) {
                el.querySelector("h1").innerHTML = note.getName() || TEXTS.NEW_NOTE;

                var content = note.getContent() || "";

                elContent.value = content;

                onContentBlur();
            } else {
                el.querySelector("h1").innerHTML = TEXTS.NEW_NOTE;
                elContent.value = "";
                onContentBlur();
            }
            
            currentNote = note;
            currentNotebook = notebook;
        };

        this.save = function(callback) {
            var content = elContent.value;

            if (content) {
                if (currentNote) {
                    currentNote.setContent(content);
                } else {
                    currentNote = new Note({
                        "content": content
                    });
                    currentNotebook.addNote(currentNote);
                }
                
                callback(currentNote);
            } else {
                callback();
            }
        };

        function onContentFocus(e) {
            el.classList.remove("empty-note");
        }
        function onContentBlur(e) {
            if (elContent.value) {
                el.classList.remove("empty-note");
            } else {
                el.classList.add("empty-note");
            }
        }
    };

    var NotebookView = new function() {
        var el = null, $notesList = null,
            currentNotebook = null, currentSort = "", currentIsDesc = false,
            onClickNote = null, notebookScrollOffset = 0;

        this.init = function(options) {
            el = options.container;
            onClickNote = options.onClickNote;
            
            $notesList = el.getElementsByClassName("notebook-notes")[0];
            
            $notesList.addEventListener("click", clickNote);
            
            notebookScrollOffset = document.getElementById("search").offsetHeight;
        };
        
        this.show = function(notebook) {
            !notebook && (notebook = currentNotebook);
            
            el.querySelector("h1").innerHTML = notebook.getName() || TEXTS.EMPTY_NOTEBOOK_NAME;
            
            
            if (!currentNotebook || currentNotebook.getId() != notebook.getId()) {
                currentSort = "";
                currentIsDesc = false;
            }
            
            currentNotebook = notebook;
            
            this.showNotes(currentSort, currentIsDesc);
            
            this.scrollTop();
        };
        
        this.showNotes = function(sortby, isDesc) {
            if (!currentNotebook) return;
            
            $notesList.innerHTML = '';
            
            var notes = sortNotes(currentNotebook.getNotes(), sortby, isDesc);
            for (var i=0; i<notes.length; i++) {
                $notesList.appendChild(notes[i].getElement());
            }
            
            currentSort = sortby;
            currentIsDesc = isDesc;
        };

        this.getCurrent = function() {
            return currentNotebook;
        };
        
        this.scrollTop = function() {
            $notesList.parentNode.scrollTop = notebookScrollOffset;
        };
        
        function sortNotes(notes, sortby, isDesc) {
            if (!sortby) return notes;
            
            var valMethod = "get" + sortby;
            notes.sort(function(a, b){
                var valA = a.getProperty(sortby),
                    valB = b.getProperty(sortby);
                
                return valA > valB? (isDesc?-1:1)*1 : valA < valB? (isDesc?1:-1)*1 : 0;
            });
            
            return notes;
        }
        
        // the click is captured on the entire list,
        // and we extract the specific note from the event target
        function clickNote(e) {
            var elNote = e.target;
            while (elNote && elNote.tagName != "LI") {
                elNote = elNote.parentNode;
            }
            
            elNote && onClickNote && onClickNote(elNote.objNote);
        }
    };
};


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
        return '<div class="name">' + _this.getName() + ' <span class="time">' + dateUpdated.getTime() + '</span></div>' +
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
        this.name = content;
        
        if (!content) return "";
        
        return content.substring(0, 10);
    };
    this.getContent = function() { return content; };
    this.getElement = function() { return el; };
    this.getDateCreated = function() { return dateCreated.getTime(); };
    this.getDateUpdated = function() { return dateUpdated.getTime(); };
    
    init(_options);
};


var Cards = function(_options) {
    var _this = this,
        elContainer = null, cardElements = [], drawerWidth = 0, cardWidth = 0, currentIndex = -1,
        hasDrawer = false, transitionDuration = 0, transitionEasing = "";

    var CLASS_WHEN_ACTIVE = "active",
        CLASS_DRAWER = "drawer",
        DEFAULT_TRANSITION_DURATION = 400,
        DEFAULT_TRANSITION_EASING = "ease";
        
    this.CARDS = {};
    
    this.init = function(options) {
        !options && (options = {});
        
        elContainer = options.container || document.querySelector(".cards");
        
        elContainer.style.cssText += '; position: relative; overflow: hidden; min-height: 100%;';

        cardWidth = drawerWidth = elContainer.offsetWidth;
        cardElements = elContainer.getElementsByClassName("card");

        transitionDuration = options.transitionDuration || DEFAULT_TRANSITION_DURATION;
        transitionEasing = options.transitionEasing || DEFAULT_TRANSITION_EASING;

        initCards();
    };

    this.goTo = function(index) {
        if (typeof index == "string") {
            index = getIndexById(index);
        }

        if (index < 0 || index >= cardElements.length) {
            return _this;
        }

        for (var i=0, l=cardElements.length; i<l; i++) {
            var pos = 0,
                zIndex = 10,
                el = cardElements[i];

            if (i < index) {
                pos = -((index-i)*cardWidth);
            } else if (i > index) {
                pos = (i-index)*cardWidth;
            } else {
                pos = 0;
                zIndex = 100;
            }

            if (hasDrawer) {
                if (index == 0 && i == 1) {
                    pos = pos - cardWidth + drawerWidth;
                }
            }

            el.style.cssText += "; z-index: " + zIndex + ";" +
                                 "-moz-transform: translate3d(" + pos + "px, 0, 0); " +
                                 "-webkit-transform: translate3d(" + pos + "px, 0, 0); ";
        }

        cardElements[currentIndex].classList.remove(CLASS_WHEN_ACTIVE);
        document.body.classList.remove("card-" + cardElements[currentIndex].id);
        currentIndex = index;
        cardElements[currentIndex].classList.add(CLASS_WHEN_ACTIVE);
        document.body.classList.add("card-" + cardElements[currentIndex].id);

        return _this;
    };

    function initCards() {
        var defaultIndex = 0;

        for (var i=0, l=cardElements.length; i<l; i++) {
            var el = cardElements[i];

            el.style.cssText += "; position: absolute; top: 0; left: 0; width: " + cardWidth + "px; min-height: 100%;";

            if (el.className.indexOf(CLASS_WHEN_ACTIVE) !== -1) {
                currentIndex = i;
                defaultIndex = i;
            }
            if (el.className.indexOf(CLASS_DRAWER) !== -1) {
                hasDrawer = true;
                drawerWidth -= el.getAttribute("data-gutter");
                el.style.cssText += "; width: " + drawerWidth + "px;";
            }

            _this.CARDS[el.id.toUpperCase()] = el.id;

            addDefaultButtons(el, i);
        }

        _this.goTo(defaultIndex);

        window.setTimeout(enableAnimation, 0);
    }

    function addDefaultButtons(el, index) {
        var buttons = el.getElementsByClassName("card-prev");
        for (i=0; i<buttons.length; i++) {
            buttons[i].addEventListener("click", function(){
                _this.goTo(index-1);
            });
        }
        buttons = el.getElementsByClassName("card-next");
        for (i=0; i<buttons.length; i++) {
            buttons[i].addEventListener("click", function(){
                _this.goTo(index+1);
            });
        }
    }
    
    function enableAnimation() {
        for (var i=0, l=cardElements.length; i<l; i++) {
            cardElements[i].style.cssText += "; -moz-transition: all " + transitionDuration + "ms " + transitionEasing + ";" +
                                             "; -webkit-transition: all " + transitionDuration + "ms " + transitionEasing + ";";
        }
    }
    
    function getIndexById(cardId) {
        for (var i=0, l=cardElements.length; i<l; i++) {
            if (cardElements[i].id == cardId) {
                return i;
            }
        }

        return -1;
    }

    _this.init(_options);
};

App.init();