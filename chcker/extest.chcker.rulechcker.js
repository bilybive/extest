
var suscriber = extest.core.ModuleSubscriber.CHCKER;
extest.core.Module.registerWithContext(suscriber,"extest.chcker.rulechcker", function(){
	
	var core     = extest.core.Module.getModuleInstance(extest.core.ModuleSubscriber.CORE);
	var support  = extest.core.Module.getModuleInstance(extest.core.ModuleSubscriber.SUPPORT);
	var chcker   = extest.core.Module.getModuleInstance(extest.core.ModuleSubscriber.CHCKER);
	var chckExec = chcker.get("extest.chcker.exec");
	var chckRepo = chcker.get("extest.chcker.repo");
	var testAPI  = chcker.get("extest.chcker.testapi");
	var literal  = chcker.get("extest.chcker.literal");
	var exec     = core.get("extest.core.exec");
	
	support = support.get("Support");
	
	function _convertDataSetData(/*cpr.core.AppInstance*/embApp,prcdRows,mainCtrlId){
			
		var _dataSet = embApp.lookup("__dataSetTemp");
		if(!_dataSet){
			_dataSet = new cpr.data.DataSet("__dataSetTemp");
			_dataSet.parseData({
				"columns" : [
					{"name": "TENT_ID"},
					{"name": "PGM_ID"},
					{"name": "CHCK_ITEM_ID"},
					{"name": "MAIN_CTRL_ID"},
					{"name": "CHCK_PRCD"},
					{"name": "CHCK_CRIT_ID"},
					{"name": "EXPT_RCD"},
					{"name": "DTL_CTRL_TYPE"},
					{"name": "API_EXP"},
					{"name": "API_USE"},
					{"name": "API_ID"},
					{"name": "ITEM_RCD"},
					{"name": "CHCK_PRCD_EXEC_RCD"},
					{"name": "CHCK_MAND_YN"},
					{"name": "CHCK_PRCD_PGR_RCD"},
					{"name": "EXPT_SER_NO"},
					{"name": "DTL_CTRL_ID"}
				]
			});
			embApp.register(_dataSet);
		}
		_dataSet.build(prcdRows, false);
		
		return _dataSet.findAllRow("MAIN_CTRL_ID == '"+mainCtrlId+"'");
	}
	
/*라벨 획득 method*/	
	function _getLabel(embApp, mainCtrl, parentType){
		
		var label = null;
		if(parentType=="detail" || parentType=="header" || parentType=="footer"){
			label = _findLabelCtrlInGrid(mainCtrl,parentType);
		}else{
			label = _getLabelCtrl(embApp, mainCtrl);
		}
		
		return label;
	}

	function _getLabelCtrl(embApp, mainCtrl){
		var container = embApp.getContainer();
		var ctrlOrders = support.Ctrl.getAllChildrenByOrders(container,false);
		
		/**@type cpr.controls.Output*/
		var chckLabel = null;
		
		for(var idx = 0; idx < ctrlOrders.length; idx++){
			/** @type cpr.controls.UIControl */
			var ctrl = ctrlOrders[idx];
			if(ctrl.uuid != mainCtrl.uuid){
				continue;
			}
			
			var label = _findLabelCtrl(ctrlOrders, idx, mainCtrl);
			if(label != null){
				chckLabel = label;
				break;
			}
		}
		
		if(chckLabel == null){
			chckLabel = "";
		}
		
		return chckLabel;
	}
	
	function _findLabelCtrl(ctrlOrders,orderIdx, mainCtrl){
		
		if(orderIdx == 0){
			console.log(mainCtrl);
			return null;
		}
		
		/**@type cpr.controls.Output*/
		var ctrl = ctrlOrders[--orderIdx];

		//바로 앞이 아웃풋이 아니면 자기자신으로 라벨 대응
		if( ctrl.type !== 'output' ){
			return mainCtrl;
		}
		
		//아웃풋인데 라벨이 아닌경우 ex) ~ ,시,분,km,원 등
		//@todo 좀더 상세한 사항이 필요함
		// 1차 수정 : /[~!@#$%^&*()_+|<>?:{}]/ ==> () 삭제
		if(ctrl.type.match(/[~!@#$%^&*_+|<>?:{}]/)){
			return _findLabelCtrl(ctrlOrders, order, mainCtrl);
		}
		
		
		return ctrl;
	}
	
	
	function _findLabelCtrlInGrid(/*cpr.controls.UIControl*/mainCtrl,parentType){
		
		/** @type cpr.controls.Grid */
		var grid = mainCtrl.getParent();
		if(grid.type != 'grid'){
			throw new cpr.exceptions.CError("AllgorithmException", "부모가 그리드가 아닙니다.");
			return null;
		}
		
		var label = _getHeader(grid, mainCtrl, parentType);
//		if( !ValueUtil.isNull(label.control) && label.control["text"] ){
//			label = label.control;
//		}
		
		return label;
	}
	
	function _getHeader(/*cpr.controls.Grid*/grid,/*cpr.controls.UIControl*/mainCtrl,blong){
	
	    var maxHeaderRowIndex = 0;
	    var maxBlongRowIndex  = 0;
	    var currBlongRowIndex = 0;
		var currStrtColIndex  = null;
		var currEndColIndex   = null;
		
		var currColIndex = null;
		var currColSpan = null;
		
	    var blongCnt = grid[blong].cellCount;
	    var headerCnt = grid.header.cellCount;
	    
	    for(var blongIdx = 1; blongIdx < blongCnt; blongIdx++){
			var detailCol = grid.detail.getColumn(blongIdx);
			if(detailCol.rowIndex > maxBlongRowIndex){
				maxBlongRowIndex = detailCol.rowIndex;
			}
		}
		
	    
		grid.getColumnLayout()[blong].some(function(cellProp){
			var cellIndex = cellProp.cellIndex;
			var col = grid[blong].getColumn(cellIndex);
			var uuid = ValueUtil.isNull(col.control) ? null : col.control.uuid;
			if(mainCtrl.uuid == uuid){
				currStrtColIndex = cellProp.colIndex;
				currEndColIndex  = cellProp.colIndex + cellProp.colSpan;
				currBlongRowIndex = cellProp.rowIndex;
				currColIndex = cellProp.colIndex;
				currColSpan = cellProp.colSpan;
				return true;
			}
		});
		
		if(currStrtColIndex == null){
			return null;
		}
		
		for(var headerIdx = 1; headerIdx < headerCnt; headerIdx++){
			var headerCol = grid.header.getColumn(headerIdx);
			if(headerCol.rowIndex > maxHeaderRowIndex){
				maxHeaderRowIndex = headerCol.rowIndex;
			}
		}
		
		var header = null;
		grid.getColumnLayout().header.some(function(cellProp){
			if(cellProp.colIndex <= currStrtColIndex && currStrtColIndex < (cellProp.colIndex+cellProp.colSpan)
			 && cellProp.colIndex < currEndColIndex && currEndColIndex <= (cellProp.colIndex+cellProp.colSpan)
			){
				var differRowIndex = maxBlongRowIndex - currBlongRowIndex;
				if(currBlongRowIndex == maxBlongRowIndex && maxHeaderRowIndex == (cellProp.rowIndex+cellProp.rowSpan-1) ){
					header = grid.header.getColumn(cellProp.cellIndex);
					return true
				}else if(currBlongRowIndex < maxBlongRowIndex && (maxHeaderRowIndex-differRowIndex) == cellProp.rowIndex){
					header = grid.header.getColumn(cellProp.cellIndex);
					return true
				}
			}
		});
		
		return header
	}
	
	function _getMainCtrl(embApp, mainId, parentType){
		
		var mainCtrl = null;
		if(mainId === "root"){
			mainCtrl = embApp.getContainer();
		}else if(mainId.indexOf("header") != -1 && parentType == "grid"){
			var grid = embApp.lookup(mainId.replace("-header",""));
			mainCtrl = grid.header;
			chckRepo.setTrgCtrlRepo("grid-header",mainCtrl);
		}else if(mainId.indexOf("column") != -1 && parentType == "header"){
			var gridId = mainId.substring(0,mainId.indexOf("-"));
			var column = mainId.substring(mainId.indexOf("[")+1,mainId.indexOf("[")+2);
			var grid = embApp.lookup(gridId);
			mainCtrl = grid.header.getColumn(column);
		}else{
			mainCtrl = embApp.lookup(mainId);
		}
		
		return mainCtrl;
	}
	
	
	var RuleChecker = (function(){
	
		var RuleChecker = function(app,RuleClass){
			//RuleClass.call(this);
			/**@type cpr.core.AppInstance*/
			this._app = app;
			this.args = [];
		}
		
		RuleChecker.prototype.run = function(embApp, mainCtrlId, mainMethod, parentType, prcdRows,pgmId, chckItemId){
			
			prcdRows = _convertDataSetData(embApp, prcdRows, mainCtrlId);
			this.args = [embApp, mainCtrlId,parentType, prcdRows];
		
			var self = this;
			mainMethod = ValueUtil.isNull(mainMethod) ? "chckDefault" : mainMethod;
			var _script = "return self."+mainMethod+"();";
			try {
				return exec.runDynamicScript.call(this, _script, embApp);
			} catch (error){
				error = "TC_ID : "+pgmId+"-"+chckItemId+"-"+mainCtrlId+"\n"+error;
				console.error(error);
				throw error;			
			}
		}
		
		
		RuleChecker.prototype.chckDefault = function(/*cpr.core.AppInstance*/embApp,mainId,parentType,prcdRows){
			embApp = embApp == null ? this.args[0] : embApp; 
			mainId = mainId == null ? this.args[1] : mainId; 
			parentType = parentType == null ? this.args[2] : parentType; 
			prcdRows = prcdRows == null ? this.args[3] : prcdRows; 
			
			chckExec.initEvalScore();
			
			var mainCtrl = _getMainCtrl(embApp, mainId, parentType);;
			var label = _getLabel(embApp, mainCtrl, parentType);
			chckRepo.setTrgCtrlRepo("App",embApp.app);
			chckRepo.setTrgCtrlRepo("main",mainCtrl);
			chckRepo.setTrgCtrlRepo("label",ValueUtil.isNull(label) ? mainCtrl : label);
			
			for(var idx = 0; idx < prcdRows.length; idx++){
				
				var row = prcdRows[idx];
				var chckItemId = row.getValue("CHCK_ITEM_ID");
				var chckPrcdExecRcd = row.getValue("CHCK_PRCD_EXEC_RCD");
				
				var rslt = chckExec.exec(embApp, row, chckPrcdExecRcd);
				if(rslt){
					      if( rslt == literal.Keyword.BREAK ){
							break;
					}else if( rslt == literal.Keyword.CONTINUE ){
							continue;
					}
				}
			}
			
			return {
					item: chckExec.getTestRslt()
				   ,prcd: chckExec.getTestRsltDtl()
				};
		}
		
		return RuleChecker;
	})();
	
	return new RuleChecker();
});

	

