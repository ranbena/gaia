if (!window.Everything)
{
	Everything = new Object();
	Everything.NoteStore = new Object();
	Everything.NoteStore.Schema = {}
}

Everything.NoteStore.Query = function(obj)
{
	this.filters = null;	
	this.sortBy = null;
	this.descending = false;
	this.storeName = null;	
	this.db = null;
	
	if (obj)
	{
		for (x in obj)
		{
			this[x] = obj[x];
		}
	}
	
	this.log = function(txt)
	{
		console.log(new Date().toJSON() + " - [Everything.NoteStore.Query(" + JSON.stringify(this) + ")]: " + txt)
	}			
	
	this.execute = function(onSuccess, onFailure)
	{  		
				
		var index = null;
		var range = null;
		var useFakeFilterIndex = false;			
		var useFakeSortIndex = false;
			
		var store = this.db.getStore(this.storeName);
		
		if (this.filters)		
		{
			for (filterName in this.filters)
			{							
				index = store.getIndex(filterName)
				
				if (index['isReal'])
				{
					range = this.db.IDBKeyRange.only(this.filters[filterName]);
					break;
				}								
			}
		}				
		else if (this.sortBy)
		{
			
			index = store.getIndex(this.sortBy)
			
			if (index['isReal'])
				range = this.db.IDBKeyRange.lowerBound(null);
		}		
							
							
		var direction = this.descending ? "prev" : "next";
		
		var cursor = index['index'] ? index['index'].openCursor(range, direction) : store.getStoreObj().openCursor(range, direction);
		 
		var results = [];
		
		var ref = this;
		
		cursor.onsuccess = function(ev)
		{
			var res = ev.currentTarget.result;
			
			if (res)
			{
				results.push(res.value)
				res.continue();
			}
			else
			{
				if (ref.filters)
				{
					for (var filterName in ref.filters)
					{
						filterValue = ref.filters[filterName]
						idx = store.getIndex(filterName)
						
						if (!idx['isReal'])
						{									
							var regex = idx['schema']['regex'];
							
							if (regex)
							{
								regex = new RegExp(regex.replace("@@", filterValue), "im");
								
								var newResults = []
								
								for (var x in results)
								{
									if (regex.test(results[x][filterName]))
										newResults.push(results[x]);
								}
								
								results = newResults;
							}
						}
					}
				}
												
				if (ref.filters && ref.sortBy || (ref.sortBy && !index['isReal']))
				{
					results.sort(
						function (a,b)
						{
							var aData = a[ref.sortBy]
							var bData = b[ref.sortBy]
							
							if (ref.descending)
								return aData>bData ? -1 : aData<bData ? 1 : 0;
							else
								return aData<bData ? -1 : aData>bData ? 1 : 0;													
						}					
					)
				}
				
				if (onSuccess)
					onSuccess(ref, results);
			}
		}		
		
		cursor.onerror = function(ev)
		{
			ref.log("Failed opening cursor: " + ev)
			if (onError)
				onError(ref, ev);
		}
		
	}
}
