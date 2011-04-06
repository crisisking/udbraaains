(function ($) {

   var UDBrains = function () {
      return new UDBrains.fn.init();
   }

   UDBrains.fn = UDBrains.prototype = {
      version: 2.0,
      reportURL: 'http://localhost:8989/',
      surroundings: {
         inside: false,
         position: [],
         map: [],
      },
      user: {
         name: "",
         id: 0
      },
      UI: {},
      init: function () {
         var udb = this;
         $(document).ready(function () {
            udb.populateSurroundings();
            udb.populateUser();
            //udb.sendReport();
            $(udb).trigger('ready', [this]);
            udb.renderUI();
         });
         return this;
      },
      
      populateUser: function () {
         var playerInfo = $('.cp .gt');
         $.extend(this.user, {
            name:       playerInfo.find('a[href^=profile]').text(),
            id:         playerInfo.find('a[href^=profile]').attr('href').split('=')[1],
            alive:      playerInfo.text().search(/you are dead/) == -1 ? true : false,
            health:     playerInfo.text().match(/You have (\d+) Hit Points?/)[1],
            ap:         playerInfo.text().match(/You have (\d+) Action Points?/)[1],
            experience: playerInfo.text().match(/and (\d+) Experience Points?/)[1],
            inventory:  []
         });
         var udb = this;
         $('select[name=drop] option[value!=""]').each(function () {
            udb.user.inventory.push({
               id:   $(this).val(),
               name: $(this).text()
            });
         });
         
         
      },

      populateSurroundings: function () {
         var udb = this;
         this.surroundings.inside = this.isInside();
         $('table.c tr:has(td.b)').each(function (row) {
            udb.surroundings.map.push([]);
            $(this).find('td.b').each(function (col) {
               udb.surroundings.map[row].push({
                  element:          this,
                  coords:           udb.getCoordsFromMapTile(this),
                  zombies:          udb.getZombieCountFromMapTile(this),
                  survivors:        udb.getSurvivorsFromMapTile(this),
                  ruined:           udb.isMapTileRuined(this),
                  illuminated:      udb.isMapTileLit(this)
               });
               // Note the coordinates of our position in relation to surroundings.
               if(udb.isPositionElement(this))
                  udb.surroundings.position = udb.surroundings.map[row][udb.surroundings.map[row].length-1];
            });
            // Current position specific data.
            $.extend(udb.surroundings.position, {
               barricades: udb.getBarricadeLevel()
            });
         });
      },

      isPositionElement: function (elem) {
         // Position element has input with no form.
         return $(elem).is('td:has(>input)');
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
      
      isMapTileRuined: function (elem) {
         //.mr = ruined or inside dark
         if(this.isPositionElement(elem)){
            return false;//fucking special cases
         } else {
            return $(elem).find('input[type=submit]').hasClass('mr');
         }
      },
      
      isMapTileLit: function (elem) {
         //.ml = lit tile
         //.mrl = ruined + powered
         var button = $(elem).find('input[type=submit]');
         return ( button.hasClass('ml') || button.hasClass('mrl') );
      },
      
      isHPDataAvailable: function () {
         return ( $('.gp .gt sub').length != 0 );
      },

      getCoordsFromMapTile: function (elem) {
         // Parse out the coordinates for the provided tile.
         var coords;
         if (this.isPositionElement(elem)) {
            // Player position has to be calculated from a nearby tile.
            coords = this.calculatePositionCoords(elem);
         } else {
            coords = this.parseCoords($(elem).find('input[type=hidden]').val());
         }
         return coords;
      },
      
      calculatePositionCoords: function (elem) {
         var locationTD = $('table.c td:has(>input)'); //Location TD always has an input without a form.
         var locationRow = locationTD.parent().find('td');
         var xOffset = 1;
         var offsetTDIndex = 0;
         if (locationRow.index(elem) == 0) {//We are at the left edge of the map.
            xOffset = -1;
            offsetTDIndex = 1;
         }
         var offset = this.parseCoords(
            // Get the coordinates of the tile to our left/right
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


      getSurvivorsFromMapTile: function (elem) {
         //Returns an array of objects with survivor names and ids.
         var survivors = [];
         var survivorLinks = $(elem).find('a[href^=profile]');
         if (this.isPositionElement(elem)) {
            // If the query is for our current position we can provide a full list.
            survivorLinks = $('.gp .gt a');
         }
         var udb = this;
         survivorLinks.each(function (i) {
            survivors.push({
               name: $(this).text(),
               id:   $(this).attr('href').split('=')[1]
            })
            if (udb.isPositionElement(elem) && udb.isHPDataAvailable()) {
               survivors[i].hp = udb.getHPDataForSurvivor(survivors[i]);
            }
         });
         return survivors;
      },
      
      getHPDataForSurvivor: function (survivor) {
         var reg = new RegExp( survivor.name + "\\s\\((\\d+)HP\\)" );
         return $('.gp .gt').text().match(reg)[1];
      },

      getZombieCountFromMapTile: function (elem) {
         if($(elem).is('td:has(.fz)'))
            return parseInt($(elem).find('.fz').text().split(' ')[0], 10);
         else
            return 0;
      },
      
      getBarricadeLevel: function () {
         var reg = /The (building|doors to the street|building\'s doors) (has|have) been ([^\.]*(secured|barricaded|left wide open))[^\.]*./;
         if (this.isEmptyLot())
            var barricadeText = 'no building';
         else
            var barricadeText = $('.gp .gt').text().match(reg)[3];
         return this.barricadeLevels[barricadeText];
      },

      getLocationByCoord: function (locx, locy) {
         var location = false;
         $.each(this.surroundings, function () {
            $.each(this, function () {
               if (this.coords.x == locx && this.coords.y == locy)
                  location = this;
            });
         });
         return location;
      },

      sendReport: function () {
         $.ajax({
            type: "POST",
            url: this.reportURL,
            //data: {data: JSON.stringify({user: this.user, surroundings: this.surroundings})},
            dataType: 'json',
            success: this.receiveData
         });
      },
      
      receiveData: function (data, status, xhr) {
         //placeholder
         console.log('xhr');
      },

      barricadeLevels: {
         'no building':                      0,
         'left wide open' :                  1,
         'secured' :                         2,
         'loosely barricaded' :              3,
         'lightly barricaded' :              4,
         'quite strongly barricaded' :       5,
         'very strongly barricaded' :        6,
         'heavily barricaded' :              7,
         'very heavily barricaded' :         8,
         'extremely heavily barricaded' :    9
      },
      
      renderUI: function () {
         for( ext in this.UI ) {
            this.UI[ext].init(this);
         }
      }

   }

   UDBrains.fn.init.prototype = UDBrains.fn;

   UDBrains = window.UDBrains = UDBrains();
   
   
   UDBrains.UI.ordersPane = {
      url: 'http://brains.somethingdead.com/orders/',
      init: function (udb) {
         this.url = this.url
         var iframe = $('<iframe>').attr('id', 'orders').attr('src', this.url).css({
            width: '100%',
            height: '200px',
            border: '4px solid #445544'
         });
         var ordersLink = $('<a>').attr('href', '#orders').bind('click', function () {            
            localStorage.ordersVisible = $('#orders').toggle().is(':visible');
         }).text('Click here to toggle orders.');
         $('.gp').append(ordersLink);
         $('.gp').append(iframe);
         if (localStorage.ordersVisible == "false")
            iframe.hide();
         
      }
   }
   
   UDBrains.UI.colorNames = {
      init: function (udb) {
          var profile_links = $('div.gt a[href^=profile]'),
              ids = [];
          
          profile_links.each(function (index, element) {
              ids.push(element.attr('href').text().split('=')[1]);
          });
          
          $.post('http://brains.somethingdead.com/names/colors/', {players:ids}, function (data) {
              $.each(data, function (index, elem) {
                 $('a[href="profile.cgi?id=' + elem.id + '"]').css('color', elem.color_code); 
              });
          }, 'json');

      } 
   }


})(jQuery);