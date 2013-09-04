/* This is a data bound menu that automatically reads from the routes from the application selected theme creates a navigation menu. */

//http://stackoverflow.com/questions/16881478/how-to-call-a-method-defined-in-an-angularjs-directive
$app.directive('hostLoading', function(){
  return {
    // restrict to an attribute (A = attribute, C = class, M = comment)
    restrict: 'E',
	scope:{
		setShowLoading :"&",
		setHideLoading:"&"
	},
    template:
	'<div class="host-list"><div class="loading {{loadingClass}}"></div><span ng-transclude></span></div>',

    controller: function($scope, $location) {
		$scope.showLoading=function(){
			$scope.loadingClass='';
		}
		$scope.hideLoading=function(){
			$scope.loadingClass="hide";
		}
		$scope.setShowLoading({fnShow: $scope.showLoading});
		$scope.setHideLoading({fnHide: $scope.hideLoading});
    },
	transclude:true,
    //the link method does the work of setting the directive up, things like bindings, jquery calls, etc are done in here
    link:function(scope,elem,attrs,ctrl){
		console.log("why!");
		
	}
  }
});