function assert(text, test, scope) {
   if(test.call)
      test = test.apply(scope);
   if (test === true){
      console.log(text + ': pass');      
   } else{
      console.warn(text + ': fail');
      console.log(test);      
   }
}
function maptest(map, property) {
   return function () {
      for (var row = this.surroundings.map.length - 1; row >= 0; row--){
   		for (var col = this.surroundings.map[row].length - 1; col >= 0; col--){
   			if(eval('this.surroundings.map[row][col]' + property) != map[row][col])
   				return {
   					row: 			row, 
   					col: 			col, 
   					value: 	   this.surroundings.map[row][col].survivors.length, 
   					expected: 	map[row][col]
   				}
   		};
   	};
   	return true; 
   };
}