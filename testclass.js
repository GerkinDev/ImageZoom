var testclass;
// Open the closure to hide the inner components
(function(){
	// Define the constructir
	testclass = function(v){
		// Save "this" to keep the invoker 
		var self = this;
		
		self.v = v;
		var v_2 = v + "_2";
		
		console.log("Construct", v,v_2);
		
		/*****************************************\
		|*********** PUBLIC INSTANCE *************|
		\*****************************************/
		function public_instace(){
			console.log("Public instance",self.v, v_2);
			private();
		}
		// Make this function publicly visible by attaching it to the new instance
		self.public = public_instace;
		
		/*****************************************\
		|************ PRIVATE INSTANCE ***********|
		\*****************************************/
		function private_instance(){
			console.log("Private instance",self.v, v_2);
		}
		var private = private_instance;
	}
	/*****************************************\
	|************* PUBLIC STATIC *************|
	\*****************************************/
	function public_static(){
		console.log("Public static");
		private_static();
	}
	// Make this function publicly visible by attaching it to the constructor
	testclass.public = public_static;
	
	/*****************************************\
	|************* PRIVATE STATIC ************|
	\*****************************************/
	function private_static(){
		console.log("Private static");
	}
})();

testclass.public();
var a = new testclass("a");
var b = new testclass("b");
a.public();
b.public();