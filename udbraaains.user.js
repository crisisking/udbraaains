// ==UserScript==
// @name          UDBraaains
// @namespace     http://code.google.com/p/udbraaains/
// @description   Reports and downloads metadata for Urban Dead
// @include       http://*urbandead.com/map.cgi*
// ==/UserScript==


version = "0.73";

/**
* Timezone stuff
**/
var timezonePat = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
var timezoneClip = /[^-+\dA-Z]/g;
var timezone = (String(Date()).match(timezonePat) || [""]).pop().replace(timezoneClip, "");


/**
* Gets the coordinates of the center tile.
*
* Thanks to Ben2 for this code
* No need to search around when the coords are provided by UDToolbar --XyzzyYYZ
**/
function getCoords() {
	// This will work with UDToolbar
	var input = document.getElementsByName("coord")[0];
	var coords;
	if(input) {
		if(coords = input.value.match(/(\d+)\|(\d+)/)) {
			x = parseInt(coords[1]);
			y = parseInt(coords[2]);
			return [x,y];
		}
	}
	
	// This will work without UDToolbar
	var query = "//input[@type='hidden' and @name='v']";
	var grid = document.evaluate(query, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	// searches for the top left cell in the map 
	var input = grid.snapshotItem(0);
	if(coords = input.value.match(/^(\d+)-(\d+)$/)) {
		x = parseInt(coords[1]);
		y = parseInt(coords[2]);
		//divAdd('Old: '+x+','+y);
		if (grid.snapshotLength == 3) { // 4 corners
			if(x == 98 && y == 98) { x +=1; y += 1; } // bottom-right
			if(x == 0 && y == 98) { y += 1; } // bottom-left
			if(x == 98 && y == 0) { x +=1; } // top-right
			if(x == 0 && y == 1) { y -= 1; } // top-left
		} else if(grid.snapshotLength == 5) { // 4 borders
			if(x == 98 || y == 98) { x +=1; y += 1; } // bottom OR right
			if(y == 0) { x +=1; } // top
			if(x == 0) { y += 1; } // left
		} else { // snapshotLength = 8 -> normal
			x += 1;
			y += 1;
		}
	}
	var out = new Array(x,y);
	var sb = document.evaluate("//td[@class='sb']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	//divAdd(sb.snapshotItem(0).innerHTML);
	if (sb.snapshotLength)
	{
		sb.snapshotItem(0).innerHTML += ' <a href="http://map.aypok.co.uk/index.php?suburb='
			+((Math.floor(x/10)+1) + (Math.floor(y/10)*10))
			+'" style="color: red"> ['+x+", "+y+"]</a>";
	}
	return out;
}

/**
* Determines 'cade status of building based on description
*
* Stolen and modified from Urban Dead Barricae Colorizer,
* by Sean Dwyer <sean DOT dwyer AT gmail DOT com>
*
* Includes a hack to support UDToolbar
* Includes code by sluutthefeared for better cade identification
**/
function getCurrentCades() {
	var barricadeInfo = {
		'wide open'																	: 1,
		'have been secured'															: 2,
		'loosely <span id="barricaded" class="target">barricaded</span>'			: 3,
		'loosely barricaded'														: 3,
		'lightly <span id="barricaded" class="target">barricaded</span>'			: 4,
		'lightly barricaded'														: 4,
		'quite strongly <span id="barricaded" class="target">barricaded</span>'		: 5,
		'quite strongly barricaded'													: 5,
		'very strongly <span id="barricaded" class="target">barricaded</span>'		: 6,
		'very strongly barricaded'													: 6,
		'heavily <span id="barricaded" class="target">barricaded</span>'			: 7,
		'heavily barricaded'														: 7,
		'very heavily <span id="barricaded" class="target">barricaded</span>'		: 8,
		'very heavily barricaded'													: 8,
		'extremely heavily <span id="barricaded" class="target">barricaded</span>'	: 9,
		'extremely heavily barricaded'												: 9
	};
	var query = "//div[@class='gt']";
	var grid = document.evaluate(query, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	var level = '';
	for(var i = 0; i < grid.snapshotLength; i++) {
		arr = grid.snapshotItem(i).innerHTML.split('<br>');
		var text = arr[0];
		for(var lvl in barricadeInfo)
			if(text.indexOf(lvl) >= 0 && lvl.length > level.length)
				level = lvl;
	}
	if(barricadeInfo[level])
		return barricadeInfo[level];
	return 1;
}

/**
* Mk abbrev. form -- 'cade stats.
**/
function convertCadeLevelToShort(cl) {
	if(cl == 1)
		return "Opn";
	if(cl == 2)
		return "Cls";
	if(cl == 3)
		return "LoB";
	if(cl == 4)
		return "LiB";
	if(cl == 5)
		return "QSB";
	if(cl == 6)
		return "VSB";
	if(cl == 7)
		return "HeB";
	if(cl == 8)
		return "VHB";
	if(cl == 9)
		return "EHB";
}

/**
* Mk abbrev. form -- 'cade stats.
**/
function convertCadeLevelToShortish(cl) {
	if(cl == 1)
		return "Open";
	if(cl == 2)
		return "Closed";
	if(cl == 3)
		return "Loosely";
	if(cl == 4)
		return "Light";
	if(cl == 5)
		return "QSB";
	if(cl == 6)
		return "VSB";
	if(cl == 7)
		return "Hevy";
	if(cl == 8)
		return "VHB";
	if(cl == 9)
		return "EHB";
}


/**
* Convert [X,Y] array to database and report form.
**/
function convertCoordsToBXY(coords) {
	if (coords == null)
		return null;
	return parseInt(coords[0]*100)+parseInt(coords[1]);
}

/**
* Convert database and report form to [X,Y] array
**/
function convertBXYToCoords(bxy) {
	return [ parseInt(bxy / 100), bxy % 100 ];
}

/**
*Put some nice descriptive text on the map tiles.
**/
function displayData(estr) {
	// estr coords:age:type:value
	var entry = estr.split(':');
	if(entry[0]>9999 || entry[0]<0) // Is building ID reasonable?
		return -1;
	if(entry[2] != 1) // Only display barricade reports atm
		return 0;
	
	// Get coords of this report
	var arr = convertBXYToCoords(entry[0]);
	
	// Other Squares
	var re = new RegExp('^'+arr[0]+'-'+arr[1]+'$');
	var inputs = document.getElementsByTagName("input");
	for(var i=0; i<inputs.length; i++) {
		if(coords = re.exec(inputs[i].value)) {
			var data_string = "\n("+convertCadeLevelToShort(entry[3])+")";
			if (entry[4] < 3600*24*14) // we accept 2-week-old survivor data
			{
				if (entry[4] > 3600*24) // after 24 hours, add ?
					data_string += "("+entry[5]+"?)";
				else
					data_string += "("+entry[5]+")";
			}
			inputs[i+1].value += data_string;
			var agestr = "Barricade data is "+convertAge(entry[1])+" old.\n"+
				"Survivor data is "+convertAge(entry[4])+" old.\n";
			inputs[i+1].title = agestr;
			inputs[i+1].alt = agestr;
			return 0;
		}
	}
}

/**
* Displays 'cade level of center square.
**/
function displayOnCenterSquare(cades) {
	if(gPlayerLocation > 1) {
		var query = "//td[contains(@class,'b c')]";
		var grid = document.evaluate(query, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
		for(var i = 0; i < grid.snapshotLength; i++) {
			var td = grid.snapshotItem(i);
			if(td.innerHTML.indexOf("<form") < 0)
			{
				var inputs = td.getElementsByTagName("input");
				if (inputs.length > 0)
					inputs[0].value += "\n("+convertCadeLevelToShort(cades)+")";
			}
		}
	}
}

/**
* Makes a more readable age display for those of us who do not like to convert out from seconds to days.
**/
function convertAge(num) {
	var str = num+"s";
	if(num/90 > 1) {
		num = parseInt(num/60+.5);
		str = num+"m";
		if(num/90 > 1) {
			num = parseInt(num/60+.5);
			str = num+"h";
			if(num/36 > 1) {
				num = parseInt(num/24+.5);
				str = num+"d";
			}
		}
	}
	return str;
}

/**
* Display messages to user.
**/
function divAdd(txt) {
	var div = document.createElement('div');
	div.innerHTML = txt;
	div.style.textAlign = 'center';
	div.style.fontWeight = 'bold';
	div.style.background = '#565';
	div.style.margin = '2px';
	document.body.insertBefore(div,document.body.firstChild);
}

/**
* Display messages to user on a different background.
**/
function divAddHighlighted(txt) {
	var div = document.createElement('div');
	div.innerHTML = txt;
	div.style.textAlign = 'center';
	div.style.fontWeight = 'bold';
	div.style.color = 'red';
	document.body.insertBefore(div,document.body.firstChild);
}

/**
* Counts grapefruit.
**/
function checkVersion(txt) {
	if(parseFloat(txt) > parseFloat(version))
		divAddHighlighted('<h1> <a href="https://github.com/crisisking/udbraaains/raw/master/udbraaains.user.js">'+
				'Please update UDBraaains from version ' + version + ' to version ' + txt + '</a></h1>.');
}

/**
* Coordinate grabber for a given tile.
**/
function getCoordsForTd(oTd) {
	if(oTd.innerHTML) {
		if (!oTd.innerHTML.match(/<input/))
		{
			return null;
		}
		var matches = oTd.innerHTML.match(/(\d+)-(\d+)/);
		if(matches) // if the TD contains coords, return them
			return [ matches[1], matches[2] ];
		else // it's the center square, return our coords
			return gCoords;
	}
}

/**
* Counts zombies on this block.
* 
* Use directly when inside
* Derived from code by Ben2
**/
function countLocalZeds() {
	//var bork = document.evaluate("//table", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	//alert(bork.snapshotItem(1).innerHTML);
	//	var query = "//td[contains(@class,' l') or contains(@class,'x')]//span[@class='fz']";
	// var query = "//td[contains(@class,' l') or contains(@class,'x')]";
	var query = "//td[contains(@class,'b c')]";
	var grid = document.evaluate(query, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	var el = 0;
	//divAdd('snapshot ' + grid.snapshotLength);
	// divAdd(' '+0+' '+grid.snapshotItem(0).innerHTML);
	for (var i = 1; i < grid.snapshotLength ; i++)
	{
		//divAdd(' '+i+' '+grid.snapshotItem(i).innerHTML);
		if (!grid.snapshotItem(i).innerHTML.match(/<form/) && grid.snapshotItem(i).innerHTML.match(/<input/))
			el = i;
	}
	//divAdd('chose ' + el);
	if(grid.snapshotLength) {
		var matches = grid.snapshotItem(el).innerHTML.match(/(\d+)\s+zombie/);		
		if(matches)
		{
			// divAdd('local zombies : ' + matches[1]);
			// alert(matches[1]);
			return matches[1];
		}
		/*else
			alert('no matches');*/
	}
	// divAdd('0 local zombies');
	return 0;
}

var gSurvivorIds = false;

function countSurvivors() {
	var survivor_count = 0;
	var survivor_ids = [];
	
	// this matches multiple items, so we have to evaluate each
	var textblob = document.evaluate("//div[contains(@class,'gt')]", document, null, XPathResult.ANY_TYPE, null);
	var bso;
	while ( bso = textblob.iterateNext() ) {
		var bs = ''+bso.innerHTML;
//		alert(bs+'\n');
		var matches = bs.match(/There\sis\sa\scrowd\sof\s(\d+)\ssurvivors\sgathered\shere/);
		
		if (matches) {
			survivor_count = matches[1];
//			alert(matches[1]);
//				array[i] = [ coords, 2, matches[1] ].join(':');
		} else {
			
			var m1 = bs.match(/(.*?)<br><br>/);
			if (!m1)
				m1 = [0, bs];
			var m2 = m1[1].match(/<a\shref="profile.cgi\?id=\d+/g);
			if (m2)
			{
				survivor_count += m2.length;
				for (var i = 0; i < m2.length; i++)
				{
					m3 = m2[i].match(/\d+/);
					survivor_ids.push(m3);
				}
			}
//			alert(m2.length);
//			alert(m1[1]);
		}
	}
	gSurvivorIds = survivor_ids;
	gSurvivorIds.shift();
	return(survivor_count - 1);
}

/**
* Counts zombies on nearby blocks.
* 
* Use only when outside!
* Derived from code by Ben2
**/
function countZeds() {
	var query = "//td[contains(@class,'b c')]";
	var grid = document.evaluate(query, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	var array = [];
	
	for(var i = 0; i < grid.snapshotLength; i++) {
		var oTd = grid.snapshotItem(i);
		var coords = convertCoordsToBXY(getCoordsForTd(oTd));
		if (coords == null)
			continue;

		// If square is in center, use dedicated function
		if(coords == convertCoordsToBXY(gCoords)) {
			array[i] = [ coords, 2, countLocalZeds() ].join(':');
		}
		
		// If square is not center and has zeds, count them
		else if(oTd.lastChild.className == 'fz') { // Has zombies
			var matches = oTd.lastChild.innerHTML.match(/^(\d+)\s+zombie/);
			if(matches) {
				array[i] = [ coords, 2, matches[1] ].join(':');
			}
		}
		
		// Otherwise, assume zero
		else {
			array[i] = [ coords, 2, 0 ].join(':');
		}
	}
	return array.join('|');
}

function countRuins() {
	var query = "//td[contains(@class,'b c')]";
	var grid = document.evaluate(query, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	var array = [];
	
	for(var i = 0; i < grid.snapshotLength; i++) {
		var oTd = grid.snapshotItem(i);
		var coords = convertCoordsToBXY(getCoordsForTd(oTd));
		if (!coords)
			continue;
		var input;
		// If square is in center, use dedicated function
		var inputs = oTd.getElementsByTagName('input');
		for (var j = 0; j < inputs.length ; j++)
			if (inputs[j].getAttribute("type") == "submit")
				input = inputs[j];
		if (input && input.hasAttribute("class"))
		{
			if (input.getAttribute("class") == "mr")
				array[i] = [ coords, 4, 1 ].join(':');
			else if (input.getAttribute("class") == "ml")
				array[i] = [ coords, 4, 2 ].join(':');
			else
				array[i] = [ coords, 4, 0 ].join(':');
		}

	}
	//alert(array.join('|'));
	return array.join('|');
}

/**
* Checks if player is on an empty block(1), outside(2), inside(3)
* 
* Zero means no data found.
* Note: this is a change from previous behavior.
**/
function playerLocation() {
	var query = "//div[@class='gt']";
	var grid = document.evaluate(query, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var i = 0; i < grid.snapshotLength; i++) {
		var oDiv = grid.snapshotItem(i);
		if(oDiv.innerHTML.match(/The exertions of the day have numbed your clouded brain/))
			return -1;
		if(oDiv.innerHTML.match(/Exhausted, you can go no further/))
			return -1;
		if(oDiv.innerHTML.match(/You are inside/))
			return 3;
		if(oDiv.innerHTML.match(/^You are in the/))
			return 3;
		if(oDiv.innerHTML.match(/You are standing outside/))
			return 2;
		if(oDiv.innerHTML.match(/You are lying outside/))
			return 2;
		if(oDiv.innerHTML.match(/You are lying in a cemetery/))
			return 2;
		if(oDiv.innerHTML.match(/You are at/) || oDiv.innerHTML.match(/You are standing in/)) // TODO: Test
			return 1;
	}
	/* If we reach here, we have struck an annoying bug. What we really want to do is submit the entire page to 
	 * our debugging server for later analysis to see why it coudn't find your location. TODO 
	 * Bug tracker: Issue#1 */
	return -1;
}


function colorSurvivor(spec) {
	var id = spec[1];
	var query = '//a[contains(@href, "id='+id+'")]';
	var players = document.evaluate(query, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var i = 0; i < players.snapshotLength; i++) {
		var pl = players.snapshotItem(i);
		var span = document.createElement('span');
		span.setAttribute('style', 'color: '+spec[2]);
		var bold = document.createElement('b');
		span.appendChild(bold);
		var old_child = pl.replaceChild(span, pl.firstChild);
		bold.appendChild(old_child);
	}
}

/**
* Send and receive data on buildings with the Alloscomp server.
*
* Coming soon: send and receive data on players with the Tagteamtech server.
**/
function exchangeData() {	
	// Get our coordinates
	var coords = gCoords;
	
	// Begin the query string
	var qs = '?';
	
	// Search form inputs for map squares to add to query
	var query = "//td[contains(@class,'b c')]/form/input[@name='v']";
	var grid = document.evaluate(query, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var i = 0; i < grid.snapshotLength; i++) {
		var input = grid.snapshotItem(i);
		if(ncoords = input.value.match(/^(\d+)-(\d+)$/)) 
			qs += convertCoordsToBXY([ncoords[1],ncoords[2]]) + '&';
	}
	qs = qs.replace(/\&$/,'');
	qs = qs + '&' + convertCoordsToBXY(gCoords);
	// alert(qs);
	
	// Begin the post array
	var postarr = [];
	
	// Inside or outside a building
	if(gPlayerLocation >= 2) {
		// Create our Barricade Report
		postarr.push([ convertCoordsToBXY(gCoords), '1', getCurrentCades() ].join(':')); 
	}
	
	// Inside a building
	if(gPlayerLocation == 3) { 
		// Count zeds in this building
		postarr.push([ convertCoordsToBXY(coords), '3', countLocalZeds() ].join(':'));
		postarr.push([ convertCoordsToBXY(coords), '5', countSurvivors() ].join(':'));
	}
	
	postarr.push(countRuins());

	// Outside a building or empty square
	if(gPlayerLocation <= 2) {
		// Count zeds on this and other blocks
		postarr.push(countZeds());
	}
	
	// Build the post data string
	var data = 'user='+[ gUDID, version, convertCoordsToBXY(coords), gPlayerLocation ].join(':')+'&data='+postarr.join('|');
	if (gSurvivorIds)
		data += '&survivors='+gSurvivorIds.join("|");

	// Debugging: print query and data
	//divAdd("qs: "+qs+"<br>data: "+data);
	
	// Make connection to server
	GM_xmlhttpRequest({
		method: 'POST',
//		url: 'http://www.alloscomp.com/udbrain/api2.php'+qs,
//		url: 'http://127.0.0.1:8080/udb'+qs,
		url: 'http://udbrains.kimihia.org.nz:50609/udb'+qs,
		headers: {
			"Accept": "text/html",
			"Content-type": "application/x-www-form-urlencoded"
		},
		data: encodeURI(data),
		onload: function(xhr) {
			// Debugging: print response
			//alert(xhr.responseText);
			
			// If Error, throw alert box
            if(xhr.responseText.match(/Error:/))
                alert('Sorry, something is broken :(');
			
			// Begin to parse the response data
			var arr = xhr.responseText.split('|');
			for(var i=0; i < arr.length; i++) {
				// Build and exec regexps
				var version_matches = arr[i].match(/^v(.*)/); // Contains version info?
				var alert_matches = arr[i].match(/^(Alert: .*?)ENDALERT/); // Is an alert?
				
				// Add a div with alert text
				if(alert_matches)
					divAdd(alert_matches[1]);
				
				// Check to see if upgrade is needed
				else if(version_matches)
					checkVersion(version_matches[1]);

				else if (arr[i].match(/^S:/))
					colorSurvivor(arr[i].split(':'));
				else if (arr[i].match(/^T:/))
					processTastyData(arr[i].split(':'));
				else if (arr[i].match(/^N:/))
					processNews(arr[i]);
				// Handle the report
				else
					displayData(arr[i]);
			}
		}
	});
}

function processNews(line)
{
	divAdd(line.slice(2));
}

/**
* Gets Urban Dead userID.
*
*  All that is needed for UDToolbar compatibility is a regex switch. --XyzzyYYZ
**/
function getUDID() {
	var query = "//div[@class='gt']";
	var grid = document.evaluate(query, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	for(var i = 0; i < grid.snapshotLength; i++) {
		var pText = grid.snapshotItem(i).innerHTML;
		if(matches = pText.match(/You are <a href="profile\.cgi\?id=([0-9]+)">/))
			return matches[1];
		else if(matches = pText.match(/<li><a href="profile\.cgi\?id=([0-9]+)">/))
			return matches[1];
	}
	return -1;
}

/* http://www.quirksmode.org/js/cookies.html */
function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}
function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}
function eraseCookie(name) {
	createCookie(name,"",-1);
}
/* end quirksmode */

var szGoonOrderSrc;

function drawGoonOrdersIFrame() {
  // Make iframe
  var eIF = document.createElement('iframe');
  eIF.id = 'goonOrders_frame';
  szGoonOrderSrc = 'http://tdslk.com'
  // check if we are actually going to display this
  if ( readCookie('goonorders') == 'hidden' ) {
  eIF.src = 'about:blank';
  eIF.style.display = 'none';
  } else {
  eIF.src = szGoonOrderSrc;
  eIF.style.display = 'block';
  }
  eIF.style.marginTop = '0.3em';
  eIF.style.height = '280px';
  eIF.style.width = '100%';
  //eIF.addEventListener("onload", function() { alert("hi"); }, true);
 
  // Make display link
  var eLink = document.createElement('a');
  eLink.href = '#';
  eLink.style.display = 'block';
  eLink.style.marginTop = '0.6em';
  if ( readCookie('goonorders') == 'hidden' ) {
    eLink.innerHTML = 'Click to Show Orders';
  } else {
    eLink.innerHTML = 'Click to Hide Orders';
  }
  eLink.addEventListener('click', function(e) { 
    var rf = document.getElementById('goonOrders_frame').style;
    if(rf.display == 'none') {
      rf.display = 'block';
      this.innerHTML = 'Click to Hide Orders';
      // go back to default (displayed) mode
      eraseCookie('goonorders');
      // load the orders
      var eIF = document.getElementById("goonOrders_frame");
      eIF.src = szGoonOrderSrc;
    }
    else if(rf.display == 'block') {
      rf.display = 'none';
      this.innerHTML = 'Click to Show Orders';
      // remember this choice
      createCookie('goonorders', 'hidden', 31);
    }
  }, true);
 
  // Find parent element
  var query = "//td[@class='gp']";
  var grid = document.evaluate(query, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
  if(grid.snapshotLength == 1) {
    var eTd = grid.snapshotItem(0);
    eTd.appendChild(eLink);
    eTd.appendChild(eIF);
  }
}

var gTastyTable;

function createTastyTable() {
	var T = document.getElementsByTagName('td');
	var mt;
	for (var i =0; i < T.length ; i++)
	{
		if (T[i].getAttribute('class') == 'cp')
			mt = T[i];
	}
	if (!mt)
	{
		divAdd("couldn't add tasty table");
		return;
	}
	newobj = document.createElement("p");
	label = document.createElement("b");
	label.appendChild(document.createTextNode("Easy Eating:"));
	newobj.appendChild(label);
	gTastyTable = document.createElement("table");
	gTastyTable.setAttribute("name", "tasty_table");
	newobj.appendChild(gTastyTable);
	mt.appendChild(newobj);
}

function coordinatesToOffset(x,y) {
	var delta_x = x-gCoords[0];
	var delta_y = y-gCoords[1];
	var outstr = "";
	var mn = Math.min(Math.abs(delta_x), Math.abs(delta_y));
	if (delta_x > 0 && delta_y > 0)
	{
		outstr += mn+" SE ";
		delta_x -= mn;
		delta_y -= mn;
	}
	if (delta_x > 0 && delta_y < 0)
	{
		outstr += mn+" NE ";
		delta_x -= mn;
		delta_y += mn;
	}
	if (delta_x < 0 && delta_y < 0)
	{
		outstr += mn+" NW ";
		delta_x += mn;
		delta_y += mn;
	}
	if (delta_x < 0 && delta_y > 0)
	{
		outstr += mn+" SW ";
		delta_x += mn;
		delta_y -= mn;
	}
	if (delta_x > 0)
		outstr += delta_x + "E";
	if (delta_x < 0)
		outstr += (-delta_x) + "W";
	if (delta_y > 0)
		outstr += delta_y + "S";
	if (delta_y < 0)
		outstr += (-delta_y) + "N";
	return outstr;
}

function isArray(testObject) {   
	if (testObject[0]) return true;
	return false;
}

function processTastyData(r) {
	//coord = document.createTextNode("["+r[1]+","+r[2]+"]");
	coord = document.createTextNode(coordinatesToOffset(1*r[1], 1*r[2]));
	cb = document.createElement("b");
	cb.appendChild(coord);
	addTastyRow([document.createTextNode(r[7]), cb]);
	cades = document.createTextNode(convertCadeLevelToShortish(r[3]));
	ccol = document.createElement("span");
	var cadeColor = "white";
	if (r[3] == 1)
		cadeColor = "#00FF00";
	else if (r[3] == 2)
		cadeColor = "#80FF00";
	else if (r[3] == 3)
		cadeColor = "yellow";
	else if (r[3] == 4)
		cadeColor = "orange";
	ccol.setAttribute("style", "color: "+cadeColor);
	ccol.appendChild(cades);
	cadeAge = document.createTextNode("("+convertAge(r[4])+")");
	srv = document.createTextNode(r[5]+" surv. ("+convertAge(r[6])+")");
	addTastyRow([[ccol, cadeAge], srv]);
}

function addTastyRow(r) {
	row = document.createElement("tr");
	for (var i = 0; i < r.length ; i++)
	{
		elem = document.createElement("td");
		if (isArray(r[i]))
		{
			for (var j = 0; j < r[i].length; j++)
				elem.appendChild(r[i][j]);
		}
		else
			elem.appendChild(r[i]);
		//elem.appendChild(document.createTextNode(r[i]));
		row.appendChild(elem);
	}
	gTastyTable.appendChild(row);
}

gUDID = getUDID();

if(gUDID != -1) {
//	alert(timezone);
	gPlayerLocation = playerLocation();
	if (gPlayerLocation != -1)
	{
		if (gPlayerLocation == 0)
		{
			divAdd('player location reported as 0 - minor bug - <a href="http://code.google.com/p/udbraaains/issues/detail?id=1">please report</a>');
		}
		gCoords = getCoords();
		createTastyTable();
		displayOnCenterSquare(getCurrentCades());
		if (!(gCoords[0] > 99 || gCoords[1] > 99)) // No support for Monroeville, sorry.
			exchangeData();
		drawGoonOrdersIFrame();
	}
}

