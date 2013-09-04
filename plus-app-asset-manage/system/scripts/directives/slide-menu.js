/* This is a data bound menu that automatically reads from the routes from the application selected theme creates a navigation menu. */
$app.directive('slideMenu', function(){
  return {
    // restrict to an attribute (A = attribute, C = class, M = comment)
    restrict: 'AEC',
    template:
	'<div><button id="show-menu-button" class=" btn nav-show-menu label label-primary">Menu</button>'+
		'<div class="navigation-vertical panel panel-default">'+
			'<div class="panel-heading">Menu</div>'+
			'<div class="panel-body">'+
				'<div id="panel-menu-wrapper" >' +
				'<div id="scroller" style="position:absolute;width:100%;">' +
					'<div class="panel panel-primary" style="margin-top:10px;">'+
						'<div class="panel-heading" style="position:relative">Menu <span style="right:5px;position:absolute;top:3px;"><button id="hide-menu-button" class="btn">Back</button></span></div>'+
						'<div class="panel-body link-panel">'+
							'<div class="list-group " ng-repeat="route in routes">'+
							  '<a hm-tap="$navigate.go(route.path, route.transition)" class="list-group-item {{route.class}}">'+
								'{{ route.title }}'+
							  '</a>'+
							'</div>'+
						'</div>	'+
					'</div>'+
				'</div>'+
			'</div>'+
		'	</div>'+
			
		'</div></div>',
//	'<ul class="nav"><li class="{{route.class}}" ng-repeat="route in routes"><a hm-tap="$navigate.go(route.path, route.transition)">{{ route.title }}</a></li></ul>',
    controller: function($scope, $location) {
      var routes = settings.theme.routes;
      $scope.routes = [];

      //check for top level routes only
      for(var i in routes){
        var route = routes[i];

        if(_.isUndefined(route.path))
          continue;

        var segments = route.path.split('/');

        //if is not a top level route, continue
        if(segments.length > 2 && !_.isEmpty(segments[2]))
          continue;

        if(angular.isUndefined(route.class)) route.class = '';
		if(angular.isUndefined(route.aClass)) route.aClass = '';

        if($location.path() == route.path){
          route.class += ' active';
		  route.aClass= ' active';
        }else{
          if(angular.isDefined(route.class)){
             route.class = route.class.replace(' active', '');
			 route.aClass= route.class.replace(' active', '');
          }
        }
        
        $scope.routes.push(route);
      }

      $scope.$location = $location;
    },
    replace: true,
    //the link method does the work of setting the directive up, things like bindings, jquery calls, etc are done in here
    link:function(scope,elem,attrs,ctrl){
		elem.find("#show-menu-button").click(function(){
			elem.find(".navigation-vertical").addClass("nav-in");
			elem.find("#show-menu-button").hide();
		});
		elem.find("#hide-menu-button").click(function(){
			elem.find(".navigation-vertical").removeClass("nav-in");
			elem.find("#show-menu-button").show();
		});
		console.log(elem.find('#panel-menu-wrapper')[0]);
		var myScroll = new iScroll(elem.find('#panel-menu-wrapper')[0],{useObject:true});
		setTimeout(function(){myScroll.refresh();},1000);
			/*elem.find('.fileinput-button').click(function(){
			
				elem.find('.fileinput-button input[type=file]').click();
			});*/
			
				
	}
  }
});