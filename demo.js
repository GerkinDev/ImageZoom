$(document).ready(function(){
	c3 = $("#container3 > img");
	zoomables = {
		container1: new ZoomableImage("#container1 > img", {maxZoom: 2}),
		container2: new ZoomableImage("#container2 > img", {
			maxZoom: 2,
			target: $("#container2 .zoomArea"),
			deadarea: 0.25
		}),
		container4: new ZoomableImage("#container4 > img"),
		container5: new ZoomableImage("#container5 > img", {forceNaturalProportions: false})
	};
	c3.load(function(){
		zoomables.container3 = new ZoomableImage("#container3 > img", {
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
});