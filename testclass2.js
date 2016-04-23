var testclass = (function(){
	var private = new WeakMap();

	/*****************************************\
	|*********** PUBLIC INSTANCE *************|
	\*****************************************/
	function public_instance(){
		console.log("Public instance",this.v, private.get(this).v_2);
		private.get(this).private.apply(this);
	}

	/*****************************************\
	|************ PRIVATE INSTANCE ***********|
	\*****************************************/
	function private_instance(){
		console.log(this);
		console.log("Private instance",this.v, private.get(this).v_2);
	}

	// Define the constructor
	function testclass(v){
		var privateProps = {
			v_2:v + "_2",
			private: private_instance
		};

		this.v = v;
		private.set(this, privateProps);

		console.log("Construct", this.v,private.get(this).v_2);
	}
	testclass.prototype.public = public_instance;
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
	
	return testclass;
})();

testclass.public();
var a = new testclass("a");
var b = new testclass("b");
a.public();
b.public();