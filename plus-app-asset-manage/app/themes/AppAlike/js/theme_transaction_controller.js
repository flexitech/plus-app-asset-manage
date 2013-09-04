$app.controller('BillingPlanViewController', function(SearchBarHandler,$scope, $http,CacheServiceApp,LocalMyDb,MethodHandler,$navigate){
	
	
	var billing_plans_original=[];

	SearchBarHandler.searchText = "";
	SearchBarHandler.enable=true;
	SearchBarHandler.func=function(text){
		if (text==""){
			$scope.billing_plans=billing_plans_original;
			return;
		}
		console.log(text);
		$scope.billing_plans = _.filter(billing_plans_original,function(row){
			var val = false;
			val = val || $scope.getAssetName(row.asset_id).indexOf(text)>-1 || row.plan_name.toString().indexOf(text)>-1 || row.due_date.toString().indexOf(text)>-1;
			return val;
		});
	}
	
 	MethodHandler.text="New";
	MethodHandler.show=true;
	MethodHandler.icon_class ="glyphicon glyphicon-chevron-right";
	MethodHandler.func=function(){ $navigate.go("billing_plan_view_all_assets","slide")};
	$scope.billing_plans=[];
	//// query all billing plans
	var uname = CacheServiceApp.get("login_user");
	var usertmp = LocalMyDb.db.query("users",{user_name:uname})[0];
	var uid=-1;
	if (usertmp!=undefined)
		uid = LocalMyDb.db.query("users",{user_name:uname})[0].ID;
	console.log("userid:" + uid);
	$scope.billing_plans = LocalMyDb.db.query("billing_plans",{user_id:uid+""});
	billing_plans_original = $scope.billing_plans;
	$scope.showPlan = function(id){
		if (canClick)
			$navigate.go("billing_plan_info/" + id + "/update","slide");

	}
	$scope.deletePlan=function(id){
		///check if it has been used in invoices
		var canDel= LocalMyDb.db.query("invoices",{billing_plan_id:id+""}).length<=0;
		if (canDel){
			LocalMyDb.db.deleteRows("billing_plans",{ID:id});
			LocalMyDb.db.commit();
			$scope.billing_plans = LocalMyDb.db.query("billing_plans");

		}
		else{
			alert("Cannot Delete this plan!");
		}
		setTimeout(function(){
			
			canClick=true;
		},1000);
	}
	var  lastButton = null;
	var canClick=true;
	$scope.showDelete=function(o){
		canClick=false;
		$scope.hideDelete();
		lastButton = $(o);
		lastButton.removeClass('hideDeleteButton');
		lastButton.addClass('showDeleteButton');
		setTimeout(function(){
			$scope.hideDelete();
			canClick=true;
		},2000);
	}
	$scope.hideDelete=function(){
		if (lastButton!=null){
			lastButton.removeClass('showDeleteButton');
			lastButton.addClass('hideDeleteButton');
		}

	}
	$scope.getAssetName= function(id){
		var asset = LocalMyDb.db.query("assets",{ID:parseInt(id)})[0];
		if (asset!=undefined){
			return asset.asset_name;
		}
		else{
			return "";
		}
	}

});
/////////// billing_plan
$app.controller('BillingPlanViewAllAssetController', function($scope,SearchBarHandler, $http,CacheServiceApp,LocalMyDb,MethodHandler,$navigate){
	SearchBarHandler.enable=false;
	MethodHandler.text="Back";
	
	MethodHandler.show=true;
	MethodHandler.icon_class ="glyphicon glyphicon-chevron-left";
	MethodHandler.func=function(){ $navigate.back()};

	///// query all assets
	$scope.assets=[];
	var assets = LocalMyDb.db.query("assets");
	var billing_plans = LocalMyDb.db.query("billing_plans");
	
	$scope.assets = _.reject(assets,function(asset){
		return _.where(billing_plans,{asset_id:asset.ID+""}).length>0;
	});
});
$app.controller('BillingPlanInfoController', function($scope,SearchBarHandler, $http,CacheServiceApp,LocalMyDb,MethodHandler,$navigate,$routeParams){
	SearchBarHandler.enable=false;
	//Asset id
	$scope.id = $routeParams.id;
	//mode: update/new 
	$scope.mode = $routeParams.mode;
 	MethodHandler.text="Plans";
	MethodHandler.show=true;
	MethodHandler.icon_class ="glyphicon glyphicon-chevron-right";
	MethodHandler.func=function(){ $navigate.go("billing_plan_view","slide")};

	/// init 
	$scope.bill={name:"",note:"",tag:"",duedate:""};
	/// if update, load to textbox
	if ($scope.mode=="update"){
		var bill = LocalMyDb.db.query("billing_plans",{ID:$scope.id})[0];
		if (bill!=undefined){
			$scope.bill.name = bill.plan_name;
			$scope.bill.note = bill.note;
			$scope.bill.tag = bill.tag;
			$scope.bill.duedate = bill.due_date;
		}
		else{
			$scope.mode="new";
		}
	}
	$scope.createBill=function(bill){
		var uname = CacheServiceApp.get("login_user");
		var uid = LocalMyDb.db.query("users",{user_name:uname})[0].ID;
		if (uid==undefined || uid<=0){
			alert("You have not login yet! Please login!");
			$navigate.go("login","slide");
			return;
		}
		if ($scope.mode=="new"){
			//get user id

			var currentDate = new Date();
			var date = currentDate.getDate() + "/" + (currentDate.getMonth()+1) + "/" + currentDate.getFullYear();
			var row_affected = LocalMyDb.db.insert("billing_plans",{
					plan_name:bill.name,
					created_date:date,
					due_date:bill.duedate,
					tag:bill.tag,
					asset_id:$scope.id,
					user_id:uid,
					note:bill.note
					});
			LocalMyDb.db.commit();
			if (row_affected>0){
				alert("Save Successfully!");
				$scope.bill.name="";
				$scope.bill.tag="";
				$scope.bill.note="";
				$scope.bill.duedate="";
				$navigate.go("billing_plan_view","slide");
			}
			else{
				alert("Save fail!");
			}
		}
		else{
			var row_affected = LocalMyDb.db.update("billing_plans",{ID:$scope.id},function(row){
				row.plan_name=bill.name;
				row.due_date=bill.duedate;
				row.tag=bill.tag;				
				row.note=bill.note;
				return row;
			});
			LocalMyDb.db.commit();
			if (row_affected>0){
				alert("Update Successfully!");
				$scope.bill.name="";
				$scope.bill.tag="";
				$scope.bill.note="";
				$scope.bill.duedate="";
			}
			else{
				alert("Update fail!");
			}
		}
	}
});
///////// invoices
$app.controller('InvoiceViewAllBillingPlanController', function($scope, $http,SearchBarHandler,CacheServiceApp,LocalMyDb,MethodHandler,$navigate,$routeParams){
	var invoice_bills_original=[];
	SearchBarHandler.searchText = "";
	SearchBarHandler.enable=true;
	SearchBarHandler.func=function(text){
		if (text==""){
			$scope.invoice_bills=invoice_bills_original;
			return;
		}
		console.log(text);
		$scope.invoice_bills = _.filter(invoice_bills_original,function(row){
			var val = false;
			val = val || $scope.getAssetName(row.asset_id).indexOf(text)>-1 || row.plan_name.toString().indexOf(text)>-1 || row.due_date.toString().indexOf(text)>-1;
			return val;
		});
	}
	$scope.invoice_bills=[];
	if ($routeParams.val==undefined && $routeParams.val==undefined){
	
	

		$scope.invoice_bills = LocalMyDb.db.query("billing_plans");
		invoice_bills_original= $scope.invoice_bills;
	}
	else{
		$scope.invoice_bills = LocalMyDb.db.query("billing_plans",{due_date:$routeParams.val+""});
		invoice_bills_original= $scope.invoice_bills;
	}
	MethodHandler.text="New";
	MethodHandler.show=false;
	MethodHandler.icon_class ="glyphicon glyphicon-chevron-right";
	MethodHandler.func=function(){ };
	
	$scope.createInvoice = function(id){
		
		$navigate.go("invoice_info/" + id ,"slide");

	}
	$scope.getAssetName= function(id){
		var asset = LocalMyDb.db.query("assets",{ID:parseInt(id)})[0];
		if (asset!=undefined){
			return asset.asset_name;
		}
		else{
			return "";
		}
	}
	
});
$app.controller('InvoiceInfoController', function($scope,SearchBarHandler, $http,CacheServiceApp,LocalMyDb,MethodHandler,$navigate,$routeParams){
	SearchBarHandler.enable=false;
	$scope.invoice={
		bill:{},
		pricing_list:[],
		note:"",
		created_date:''
	};
	////
	$scope.id = $routeParams.id;
	var user_id = -1;
	if ($scope.id!=undefined && $scope.id>0){
		//get the bills
		$scope.invoice.bill = LocalMyDb.db.query("billing_plans",{ID:parseInt($scope.id)})[0];
		
		// bill
		if ($scope.invoice.bill!=undefined){
			var a_id = parseInt($scope.invoice.bill.asset_id);
			
			var user_id = parseInt($scope.invoice.bill.user_id);
			//get asset
			var asset = LocalMyDb.db.query("assets",{ID:a_id})[0];
			if (asset!=null){
			
			console.log(asset);
				//get asset pricing list
				var asset_pricings = LocalMyDb.db.query("asset_pricing",{asset_id:a_id});
				angular.forEach(asset_pricings,function(value,key){
					asset_pricings[key].qty = 0;
					asset_pricings[key].getQuantity = function(){
						return asset_pricings[key].qty - asset_pricings[key].current_qty;
					};
					asset_pricings[key].getAmount = function(){
						return asset_pricings[key].getQuantity() * asset_pricings[key].price;
					};
					asset_pricings[key].getAmountStr = function(){
						return asset_pricings[key].currency + " " + ( asset_pricings[key].getAmount());
					};
				});
				$scope.invoice.pricing_list = asset_pricings;
			}
		}
	}
	$scope.getTotalAmount = function(){
	
		if ($scope.invoice==undefined || $scope.invoice.pricing_list==undefined || $scope.invoice.pricing_list.length<=0){
			return "NaN";
		}
		else{
			var groupby_currency  = _.groupBy($scope.invoice.pricing_list,'currency');
			
			var textTotal = "";
			_.each(groupby_currency,function(row,key){
				var sum=0;
				 _.each(row,function(row_2){
					sum = sum + row_2.getAmount();
				});
				if (textTotal==""){
					textTotal +=key + " " + sum + "";
				}
				else{
					textTotal +=", " + key + " " + sum + "";
				}
			});
			return textTotal;
		}
	}
	
	$scope.createInvoice=function(invoice){
		var c_date = Date.parse(invoice.created_date);
		var due_paid_date = new Date(c_date);
		due_paid_date.setDate(due_paid_date.getDate()+5);
		var inv_id=-1;
		LocalMyDb.db.insert("invoices",
			{
				billing_plan_id:invoice.bill.ID,
				created_date:invoice.created_date,
				total_value:$scope.getTotalAmount(),
				due_paid:due_paid_date.getMonth() + "/" + due_paid_date.getDate() + "/" + due_paid_date.getYear(),
				paid:'false',
				user_id:invoice.bill.user_id,
				note:invoice.bill.note
				
			});
		inv_id = _.max(LocalMyDb.db.query("invoices"),function(invoice){
			return invoice.ID;
		}).ID;
		////insert into invoice detail and update pricing list new value
		angular.forEach(invoice.pricing_list,function(value){
		console.log(value);
			LocalMyDb.db.insert("invoice_detail",
				{
					invoice_id:inv_id,
					pricing_id:value.ID,
					pricing_name:value.pricing_name,
					old_qty:value.current_qty,
					new_qty:value.qty,
					unit:value.unit,
					currency:value.currency,
					qty:value.getQuantity(),
					amount:value.getAmount()
				});
			if (value.value_can_change){
				LocalMyDb.db.update("asset_pricing",{ID:value.ID},function(row){
					row.current_qty = value.qty;
					return row;
				});
			}
		});
		////commit chagnes
		LocalMyDb.db.commit();
		console.log(LocalMyDb.storeFunction.exportJSON());
		$navigate.go("invoice_view_all","slide");
	}
	
});
$app.controller('InvoiceViewAllController', function(SearchBarHandler,$scope, $http,CacheServiceApp,LocalMyDb,MethodHandler,$navigate,$routeParams){
	var invoices_original=[];
	SearchBarHandler.enable=true;
	SearchBarHandler.searchText = "";
	SearchBarHandler.func=function(text){
		if (text==""){
			$scope.invoices=invoices_original;
			return;
		}
		console.log(text);
		$scope.invoices = _.filter(invoices_original,function(row){
			var val = false;
			val = val || $scope.getBillingName(row.ID).indexOf(text)>-1 || row.created_date.toString().indexOf(text)>-1 || row.total_value.toString().indexOf(text)>-1 || row.ID.toString().indexOf(text)>-1;
			return val;
		});
	}
	
		
	MethodHandler.text="New";
	MethodHandler.show=false;
	MethodHandler.icon_class ="glyphicon glyphicon-chevron-right";
	MethodHandler.func=function(){
		console.log("hey u!!!");
		
	};
	var  lastButton = null;
	var editing=false;
	$scope.showPaid=function(o){
		$scope.hidePaid();
		lastButton = $(o);
		lastButton.removeClass('hideDeleteButton');
		lastButton.addClass('showDeleteButton');
	}
	$scope.hidePaid=function(){
		if (lastButton!=null){
			lastButton.removeClass('showDeleteButton');
			lastButton.addClass('hideDeleteButton');
		}
	}
	$scope.invoices=[];
	$scope.pay = function(id){
		editing=true;
		console.log(LocalMyDb.db.update("invoices",{ID:parseInt(id)},function(row){
			row.paid="true";return row;
		}));
		LocalMyDb.db.commit();
		viewAllInvoices();
		setTimeout(function(){
			editing=false;	
		},1000);
	}
	function viewAllInvoices(){
		var uname = CacheServiceApp.get("login_user");
		if (uname!=undefined){
			var uid = LocalMyDb.db.query("users",{user_name:uname})[0].ID;
			if (uid==undefined || uid<=0){
				//alert("You have not login yet! Please login!");
				$navigate.go("login","slide");
				return;
			}
			else{
				$scope.invoices= LocalMyDb.db.query("invoices",{user_id:uid+""});
				invoices_original = $scope.invoices;
			}
		}
		else{
			//alert("You have not login yet! Please login!");
			$navigate.go("login","slide");
			return;
		}
	}
	viewAllInvoices();
	$scope.getBillingName=function(id){
			var billing = LocalMyDb.db.query("billing_plans",{ID:parseInt(id)})[0];
			if (billing==undefined){
				return "Unknown";
			}
			else{
				return billing.plan_name;
			}
		}
	$scope.view=function(id){
		if (!editing)
			$navigate.go("invoice_view/" + id,"slide");
	}
});
$app.controller('InvoiceViewController', function($scope,SearchBarHandler, $http,CacheServiceApp,LocalMyDb,MethodHandler,$navigate,$routeParams){
	SearchBarHandler.enable=false;

	$scope.invoice={};
	$scope.id = $routeParams.id;
	var uname = CacheServiceApp.get("login_user");
	var user=LocalMyDb.db.query("users",{user_name:uname})[0];
	var uid = -1;
	if (user!=undefined)
		uid = LocalMyDb.db.query("users",{user_name:uname})[0].ID;
	
	$scope.invoice= LocalMyDb.db.query("invoices",{user_id:uid+"",ID:parseInt($scope.id)})[0];
	if ($scope.invoice!=undefined){
		$scope.invoice.getBillingName=function(){
			var billing = LocalMyDb.db.query("billing_plans",{ID:parseInt($scope.invoice.billing_plan_id)})[0];
			if (billing==undefined){
				return "Unknown";
			}
			else{
				return billing.plan_name;
			}
		}
		////get invoice detail
		$scope.invoice.detail = LocalMyDb.db.query("invoice_detail",{invoice_id:$scope.invoice.ID+""});
		console.log(LocalMyDb.db.query("invoice_detail"));
		
		$scope.getTotalAmount = function(){

			if ($scope.invoice==undefined || $scope.invoice.detail==undefined || $scope.invoice.detail.length<=0){
				return "NaN";
			}
			else{
				var groupby_currency  = _.groupBy($scope.invoice.detail,'currency');
				
				var textTotal = "";
				_.each(groupby_currency,function(row,key){
					var sum=0;
					 _.each(row,function(row_2){
						sum = sum + row_2.amount;
					});
					if (textTotal==""){
						textTotal +=key + " " + sum + "";
					}
					else{
						textTotal +=", " + key + " " + sum + "";
					}
				});
				return textTotal;
			}
		
		}
	}
	
});