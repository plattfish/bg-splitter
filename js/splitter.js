angular.module('bgDirectives', [])
    .directive('bgSplitter', function () {
      return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
          orientation: '@',
          position: '=?'
        },
        template: '<div class="split-panes {{orientation}}" ng-transclude></div>',
        controller: ['$scope', function ($scope) {
          $scope.panes = [];
          $scope.position = angular.isDefined($scope.position) ? $scope.position : 0.5;
          this.addPane = function (pane) {
            if ($scope.panes.length > 1)
              throw 'splitters can only have two panes';
            $scope.panes.push(pane);
            return $scope.panes.length;
          };
        }],
        link: function (scope, element, attrs) {
          var handler = angular.element('<div class="split-handler"></div>');
          var pane1 = scope.panes[0];
          var pane2 = scope.panes[1];
          var vertical = scope.orientation == 'vertical';
          var pane1Min = pane1.minSize || 0;
          var pane2Min = pane2.minSize || 0;
          var drag = false;

          pane1.elem.after(handler);

          function refreshVertical() {
            var bounds = element[0].getBoundingClientRect();
            var height = bounds.bottom - bounds.top;
            var pos;
            if (scope.position <= 1) {
              pos = (height * scope.position) - bounds.top;
            } else {
              pos = scope.position - bounds.top;
            }
            console.log('refreshVertical pos: ', pos);
            if (pos < pane1Min) return;
            if (height - pos < pane2Min) return;
            handler.css('top', pos + 'px');
            pane1.elem.css('height', pos + 'px');
            pane2.elem.css('top', pos + 'px');
          }

          function refreshHorizontal() {
            var bounds = element[0].getBoundingClientRect();
            var width = bounds.right - bounds.left;
            var pos;
            if (scope.position <= 1) {
              pos = (width * scope.position) - bounds.left;
            } else {
              pos = scope.position - bounds.left;
            }
            if (pos < pane1Min) return;
            if (width - pos < pane2Min) return;
            handler.css('left', pos + 'px');
            pane1.elem.css('width', pos + 'px');
            pane2.elem.css('left', pos + 'px');
          }

          function refresh() {
            if (pane1 && pane2) {
              var bounds = element[0].getBoundingClientRect();
              var height = bounds.bottom - bounds.top;
              var width = bounds.right - bounds.left;
              if (pane1.visible && pane2.visible) {
                // both are visible
                pane1.elem.removeClass('hide');
                pane2.elem.removeClass('hide');
                if (vertical) {
                  refreshVertical();
                } else {
                  refreshHorizontal();
                }
              } else if (pane1.visible) {
                // first is visible
                console.log('### show only first');
                pane1.elem.removeClass('hide');
                pane2.elem.addClass('hide');
                if (vertical) {
                  //handler.css('top', 0);
                  pane1.elem.css('height', height + 'px');
                } else {
                  pane1.elem.css('width', width + 'px');
                }
              } else if (pane2.visible) {
                // second is visible
                console.log('### show only second');
                pane2.elem.removeClass('hide');
                pane1.elem.addClass('hide');
                if (vertical) {
                  //handler.css('top', 0);
                  pane2.elem.css('top', 0);
                } else {
                  pane2.elem.css('left', 0);
                }
              } else {
                // both are hidden
                pane1.elem.addClass('hide');
                pane2.elem.addClass('hide');
              }
            }
          }

          element.bind('mousemove', function (ev) {
            if (!drag) return;
            if (vertical) {
              scope.position = Math.max(2, ev.clientY);
              refreshVertical();
            } else {
              scope.position = Math.max(2, ev.clientX);
              refreshHorizontal();
            }
          });

          handler.bind('mousedown', function (ev) {
            ev.preventDefault();
            drag = true;
          });

          angular.element(document).bind('mouseup', function (ev) {
            drag = false;
          });

          scope.$on('PANE_VISIBILITY', function () {
            console.log('VISIBILITY HAS CHANGED');
            refresh();
          });
        }
      };
    })
    .directive('bgPane', function () {
      return {
        restrict: 'E',
        require: '^bgSplitter',
        replace: true,
        transclude: true,
        scope: {
          minSize: '=',
          visible: '=?'
        },
        template: '<div class="split-pane{{index}}" ng-transclude></div>',
        link: function (scope, element, attrs, bgSplitterCtrl) {
          scope.elem = element;
          scope.index = bgSplitterCtrl.addPane(scope);
          scope.visible = angular.isDefined(scope.visible) ? scope.visible : true;
          scope.$watch('visible', function () {
            scope.$emit('PANE_VISIBILITY');
          });
        }
      };
    });
