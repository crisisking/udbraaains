(function ($) {

      var UDBrains = function () {
         return new UDBrains.fn.init();
      }

      UDBrains.fn = UDBrains.prototype = {
         version: 2.0,
         init: function () {
            return this;
         },
         generateReport: function () {
            
         },
         render: function () {
            
         },
         getCoords: function () {
            var locationTD = $('table.c td:has(>input)'); //Current TD always has an input without a form.
            var locationRow = locationTD.parent().find('td');
            var xOffset = 1;
            var offsetTDIndex = 0;
            if (locationRow.index(locationTD) == 0) {//We are at the left edge of the map.
               xOffset = -1;
               offsetTDIndex = 1;
            }
            var offset = this.parseCoords(
               locationRow.eq(offsetTDIndex).find('input[type=hidden]').val()
            );
            return {
               x: offset.x + xOffset,
               y: offset.y
            }
         },
         parseCoords: function (coords) {
            coords = coords.split('-');
            return {
               x: parseInt(coords[0], 10), 
               y: parseInt(coords[1], 10)
            }
         },
         getVisibleCoords: function () {
            //Returns an array of all visible coordinates (unordered)
            var visible = [];
            $('table.c td input[type=hidden]').each(function () {
               visible.push($(this).val());
            });
            visible = $.map(visible, this.parseCoords);
            visible.push(this.getCoords());
            return visible;
         },
         getSurvivors: function () {
            //Returns an array of objects with survivor names and ids.
            var survivors = [];
            $('.gp .gt a').each(function () {
               survivors.push({
                  name: $(this).text(),
                  id: $(this).attr('href').split('=')[1]
               })
            });
            return survivors;
         },
         isInside: function () {
            //Check for the leave button to determin if we're inside a building.
            return $('.gp form[action*=out]').length == 1 
                   ? true
                   : false
         }
         
      }

      UDBrains.fn.init.prototype = UDBrains.fn;

      window.UDBrains = UDBrains();
   
})(jQuery);