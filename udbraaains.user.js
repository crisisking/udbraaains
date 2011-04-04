// ==UserScript==
// @name          UDBraaains
// @namespace     http://code.google.com/p/udbraaains/
// @description   Reports and downloads metadata for Urban Dead
// @include       http://*urbandead.com/map.cgi*
// @require       http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js
// ==/UserScript==


(function () {
   window = unsafeWindow ? unsafeWindow : window; //fucking chrome
   function appendScript(source, loadHandler) {
<<<<<<< HEAD
   	var head = document.getElementsByTagName('head')[0] || document.documentElement;
   	var script = document.createElement('script');

   	script.src = source;
   	script.type = 'text/javascript';
   	script.addEventListener('load', loadHandler, false);
   	head.appendChild(script);
   }
   // function reportData (data, reporturl) {
   //       GM_xmlhttpRequest({
   //          method: 'POST',
   //    //    url: 'http://www.alloscomp.com/udbrain/api2.php'+qs,
   //    //    url: 'http://127.0.0.1:8080/udb'+qs,
   //          url: 'http://udbrains.kimihia.org.nz:50609/udb'+data[1],
   //          headers: {
   //             "Accept": "text/html",
   //             "Content-type": "application/x-www-form-urlencoded"
   //          },
   //          data: encodeURI(data[0]),
   //          onload: function(xhr) {
   //             // Debugging: print response
   //             //alert(xhr.responseText);
   // 
   //             // If Error, throw alert box
   //                if(xhr.responseText.match(/Error:/))
   //                    alert('Sorry, something is broken :(');
   // 
   //             // Begin to parse the response data
   //             var arr = xhr.responseText.split('|');
   //             for(var i=0; i < arr.length; i++) {
   //                // Build and exec regexps
   //                var version_matches = arr[i].match(/^v(.*)/); // Contains version info?
   //                var alert_matches = arr[i].match(/^(Alert: .*?)ENDALERT/); // Is an alert?
   // 
   //                // Add a div with alert text
   //                if(alert_matches)
   //                   window.divAdd(alert_matches[1]);
   // 
   //                // Check to see if upgrade is needed
   //                else if(version_matches)
   //                   window.checkVersion(version_matches[1]);
   // 
   //                else if (arr[i].match(/^S:/))
   //                   window.colorSurvivor(arr[i].split(':'));
   //                else if (arr[i].match(/^T:/))
   //                   window.processTastyData(arr[i].split(':'));
   //                else if (arr[i].match(/^N:/))
   //                   window.processNews(arr[i]);
   //                // Handle the report
   //                else
   //                   window.displayData(arr[i]);
   //             }
   //          }
   //       });
   //    
   // }
   // 
   appendScript('http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js', function () {
      // appendScript('http://localhost:8000/udbraaains.js', function () {
      appendScript('https://github.com/underisk/udbraaains/raw/master/udbraaains.js', function () {
=======
       	var head = document.getElementsByTagName('head')[0] || document.documentElement;
       	var script = document.createElement('script');

       	script.src = source;
       	script.type = 'text/javascript';
       	script.addEventListener('load', loadHandler, false);
       	head.appendChild(script);
   }

   appendScript('http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js', function () {
      appendScript('https://github.com/crisisking/udbraaains/raw/master/udbraaains.js', function () {
>>>>>>> upstream/master
         //Stuff here someday maybe.
      });      
   });
   
<<<<<<< HEAD
   


   
   
=======
>>>>>>> upstream/master
})();