
var suscriber = extest.core.ModuleSubscriber.CORE;
extest.core.Module.registerWithContext(suscriber,"extest.core.exec", function(){
	
		var Exec = {}
		Exec.runDynamicScript = function(obj, embApp){
			if(embApp != null){
				this._app = embApp;
			}
			var result = null;
			try {
				result = Function('self',"'use strict'; "+obj+"")(this);
			} catch (error){
				throw new Error("Error Script: "+obj+"\n"+error.stack);
			}
			return result;
		}
		
	return Exec;
});
