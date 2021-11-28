
var suscriber = extest.core.ModuleSubscriber.CHCKER;
extest.core.Module.registerWithContext(suscriber,"extest.chcker.exec", function(){
	var chcker  = extest.core.Module.getModuleInstance(extest.core.ModuleSubscriber.CHCKER);
	var core    = extest.core.Module.getModuleInstance(extest.core.ModuleSubscriber.CORE);
	var chckRepo = chcker.get("extest.chcker.repo");
	var testAPI  = chcker.get("extest.chcker.testapi");
	var literal  = chcker.get("extest.chcker.literal");
	var exec     = core.get("extest.core.exec");
	
	
	function _expLogicalParser(/*String*/exp){
		var matcher = /(&&)|(\|\|)/g;
		var matches = exp.match(matcher);
		matches = matches == null ? [] : matches;
		var exps  = _parse(matches, exp);		
		return { 0: matches, 1: exps };
	}
	
	function _parse(matches, exp){
		
		if(!(exp instanceof Array)){
			exp = [exp];
		}
		
		var exps = [];
		var match = matches[0];
		exp.forEach(function(each){
			_pushArray(each.split(match), exps);
		});
		
		matches = matches.slice(1);
		if(matches.length > 0){
			exps = _parse(matches, exps);
		}
		return exps; 
	}
	
	
	function _pushArray(paSrc, paTrg){
		paSrc.forEach(function(each){
			paTrg.push(each);
		});
		
		return paTrg;
	}
	
	
	/*testApi 실행시 넘길 파라미터 파서 method*/	
	function _getParams(/*String*/exp){
		var params = exp.split(/\s+/);
		params.forEach(function(param,index){
			param = param.replace(/^"|^'/g,"").replace(/"$|'$/g,"");
			param = '"'+param+'"';
//			param = _parseParam(param);
			params[index] = param;
		});
		
		return params = params.join(",");
	}
	
	var Exec = (function(){
		
		var prcdRslt         = [];
		var rsltScore        = 0;
		var mandScore        = 0;
		var chckPrcdExecStat = literal.ExecStat.EXEC; //진행상태
		var isIfTrue         = false;
			
		function Exec(){
			var _execRep = {};
			_execRep[literal.ExecRcd.EXEC]    = ChckExec;
			_execRep[literal.ExecRcd.IF]      = ChckExecIf;
			_execRep[literal.ExecRcd.ELSE_IF] = ChckExecIf;
			_execRep[literal.ExecRcd.ELSE]    = ChckExecIf;
			
			this.exec = function(embApp, row, execRcd){
				var adpt = _execRep[execRcd];
				return adpt._exec(embApp, row);
			}
			
			this.getTestRslt = function(){
				/*
				 * break의 의미 : 절차 수행결과 실패일시 절차 진행을 중단함
				 * 1. break + 선택 : 절차를 진행할 대상인지 판단하기 위함
				 *    성공 - 절차를 계속 진행해야 할 대상으로 판단
				 *    실패 - 진행 대상이 아님으로 판단(N/A)
				 * 2. break + 필수 : 절차를 계속 수행해도 되는지 판단
				 *    성공 - 절차를 계속 진행
				 *    실패 - 절차를 계속 진행하면 안됨 (실패)           
				 */
				
				/*
				 * 1. 해당 절차는 전부 실행한다.
				 *  (if 구문시 if에 해당하는 절차는 전부 실행한다.)
				 * 2. 절차를 전부 실행하나 break절차시 절차진행을 중단한다.
				 * 3-1. break + 선택 절차 수행  성공 --> 다음절차 진행
				 *                         실패 --> 중단결과 'N/A'
				 * 3-2. break + 필수 절차 수행 성공 --> 다음절차 진행
				 *                         실패 --> 중단결과 실패 (필수절차이지만, 절차를 전부 진행하지 못함) 
				 * 4. break 설정시에만 선택절차에 의미가 있다.
				 * 5. 필수절차 수행 후 break & 선택에 대한 상황은 고려하지 않았다.(논리적으로 이상함)
				 */
				
				return mandScore == 0 ? "N/A" : rsltScore == prcdRslt.length ? "Y" : "N";	
			}
			
			this.getTestRsltDtl = function(){
				return prcdRslt;
			}
			
			this.initEvalScore = function(){
				prcdRslt         = [];
				rsltScore        = 0;
				mandScore		 = 0;   
				chckPrcdExecStat = literal.ExecStat.EXEC;
				isIfTrue         = false;
				chckRepo.initRepo();
			}
			
		}
		
		var ChckExec = {
			_exec: function(embApp, row){
				var rslt = beforeExec(row)
				if(rslt) return rslt;
				
				rslt = runExec(embApp, row);
				
				rslt = afterExec(row, rslt);			
				if(rslt) return rslt;
			}
		}
		
		var ChckExecIf = {
			_exec: function(embApp, row){
				
				var chckPrcdExecRcd = row.getValue("CHCK_PRCD_EXEC_RCD"); 
				var isIf = isIfExecRcd( chckPrcdExecRcd );
				if(chckPrcdExecStat == literal.ExecStat.IF 
				 && isIf && isIfTrue){ //condition statement is complete
					return literal.Keyword.BREAK;
				}
				
				chckPrcdExecStat = literal.ExecStat.IF;
				if(chckPrcdExecRcd == literal.ExecRcd.ELSE){
					//else인 경우 무조건 true
					isIfTrue = true;
				}else{
					var rslt = runExec(embApp, row);
					isIfTrue = rslt.RESULT ? true : false;
					if(isIfTrue){
						rslt = afterExec(row, rslt);			
					}
				}
				
				return literal.Keyword.CONTINUE;
			}
		}
		
		function isIfExecRcd(chckPrcdExecRcd){
			return chckPrcdExecRcd == literal.ExecRcd.IF || chckPrcdExecRcd == literal.ExecRcd.ELSE_IF || chckPrcdExecRcd == literal.ExecRcd.ELSE;
		}
		
		function beforeExec(row){
			var chckPrcdExecRcd = row.getValue("CHCK_PRCD_EXEC_RCD"); 
			var exptRcd = row.getValue("EXPT_RCD");
			/** 예외항목 수행---------------------------------------------------------------*/
			if( exptRcd == 'Y' ){
				var obj = {
					RESULT: true
					,CAUSE: "예외항목"
				}
				rsltScore += 1;
				result(row.getRowData(), obj);
				return literal.Keyword.BREAK;
			}
			
			/** if절차 수행---------------------------------------------------------------*/
			var isIf = isIfExecRcd( chckPrcdExecRcd );
			if( chckPrcdExecStat == literal.ExecStat.IF && !isIfTrue ){ //if수행상태 and if수행값 == false
				if( !isIf ){ //To next condition statement //현재절차가 if수행구분
					return literal.Keyword.CONTINUE;
				}
			}
		}
		
		
		function runExec(embApp, row){
			var chckItemId = row.getString("CHCK_ITEM_ID");
			var d_ctrlType = row.getString("DTL_CTRL_TYPE");
			var apiExp     = row.getString("API_EXP");
			var itemDivCd  = row.getString("ITEM_RCD");
			var apiUse     = row.getString("API_USE");
			
			var params = _getParams(apiExp);
			var script = "return self."+apiUse+"('"+d_ctrlType+"', '"+itemDivCd+"', "+params+")";
			return exec.runDynamicScript.call(testAPI,script,embApp);
		}
		
		function afterExec(row, rslt){
			var chckMandYn     = row.getValue("CHCK_MAND_YN");
			var chckPrcdPgrRcd = row.getValue("CHCK_PRCD_PGR_RCD");
			
			if(chckMandYn == "Y"){
				mandScore = 1;
			}else{
				mandScore = 0;
			}
			
			rsltScore += rslt.RESULT ? 1 : 0; 
			result(row.getRowData(), rslt);
			if( chckPrcdPgrRcd == literal.PgrRcd.BREAK && !rslt.RESULT ){
				return literal.Keyword.BREAK;
			}
		}
		
		function result(rowData,rslt){
			var obj = {
				RESULT: rslt.RESULT == true ? "Y" : rslt.RESULT == false ? "N" : rslt.RESULT
				,CAUSE: rslt.CAUSE
				,TEST_TGT: rslt.TESTITEM
				,EXPE_VAL: rslt.EXPEVAL
				,REAL_VAL: rslt.REALVAL
			}
			
			var rsltObj = Object.assign(rowData,obj);
			prcdRslt.push(rsltObj);
		}
		return Exec;
	})();	
	return new Exec();
});
