
var _trgCtrlRepo = {};
var suscriber = extest.core.ModuleSubscriber.CHCKER;
extest.core.Module.registerWithContext(suscriber,"extest.chcker.literal", function(){
	
	var Literal = {};
	
	Literal.PgrRcd = {
		BREAK: "B"
	}
	
	Literal.ExecRcd = {
		EXEC: "A",
		IF: "B",
		ELSE_IF:"C",
		ELSE: "D"
	}
	
	Literal.ExecStat = {
		EXEC: "exec",
		IF: "if"
	}
	
	Literal.Keyword = {
		BREAK: "break",
		CONTINUE: "continue"
	}
	
	return Literal;
});
