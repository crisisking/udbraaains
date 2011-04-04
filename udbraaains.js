(function ($) {

      var UDBrains = function () {
         return new UDBrains.fn.init();
      }

      UDBrains.fn = UDBrains.prototype = {
         version: 2.0,
         reportUrl: 'http://old.somethingdead.com/udb',
         barricadeLevels: {
                          'left wide open' : 1,
                                 'secured' : 2,
                      'loosely barricaded' : 3,
                      'lightly barricaded' : 4,
               'quite strongly barricaded' : 5,
                'very strongly barricaded' : 6,
                      'heavily barricaded' : 7,
                 'very heavily barricaded' : 8,
            'extremely heavily barricaded' : 9
      	},
      	surroundings: [[],[],[]],
      	position: [],
         init: function () {
            var udb = this;
            $(document).ready(function () {
               udb.populateSurroundings();
               udb.user = {
                  name: $('.cp .gt a[href^=profile]').text(),
                    id: $('.cp .gt a[href^=profile]').attr('href').split('=')[1]
               };
            });            
            return this;
         },
         
         populateSurroundings: function () {
            var udb = this;
            
            $('table.c tr:has(td.b)').each(function (row) {
               $(this).find('td.b').each(function (col) {
                  udb.surroundings[row].push({
                       element: this,
                        coords: udb.getCoordsFromElement(this),
                       zombies: udb.getZombieCountFromElement(this),
                     survivors: udb.getSurvivorsFromElement(this),
                     ruinLevel: udb.getRuinLevelFromElement(this)
                  });
                  // Note the coordinates of our position in relation to surroundings.
                  if(udb.isPositionElement(this))
                     udb.position = udb.surroundings[row][udb.surroundings[row].length-1];
               });
            });
         },
         
         isPositionElement: function (elem) {
            return $(elem).is('td:has(>input)');
         },
         
         getCoordsFromElement: function (elem) {
            var coords;
            if (this.isPositionElement(elem)) {
               coords = this.calculatePositionCoords();
            } else {
               coords = this.parseCoords($(elem).find('input[type=hidden]').val());
            }
            return coords;
         },
         
         getSurvivorsFromElement: function (elem) {
            //Returns an array of objects with survivor names and ids.
            var survivors = [];
            var survivorLinks = $(elem).find('a[href^=profile]');
            if (this.isPositionElement(elem)) {
               // If the query is for our current position we can provide a full list.
               survivorLinks = $('.gp .gt a');
            } 
            survivorLinks.each(function () {
               survivors.push({
                  name: $(this).text(),
                    id: $(this).attr('href').split('=')[1]
               })
            });               
            return survivors;
         },
         
         getZombieCountFromElement: function (elem) {
            if($(elem).is('td:has(.fz)'))
               return parseInt($(elem).find('.fz').text().split(' ')[0], 10);
            else
               return 0;
         },
         
         getRuinLevelFromElement: function (elem) {            
            var ruinClasses = {
               'mr': 1,
               'ml': 2 //Building is ruined.
            };
            if($(elem).is('td:has(.mr)'))
               return ruinClasses['mr'];
            else if($(elem).is('td:has(.ml)'))
               return ruinClasses['ml'];
            else
               return 0;
         },
         
         calculatePositionCoords: function (row,col) {
            var locationTD = $('table.c td:has(>input)'); //Location TD always has an input without a form.
            var locationRow = locationTD.parent().find('td');
            var xOffset = 1;
            var offsetTDIndex = 0;
            if (col == 0) {//We are at the left edge of the map.
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
         
         isInside: function () {
            //Check for the leave button to determine if we're inside a building.
            return ($('.gp form[action$=out]').length == 1);
         },
         
         isOutsideBuilding: function () {
            //Check for the enter button to see if we're outside a building.
            return ($('.gp form[action$=in]').length == 1);
         },
         
         isEmptyLot: function () {
            //Returns true if current tile is empty lot
            return (!this.isInside() && !this.isOutsideBuilding());
         },
         
         getPositionType: function () {
            if (this.isInside())
               return 3;
            else if (this.isOutsideBuilding())
               return 2;
            else
               return 1;
         },
         
         getBarricadeLevel: function () {
            var reg = /The (building|doors to the street) (has|have) been ([^\.]*(secured|barricaded|left wide open))./;
            var barricadeText = $('.gp .gt').text().match(reg)[3];
            return this.barricadeLevels[barricadeText];
         },
         
         generateReport: function () {
            var qs = [];
            var post = {};
            var positionCoords = [this.position.coords.x,this.position.coords.y].join('');
            var survivors = [];
            var user = [
                           this.user.id,
                           this.version,
                           positionCoords,
                           this.getPositionType()
                       ].join(':');
            
            // Start with information on current position.
            var data = [[positionCoords,1,this.getBarricadeLevel()].join(':')];
            
            // Zombie and survivor levels only sent when inside
            if (this.isInside()) {
               data.push([positionCoords,3,this.position.zombies].join(':'));
               data.push([positionCoords,5,this.position.survivors.length].join(':'));
            };
            
            // Collect surroundings info
            $.each(this.surroundings, function () {
               $.each(this, function () {
                  var coords = [this.coords.x,this.coords.y].join('');
                  data.push([coords,4,this.ruinLevel].join(':'));
                  qs.push(coords);                  
               });
            });
            
            // Create an array of survivor IDs
            $.each(this.position.survivors, function () {
               survivors.push(this.id);
            });
            
            // Collect the post data
            post.user = user;
            post.data = data.join('|');
            post.survivors = survivors.join('|');            
            
            return {
                 qs: '?' + qs.join('&'),
               post: post               
            }
         },
         
         sendReport: function () {
            var data = this.generateReport();
            var udb = this;
            xhr = new XMLHttpRequest();
            xhr.open('POST', this.reportUrl + data.qs, true);
            xhr.onreadystatechange = function () {
            	if (xhr.readyState == 4) {
            		udb.receiveData(xhr);
            	}
            }
            xhr.setRequestHeader("Accept", "text/html");
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

            xhr.send($.param(data.post));
         },
         receiveData: function (xhr) {
            console.log(xhr);
         },
         render: function () {
            
         }

      }

      UDBrains.fn.init.prototype = UDBrains.fn;

      window.UDBrains = UDBrains();         

   
})(jQuery);