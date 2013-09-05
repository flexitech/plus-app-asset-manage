'use strict';

/* Variables:
 * 1) $scope: Here we pass in the $scope dependency because this controller needs the two-way databinding functionality of angular.
 * 2) geolocation: The geo location service will get and return the user's current location
 * 3) $http: This is angular service to  post and get data from external sources
 */

//////// Current scene right top menu handler
$app.factory('MethodHandler', function() {
	var methodHandler={};
	methodHandler.text="Skip";
	methodHandler.show = true;
	methodHandler.icon_class="glyphicon glyphicon-chevron-right";
	methodHandler.func=null;
  return methodHandler;
});
//////// Current scene search
$app.factory('SearchBarHandler', function() {
	var SearchBarHandler={};
	SearchBarHandler.searchText="";

	SearchBarHandler.enable=false;
	SearchBarHandler.onSubmit=function(){
		
		if (SearchBarHandler.func!=null){
			SearchBarHandler.func(SearchBarHandler.searchText);
		}
	}
	SearchBarHandler.func=null;
  return SearchBarHandler;
});
//////// local cache service
$app.factory('CacheServiceApp', function($cacheFactory) {
  return $cacheFactory('CacheServiceApp');
});
//////// local database service
$app.factory('LocalMyDb',function(){
	var dbAccess={

	};
	dbAccess.db = new localStorageDB("LocalMyDb",localStorage);
	dbAccess.resetDb = function(){
		if (!dbAccess.db.isNew()){
			dbAccess.db.drop();
			dbAccess.db.commit();

		}
	}
	dbAccess.storeFunction ={};
	dbAccess.storeFunction.checkNewInstallation=function(){
		var tmp = dbAccess.db.query("master_db",{fresh_installation:true});
		return tmp[0];
	}
	dbAccess.storeFunction.exportJSON = function(){
		var db ={};
		db["users"] = dbAccess.db.query("users");
		db["users_social"] = dbAccess.db.query("users_social");
		db["vaults"] = dbAccess.db.query("vaults");
		db["assets"] = dbAccess.db.query("assets");
		db["asset_pricing"] = dbAccess.db.query("asset_pricing");
		db["master_db"] = dbAccess.db.query("master_db");
		db["invoice_detail"] = dbAccess.db.query("invoice_detail");
		db["billing_plans"] = dbAccess.db.query("billing_plans");
		db["invoices"] = dbAccess.db.query("invoices");
		return angular.toJson(db);
	}
	if (dbAccess.db.isNew()){
		//////create table user
		dbAccess.db.createTable("users",["user_id","user_name","password","email","date_joined"]);
		///// create table user social
		dbAccess.db.createTable("users_social",["user_id","social_type","social_username","social_profile_image_url","social_code","social_secret"]);
		//// create table vault
		dbAccess.db.createTable("vaults",["user_id","vault_name","vault_password","vault_single_sign_check","created_date"]);
		/// create asset table
		dbAccess.db.createTable("assets",["asset_name","asset_type","asset_value","vault_id","created_date","status"]);
		/// create table asset pricing
		//dbAccess.db.createTable("asset_pricing",["asset_id","pricing_name","pricing_type","price","currency","due_pricing_date"]);
		dbAccess.db.createTable("asset_pricing",["asset_id","pricing_name","current_qty","unit","price","currency","value_can_change","last_changed_date"]);
		/// create master table
		dbAccess.db.createTable("master_db",["fresh_installation","installation_date","username"]);
		/// create table billing plan
		dbAccess.db.createTable("billing_plans",["plan_name","created_date","due_date","tag","asset_id","note","user_id"]); //Asset_id ref assets(ID)
		/// create table invoice
		dbAccess.db.createTable("invoices",["billing_plan_id","created_date","total_value","paid","due_paid","user_id","note"]); //billing_plan_id ref billing_plan(ID)
		/// create table invoice detail
		dbAccess.db.createTable("invoice_detail",["invoice_id","pricing_id","pricing_name","currency","old_qty","new_qty","qty","unit","amount"]); //invoice_id ref invoices(ID), pricing_id ref asset_pricing(ID)
		//// lib commit
		dbAccess.db.commit();
	}
	return dbAccess;
});
//////// upload file service 
$app.factory('MyUploader',function(){
	/******* usage ********/
	/*
		- inject MyUploader service to controller
		- call set up uploading
			+ MyUploader.setOption('file','video.mp4','video/mp4');
			+ MyUploader.setParams({dir:'/server1/',user_id:1});
			+ MyUploader.init('http://myserver.com/fileupload.php','file:///video.mp4',
				successcallback,errorcallback,progresscallback);
				* function successcallback(){}
				* function errorcallback(){}
				* function progresscallback(percentage,computable){}

	*/
	var uploader={};
	uploader.options =null;
	uploader.serverURL = "";

	uploader.params = Object();
	uploader.setOptions=function(filekey,filename,mimetype){
		var options = new FileUploadOptions();
		options.fileKey = filekey;
		options.fileName =filename;
		options.mimeType = mimetype;
		uploader.options = options;
		return options;
	}
	uploader.setParams=function(array){
		uploader.params = {};
		_.each(array,function(value,key){
			uploader.params[key] = value;
		});
		return uploader.params;
	}
	uploader.init=function(server_url,fileuri,onsuccess,onerror,onprogress){
		if (uploader.options !=null){
			uploader.options.params = uploader.params;
			uploader.options.chunkedMode = false;
			var ft = new FileTransfer();
			ft.onprogress = function(progressEvent){
				if (progressEvent.lengthComputable){
					if (onprogress!=null){
						onprogress(progressEvent.loaded/progressEvent.total,true);
					}
					else{

						console.log("onprogress event not working!#1: " + (progressEvent.loaded/progressEvent.total));
					}
				}
				else{
					if (onprogress!=null){
						onprogress(1,false);
					}
					else{

						console.log("onprogress event not working!#2: + 1" );
					}
				}
			}

			ft.upload(
					fileuri,
					server_url,
					function(){
						if (onsuccess!=null){
							onsuccess();
						}
						console.log("upload successfully!");
					},
					function(){
						if (onerror!=null){
							onerror();
						}
						console.log("upload fail!");
					},
					uploader.options
				);
			
		}
		else{
			alert("Options parameter of 'MyUploader' has not been set properly!");
		}
	}
	return uploader;
});
//////// file system service
$app.factory('FileSystem',function(){
	var fileSystem = {};
	fileSystem.success=null;
	fileSystem.error=null;
	fileSystem.filename ="";
	fileSystem.readFile=function(filename,func_success,func_error){
		fileSystem.success = func_success;
		fileSystem.error = func_error;
		window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fileSystem.error);
		alert("readFile");
	}
	function gotFS(fs){
		fs.root.getFile(fileSystem.filename,null,gotFileEntry,fileSystem.error);
		alert("goFS");
	}
	function gotFileEntry(entry){
		entry.file(gotFile,fileSystem.error);
		alert("getFileEntry");
	}
	function gotFile(file){
		alert("gotFile");
		if (fileSystem.success!=null){
			fileSystem.success(file);
		}
	}
	return fileSystem;
});
$app.controller('LayoutController', function($scope, $http,CacheServiceApp){

  $scope.userLogined = function(){
		var tmp=(CacheServiceApp.get("login_user")!=undefined && CacheServiceApp.get("login_user")!=null && CacheServiceApp.get("login_user")!="");
		
		return tmp;
	}

});
$app.controller('FooterController', function($scope, $http,$location,CacheServiceApp,LocalMyDb){
	
});
$app.controller('NavController', function($scope, $http,$location,CacheServiceApp,LocalMyDb){
	$scope.userLogined = function(){
		var tmp=(CacheServiceApp.get("login_user")!=undefined && CacheServiceApp.get("login_user")!=null && CacheServiceApp.get("login_user")!="");
		
		return tmp;
	}

	var uname = CacheServiceApp.get("login_user");
	var usertmp = LocalMyDb.db.query("users",{user_name:uname})[0];
	var uid=-1;
	if (usertmp!=undefined)
		uid = LocalMyDb.db.query("users",{user_name:uname})[0].ID;

	$scope.importantNotice = [{text:"Unpaid Invoices",value:0,link:"invoice_view_all"},{text:"Due Invoices",value:0,link:""},{text:"Message",value:0,link:""}];
	////load data for notice
	function loadDataForNotice(){
		if (uid==undefined || uid<=0){
			
			return;
		}

		var billingOfUser = LocalMyDb.db.query("billing_plans",{user_id:uid});
		
		$scope.importantNotice[0].value = _.filter(LocalMyDb.db.query("invoices"),function(row){
			return _.where(billingOfUser,{ID:parseInt(row.billing_plan_id)}).length>0;
		}).length;
		
		var billDueInv= _.filter(billingOfUser,function(row){
			
			var currentDate = new Date();
			var mydate = Date.parse(row.due_date);
			var lowerDate = new Date(mydate);
			lowerDate.setDate(lowerDate.getDate()+5);


			//get invoices for the current bill plan
			var invs = LocalMyDb.db.query("invoices",{billing_plan_id:row.ID+""});
			var inv=null;
			var isInvCreateYet = false;
			if (invs.length>0){
				inv = invs[invs.length-1];
			}
			if (inv==null || inv==undefined){
				isInvCreateYet = false;
			}
			else{
				var lastInvDate = Date.parse(inv.created_date);
				isInvCreateYet = (lastInvDate - mydate)>20;
			}
			

			//console.log("currentDate:" + currentDate + ",lowerDate: " + lowerDate);
			return lowerDate<=currentDate && !isInvCreateYet;
		});
		$scope.importantNotice[1].value = billDueInv.length;
		$scope.importantNotice[1].link="invoice_view_all_billing_plan/" + billDueInv.due_date + "/filter";
	}
	$scope.logoff = function(){
		CacheServiceApp.remove("login_user");
		LocalMyDb.db.deleteRows("master_db");
		LocalMyDb.db.commit();
		$location.path("/login");
	}
	$scope.current_assets=[];
	////get all assets
	function getCurrentAssets(){
		if (uid==undefined || uid<=0){
			
			return;
		}
		$scope.current_assets=[];
		var vaultofUser = LocalMyDb.db.query("vaults",{user_id:uid});
		
		var assets =_.filter(LocalMyDb.db.query("assets",{}),
				function(row){
					
					return _.where(vaultofUser,{ID:parseInt(row.vault_id+"")}).length>0;
				}
			);
		var tmp = _.countBy(assets,'asset_type');
		_.each(tmp,function(value,key){
		$scope.current_assets.push({asset_type:key,asset_count:value});

		});
		
	}
	if ($scope.userLogined()){
		getCurrentAssets();
		loadDataForNotice();
	}
});


$app.controller('LayoutHeaderController', function($scope, $http,$location,CacheServiceApp,MethodHandler,$routeParams,SearchBarHandler){
	SearchBarHandler.searchText = "Searching text";
	


	$scope.pageTitle = "Assets";
	var routes = settings.theme.routes;
	
	//check for top level routes only
	for(var i in routes){
		
		var route = routes[i];
		var routepath = route.path + "";
		var locpath = $location.path() + "";
		var routeslash = routepath.substr(1,routepath.length-1).indexOf('/');
		var locslash = locpath.substr(1,locpath.length-1).indexOf('/');
		locslash=locslash>0?locslash:locpath.length;
		routeslash=routeslash>0?routeslash:routeslash.length;
		if (routepath.substr(0,routeslash) == locpath.substr(0,locslash)){
			
			$scope.pageTitle = route.title;
		}
	}
	$scope.show=function(t){
		if ($(t).attr("data-cur")=="hide"){
			$(t).click();
			$(t).attr("data-cur","show");
		}
		console.log("come show");
	}

	$scope.showSearch=function(t){
		if ($scope.getSearchBarHandler().enable){
			if ($(t).attr("data-cur")=="hide"){
				$(t).click();
				$(t).attr("data-cur","show");
			}
			console.log("df");
		}
	}

	$scope.hide=function(t){
		if ($(t).attr("data-cur")=="show"){
			$(t).click();
			$(t).attr("data-cur","hide");
		}
		console.log("come hide");
		
	}
	$scope.isLogin=false;
	$scope.checkUserLogin = function(){
		$scope.isLogin = (CacheServiceApp.get("login_user")!=undefined && CacheServiceApp.get("login_user")!=null && CacheServiceApp.get("login_user")!="");
		
	}
	$scope.getMethodHandler=function(){return MethodHandler;};
	$scope.getSearchBarHandler=function(){return SearchBarHandler;};

	
});
$app.controller('HomeController', function($scope, $http,MethodHandler){
	$scope.isLogin = false;
  	MethodHandler.text="Exit	";
	MethodHandler.show=true;
	MethodHandler.icon_class ="glyphicon glyphicon-chevron-right";
	MethodHandler.func=function(){alert("now you are in ome page!")};

});
$app.controller('RoomController', function($scope, $http,MethodHandler){

  	MethodHandler.text="New Room";
	MethodHandler.show=true;
	MethodHandler.icon_class ="glyphicon glyphicon-chevron-right";
  	MethodHandler.func=function(){alert("New room information!")};

});
$app.controller('AssetViewController', function($scope,SearchBarHandler, $http,LocalMyDb,CacheServiceApp,MethodHandler,$routeParams,$navigate){
	
	SearchBarHandler.enable=false;
	$scope.id=0;
	$scope.asset =null;

	$scope.asset_pricing=[];
	if ( $routeParams.id==null || $routeParams.id==undefined || $routeParams.id<1){
		$navigate.back();
	}
	else{
		$scope.id = $routeParams.id;
		
	}
	function viewAsset(){
		var tmp = LocalMyDb.db.query("assets",{ID:$scope.id});
		$scope.asset =  tmp[0];
		if ($scope.asset==null){
			$navigate.back();
		}
		//get asset pricing
		$scope.asset_pricing = LocalMyDb.db.query("asset_pricing",{asset_id:$scope.id});
	}
	$scope.edit=function(){
		$navigate.go("new_assets/" + $scope.id + "/update","slide");
	}
	$scope.editAssetPricing = function(pid){
		$navigate.go("asset_pricing/" + pid + "/update","slide");
		//alert(pid);
	}
	viewAsset();
	MethodHandler.show=true;
	MethodHandler.icon_class ="glyphicon glyphicon-chevron-left";
	MethodHandler.text="Back";
	MethodHandler.func=function(){
		
		$navigate.back();
		
	}
});
$app.controller('AssetPricingController', function($scope,SearchBarHandler, $http,LocalMyDb,CacheServiceApp,MethodHandler,$routeParams,$navigate){
	SearchBarHandler.enable=false;

	MethodHandler.show=true;
	MethodHandler.text="Vaults";
	MethodHandler.icon_class ="glyphicon glyphicon-chevron-right";
	MethodHandler.func=function(){
		
		$navigate.go("vaults" ,"slide");
		
	}


	//asset init
	$scope.pricing={name:"",current_qty:"",currency:"",unit:"",price:0,value_can_change:true};

	$scope.id=0;
	$scope.mode = "new";
	if ($routeParams.mode ==null || $routeParams.id==null || $routeParams.id==undefined || $routeParams.id<1){
		$navigate.go("assets","slide");
	}
	else{
		$scope.id = $routeParams.id;
		$scope.mode = $routeParams.mode;
		if ($scope.mode=="update"){
			//query current pricing plan
			var priceplan = LocalMyDb.db.query("asset_pricing",{ID:$scope.id})[0];
			if (priceplan!=null && priceplan!=undefined){
				$scope.pricing.name = priceplan.pricing_name;
				$scope.pricing.current_qty = priceplan.current_qty;
				$scope.pricing.currency = priceplan.currency;
				$scope.pricing.unit  = priceplan.unit;
				$scope.pricing.price = priceplan.price;
				$scope.pricing.value_can_change = priceplan.value_can_change;
				MethodHandler.text="Back";
				MethodHandler.icon_class ="glyphicon glyphicon-chevron-left";
				MethodHandler.func=function(){
					
					$navigate.back();
					
				}

				
			}
			else{
				$scope.mode="New";
			}
		}
	}
	$scope.createPricing = function(pricing){

		///insert into database
		if($scope.mode=="new"){
			var row_affected = LocalMyDb.db.insert("asset_pricing",{
				asset_id:$scope.id,
				pricing_name:pricing.name,
				current_qty:pricing.current_qty,
				price:pricing.price,
				currency:pricing.currency,
				unit:pricing.unit,
				value_can_change:pricing.value_can_change
			});
			LocalMyDb.db.commit();
			
			if (row_affected>0){
				alert("Save success!");
				$scope.pricing.name="";
				$scope.pricing.current_qty="";
				$scope.pricing.currency ="";
				$scope.pricing.unit = "";
				$scope.pricing.price = 0;
				$scope.pricing.value_can_change=true;
			}
			else{
				alert("Save Fail!");
			}
		}
		else{
			var row_affected = LocalMyDb.db.update("asset_pricing",{ID:$scope.id},function(row){
				row.pricing_name = pricing.name;
				row.current_qty = pricing.current_qty;
				row.price = pricing.price;
				row.currency = pricing.currency;
				row.unit = pricing.unit;
				row.value_can_change = pricing.value_can_change;
				return row;
			});
			LocalMyDb.db.commit();
			if (row_affected>0){
				alert("Update success!");
				$scope.pricing.name="";
				$scope.pricing.current_qty="";
				$scope.pricing.currency ="";
				$scope.pricing.duedate = "";
				$scope.pricing.unit = 0;
				$scope.pricing.value_can_change = true;
				$scope.mode="new";
			}
			else{
				alert("Update Fail!");
			}
		}

	}


	
});
$app.controller('AssetInfoController', function(SearchBarHandler,$scope, $http,LocalMyDb,CacheServiceApp,MethodHandler,$routeParams,$navigate){
	

	SearchBarHandler.enable=false;
	//asset init
	$scope.assetinfo={asset_name:"",asset_value:"",asset_type:""};

	$scope.id=0;
	$scope.mode = "new";
	if ($routeParams.mode ==null || $routeParams.id==null || $routeParams.id==undefined || $routeParams.id<1){
		$navigate.go("assets","slide");
	}
	else{
		$scope.id = $routeParams.id;
		$scope.mode = $routeParams.mode;
		if ($scope.mode=="update"){
			//query data 

			var currentAsset = LocalMyDb.db.query("assets",{ID:$scope.id});

			if (currentAsset.length>0){
				$scope.assetinfo.asset_name = currentAsset[0].asset_name;
				$scope.assetinfo.asset_type = currentAsset[0].asset_type;
				$scope.assetinfo.asset_value = currentAsset[0].asset_value;

					console.log($scope.assetinfo);
			}
			else{
				$scope.mode="new";
			}
		}
	}
	MethodHandler.show=true;
	MethodHandler.text="Back";
	MethodHandler.icon_class ="glyphicon glyphicon-chevron-left";
	MethodHandler.func=function(){
		/*if ($scope.mode=="new"){
			$navigate.go("assets/" + $scope.id,"slide");
		}
		else{

		}*/
		$navigate.back();
	}

	$scope.createAsset=function(){
		if ($scope.mode=="update"){
			
			LocalMyDb.db.update("assets",
				{
					ID:$scope.id
				}
				,function(row)
				{
					row.asset_name=$scope.assetinfo.asset_name;
					row.asset_type=$scope.assetinfo.asset_type;
					row.asset_value=$scope.assetinfo.asset_value;
					return row;
				}
			);
			LocalMyDb.db.commit();
			$navigate.back();
		}else{
			var currentDate = new Date();
			var date = currentDate.getDate() + "/" + (currentDate.getMonth()+1) + "/" + currentDate.getFullYear();
			LocalMyDb.db.insert("assets",
				{
					asset_name:$scope.assetinfo.asset_name,
					asset_type:$scope.assetinfo.asset_type,
					asset_value:$scope.assetinfo.asset_value,
					vault_id:$scope.id,
					created_date:date,
					status:"fine"

				}
			);
			LocalMyDb.db.commit();
			var assets = LocalMyDb.db.query("assets");
			var lastInsertedId = _.last(assets).ID;
			
			//alert(lastInsertedId);
			$navigate.go("asset_pricing/" + lastInsertedId +"/new","slide");
		}
		//CacheServiceApp.create
	}
});
$app.controller('AssetController', function($scope, $http,LocalMyDb,SearchBarHandler,CacheServiceApp,MethodHandler,$routeParams,$navigate){

	var assets_original=[];
	SearchBarHandler.enable=true;
	SearchBarHandler.searchText = "";
	SearchBarHandler.func=function(text){
		if (text==""){
			$scope.assets=assets_original;
			return;
		}
		console.log(text);
		$scope.assets = _.filter(assets_original,function(row){
			console.log(row.asset_name);
			return row.asset_name.indexOf(text)>-1;
		});
	}

	var  lastButton = null;var editing=false;
	$scope.assets=[];
	MethodHandler.text="New";
	MethodHandler.show=true;
	MethodHandler.icon_class ="glyphicon glyphicon-chevron-right";
	MethodHandler.func=function(){
		console.log("hey u!!!");
		$navigate.go("new_assets/" + $scope.vaultid + "/new","slide");
	};
	$scope.showDelete=function(o){
		$scope.hideDelete();
		lastButton = $(o);
		lastButton.removeClass('hideDeleteButton');
		lastButton.addClass('showDeleteButton');
	}
	$scope.hideDelete=function(){
		if (lastButton!=null){
			lastButton.removeClass('showDeleteButton');
			lastButton.addClass('hideDeleteButton');
		}
	}
  	$scope.showAsset=function(id){
  		if (!editing)
  			$navigate.go("view_asset/" + id,"slide");
  	}
  	$scope.deleteAsset=function(id){
  		editing=true;
  		if (LocalMyDb.db.query("billing_plans",{asset_id:id+""}).length>0) {
			alert("Cannot Delete this asset!");
  		
		}
		else{
			LocalMyDb.db.deleteRows("assets",{ID:id});
			getAssets();

		}
  		setTimeout(function(){
			editing=false;	
		},1000);
  	}
  	$scope.vaultid=0;
  	$scope.asset_type = null;
	if ($routeParams.mode==undefined){
		
		if ($routeParams.vault_id==null || $routeParams.vault_id==undefined || $routeParams.vault_id<1){
			$navigate.go("vaults","slide");
		}
		else{
			$scope.vaultid = $routeParams.vault_id;
		}
		
		$scope.getAsset=function(assetid){

		}
		
	  	getAssets();
	}
	else{
		$scope.asset_type = $routeParams.asset_type;
		if ($scope.asset_type!=null && $scope.asset_type!=undefined){

			$scope.assets = LocalMyDb.db.query("assets",{asset_type:$scope.asset_type});

		}
		MethodHandler.text="Vaults";
		MethodHandler.show=true;
		MethodHandler.icon_class ="glyphicon glyphicon-chevron-right";
		MethodHandler.func=function(){
			
			$navigate.go("vaults","slide");
		};
	}
	function getAssets(){
  		//get user id
  		
  		$scope.assets = LocalMyDb.db.query("assets",{vault_id:$scope.vaultid});
		assets_original	 = $scope.assets;
  	}
	
});
$app.controller('VaultInfoController', function($scope,SearchBarHandler, $http,LocalMyDb,CacheServiceApp,MethodHandler,$navigate,$routeParams){
	SearchBarHandler.enable=false;
	MethodHandler.text="Back";MethodHandler.icon_class ="glyphicon glyphicon-chevron-left";
  	MethodHandler.func=function(){
  		$navigate.go("vaults","slide");
  	};
	MethodHandler.show=true;

	$scope.vault={name:"",password:"",single_sign:false};
	

	$scope.id=0;
	$scope.mode="new";
	if ($routeParams.mode==null || $routeParams.id==null || $routeParams.id==undefined ){
		$navigate.go("vaults","slide");
	}
	else{
		$scope.id = $routeParams.id;
		$scope.mode=$routeParams.mode;
		if ($scope.mode =="update" && $scope.id>0){
			//get the current vault to update
			var v = LocalMyDb.db.query("vaults",{ID:$scope.id})[0];
			if(v!=undefined){

				$scope.vault.name = v.vault_name;
				$scope.vault.password = v.vault_password;
				$scope.vault.single_sign= v.vault_single_sign_check;
				console.log(v);
			}
			else{
				$scope.mode="new";
			}
		}
		else{
			$scope.mode="new";
		}
	}
	$scope.save=function(vault){
		if ($scope.mode=="new"){
			if (LocalMyDb.db.query("vaults",{vault_name:vault.name}).length){
				alert("Vault name is already taken!");
			}
			else{
				var uname=CacheServiceApp.get("login_user");
				if (uname!=undefined){
					var uid = LocalMyDb.db.query("users",{user_name:uname})[0].ID;

					var currentDate = new Date();
					var created = currentDate.getDate() + "/" + (currentDate.getMonth()+1) + "/" + currentDate.getFullYear();
					var affected_row=LocalMyDb.db.insert("vaults",
							{
								user_id:uid,
								vault_name:$scope.vault.name,
								vault_password:$scope.vault.password,
								vault_single_sign_check:$scope.vault.single_sign,
								created_date:created
							}
						);
					LocalMyDb.db.commit();
					if (affected_row>0){
						alert("Save success!");
						$scope.vault.name="";
						$scope.vault.password="";
						$scope.vault.single_sign = false;
						$scope.mode="new";
					}
					else{
						alert("Save fail!");
					}
				}
				
				
			}
		}
		else{
			var affected_row=LocalMyDb.db.update("vaults",{ID:$scope.id},function(row){
				row.vault_name = $scope.vault.name;
				row.vault_password = $scope.vault.password;
				row.vault_single_sign_check = $scope.vault.single_sign;
				return row;
			});
			LocalMyDb.db.commit();
			if (affected_row>0){
				alert("Save success!");
				$scope.vault.name="";
				$scope.vault.password="";
				$scope.vault.single_sign = false;
				$scope.mode="new";
			}
			else{
				alert("Save fail!");
			}
			

		}
	}
});
$app.controller('VaultController', function(SearchBarHandler,$scope, $http,LocalMyDb,CacheServiceApp,MethodHandler,$navigate){
	
	var vaults_original=[];
	SearchBarHandler.enable=true;
	SearchBarHandler.searchText = "";
	SearchBarHandler.func=function(text){
		if (text==""){
			$scope.vaults=vaults_original;
			return;
		}
		console.log(text);
		$scope.vaults = _.filter(vaults_original,function(row){
			return row.vault_name.indexOf(text)>-1;
		});
	}

	var  lastButton = null;
	$scope.vaults=[];
	MethodHandler.text="New";
	MethodHandler.show=true;
	MethodHandler.icon_class ="glyphicon glyphicon-chevron-right";
	MethodHandler.func=function(){$navigate.go("vaults/0/new","slide")};
	$scope.showDelete=function(o){
		$scope.hideDelete();
		lastButton = $(o);
		lastButton.removeClass('hideDeleteButton');
		lastButton.addClass('showDeleteButton');
	}
	$scope.hideDelete=function(){
		if (lastButton!=null){
			lastButton.removeClass('showDeleteButton');
			lastButton.addClass('hideDeleteButton');
		}
	}
	$scope.deleteVault=function(id){
		//check if has used
		editing=true;
		if ($scope.getTotalAssetCount(id)>0){
			alert("Cannot Delete this vault!");
		}
		else{
			LocalMyDb.db.deleteRows("vaults",{ID:id});
			getVaults();

		}
		setTimeout(function(){
			editing=false;	
		},1000);
		 
		
	}
  	function getVaults(){
  		//get user id
  		var name = CacheServiceApp.get("login_user");
		var user = LocalMyDb.db.query("users",{user_name:name})[0];
		if (user!=undefined){
			var id = LocalMyDb.db.query("users",{user_name:name})[0].ID;
			
			$scope.vaults = LocalMyDb.db.query("vaults",{user_id:id});
			vaults_original= $scope.vaults;
		}
  	}

  	getVaults();
  	$scope.showAssets=function(vault){
  		if(!editing)
  			$navigate.go("assets/" + vault.ID,"slide");
  	}
  	$scope.getTotalAssetCount = function(id){
  		var count = LocalMyDb.db.query("assets",{vault_id:id}).length;
  		if (count>99){
  			return count + "+";

  		}
  		else
  			return count;
  	}
  	$scope.getTotalAssetValue = function(id){
  		var value = 0;
  		_.each(LocalMyDb.db.query("assets",{vault_id:id}),function(asset){
  			value += asset.asset_value;
  		});;
  		if (value>9999){
  			return "$ " + value + "+";

  		}
  		else
  			return "$ " + value;
  		
  	}
  	var editing=false;
  	$scope.editVault=function(id){
  		editing=true;
  		$navigate.go("vaults/"+id+"/update","slide");
  	}
});
$app.controller('StartUpController', function($scope,SearchBarHandler, $http,LocalMyDb,$navigate,CacheServiceApp,MethodHandler,$location){
	MethodHandler.text="";
  	MethodHandler.func=null;
  	MethodHandler.icon_class ="glyphicon glyphicon-chevron-right";
	MethodHandler.show=false;
	SearchBarHandler.enable=false;

	$scope.formRegisterDone=false;
	$scope.isformRegisterDone=function(){return $scope.formRegisterDone};
	$scope.formVaultDone=false;
	$scope.isformVaultDone=function(){return $scope.formVaultDone};

	$scope.registerinfo={username:"",password:"",email:"",id:-1};
	$scope.vault={name:"",password:"",single_sign:false};
  	$scope.isLogin = true;
  	$scope.myscroll=null;

  	//LocalMyDb.resetDb();return;
  	//check if already login or just register
	var data = "";
	var mst_data = LocalMyDb.storeFunction.checkNewInstallation();
	if (mst_data==undefined || mst_data==null){
	  	//first time
	  	console.log("first time!");
	}
	else{
		//check startup
		console.log("already register!");
		CacheServiceApp.put("login_user",mst_data.username);
		//alert(CacheServiceApp.get("login_user"));
		console.log(LocalMyDb.storeFunction.exportJSON());
		//$navigate.go("vaults","slide");
		setTimeout(function(){
			$location.path("/vaults");	
		},300);
		
		return;
	}
	//////////debug data users .vaulth
	console.log(LocalMyDb.db.query("users"));
	console.log(LocalMyDb.db.query("vaults"));

	$scope.register=function(reg){
		if (LocalMyDb.db.query("users",{user_name:reg.username}).length){
			alert("Username alread taken!");
		}
		else{
			var currentDate = new Date();
			var joined = currentDate.getDate() + "/" + (currentDate.getMonth()+1) + "/" + currentDate.getFullYear();
			console.log(LocalMyDb.db.insert("users",{user_id:reg.username,user_name:reg.username,password:reg.password,email:reg.email,date_joined:joined}));
			myScroll2.scrollToPage(0,0,200);
			//LocalMyDb.db.commit();
			$scope.registerinfo.id= LocalMyDb.db.query("users",{user_id:reg.username})[0].ID;
			$scope.formRegisterDone=true;
			login_username = reg.username;
		}
	}
	var login_username="";
	$scope.setupVault=function(vault){
		if (LocalMyDb.db.query("vaults",{vault_name:vault.name}).length){
			alert("Vault name is already taken!");
		}
		else{
			//dbAccess.db.createTable("vaults",["vault_id","vault_name","vault_password","vault_single_sign_check","created_date"]);
			var currentDate = new Date();
			var created = currentDate.getDate() + "/" + (currentDate.getMonth()+1) + "/" + currentDate.getFullYear();
			console.log(LocalMyDb.db.insert("vaults",
					{
						user_id:$scope.registerinfo.id,
						vault_name:$scope.vault.name,
						vault_password:$scope.vault.password,
						vault_single_sign_check:$scope.vault.single_sign,
						created_date:created
					}
				));
			$scope.formVaultDone=true;
			
			myScroll2.scrollToPage(0,0,200);
		}
	}

	$scope.finish= function(){
		var currentDate = new Date();
		var created = currentDate.getDate() + "/" + (currentDate.getMonth()+1) + "/" + currentDate.getFullYear();
		//set first installation
		LocalMyDb.db.deleteRows("master_db");
		LocalMyDb.db.insert("master_db",{fresh_installation:true,installation_date:created,username:login_username});
		LocalMyDb.db.commit();
		$navigate.go("login","slide");
	}
});

$app.controller('LoginController', function($scope,SearchBarHandler, $http,LocalMyDb,$navigate,CacheServiceApp,MethodHandler,$location,plus){
	MethodHandler.text="";
  	MethodHandler.func=null;
	MethodHandler.show=false;
	console.log(plus.ui);
	SearchBarHandler.enable=false;
	

	//check if already login or just register
	var data = "";
	var mst_data = LocalMyDb.storeFunction.checkNewInstallation();
	if (mst_data==undefined || mst_data==null){
	  	//first time
	  	console.log("first time!");
	}
	else{
		//check startup
		CacheServiceApp.put("login_user",mst_data.username);
		
		console.log(LocalMyDb.storeFunction.exportJSON());
		setTimeout(function(){
			$location.path("/vaults");	
		},300);
	}

	$scope.logininfo={username:"",password:""};
	$scope.login=function(logininfo){
		var query = LocalMyDb.db.query("users",{user_name:logininfo.username,password:logininfo.password});
		if (query.length>0){
			//login success
			// temporarily navigate to vault
			CacheServiceApp.put("login_user",logininfo.username);
			alert(CacheServiceApp.get("login_user"));
			$navigate.go("vaults","slide");
			console.log("username:" + logininfo.username);
			var currentDate = new Date();
			var created = currentDate.getDate() + "/" + (currentDate.getMonth()+1) + "/" + currentDate.getFullYear();
			LocalMyDb.db.deleteRows("master_db");
			LocalMyDb.db.insert("master_db",{fresh_installation:true,installation_date:created,username:logininfo.username});
			LocalMyDb.db.commit();
		}
		else
		{
			//login fail
			alert("Invalid Username or password!");
		}

	}
});

$app.controller('FileUploaderController', function($scope,FileSystem,SearchBarHandler,MyUploader, $http,LocalMyDb,$navigate,CacheServiceApp,MethodHandler,$location,plus){
	SearchBarHandler.enable=false;
	$scope.selectFile = function(){
		
		$('#fileupload-control').click();
	}
	$scope.selectedFile = null;
	$scope.fileNameChanged=function(that){
		$scope.selectedFile = null;
		if (that.files.length>0){
			var file = that.files[0];
			$scope.selectedFile = file;
			$scope.selectedFile.getSizeMb=function(){
				return $scope.selectedFile.size/(1024*1024);
			}
			$scope.selectedFile.getSizeKb=function(){
				return $scope.selectedFile.size/(1024);
			}
			 console.log(window.URL.createObjectURL($scope.selectedFile));
			$scope.selectedFile.getSize=function(){
				if ($scope.selectedFile.size<1024){
					return $scope.selectedFile.size + " byte";
				}
				else if ($scope.selectedFile.size<1024*1024){
					return Math.round($scope.selectedFile.getSizeKb()*100)/100 + " KB";

				}
				else{
					return Math.round($scope.selectedFile.getSizeMb()*100)/100  + " MB";

				}
			}
			//
			$scope.$apply();
			alert("hey u");
			try{
				StartUpload($scope.selectedFile);
				//FileSystem.readFile($scope.selectedFile.filename,StartUpload,error);
			}
			catch(e){alert(e);}
			$scope.percentage=100;	
		}

		
	}
	function StartUpload(file){

		try{
			var uri= window.URL.createObjectURL($scope.selectedFile);
			alert(uri);
			MyUploader.setOptions('file',$scope.selectedFile.filename,$scope.selectedFile.type);
			MyUploader.setParams({dir:'/server1/',user_id:1});
			MyUploader.init('http://192.168.17.111:8030/upload-files/phonegap/serviceside.php',
				uri,
				successcallback,errorcallback,progresscallback);
		}
		catch(e){alert(e);}
	}
	function error(evt){
		alert("error reading file!" + evt.target.error.code);
	}
	function successcallback(){alert("success -----------------------");}
	function errorcallback(){alert("error -----------------------");}
	function progresscallback(percentage,computable){
		if (computable)
			$scope.percentage=percentage;
		else{
			$scope.percentage+=1;

		}
		$scope.percentage=100;	
	}
	$scope.percentage = 0;
	$scope.getPercentage=function(){
		return $scope.percentage;
	}
});