if (!window.Everything)
{
	Everything = new Object();
	Everything.NoteStore = new Object();
	Everything.NoteStore.Schema = {}
}

Everything.NoteStore.Store = function(db, storeName)
{
	this.db = db;
	this.name = storeName;
	
	
	
	this.log = function(txt)
	{
		console.log(new Date().toJSON() + " - [Everything.NoteStore.Store(" + this.name + ")]: " + txt)
	}		
		
	this.getStoreObj = function()
	{
		return this.db.getStoreObject(this.name);
	}
	
	this.createQuery = function(args)
	{
		args['db'] = this.db;
		args['storeName'] = this.name;
		
		return new Everything.NoteStore.Query(args)
	}
		
	
	this.getIndex = function(idxName)
	{
		var index = null;
		var isPrimary = Everything.NoteStore.Schema[this.name]['primary']['keyPath'] == idxName;		
		var indexExists = isPrimary || Everything.NoteStore.Schema[this.name]['indexes'][idxName] != null;
		
		if (!indexExists)
			throw "Index " + idxName + " for store " + this.name + " doesn't exists!";
		
		
		var isReal = isPrimary || Everything.NoteStore.Schema[this.name]['indexes'][idxName]['realIndex'];
						
		if (isReal)
		{
			if (!isPrimary)
				index = this.getStoreObj().index(idxName + "_idx");						
		}
		
		return {'index': index, 'isReal': isReal, 'schema': Everything.NoteStore.Schema[this.name]['indexes'][idxName] };
	}
	
	
	this.put = function(obj, onSuccess, onFailure)
	{
		try
		{
			var ref = this;						
			var data = {};
			
			// Strip methods
			for (x in obj)
			{
				if (typeof(obj[x]) != "function" && x != "__proto__")
				{
					data[x] = obj[x];
				}
			}		
					
			
			var req = this.getStoreObj().put(data)
			
			
			
			req.onsuccess = function(ev)
			{
				ref.log("Saved "+obj)
				
				if (onSuccess)
					onSuccess(ref)
			}
			
			req.onerror = function(ev)
			{
				ref.log("Failed saving " + obj + ": " + ev)
				
				if (onError)
					onError(ref, ev)
			}
		}
		catch (e)
		{
			ref.log("Failed saving " + obj + ": " + e)
			
			if (onFailure)
				onFailure(ref, e)
		}
	}
	
	this.load = function(id, onSuccess, onFailure)
	{
		var ref = this;
		
		var store = this.getStoreObj();		
		var req = store.get(id);		
		
		req.onsuccess = function(ev)
		{
			data = req.result;
			
			if (!data)
			{
				ref.log("Unable to find " + id)
				
				if (onFailure)
					onFailure(ref, new Error("Unable to find " + id + " on " + ref.name))
			}							
			else
			{
				ref.log("Loaded " + id)
				
				if (onSuccess)
					onSuccess(ref, data)
			}
		}
		
		req.onerror = function(ev)
		{
			ref.log("Failed loading " + id + ": " + ev)
			
			if (onFailure)
				onFailure(ref, ev)
		}		
	}	
}
