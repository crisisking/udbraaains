(function(){

   var Grid, Tile, Malton;

   Grid = new Class({
      
      Implements: [Options, Events, Array],
      
      options: {
         elem:  false,
         xsize: 2,
         ysize: 2,
         tiles: {
            height:  4,
            width:   4,
            padding: 1,
            color: "#000"
         }
      },
      
      initialize: function (options) {
         this.setOptions(options);
         this.length = this.options.ysize;
         this.height = this.options.ysize * this.options.tiles.height + this.options.ysize * this.options.tiles.padding;
         this.width = this.options.xsize * this.options.tiles.width + this.options.xsize * this.options.tiles.padding;
         this.canvasElement = new Element('canvas', {
            height: this.height,
            width:  this.width
         });
         this.canvas = this.canvasElement.getContext('2d');
         this.createTiles();
         this.appendTo(this.options.elem);
      },
      
      createTiles: function () {
         this.options.ysize.times(function (row) {
            this[row] = [];
            this.options.xsize.times(function (col) {
               var tile = new Tile(this, col, row, this.options.tiles);
               this[row].push(tile);
            }, this);
         }, this);
      },
      
      appendTo: function (elem) {
         return this.canvasElement.inject($$(elem)[0]);
      }      
      
   });
   
   
   
   Tile = new Class({
      
      Implements: [Options, Events],
      
      options: {
         height:  0,
         width:   0,
         padding: 0,
      },
      
      initialize: function (grid, col, row, options) {
         this.setOptions(options);
         this.grid = grid;
         this.col = col;
         this.row = row;
         this.x = (col * options.width) + (col * options.padding);
         this.y = (row * options.height) + (row * options.padding);
         this.color(options.color);
      },
      
      color: function (color) {
         var canvas;
         canvas = this.grid.canvas;
         canvas.fillStyle = color;
         canvas.fillRect(this.x, this.y, this.options.width, this.options.height);
      }
      
   });
   
   
   Malton = new Class({
      
      Implements: [Options, Events, Array],
      
      options: {
         height:        5,
         width:         5,
         padding:       2,
         tileColor:     "#fff",
         borderColor:   "#000"
      },
      
      initialize: function (options) {
         this.setOptions(options);
         this.grid = new Grid({
   			elem: options.elem,
   			xsize: 100,
   			ysize: 100,
   			tiles: {
   			   height:  this.options.height,
   			   width:   this.options.width,
   			   color:   this.options.tileColor,
   			   padding: this.options.padding
   			}
   		});
   		this.drawBorders(this.options.borderColor);
      },
      
      drawBorders: function (color) {
         var canvas;
         canvas = this.grid.canvas;
         canvas.fillStyle = color;
         //horizontal
         (9).times(function (i) {
            var width, height, x;
            width = this.grid.options.tiles.padding;
            height = this.grid.height;
            x = ((width * 10) * (i+1)) + ((this.grid.options.tiles.width * 10) * (i+1)) - width;
            canvas.fillRect(x, 0, width, height);
         }, this);
         //vertical
         (9).times(function (i) {
            var width, height, y;
            height = this.grid.options.tiles.padding;
            width = this.grid.width;
            y = ((height * 10) * (i+1)) + ((this.grid.options.tiles.height * 10) * (i+1)) - height;
            canvas.fillRect(0, y, width, height);
         }, this);
      },
      
      getTile: function (x, y) {
         return this.grid[y][x];
      }
      
   })
   
   window.Malton = Malton;


})();