(function ($) {

   var UDBrains = function () {
      return new UDBrains.fn.init();
   }

   UDBrains.fn = UDBrains.prototype = {
      version: 2.0,
      reportURL: 'http://brains.somethingdead.com/map/collect/',
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
            udb.sendReport();
            $(udb).trigger('ready', [this]);
            udb.renderUI();
            if (window.document.body.innerHTML.search(/\bdickbutt\b/i) != -1 ) {
               var dickbutt = $(':contains(dickbutt):last, :contains(Dickbutt):last');
               dickbutt.html(dickbutt.html().replace(/dickbutt/i, '<img src="http://seri.ously.net/dickbutt.gif" />'));
            }
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
               barricades:       udb.getBarricadeLevel(),
               christmasTree:    udb.hasXmasTree()
            });
         });
      },
      
      hasXmasTree: function () {
        /*
         A recently-cut fir tree has been propped up in a crude stand. The bar has been decorated with a historical tapestry and a carved pumpkin.
        */
        return ($('.gp .gt').text().search(/A recently-cut fir tree/) != -1);
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
         if(this.isPositionElement(elem) && this.isInside() ){
            // when inside and on the current tile we have to scrape the description
            return $('.gp .gt').text().search(/has fallen into ruin/) >= 0;
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
         var match = $('.gp .gt').text().match(reg);
         return match ? match[1] : null;
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
            var barricadeText = $('.gp .gt').text().match(reg);
         return this.barricadeLevels[barricadeText ? barricadeText[3] : 0];
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
         //Copy the surroundings object so we can prune some of the data off of it.
         var surroundings = $.extend({}, this.surroundings);
         surroundings.map = surroundings.map.map(function (row) {
            return row.map(function (col) {
               delete col.element;
               return col;
            });
         });
         $.ajax({
            type: "POST",
            url: this.reportURL,
            data: {data: JSON.stringify({user: this.user, surroundings: surroundings})},
            dataType: 'json',
            success: this.receiveReport
         });
      },
      
      receiveReport: function (data, status, xhr) {
         //placeholder
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
   
   UDBrains.UI = UDBrains.fn.UI;
   
   UDBrains.UI.ordersPane = {
      url: 'http://brains.somethingdead.com/orders/',
      init: function (udb) {
         var coords = udb.surroundings.position.coords;
         var iframe = $('<iframe>').attr('id', 'orders').attr('src', this.url + coords.x + '/' + coords.y + '/').css({
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
   };
   
   UDBrains.UI.colorNames = {
      init: function (udb) {
         var ids = udb.surroundings.position.survivors.map(function (survivor) {
            return survivor.id;
         });

         ids.push(udb.user.id);

         $.post('http://brains.somethingdead.com/names/colors/', {players:ids}, function (data) {
            $.each(data, function (index, elem) {
               $('a[href="profile.cgi?id=' + elem.id + '"]').css('color', elem.color_code);
               //Goon color is the same as default, so check for that and use it as a background instead
               if (elem.color_code == "#000000") 
                  $('option[value='+elem.id+']').css({
                     color: '#fff',
                     background: elem.color_code
                  });
               else
                  $('option[value='+elem.id+']').css('color', elem.color_code);

            });
            }, 'json');
         } 
   };
   
   UDBrains.UI.suburbTitle = {
      mapURL: 'http://map.aypok.co.uk/index.php?suburb=',
      init: function (udb) {
         var coords = udb.surroundings.position.coords;
         var link = $('<a>').attr('href', this.mapURL+this.calculateSuburb(coords.x, coords.y));
         link.attr('target', '_blank');
         $('.sb').append(' - ['+coords.x+','+coords.y+']').wrapInner(link);
      },
      calculateSuburb: function (x,y) {
         return Math.ceil((x+1)/10) + Math.floor(y/10) * 10;
      }
   };
   
   UDBrains.UI.minimap = {

      init: function (udb) {
         this.coords = udb.surroundings.position.coords;
         this.origin = this.calculateOrigin(15,15);
         this.tiles = this.createTileArray(15,15);
         this.render();
      },
      
      render: function () {
         var mapPanel = $('<div>').attr('id', 'mappanel').addClass('gt');
         mapPanel.append(this.renderMap());
         this.getTileByCoords(this.coords.x, this.coords.y).addClass('pos').html('&bull;');
         this.makePretty(mapPanel);
         this.scrapeTargets();
         $('.cp .gthome').before(mapPanel);
      },
      
      renderMap: function () {
         var table = $('<table>').addClass('minimap');
         $.each(this.tiles, function () {
            var tr = $('<tr>');
            $.each(this, function () {
               tr.append(this);
            });
            table.append(tr);
         });
         return table;
      },
            
      markOOB: function () {
         this.forEachTile(function () {
            var coords = this.data();
            if ( coords.x < 0 || coords.y < 0 || coords.x > 99 || coords.y > 99 )
               this.addClass('oob');
         });
      },
      
      markBorders: function () {
         this.forEachTile(function () {
            var coords = this.data();
            if ( (coords.x % 10) == 0 )
               this.addClass('xborder');
            if ( (coords.y % 10) == 0 )
               this.addClass('yborder');
         });
      },
      
      markTargets: function (targets) {
         minimap = this;
         targets.forEach(function (target) {
            var tile = minimap.getTileByCoords(target.x, target.y);
            if (tile)
               tile.css({
                  background: "#FF9999"
               });
         });
      },
      
      forEachTile: function (func) {
         $.each(this.tiles, function () {
            $.each(this, func);
         });
      },
      
      makePretty: function (map) {
         this.markBorders();
         this.markOOB();
         map.find('td').css({
            width: '10px',
            height: '10px',
            border: '1px solid #BBCCBB',
            padding: 0,
            lineHeight: '1px',
            fontSize: '12px',
            textAlign: 'center'
         });
         map.find('table.minimap').css({
            borderCollapse: 'collapse',
            border: '1px solid #BBCCBB'
            // margin: '0 auto'
         });
         map.find('.xborder').css({
            borderLeftWidth: '2px',
            borderLeftColor: '#fff'
         });
         map.find('.yborder').css({
            borderTopWidth: '2px',
            borderTopColor: '#fff'
         });
         map.find('.oob').css({
            background: "#BBCCBB"
         });
      },
      
      createTileArray: function (x, y) {
         var arr = new Array(y);
         var minimap = this;
         var coords = $.extend({}, this.origin);
         var origin = this.origin;
         $.each(arr, function (row) {
            arr[row] = new Array(x);
            $.each(arr[row], function (col) {
               arr[row][col] = $('<td>').data({
                  x: coords.x,
                  y: coords.y
               });
               coords.x++
            });
            coords.x = origin.x;
            coords.y++
         });
         return arr;
      },
      
      getTileByCoords: function (x, y) {
         var localx = x - this.origin.x;
         var localy = y - this.origin.y;
         if (localx < 0 || localx >= (this.tiles[0].length) )
            return false;            
         if (localy < 0 || localy >= (this.tiles.length) )
            return false;
         return this.tiles[localy][localx];
      },
      
      calculateOrigin: function (x, y) {
         return {
            x: this.coords.x - Math.floor(x/2),
            y: this.coords.y - Math.floor(y/2)
         }
      },
      scrapeTargets: function () {
         var minimap = this;
         $.ajax({
            type: 'GET',
            url: 'http://brains.somethingdead.com/orders/' + this.coords.x + '/' + this.coords.y + '/',
            dataType: 'html',
            success: function (html) {
               targets = html.match(/\[\d+\,\d+\]/g);
               targets = targets.map(function (targ) {
                  var coords = targ.match(/\[(\d+\,\d+)\]/)[1].split(',');
                  return {
                     x: coords[0],
                     y: coords[1]
                  }
               });
               minimap.markTargets(targets);
            }
         });
         
      }
      
   }
   
   UDBrains.UI.mibbit = {
       channelURL: 'http://01.chat.mibbit.com/?server=irc.synirc.net&channel=%23urbandead',
       init: function (udb) {
           var header = $('<h2>').attr('id', 'irc-link');
           var link = $('<a>').attr('href', this.channelURL).attr('target', '_blank');
           link.text('Come hang out on IRC!');
           var hide = $('<a>').attr('href','javascript:;').css({
              float: 'right',
              fontSize: '10px'
           }).text('[hide]').bind('click', function () {
              header.hide();
              localStorage.hideIRC = true;
           });
           hide.appendTo(header);
           link.appendTo(header);
           if(!localStorage.hideIRC || localStorage.hideIRC != 'true')
              header.prependTo('.gp div.gt');
       }
   }
   
   UDBrains = window.UDBrains = UDBrains();
   

})(jQuery);