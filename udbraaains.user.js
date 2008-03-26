// ==UserScript==
// @name          UDBraaains
// @namespace     http://code.google.com/p/udbraaains/
// @description   Reports and downloads metadata for Urban Dead
// @include       http://*urbandead.com/map.cgi*
// ==/UserScript==


version = "0.667";

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
			inputs[i+1].value += "\n("+convertCadeLevelToShort(entry[3])+")"+
				"("+entry[5]+")";
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
		divAddHighlighted('<h1> <a href="http://code.google.com/p/udbraaains/downloads/list">'+
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
	divAdd('snapshot ' + grid.snapshotLength);
	// divAdd(' '+0+' '+grid.snapshotItem(0).innerHTML);
	for (var i = 1; i < grid.snapshotLength ; i++)
	{
		//divAdd(' '+i+' '+grid.snapshotItem(i).innerHTML);
		if (!grid.snapshotItem(i).innerHTML.match(/<form/) && grid.snapshotItem(i).innerHTML.match(/<input/))
			el = i;
	}
	divAdd('chose ' + el);
	if(grid.snapshotLength) {
		var matches = grid.snapshotItem(el).innerHTML.match(/(\d+)\s+zombie/);		
		if(matches)
		{
			divAdd('local zombies : ' + matches[1]);
			// alert(matches[1]);
			return matches[1];
		}
		/*else
			alert('no matches');*/
	}
	divAdd('0 local zombies');
	return 0;
}

function countSurvivors() {
	var textblob = document.evaluate("//div[contains(@class,'gt')]", document, null, XPathResult.ANY_TYPE, null);
	var bso = textblob.iterateNext();
/*var alertText = 'Level 2 headings in this document are:\n'

var i = 0;
while (bso) {
  alertText += 'number'+i+'\n';
  alertText += bso.innerHTML + '\n';
  bso = textblob.iterateNext();
}
alert(alertText);*/
	if (bso) {
		var bs = ''+bso.innerHTML;
//		alert(bs+'\n');
		var matches = bs.match(/There\sis\sa\scrowd\sof\s(\d+)\ssurvivors\sgathered\shere/);
		var survivor_count = '0';
		if(matches) {
			survivor_count = matches[1];
//			alert(matches[1]);
//				array[i] = [ coords, 2, matches[1] ].join(':');
		} else {
//			alert(textblob.snapshotItem(1).textContent);
			
			var m1 = bs.match(/(.*?)<br><br>/);
			if (!m1)
				m1 = [0, bs];
			var m2 = m1[1].match(/<a\shref="profile.cgi\?id=(\d+)/g);
			if (m2)
				survivor_count = m2.length;
			else
				survivor_count = 0;
//			alert(m2.length);
//			alert(m1[1]);
		}
//		alert(survivor_count);
		return(survivor_count);
	}
	else
	{
//		alert("not found");
		return(0);
	}
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
		if(oDiv.innerHTML.match(/You are inside/))
			return 3;
		if(oDiv.innerHTML.match(/You are standing outside/))
			return 2;
		if(oDiv.innerHTML.match(/You are lying outside/))
			return 2;
		if(oDiv.innerHTML.match(/You are at/) || oDiv.innerHTML.match(/You are standing in/)) // TODO: Test
			return 1;
	}
	return 0;
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

	// Debugging: print query and data
	//divAdd("qs: "+qs+"<br>data: "+data);
	
	// Make connection to server
	GM_xmlhttpRequest({
		method: 'POST',
//		url: 'http://www.alloscomp.com/udbrain/api2.php'+qs,
		url: 'http://65.78.27.242:50609/udb'+qs,
		headers: {
			"Accept": "text/html",
			"Content-type": "application/x-www-form-urlencoded",
			"Content-length": data.length,
			"Connection": "close"
		},
		data: encodeURI(data),
		onload: function(xhr) {
			// Debugging: print response
			// divAdd("response: "+xhr.responseText);
			
			// If Error, throw alert box
			if(xhr.responseText.match(/Error:/))
				alert(xhr.responseText);
			
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
				
				// Handle the report
				else
					displayData(arr[i]);
			}
		}
	});
}

/**
* Gets Urban Dead userID.
*
*  All that is needed for UDToolbar compatibility is a regex switch. --XyzzyYYZ
**/
function getUDID() {
	var query = "//p[@class='gt']";
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

function drawGoonOrdersIFrame() {
  // Make iframe
  var eIF = document.createElement('iframe');
  eIF.id = 'goonOrders_frame';
  eIF.src = 'http://www.distributedneuron.net/UD/orders.php?uid='+gUDID+'&x='+gCoords[0]+'&y='+gCoords[1];
  eIF.style.marginTop = '0.3em';
  eIF.style.height = '250px';
  eIF.style.width = '700px';
  eIF.style.display = 'block';
  //eIF.addEventListener("onload", function() { alert("hi"); }, true);
 
  // Make display link
  var eLink = document.createElement('a');
  eLink.href = '#';
  eLink.style.display = 'block';
  eLink.style.marginTop = '0.6em';
  eLink.innerHTML = 'Click to Hide Orders';
  eLink.addEventListener('click', function(e) { 
    var rf = document.getElementById('goonOrders_frame').style;
    if(rf.display == 'none') {
      rf.display = 'block';
      this.innerHTML = 'Click to Hide Orders';
    }
    else if(rf.display == 'block') {
      rf.display = 'none';
      this.innerHTML = 'Click to Show Orders';
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


gUDID = getUDID();

if(gUDID != -1) {
//	alert(timezone);
	gPlayerLocation = playerLocation();
	divAdd('player location ' +gPlayerLocation);
	gCoords = getCoords();
	displayOnCenterSquare(getCurrentCades());
	if (!(gCoords[0] > 99 || gCoords[1] > 99)) // No support for Monroeville, sorry.
		exchangeData();
	drawGoonOrdersIFrame();
}