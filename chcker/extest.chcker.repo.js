
var _trgCtrlRepo = {};
var suscriber = extest.core.ModuleSubscriber.CHCKER;
extest.core.Module.registerWithContext(suscriber,"extest.chcker.repo", function(){
	
	var Repo = {};
	Repo.setTrgCtrlRepo = function(key,value){
		_trgCtrlRepo[key] = value;
	}
	
	Repo.getTrgCtrlRepo = function(key){
		return _trgCtrlRepo[key];
	}
	
	Repo.initRepo = function(){
		 _trgCtrlRepo = {};
	}
	
	return Repo;
});
