(function ($) {

   var UDBrains = function () {
      return new UDBrains.fn.init();
   };

   UDBrains.fn = UDBrains.prototype = {

      version: 2.0,

      reportURL: 'http://brains.somethingdead.com/map/collect/',

      surroundings: {
         inside: false,
         position: [],
         map: []
      },

      user: {
         name: "",
         id: 0
      },
      
      characters: {},

      UI: {},
      
      preferences: {
         colorblind: false
      },

      init: function () {
         var udb = this;
         udb.readPrefs();
         $(document).ready(function () {
            if ( $('table.c td:has(input)').length === 0 ) {
               //don't run on pages without a movement map
               return;
            }
            udb.populateSurroundings();
            udb.populateUser();
            udb.updateCharacters();
            udb.sendReport();
            udb.renderUI();
            if (window.document.body.innerHTML.search(/\bdickbutt\b/i) !== -1 ) {
               var dickbutt = $(':contains(dickbutt):last, :contains(Dickbutt):last').last();
               dickbutt.html(dickbutt.html().replace(/dickbutt/i, '<img src="http://seri.ously.net/dickbutt.gif" />'));
            }
         });
         return this;
      },
      
      readPrefs: function () {
         if (localStorage.UDBrainsPrefs) {
            var savedSettings = JSON.parse(localStorage.UDBrainsPrefs);
            this.preferences = $.extend(this.preferences, savedSettings);
         };
      },
      
      setPrefs: function (obj) {
         this.preferences = $.extend(this.preferences, obj);
         localStorage.UDBrainsPrefs = JSON.stringify(this.preferences);
      },

      populateUser: function () {
         var playerInfo = $('.cp .gt');
         $.extend(this.user, {
            name:       playerInfo.find('a[href^=profile]').text(),
            id:         playerInfo.find('a[href^=profile]').attr('href').split('=')[1],
            alive:      playerInfo.text().search(/you are dead/) === -1 ? true : false,
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
               if(udb.isPositionElement(this)) {
                  udb.surroundings.position = udb.surroundings.map[row][udb.surroundings.map[row].length-1];
               }
            });
            // Current position specific data.
            $.extend(udb.surroundings.position, {
               barricades:       udb.getBarricadeLevel(),
               christmasTree:    udb.hasXmasTree()
            });
         });
      },
      
      updateCharacters: function() {
         if (localStorage.characters) {
            this.characters = JSON.parse(localStorage.characters);
         };
         this.characters[this.user.id] = {
            user:       this.user,
            position:   {
               coords: this.surroundings.position.coords
            }
         };
         localStorage.characters = JSON.stringify(this.characters);
      },

      hasXmasTree: function () {
        /*
         A recently-cut fir tree has been propped up in a crude stand. The bar has been decorated with a historical tapestry and a carved pumpkin.
        */
        return ($('.gp .gt').text().search(/recently-cut fir tree|plastic Christmas tree/) !== -1);
      },

      isPositionElement: function (elem) {
         // Position element has input with no form.
         return $(elem).is('td:has(>input)');
      },

      isInside: function () {
         //Check for the leave button to determine if we're inside a building.
         return ($('.gp form[action$=out]').length === 1);
      },

      isOutsideBuilding: function () {
         //Check for the enter button to see if we're outside a building.
         return ($('.gp form[action$=in]').length === 1);
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
         return ( $('.gp .gt sub').length !== 0 );
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
         if (locationRow.index(elem) === 0) {//We are at the left edge of the map.
            xOffset = -1;
            offsetTDIndex = 1;
         }
         var offsetText = locationRow.eq(offsetTDIndex).find('input[type=hidden]').val();
         var offset = this.parseCoords( offsetText );
         return {
            x: offset.x + xOffset,
            y: offset.y
         };
      },

      parseCoords: function (coords) {
         coords = coords.split('-');
         return {
            x: parseInt(coords[0], 10),
            y: parseInt(coords[1], 10)
         };
      },
      
      eachCharacter: function (func) {
         var character;
         for( character in this.characters ) {
            if (this.characters.hasOwnProperty(character)) {
               func(this.characters[character]);
            }
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
            });
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
         if($(elem).is('td:has(.fz)')){
            return parseInt($(elem).find('.fz').text().split(' ')[0], 10);
         } else {
            return 0;
         }
      },

      getBarricadeLevel: function () {
         var reg = /(building|doors to the street|building\'s doors|hole in the fencing) (has|have) been ([^\.]*(secured|barricaded|left wide open))[^\.]*./;
         var barricadeText;
         if (this.isEmptyLot()){
            barricadeText = 'no building';
         } else {
            barricadeText = $('.gp .gt').text().match(reg);
         }
         return this.barricadeLevels[barricadeText ? barricadeText[3] : 0];
      },

      getLocationByCoord: function (locx, locy) {
         var location = false;
         $.each(this.surroundings, function () {
            $.each(this, function () {
               if (this.coords.x === locx && this.coords.y === locy) {
                  location = this;
               }
            });
         });
         return location;
      },

      sendReport: function () {
         //Copy the surroundings object so we can prune some of the data off of it.
         var surroundings = $.extend({}, this.surroundings);
         var udb = this;
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
            success: this.receiveReport()
         });
      },

      receiveReport: function () {
         var udb = this;
         return function (data, status, xhr) {
            udb.report = data;
            $(udb).trigger('ready', [this]);
         };
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
         var module;
         for( module in this.UI ) {
            if (this.UI.hasOwnProperty(module)) {
               this.UI[module].init(this);
            }
         }
      }
   };

   UDBrains.fn.init.prototype = UDBrains.fn;

   UDBrains.UI = UDBrains.fn.UI;

   UDBrains.UI.ordersPane = {

      url: 'http://brains.somethingdead.com/orders/',

      init: function (udb) {
         var coords = udb.surroundings.position.coords;
         var iframe = $('<iframe>').attr('id', 'orders').attr('src', this.url + coords.x + '/' + coords.y + '/?' + new Date().getTime()).css({
            width: '100%',
            height: '200px',
            border: '4px solid #445544'
         });
         var ordersLink = $('<a>').attr('href', '#orders').bind('click', function () {
            localStorage.ordersVisible = $('#orders').toggle().is(':visible');
         }).text('Click here to toggle orders.');
         $('.gp').append(ordersLink);
         $('.gp').append(iframe);
         if (localStorage.ordersVisible === "false") {
            iframe.hide();
         }
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
               if (elem.color_code === "#000000") {
                  $('option[value='+elem.id+']').css({
                     color: '#fff',
                     background: elem.color_code
                  });
               } else {
                  $('option[value='+elem.id+']').css('color', elem.color_code);
               }
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
      /*
         Creates and renders multiple minimaps populated with data about the surrounding area.
      */
      init: function (udb) {
         var coords = udb.surroundings.position.coords;
         this.colorblind = udb.preferences.colorblind;
         var survivorColor = this.generateHeatmapColorizer(1, 15, 6);
         var barricadeColor = this.generateHeatmapColorizer(1, 9, 9);
         var zombieColor = this.generateHeatmapColorizer(1, 15, 6);
         var minimap = this;
         this.maps = {
            targetMap: this.grid(15, 15, coords, 'targets'),
            survivorMap: this.grid(15, 15, coords, 'survivors'),
            barricadeMap: this.grid(15, 15, coords, 'barricades'),
            zombieMap: this.grid(15, 15, coords, 'zombies')
         };
         $(udb).bind('ready', function () {
            udb.report.annotation.forEach(function (data) {
               if (data.survivor_count) {
                  minimap.maps.survivorMap.getTileByCoords(data.x, data.y).css({
                     'background': survivorColor(data.survivor_count)
                  }).addClass('color').attr('title', minimap.createTitleString(data, 'survivor_count', 'survivors'));
               };
               if (data.zombies) {
                  minimap.maps.zombieMap.getTileByCoords(data.x, data.y).css({
                     'background': zombieColor(data.zombies)
                  }).addClass('color').attr('title', minimap.createTitleString(data, 'zombies'));
               };
               if (data.barricades) {
                  minimap.maps.barricadeMap.getTileByCoords(data.x, data.y).css({
                     'background': barricadeColor(data.barricades)
                  }).addClass('color').attr('title', minimap.createTitleString(data, 'barricades'));
               };
            });

            minimap.render();
         });
         this.scrapeTargets(coords);
      },

      grid: function (xsize, ysize, coords, name) {
         return new UDBrains.UI.minimap.grid.fn.init(xsize, ysize, coords, name);
      },

      render: function () {
         var mapPanel = $('<div>').attr('id', 'map-panel').addClass('gt');
         var mapSwitcher = $('<div>').attr('id', 'map-switcher');
         var gridContainer = $('<div>').attr('id', 'map-grids');
         var defaultMap = "#targets-map";
         var map;
         for( gridName in this.maps ) {
            var grid = this.maps[gridName];
            var mapLink = $('<a>').attr('href', '#'+grid.name+'-map').bind('click', function () {
               $('.minimap').hide();
               mapSwitcher.find('a').css({borderColor: '#556655'});
               $(this).css({borderColor: '#BBCCBB'});
               gridID = $(this).attr('href');
               localStorage.lastMinimap = gridID;
               $(gridID).show();
               return false;
            }).text( grid.name );
            mapSwitcher.append(mapLink)
            gridContainer.append(grid.render().hide());
         }
         mapPanel.append(gridContainer);
         mapPanel.append(mapSwitcher);
         if (localStorage.lastMinimap) {
            defaultMap = localStorage.lastMinimap;
         };
         mapPanel.find(defaultMap).show();
         mapSwitcher.find('a[href*='+defaultMap+']').addClass('default');
         this.makePretty(mapPanel);
         $('.cp .gthome').before(mapPanel);
      },

      markTargets: function (targets) {
         // Temporary. Marks target tiles in pink on the targets map
         this.maps.targetMap.getTilesByCoords(targets).forEach(function (tile) {
            tile.css({
               background: "#FF9999"
            });
         });
      },

      makePretty: function (map) {
         // Should be moved into an injected CSS
         map.css({
            overflow: 'hidden'
         })
         map.find('td').css({
            width: '10px',
            height: '10px',
            border: '1px solid #BBCCBB',
            padding: 0,
            lineHeight: '1px',
            fontSize: '12px',
            textAlign: 'center'
         }).filter('.pos.color').css({
            color: '#000'
         });
         map.find('table.minimap').css({
            borderCollapse: 'collapse',
            border: '1px solid #BBCCBB'
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
         map.find('#map-switcher').css({
            'float': 'right'
         }).find('a').css ({
            display: 'block',
            textAlign: 'right',
            borderRight: '4px solid #556655',
            paddingRight: '6px'
         }).filter('.default').css({
            borderColor: "#BBCCBB"
         });
         map.find('#map-grids').css({
            'float': 'left'
         });
      },

      scrapeTargets: function (coords) {
         // Temporary function for marking high-priority targets mentioned on the orders page.
         // UDBrains should be gathering this data instead.
         var minimap = this;
         $.ajax({
            type: 'GET',
            url: 'http://brains.somethingdead.com/orders/' + coords.x + '/' + coords.y + '/?' + new Date().getTime(),
            dataType: 'html',
            success: function (html) {
               var targets = html.match(/\[\d+\,\d+\]/g);
               targets = targets.map(function (targ) {
                  var coords = targ.match(/\[(\d+\,\d+)\]/)[1].split(',');
                  return {
                     x: coords[0],
                     y: coords[1]
                  };
               });
               minimap.markTargets(targets);
            }
         });

      },

      generateHeatmapColorizer: function (min, max, stages) {
         var colorblind = this.colorblind;
         if (colorblind === true){
            var maxhue = 100;
         } else {   
            var maxhue = 200;
         }
         var colorIncrement = maxhue/stages;
         var countIncrement = max/stages;
         return function (count) {
            var hue = maxhue - (Math.floor(count/countIncrement) * colorIncrement);
            if (count < min) {
               return false;
            } else if ( count > max ) {
               hue = 0;
            }
            if (colorblind) {
               return "hsl(0, 0%, "+ hue +"%)";
            } else {
               return "hsl("+hue+", 75%, 65%)";               
            }
         };
      },
      
      createTitleString: function (data, type, name) {
         var name = name ? name : type;
         var title = '['+data.x+','+data.y+'] ' + name + ': ' + data[type];
         if (data.report_age === null) {
            return title;
         };
         var ageString = data.report_age.split(',');
         var timeWords = ['hours', 'minutes', 'seconds'];
         var time = ageString.pop().split(':').map(function (num,i) {
            return [Math.ceil(parseFloat(num, 10)), timeWords[i]];
         });
         var days = ageString.pop();
         title = title + " (";
         if (days) {
            title = title + days;
         } else {
            // Drop any units that are 0;
            time = time.filter(function (i){return i[0] > 0});
            // Drop the least significant data when string is long
            if (time.length > 2) {time.pop()};
            time = time.map(function (i) {return i.join(' ')}).join(', ');
            title = title + time;
         }
         title = title + " ago)";
         return title;
      }

   };

   UDBrains.UI.minimap.grid.prototype = UDBrains.UI.minimap.grid.fn = {
      /*
         Creates grid objects of arbitrary size for displaying information about the area around the player.
      */
      init: function (xsize, ysize, coords, name) {
         this.name = name;
         this.coords = coords;
         this.xsize = xsize;
         this.ysize = ysize;
         this.origin = this.calculateOrigin(xsize,ysize);
         this.tiles = this.createTileArray(xsize,ysize);
         // Mark the player position
         this.getTileByCoords(this.coords.x, this.coords.y).addClass('pos').html('&bull;');
         this.markOOB();
         this.markBorders();
         return this;
      },

      calculateOrigin: function (x, y) {
         // Calculates the coordinates of the top-left tile.
         return {
            x: this.coords.x - Math.floor(x/2),
            y: this.coords.y - Math.floor(y/2)
         };
      },

      createTileArray: function (x, y) {
         var arr = new Array(y);
         var coords = $.extend({}, this.origin);
         var origin = this.origin;
         $.each(arr, function (row) {
            arr[row] = new Array(x);
            $.each(arr[row], function (col) {
               arr[row][col] = $('<td>').data({
                  coords: $.extend({}, coords),
               }).attr('title', '['+coords.x+','+coords.y+']');
               coords.x++;
            });
            coords.x = origin.x;
            coords.y++;
         });
         return arr;
      },

      getTileByCoords: function (x, y) {
         // Takes x and y coordinates and returns a tile.
         var localx = x - this.origin.x;
         var localy = y - this.origin.y;
         if (localx < 0 || localx >= (this.tiles[0].length) ) {
            return false;
         }
         if (localy < 0 || localy >= (this.tiles.length) ) {
            return false;
         }
         return this.tiles[localy][localx];
      },

      getTilesByCoords: function (query) {
         // Takes an array of coordinate objects and returns an array of tiles.
         var tiles = [];
         var grid = this;
         query.forEach(function (coords) {
            var tile = grid.getTileByCoords(coords.x, coords.y);
            if (tile){
               tiles.push(tile);
            }
         });
         return tiles;
      },

      markOOB: function () {
         // Adds a class to any tile that falls outside of Malton.
         this.forEveryTile(function (tile) {
            var coords = tile.data().coords;
            if ( coords.x < 0 || coords.y < 0 || coords.x > 99 || coords.y > 99 ) {
               tile.addClass('oob');
            }
         });
      },

      markBorders: function () {
         // Adds classes to tiles on suburb borders.
         this.forEveryTile(function (tile) {
            var coords = tile.data().coords;
            if ( (coords.x % 10) === 0 ) {
               tile.addClass('xborder');
            }
            if ( (coords.y % 10) === 0 ) {
               tile.addClass('yborder');
            }
         });
      },

      forEveryTile: function (func) {
         // Runs a function once for every tile in the grid.
         this.tiles.forEach(function (row) {
            row.forEach(func);
         });
      },

      render: function () {
         var table = $('<table>').addClass('minimap');
         this.tiles.forEach(function (row) {
            var tr = $('<tr>');
            row.forEach(function (col) {
               tr.append(col);
            });
            table.append(tr);
         });
         table.attr('id', this.name+'-map');
         return table;
      }

   };

   UDBrains.UI.minimap.grid.fn.init.prototype = UDBrains.UI.minimap.grid.fn;


   UDBrains.UI.mibbit = {

       channelURL: 'http://01.chat.mibbit.com/?server=irc.synirc.net&channel=%23urbandead',

       init: function (udb) {
           var header = $('<h2>').attr('id', 'irc-link');
           var link = $('<a>').attr('href', this.channelURL).attr('target', '_blank');
           link.text('Come hang out on IRC!');
           var hide = $('<a>').attr('href','#').css({
              'float': 'right',
              fontSize: '10px'
           }).text('[hide]').bind('click', function () {
              header.hide();
              localStorage.hideIRC = true;
              return false;
           });
           hide.appendTo(header);
           link.appendTo(header);
           if(!localStorage.hideIRC || localStorage.hideIRC !== 'true') {
              header.prependTo('.gp div.gt');
           }
       }

   };
   
   UDBrains.UI.characterAlert = {
      
      collisions: [],
      
      init: function (udb) {

         this.checkCollisions(udb);
         this.render();
      },

      tooClose: function (coord1, coord2) {
         // Test if the two coordinates are within a certain distance.
         var distance = 12;
         return ((coord1.x + distance > coord2.x)  && 
                 (coord1.x - distance < coord2.x)) && 
                ((coord1.y - distance < coord2.y)  && 
                 (coord1.y + distance > coord2.y));  
      },

      combine: function (arr) {
         // Generates an array of all possible combinations of arr.
         var combinations = [];
         var len = arr.length
         for (var i=0; i < arr.length; i++) {
            var item = arr[i];
            var curs = len - 1;
            while(curs != i) {
               combinations.push([item, arr[curs]]);
               curs = curs - 1;
            }
         };
         return combinations;
      },
      
      checkCollisions: function (udb) {
         // Populates this.collisions with any characters that are too close to each other.
         var charAlert = this;
         var charArray = [];
         udb.eachCharacter(function (character) {
            charArray.push(character);
         });
         var combinations = this.combine(charArray);
         this.collisions = combinations.filter(function (elem) {
            return charAlert.tooClose( elem[0].position.coords,  elem[1].position.coords );
         });
      },
      
      render: function () {
         if (this.collisions.length === 0) {
            // Do nothing if there aren't any characters that are too close.
            return;
         };
         var alerts = $('<div>').attr('id', 'characer-alert').addClass('gt');
         alerts.append($('<h4>').text('These characters may be too close:'));
         this.collisions.forEach(function (chars) {
            var text = [ 
               chars[0].user.name,
               ' ['+ chars[0].position.coords.x +','+ chars[0].position.coords.y +']',
               ' and ',
               chars[1].user.name,
               ' ['+ chars[1].position.coords.x +','+ chars[1].position.coords.y +']'
            ].join('');
            var li = $('<li>').append(text);
            alerts.append(li);
         });
         this.style(alerts);
         $('.cp .gthome').before(alerts);
      },

      style: function(alerts) {
         alerts.css({
            fontSize: '12px'
         })
         alerts.find('h4').css({
            fontSize: '13px',
            marginTop: 0
         })
      }
      
   }
   
   UDBrains.UI.treeTracker = {

       sort_func: function(coords) {
           return function(a, b) {
               var a_to_origin = Math.sqrt(Math.pow(a.x - coords.x) + Math.pow(a.y - coords.y));
               var b_to_origin = Math.sqrt(Math.pow(b.x - coords.x) + Math.pow(b.y - coords.y));
               return a_to_origin - b_to_origin;
           };
       },
       
       init: function(udb) {
           var self = this;
           $(udb).bind('ready', function () {
               self.trees = udb.report.trees;
               self.trees.sort(self.sort_func(udb.surroundings.position.coords));
               self.render();
           });
       },
       
       render: function() {
           var panel = $('<div id="tree-panel">').addClass('gt').insertBefore('.gthome');
           $('<p>').text('Christmas Tree Tracker').appendTo(panel);
           var list = $('<ul>').appendTo(panel);
           $.each(this.trees, function (index, data) {
               $('<li>').text('['+ data.x + ', ' + data.y + ']').appendTo(list);
           });
       }
   }

   UDBrains = window.UDBrains = UDBrains();


})(jQuery);