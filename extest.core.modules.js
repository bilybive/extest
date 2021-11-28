
var core = $namespace("extest.core");
(function(core){
	var _suscriber = [];  /*구독사용가능 한 모듈*/
	var _registrations = []; /**/
	
	var _genRegisterWithDeps = function(repository) {
		var _repository = repository;
		return function(name, deps, func){
			_repository[name] = {deps:deps, func:func}
		}
	}
	
	var _genRegister = function(repository) {
		var _repository = repository;
		return function(name, func){
			_repository[name] = {func:func}
		}
	}
	
	var _genGet = function(repository) {
			
		var _repository = repository;
		return function(name){
			
			var registration = _repository[name]
			var deps = [];
			var self = this;
			
			if (registration === undefined) {
				return undefined;
			}
			
			registration.deps = ValueUtil.isNull(registration.deps) ? [] : registration.deps;
			registration.deps.forEach(function(depName) {
				deps.push(self.get(depName))
			});
			
			var func = null;
			try {
				func = registration.func.apply(undefined, deps)
			} catch (error){
				debugger;
				throw new Error(error);
			}			
			return func;
		}
	}
	/**
	 * 권한에 따라 모듈 제한
	 *  - 구독한 서비스에 따라 권한이 달라지고 이에 따라 사용 모듈을 제한한다.
	 */
	var ModuleSubscriber = (function(){
		
//		function ModuleSubscriber(){
//			this.registerWithDeps = _genRegisterWithDeps.call(this,_suscriber);
//			this.register = _genRegister.call(this,_suscriber);
//			this.get = _genGet.call(this,_suscriber)
//			
//		}
		
		var ModuleSubscriber = {
			register: _genRegisterWithDeps.call(this,_suscriber)
			,get: _genGet.call(this,_suscriber)
		}
		
		ModuleSubscriber.CORE     = "core";
		ModuleSubscriber.CHCKER   = "chcker";
		ModuleSubscriber.RECORDER = "recorder";
		ModuleSubscriber.SUPPORT  = "support";
		
		return ModuleSubscriber;
	})();
	core.ModuleSubscriber = ModuleSubscriber
	
	/**
	 * 전체 모듈 관리
	 *  - 의존관계에 따라 모듈을 관리한다.
	 */
	var Module = (function(){
		var _module = null;
		var _context = {};
		
		var Module = function (context){
			
			_context[context] = this;
			
			this.id = Math.random();
			
			this._registrations = [];
			this.registerWithDeps = _genRegisterWithDeps.call(this,this._registrations);
			this.register = _genRegister.call(this,this._registrations);
			this.get      = _genGet.call(this,this._registrations);
			
		}
		
		Module.getModuleInstance = function(context){
			if(_context.hasOwnProperty(context)){
				_module = _context[context];
			}else{
				_module = new Module(context);
			}
			
			return _module;
		}
		
		Module.registerWithContext = function(context, name, func){
			var _module = Module.getModuleInstance(context);
			_module.register(name, func);
		}
		
		
		return Module;
	})();
	core.Module = Module;
})(core);

