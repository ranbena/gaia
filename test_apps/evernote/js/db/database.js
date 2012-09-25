if (!window.Everything)
{
	Everything = new Object();
	Everything.NoteStore = new Object();
	Everything.NoteStore.Schema = {}
}


Everything.NoteStore.Database = function(name, version)
{
	/*
	 * Represents a notestore indexedb database
	 * @name - [String] Database name
	 * @version - [Number] Optional. Specified to open a specific db version. Can be NaN.
	 */
	this.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	this.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
	this.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
	this.IDBCursor = window.IDBCursor || window.webkitIDBCursor;
	
	this._dbName = name;
	this._version = version ? version : 1;
	this._db = null	
	this._stores = {}
			
	this.createQuery = function(args)
	{
		args['db'] = this;
		
		return new Everything.NoteStore.Query(args)
	}
	
	this.getStore = function(storeName)
	{
		return new Everything.NoteStore.Store(this, storeName);
	}
	
	
	this.getStoreObject = function(storeName)
	{		
		return this.getTransaction(storeName, false).objectStore(storeName);
	}
	
	this.getTransaction = function(storeName, readOnly)
	{		
		return this._db.transaction([storeName], this.IDBTransaction.READ_WRITE);//readOnly ? "readonly" : "readwrite");
	}
	
	this._createSchema = function(onSuccess, onFailure)
	{
		this.log("Changing version for schema creation...")
		var verRequest = new Object();
		
		if (this._db.setVersion)
			verRequest = this._db.setVersion(this._version)
		
		var ref = this;
		
		verRequest.onsuccess = function(ev)
		{
			schema = Everything.NoteStore.Schema;
			
			try
			{
				var creations = []
				
				for (storeName in schema)
				{
					var storeSchema = schema[storeName];
					
					ref.log("Creating store " + storeName + " schema...")
					
			        if (ref._db.objectStoreNames.contains(storeName)) 
			        {
			        	ref.log("WARNING - " + storeName + " already exists.");		        	
			        }
			        else
			        {		        	
	 					var store = ref._db.createObjectStore(storeName, storeSchema['primary']);
	          		        	
	          		    creations.push(storeName)
	          		    
		        		ref._stores[storeName] = store;	        		        		
		        			        		
		        		for (indexName in storeSchema['indexes'])
		        		{
		        			indexSchema = storeSchema['indexes'][indexName];
		        			
		        			if (indexSchema.realIndex)
		        			{
		        				ref.log("Creating store " + storeName + " index: " + indexName + "("+JSON.stringify(indexSchema)+")")
		        				
		        				var copy = indexSchema;
		        				delete copy['realIndex'];
		        				 
		        				index = store.createIndex(indexName + "_idx", indexName, copy)
		        			}		        			
		        		}
		        		
			        	oncomplete = function()
			        	{
			        		ref.log("Created schemas for " + creations.join(", ") + " successfully!");
			        		
			        		if (onSuccess)
			        			onSuccess(ref)
						}
						
						if (ev)
							ev.target.transaction.oncomplete = oncomplete
						else
							oncomplete();	        		
			        }						
				}
			}
			catch (e)
			{
				ref.log("Failed creating schema: " + e)
				
				if (onFailure)				
					onFailure(ref, e)				
			}
		}
		
		verRequest.onerror = function(ev)
		{
			ref.log("Failed creating schema - Version change failed " + ev)
			
			if (onFailure)				
				onFailure(ref, ev)				
		}
		
		if (!this._db.setVersion)
			verRequest.onsuccess(null);
	}
	
	this.getName = function()
	{
		return this._dbName;
	}
	
	this.log = function(txt)
	{
		console.log(new Date().toJSON() + " - [Everything.NoteStore.Database(" + this._dbName + ")]: " + txt)
	}
	
	this.getVersion = function()
	{
		return this._db ? new Number(this._db.version) : Number.NaN;
	}
	
	this.close = function()
	{
		if (this._db)
		{
			this.log("Closing db.")
			this._db.close();
			this._db = null;
		}
		
		this._stores = {}
	}
		
	this.destroy = function(onSuccess, onFailure)
	{
		/*
		 * Delete an indexed db database
		 * @onSuccess [function] - called when a db was successfully deleted. signature: function (Everything.NoteStore.Database db) {}
		 * @onFailure [function] - called when a db delete failed. signature: function (Everything.NoteStore.Database db, Object info) {}
		 */		
		try
		{
			this.close();
			
			var ref = this;
			var deleteReq = this.indexedDB.deleteDatabase(this._dbName);
			
			deleteReq.onsuccess = function(ev)
			{
				ref.log("Database destroyed.")
				
				if (onSuccess)
					onSuccess(this);
			}
			
			deleteReq.onerror = deleteReq.onblocked = function(ev)
			{
				ref.log("Database destroy failed: " + ev)
				
				if (onFailure)
					onFailure(this, ev);				
			}
		}
		catch (e)
		{
			this.log("Caught exception while trying to delete db: " + e)
			
			if (onFailure)
				onFailure(this, e);			
		}
	}
	
	this.open = function(onSuccess, onFailure)
	{
		/*
		 * Open an indexed db database
		 * @onSuccess [function] - called when a db is successfully opened. signature: function (Everything.NoteStore.Database db) {}
		 * @onFailure [function] - called when a db open failed. signature: function (Everything.NoteStore.Database db, Object info) {}
		 */
		try
		{
			var openReq = this.indexedDB.open(this._dbName, this._version)
			var ref = this;
			
			ref.log("Opening")
			
			openReq.onsuccess = function(ev)
			{				
				ref._db = openReq.result;						
				ref._db.onversionchange = function(e)
				{
					// Version changed, reopen the database. Use setTimeout because the internal state of indexedDB needs to change before we do that.
					setTimeout(null, function() {
						ref.log("Database version changed. Wtf? Closing db.")
						ref.close();									
					}, 1)
				}
				
				ref.log("Database opened. Version: " + ref.getVersion())
			
				if (ref._db.objectStoreNames.length == 0)
				{
					// DB empty, we need to create the schema
					
					ref.log("Database is empty. Creating schema...")
					
					if (ref._db.setVersion) //webkit
						ref._createSchema(onSuccess, onFailure);
				}	
				else
				{
					if (onSuccess)
						onSuccess(ref);								
				}
			}

			openReq.onupgradeneeded = function(ev)
			{
				ref._db = ev.currentTarget.result;
				
				ref._createSchema(function (ref) {}, onFailure)
			}			
			
			openReq.onerror = openReq.blocked = function(ev)
			{
				ref.log("Failed opening: " + ev)
				
				if (onFailure)
					onFailure(ref, ev);
			}
		}
		catch (e)
		{						
			this.log("Caught exception while trying to open db: " + e)
			
			if (onFailure)
				onFailure(this, e);
		}		
	}	
}
