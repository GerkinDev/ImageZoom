$(document).ready(function(){
	zoomable = new ZoomableImage("#container > img", {maxZoom: 2});
});

var ZoomableImage = function(selector, options){
	var self = this;
	this.opts = $.extend({
		maxZoom: 2,
		deadarea: 0.1,
		appearDuration: 0.5
	}, options);

	//this.zoomedImage;
	var original = $(selector);
	var wrapper;
	var antiSubstractedProportions;
	var substractedDims;
	var offsetProportion;
	var proportion;
	Object.defineProperties(this, {
		proportion: {
			get: function(){return proportion;}
		}
	});	
	original.load(function(){
		self.zoomedImage = original.clone().addClass("zoomed");
		wrapper = self.zoomedImage.wrap('<div class="zoomable"></div>').parent();
		var transitionString = "opacity " + self.opts.appearDuration + "s";
		console.log(transitionString);
		self.zoomedImage.css({
			WebkitTransition: transitionString,
			MozTransition: transitionString,
			transition: transitionString,
		})
		$(window).resize(self.recalcDimensions);
		self.recalcDimensions();
		original.parent().append(wrapper);
		self.enable();
	});
	this.enable = function(){
		wrapper
			.bind("mousemove", recalcOffsets)
			.bind("mouseenter", setActive)
			.bind("mouseleave", setInactive);
	}
	this.disable = function(){
		wrapper
			.unbind("mousemove", recalcOffsets)
			.unbind("mouseenter", setActive)
			.unbind("mouseleave", setInactive);
	}
	this.delete = function(){
		wrapper.remove();
	}
	function active(active){active?setActive():setInactive();}
	function setActive(){wrapper.addClass("active");}
	function setInactive(){wrapper.removeClass("active");}

	function recalcOffsets(e){
		wrapper.addClass("active");
		var axisNames = ["x", "y"];
		var offsets = {};
		for(var i = 0; i < 2; i++){
			var axis = axisNames[i];
			var offsetName = "offset" + axis.toUpperCase();
			if(e[offsetName] < self.opts.deadarea * dims[axis]){
				offsets[axis] = 0;
			} else if(e[offsetName] > (1 - self.opts.deadarea) * dims[axis]){
				offsets[axis] = dims[axis] * offsetProportion;
			} else {
				offsets[axis] = (e[offsetName] - substractedDims[axis]) * antiSubstractedProportions;
			}
		}
		self.zoomedImage.css({
			top: -offsets.y,
			left: -offsets.x
		});
	}
	this.recalcDimensions = function(){
		dims = {
			x: original.width(),
			y: original.height()
		}
		wrapper.css({
			top:	original.position().top,
			left:	original.position().left,
			width:	dims.x,
			height:	dims.y
		});
		proportion = Math.min(
			self.zoomedImage[0].naturalWidth / dims.x,
			self.zoomedImage[0].naturalHeight / dims.y,
			self.opts.maxZoom
		);
		offsetProportion = (proportion - 1);
		self.zoomedImage.css({
			width: dims.x * proportion,
			height: dims.y * proportion
		});
		substractedDims = {
			x: self.opts.deadarea * dims.x,
			y: self.opts.deadarea * dims.y
		};
		antiSubstractedProportions = offsetProportion / (1 - (self.opts.deadarea * 2));
	}
}