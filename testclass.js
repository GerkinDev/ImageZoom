var testclass;
(function(){
	var pi;
	testclass = function(){
		pi = function(){return "Private instance"};
	};// Constructor
	console.log(testclass);
	(function(){
		function ps(){return "Private static"};// Private static

		testclass.vs = function(){return "Public static"};// Public static

		testclass.prototype = {
			constructor: testclass,
			vi: function(){
				console.log(this, testclass.vs, this.vi, ps, pi);
				return "Public instance"}// Public instance
		}
	})();
})();

var instance = new testclass();
console.log("Private instance: ",typeof pi, testclass.pi, instance.pi);
console.log("Public instance: ",typeof vi, testclass.vi, instance.vi, instance.vi());
console.log("Private static: ",typeof ps, testclass.ps, instance.ps);
console.log("Public static: ",typeof vs, testclass.vs, testclass.vs(), instance.vs);