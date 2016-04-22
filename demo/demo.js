$(document).ready(function(){
	c3 = $("#container3 > img");
	zoomables = {
		container1: new ImageZoom("#container1 > img", {maxZoom: 2}),
		container2: new ImageZoom("#container2 > img", {
			maxZoom: 2,
			target: $("#container2 .zoomArea"),
			deadarea: 0.25
		}),
		container4: new ImageZoom("#container4 > img"),
		container5: new ImageZoom("#container5 > img", {forceNaturalProportions: false})
	};
	c3.load(function(){
		zoomables.container3 = new ImageZoom("#container3 > img", {
			maxZoom: 8,
			target: {
				width: c3.width(),
				height: c3.height(),
				left: 10,
				right: null,
				top: null,
				bottom: null
			},
			deadarea: 0.25
		});
	});
	
	console.log(testclass);
	console.log(new testclass());
});