var extest = $namespace("extest");

(function(extest,exports){
	
	//체커 모듈 디펜던시 관리
	var chckerModule = (function(extest){
		
		var chckerModule = extest.core.Module.getModuleInstance(extest.core.ModuleSubscriber.CHCKER);
		var depends = [
			"extest.chcker.testapi",
			"extest.chcker.rulechcker"
		];
		
		chckerModule.registerWithDeps("Chcker",depends,function(testapi,rulechcker){
			var module = {};
			module.chcker = {};
			module.chcker.TestApi = testapi;
			module.chcker.RuleChcker = rulechcker;
			
			return module;
		});
		
		return chckerModule;
	})(extest);
	
	var suppModule = (function(extest){
		
		var suppModule = extest.core.Module.getModuleInstance(extest.core.ModuleSubscriber.SUPPORT);
		
		return suppModule;
	})(extest);
	
	
	//구독 모듈 디펜던시 관리
	(function(extest,chckerModule, suppModule){
		var Chcker  = chckerModule.get("Chcker");
		var Support = suppModule.get("Support");
		
		extest.core.ModuleSubscriber.register("Chcker",null,function(){
			return Chcker;
		});
		
		extest.core.ModuleSubscriber.register("Support",null,function(){
			var module = {}
			module.support = Support;
			return module;
		});
		
		
		
	})(extest, chckerModule, suppModule);
	
	
	exports.getXTModule = function(auths){
		var depends = auths;
		if( ValueUtil.isNull(depends) ){
			depends = ["Chcker","Support"];
		}
		
		extest.core.ModuleSubscriber.register("extest.Modules", depends, function(){
			var modules = {};
			for(var idx = 0; idx < arguments.length; idx++){
				var module = arguments[idx];
				modules = Object.assign(modules, module);
			}
			return modules;
		});
		
		return extest.core.ModuleSubscriber.get("extest.Modules");
	}
	
})(extest,this);