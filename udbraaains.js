(function ($) {

   var UDBrains = function () {
      return new UDBrains.fn.init();
   };

   UDBrains.fn = UDBrains.prototype = {

      version: 2.0,
      
      brainsServer: 'http://brains.somethingdead.com',

      reportPath: '/map/collect/',


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
      
      errors: [],

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
         return ($('.gp form[action$=\\?out]').length === 1);
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
            var txt = $('.gp .gt').text();
            return txt.search(/has fallen into ruin/) >= 0 ||
                   txt.search(/The laboratories have been ruined,/) >= 0 ||
                   txt.search(/The walls are damp and crumbling, with pools of stagnant water gathering across the uneven floor/) >= 0 ||
                   txt.search(/The machinery has been ruined, with dark oil pooling on the concrete floor./) >= 0 ||
                   txt.search(/The lobby has been ruined, and debris trails down the staircases./) >= 0 ||
                   txt.search(/Chairs and tables are strewn across the floor, and there is broken glass everywhere/) >= 0 ||
                   txt.search(/The shops are ruined, broken glass covering the fallen shelves/) >= 0 ||
                   txt.search(/Shelves and racks have been smashed and toppled, with torn books scattered out across the floor/) >= 0;
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
            survivorLinks = $('.gp .gt a[href^=profile]');
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
            url: this.brainsServer + this.reportPath,
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
               try {
                  this.UI[module].init(this);                  
               } catch (e) {
                  this.errors.push({moduleFailed: {name: module, error: e}});
               }
            }
         }
      }
   };

   UDBrains.fn.init.prototype = UDBrains.fn;

   UDBrains.UI = UDBrains.fn.UI;

   UDBrains.UI.ordersPane = {

      url: UDBrains.fn.brainsServer + '/orders/',

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
         min_id = Math.min.apply(Math, ids); // need this before own id
         ids.push(udb.user.id);
         
         $.post(udb.brainsServer + '/names/colors/', {players:ids}, function (data) {
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
         if (min_id) {
            min_id_link = $('a[href="profile.cgi?id=' + min_id + '"]', 'div:.gt');
            if (min_id_link.length) {
               var p = $(document.createElement("p")).
                  append(min_id_link.clone()).
                  append(" has the oldest profile. Maybe you should kill them, like in Logan's run.");

               $('div:.gt','td:.gp').append(p);
            }
         }

      }

   };

   UDBrains.UI.suburbTitle = {

      mapURL: 'http://dssrzs.org/map/location/',

      init: function (udb) {
         var coords = udb.surroundings.position.coords;
         var link = $('<a>').attr('href', this.mapURL + [coords.x, coords.y].join('-'));
         link.attr('target', '_blank');
         $('.sb').append(' - ['+coords.x+','+coords.y+']').wrapInner(link);
      }

   };

   UDBrains.UI.minimap = {
      /*
         Creates and renders multiple minimaps populated with data about the surrounding area.
      */
      
      size: {x: 15, y: 15},
      
      init: function (udb) {
         var coords, colorblind, self;
         self = this;
         this.coords = udb.surroundings.position.coords;
         this.grid.prototype.colorblind = udb.preferences.colorblind;
         this.maps = {

            targets: this.grid(function (tile, data) {
               var targets, rank, title;
               if(data.building_type == null) {return};
               targets = ['ntbg', 'mall', 'hosp', 'pdep'];
               names = ['NT Building', 'Mall', 'Hospital', 'Police Dept.']
               rank = $.inArray(data.building_type, targets);
               if(rank !== -1) {
                  title = this.title(tile, names[rank], '', data.report_age);
                  tile
                     .attr('title', title)
                     .css({background: this.color( targets.length - rank )});
                  if( data.ruined ) {
                     tile.css({background: "#000"});
                  }
                     
               }
            }).heatmap(1, 4, 4),

            survivors: this.grid(function (tile, data) {
               var outdoor_types = ['cprk', 'ceme', 'zoox', 'zooe', 'fexy', 'monu', 'park', 'opns', 'ftgr', 'wast'];
               if ($.inArray(data.building_type, outdoor_types) === -1) {
                  if (data.ruined)
                     tile.css({background: '#000'});
                  else
                     tile.css({background: '#555'});
               }
               if(data.survivor_count === null) { return;  };
               var title = this.title(tile, 'survivors', data.survivor_count, data.inside_age);

               tile.attr('title', title)
               data.survivor_count &&
                  tile.css({background: this.color( data.survivor_count )});
            }).heatmap(1, 15, 5),

            eats: this.grid(function (tile, data) {
               if(data.survivor_count === null || data.barricades === null) {return};
               if ( data.barricades < 5 && data.survivor_count > 0 ) {
                  var title = [data.survivor_count, 'survivors'].join(' ') + ' , ' +
                              [data.barricades, 'barricades'].join(' ');
                  title = this.title(tile, title, '', data.report_age);
                  tile
                     .attr('title', title)
                     .css({background: this.color( data.survivor_count )});
               }
            }).heatmap(1, 15, 5),

            barricades: this.grid(function (tile, data) {
               if(data.barricades === null) {return};
               var title = this.title(tile, 'barricades', data.barricades, data.report_age);
               tile
                  .attr('title', title)
                  .css({background: this.color( data.barricades )});
               if (data.ruined) // barricaded ruined buildings are rare
                  tile.css({background: '#000'});

            }).heatmap(1, 9, 9),

            ruined: this.grid(function (tile, data) {
               var unruinable_types = ['cprk', 'ceme', 'zoox', 'zooe', 'fexy', 'monu', 'park', 'opns', 'ftgr', 'wast']; // Except junkyards
               
               if($.inArray(data.building_type, unruinable_types) !== -1) {
                   return;
               }
               if (data.building_type == 'junk') {                  
                  tile.css({background: '#888800'})
                      .attr('title', 'Junkyard');
               } else if(data.ruined) {
                  tile.css({background: '#000'});
               } else {
                  tile.css({background: '#FF9999'});
               }
            }),
            
            zombies: this.grid(function (tile, data) {
               if(data.zombies === null) {return};
               var title = this.title(tile, 'zombies', data.zombies, data.report_age);
               tile
                  .attr('title', title)
                  .css({background: this.color( data.zombies )});
            }).heatmap(1, 15, 5)

         };
         $(udb).bind('ready', function () {
            udb.report.annotation.forEach(function (data) {
               if (!data.hasOwnProperty('inside_age'))
                  data.inside_age = data.report_age;
               $.each(self.maps, function (name, mmap) {
                  mmap.dataHandler(data);
               });
            });
         });
         this.render();
         this.scrapeTargets();
      },

      grid: function (callback) {
         return new UDBrains.UI.minimap.grid.fn.init(this.size.x, this.size.y, this.coords, callback);
      },

      render: function () {
         var panel, switcher, grids, defaultMap; 
         panel = $('<div>').attr('id', 'map-panel').addClass('gt');
         switcher = $('<div>').attr('id', 'map-switcher');
         grids = $('<div>').attr('id', 'map-grids');
         defaultMap = "#targets-map";
         panel.append(grids);
         panel.append(switcher);
         
         //Render the maps and add them in.
         $.each(this.maps, function (name, grid) {
            grids.append(grid.render().attr('id', name + '-map').hide());
            switcher.append($("<a>")
               .bind('click', function () {
                  var selector;
                  grids.find('.minimap').hide();
                  switcher.find('a').removeClass('active').css({borderColor: '#556655'});
                  localStorage.lastMinimap = selector = $(this).addClass('active').css({borderColor: '#BBCCBB'}).attr('href');
                  grids.find(selector).show();
                  return false;
               })
               .attr('href', '#'+name+'-map')
               .text(name));
         });
         
         // Enable default map.
         if (localStorage.lastMinimap) {
            defaultMap = localStorage.lastMinimap;
         };
         panel.find(defaultMap).show();
         switcher.find('a[href*='+defaultMap+']').addClass('active').css({borderColor: '#BBCCBB'});

         this.style(panel);
         $('.cp .gthome').before(panel);
      },

      style: function (map) {
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
         map.find('.pos').html('&bull;');
      },

      scrapeTargets: function () {
         // Temporary function for marking high-priority targets mentioned on the orders page.
         // UDBrains should be gathering this data instead.
         var coords, minimap;
         coords = this.coords;
         minimap = this;

         $.ajax({
            type: 'GET',
            url: UDBrains.brainsServer + '/orders/' + coords.x + '/' + coords.y + '/?' + new Date().getTime(),
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

      markTargets: function (targets) {
         // Temporary. Marks target tiles in pink on the targets map
         this.maps.targets.getTilesByCoords(targets).forEach(function (tile) {
            tile.css({
               background: "#FF9999"
            });
         });
      },

   };

   UDBrains.UI.minimap.grid.prototype = UDBrains.UI.minimap.grid.fn = {
      /*
         Creates grid objects of arbitrary size for displaying information about the area around the player.
         Takes an optional callback to run when recieving report data. Callback has two arguments, the
         map tile and the report data.
      */
      init: function (xsize, ysize, coords, callback) {
         this.coords = coords;
         this.xsize = xsize;
         this.ysize = ysize;
         this.callback = callback || function (tile, data) {};
         this.setOrigin();
         this.createTiles();
         // Mark the player position
         this.getTileByCoords(this.coords.x, this.coords.y).addClass('pos');
         this.markOOB();
         this.markBorders();
         return this;
      },
      
      dataHandler: function (data) {
         var tile = this.getTileByCoords(data.x, data.y);
         return this.callback(tile, data);
      },
      
      setOrigin: function () {
         // Calculates the coordinates of the top-left tile.
         this.origin = {
            x: this.coords.x - Math.floor(this.xsize/2),
            y: this.coords.y - Math.floor(this.ysize/2)
         };
      },

      createTiles: function () {
         var arr, coords, origin;
         var xsize = this.xsize, ysize = this.ysize;
         arr = new Array(ysize);
         origin = this.origin;
         //Initialize first with jQuery map() since it doesnt skip over arrays with undefined values.
         this.tiles = $.map(arr, function () {
            // .map apparently tries to flatten arrays.
            return [$.map(new Array(xsize), function () { return false })];
         });
         this.map(function (tile, x, y) {
            var coords = {x: x + origin.x, y: y + origin.y};
            return $('<td>')
               .attr('title', '['+coords.x+','+coords.y+']')
               .data({coords: coords});
         });
         
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
         this.each(function (tile) {
            var coords = tile.data().coords;
            if ( coords.x < 0 || coords.y < 0 || coords.x > 99 || coords.y > 99 ) {
               tile.addClass('oob');
            }
         });
      },

      markBorders: function () {
         // Adds classes to tiles on suburb borders.
         this.each(function (tile) {
            var coords = tile.data().coords;
            if ( (coords.x % 10) === 0 ) {
               tile.addClass('xborder');
            }
            if ( (coords.y % 10) === 0 ) {
               tile.addClass('yborder');
            }
         });
      },

      each: function (func) {
         // Runs a function once for every tile in the grid.
         this.tiles.forEach(function (row, y, rows) {
            row.forEach(function (col, x, cols){
               func(col, x, y, rows, cols);
            });
         });
      },
      
      map: function (func) {
         // Replace each tile with the result of a function.
         this.tiles = this.tiles.map(function (row, y, rows) {
            return row.map(function (col, x, cols) {
               return func(col, x, y, rows, cols);
            });
         });
      },

      heatmap: function (min, max, stages, colorblind) {
         var maxhue, colorInc, countInc;
         if (this.colorblind === true){
            maxhue = 100;
         } else {   
            maxhue = 200;
         }
         colorInc = maxhue/stages;
         countInc = max/stages;
         this.color = function (count) {
            var hue = maxhue - (Math.floor(count/countInc) * colorInc);
            if (count < min) {
               return false;
            } else if ( count > max ) {
               hue = 0;
            }
            if (this.colorblind) {
               return "hsl(0, 0%, "+ hue +"%)";
            } else {
               return "hsl("+hue+", 75%, 65%)";               
            }
         };
         return this;
      },
      
      title: function (elem, name, val, age) {
         var title, ageString, timewords, time, days;
         // age format:  "[X days,]hh:mm:ss.ssss"
         title = [elem.attr('title'), val + ' ' + name].join(' : ');
         if (age === null || age === undefined) {
            return title;
         };
         age = age.split(',');
         units = ['hours', 'minutes', 'seconds'];
         time = age.pop().split(':').map(function (num, i) {
            return [Math.ceil(parseFloat(num, 10)), units[i]];
         });
         days = age.pop();
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
         return table;
      }

   };

   UDBrains.UI.minimap.grid.fn.init.prototype = UDBrains.UI.minimap.grid.fn;
   
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
               var a_to_origin = Math.sqrt(Math.pow(a.x - coords.x, 2) + Math.pow(a.y - coords.y, 2));
               var b_to_origin = Math.sqrt(Math.pow(b.x - coords.x, 2) + Math.pow(b.y - coords.y, 2));
               if(a_to_origin < b_to_origin) {
                   return -1;
               } else if(a_to_origin === b_to_origin) {
                   return 0;
               } else {
                   return 1;
               }
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
   
   if(!window.UDBrains) {
      //Make sure UDBrains only runs once.
      UDBrains = window.UDBrains = UDBrains();
   }


})(jQuery);
