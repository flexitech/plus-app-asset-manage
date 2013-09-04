/* This is a data bound menu that automatically reads from the routes from the application selected theme creates a navigation menu. */
$app.directive('tabbarMenu', function(){
  return {
    // restrict to an attribute (A = attribute, C = class, M = comment)
    restrict: 'AEC',
    template:
	'<div class="menu"><ul><li ng-repeat="route in routes" class="{{route.class}}" hm-tap="$navigate.go(route.path, route.transition)"> <div class="icon"><span>{{ route.title }}</span></div></li></ul></div>',

    controller: function($scope, $location) {
      var routes = settings.theme.routes;
      $scope.routes = [];
		$scope.pageTitle ="";
      //check for top level routes only
      for(var i in routes){
        var route = routes[i];

        if(_.isUndefined(route.path))
          continue;
		$scope.pageTitle = "";
        var segments = route.path.split('/');

        //if is not a top level route, continue
        if(segments.length > 2 && !_.isEmpty(segments[2]))
          continue;
		
        if(angular.isUndefined(route.class)) route.class = '';
		if (route.class.indexOf('media')<0) continue;
        if($location.path() == route.path){
          route.class += ' active';
		  $scope.pageTitle = route.title;
        }else{
          if(angular.isDefined(route.class)){
             route.class = route.class.replace(' active', '');
			 
          }
        }
        
        $scope.routes.push(route);
      }
		 
      $scope.$location = $location;
    },
    replace: true,
    //the link method does the work of setting the directive up, things like bindings, jquery calls, etc are done in here
    link:function(scope,elem,attrs,ctrl){
		
			
				
	}
  }
});