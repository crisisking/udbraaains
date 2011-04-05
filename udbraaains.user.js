// ==UserScript==
// @name          UDBraaains
// @namespace     http://code.google.com/p/udbraaains/
// @description   Reports and downloads metadata for Urban Dead
// @include       http://*urbandead.com/map.cgi*
// @require       http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js
// ==/UserScript==

(function () {


   function appendScript(source, loadHandler) {
   	var head = document.getElementsByTagName('head')[0] || document.documentElement;
   	var script = document.createElement('script');

   	script.src = source;
   	script.type = 'text/javascript';
   	script.addEventListener('load', loadHandler, false);
   	head.appendChild(script);
   }
   
   document.addEventListener('DOMContentLoaded', function () {
      //prevent load blocking
      appendScript('http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js', function () {
         appendScript('http://localhost:8000/udbraaains.js', function () {
         
         });      
      });      
   }, false);
   
   
})();