'use strict';
angular.module('ui.layout', []).controller('uiLayoutCtrl', [
  '$scope',
  '$attrs',
  '$element',
  function uiLayoutCtrl($scope, $attrs, $element) {
    //it seems that in 1.3.2 returning from controller is not allowed. it does not add return property to controller
    //adding via this works.
    //return {
    //  opts: angular.extend({}, $scope.$eval($attrs.uiLayout), $scope.$eval($attrs.options)),
    //  element: $element
    //};  
    this.opts = angular.extend({}, $scope.$eval($attrs.uiLayout), $scope.$eval($attrs.options));
    this.element = $element;  
  }
]).directive('uiLayout', [
  '$parse','$window',
  function ($parse,$window) {
	  //We have added ng-show="performReviewFlag" to show/hide split bar as per ERC panel show/hide
    var splitBarElem_htmlTemplate = '<div class="stretch ui-splitbar" ng-show="bottomPanelFlag"></div>';
    return {
      restrict: 'AE',
      compile: function compile(tElement, tAttrs) {
    	  //Custom Code - Start
    	  //Note: Bind resize event which resize north and south part to 50%
    	  //Note: We have done this because we have to set scrollbar for our ERC Grid. We are resetting grid to 50% on resize of window.
    	  angular.element($window).bind('resize',function(){
    		  	var _i, _childens = tElement.children(), _child_len = _childens.length;
    	        var opts = angular.extend({}, $parse(tAttrs.uiLayout)(), $parse(tAttrs.options)());
    	        var isUsingColumnFlow = opts.flow === 'column';    	        
    	        
    	        if (_child_len > 1) {
    	          var flowProperty = isUsingColumnFlow ? 'left' : 'top';
    	          var oppositeFlowProperty = isUsingColumnFlow ? 'right' : 'bottom';
    	          
    	          //Reset North Panel,Split Bar, south
    	          //Note: Set South and splitbar with same top & bottom
    	          angular.element(_childens[0]).css(flowProperty,0 + '%').css(oppositeFlowProperty,50 + '%');
    	          angular.element(_childens[1]).css(flowProperty,50 + '%').css(oppositeFlowProperty, 0+ '%');
    	          angular.element(_childens[2]).css(flowProperty,50 + '%').css(oppositeFlowProperty, 0+ '%');
    	        }
    	  });
    	  //Custom Code - End
        var _i, _childens = tElement.children(), _child_len = _childens.length;
        var opts = angular.extend({}, $parse(tAttrs.uiLayout)(), $parse(tAttrs.options)());
        var isUsingColumnFlow = opts.flow === 'column';
        tElement.addClass('stretch').addClass('ui-layout-' + (opts.flow || 'row'));
        for (_i = 0; _i < _child_len; ++_i) {
          angular.element(_childens[_i]).addClass('stretch');
        }
        if (_child_len > 1) {
          var flowProperty = isUsingColumnFlow ? 'left' : 'top';
          var oppositeFlowProperty = isUsingColumnFlow ? 'right' : 'bottom';
          var step = 100 / _child_len;
          for (_i = 0; _i < _child_len; ++_i) {
            var area = angular.element(_childens[_i]).css(flowProperty, step * _i + '%').css(oppositeFlowProperty, 100 - step * (_i + 1) + '%');
            if (_i < _child_len - 1) {
              var bar = angular.element(splitBarElem_htmlTemplate).css(flowProperty, step * (_i + 1) + '%');
              area.after(bar);
            }
          }
        }
      },
      controller: 'uiLayoutCtrl'
    };
  }
]).directive('uiSplitbar', function () {
  var htmlElement = angular.element(document.body.parentElement);
  return {
    require: '^uiLayout',
    restrict: 'EAC',
    link: function (scope, iElement, iAttrs, parentLayout) {
      var animationFrameRequested, lastX;
      var _cache = {};
      var isUsingColumnFlow = parentLayout.opts.flow === 'column';
      var mouseProperty = isUsingColumnFlow ? 'clientX' : 'clientY';
      var flowProperty = isUsingColumnFlow ? 'left' : 'top';
      var oppositeFlowProperty = isUsingColumnFlow ? 'right' : 'bottom';
      var sizeProperty = isUsingColumnFlow ? 'width' : 'height';
      var barElm = iElement[0];
      function _cached_layout_values() {
        var layout_bb = parentLayout.element[0].getBoundingClientRect();
        var bar_bb = barElm.getBoundingClientRect();
        _cache.time = +new Date();
        _cache.barSize = bar_bb[sizeProperty];
        _cache.layoutSize = layout_bb[sizeProperty];
        _cache.layoutOrigine = layout_bb[flowProperty];
      }
      function _draw() {    	
        var the_pos = (lastX - _cache.layoutOrigine) / _cache.layoutSize * 100;   
        //Broadcast resize of split bar to update ERC grid scroll bar 
        scope.$broadcast('uiSplitbarChanges',(lastX - _cache.layoutOrigine));
        the_pos = Math.min(the_pos, 100 - _cache.barSize / _cache.layoutSize * 100);
        the_pos = Math.max(the_pos, parseInt(barElm.previousElementSibling.style[flowProperty], 10));
        if (barElm.nextElementSibling.nextElementSibling) {
          the_pos = Math.min(the_pos, parseInt(barElm.nextElementSibling.nextElementSibling.style[flowProperty], 10));
        }
        barElm.style[flowProperty] = barElm.nextElementSibling.style[flowProperty] = the_pos + '%';
        barElm.previousElementSibling.style[oppositeFlowProperty] = 100 - the_pos + '%';
        animationFrameRequested = null;
      }
      function _resize(mouseEvent) {
        lastX = mouseEvent[mouseProperty] || mouseEvent.originalEvent[mouseProperty];
        if (animationFrameRequested) {
          window.cancelAnimationFrame(animationFrameRequested);
        }
        if (!_cache.time || +new Date() > _cache.time + 1000) {
          _cached_layout_values();
        }
        animationFrameRequested = window.requestAnimationFrame(_draw);
      }
      iElement.on('mousedown touchstart', function (e) {
        e.preventDefault();
        e.stopPropagation();
        htmlElement.on('mousemove touchmove', _resize);
        return false;
      });
      htmlElement.on('mouseup touchend', function () {
        htmlElement.off('mousemove touchmove');
      });
    }
  };
});
var lastTime = 0;
var vendors = [
    'ms',
    'moz',
    'webkit',
    'o'
  ];
for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
  window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
  window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
}
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = function (callback) {
    var currTime = new Date().getTime();
    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
    var id = window.setTimeout(function () {
        callback(currTime + timeToCall);
      }, timeToCall);
    lastTime = currTime + timeToCall;
    return id;
  };
}
if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = function (id) {
    clearTimeout(id);
  };
}