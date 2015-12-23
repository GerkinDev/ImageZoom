var ZoomableImage = function(selector, options){
	var self = this;
	var original = $(selector);
	this.opts = $.extend({
		maxZoom: 2,
		deadarea: 0.1,
		appearDuration: 0.5,
		target: null
	}, options);
	if(this.opts.target && typeof this.opts.target == "object" && !(this.opts.target instanceof jQuery)){
		var topt = this.opts.target;
		if((!topt.width) || (!topt.height) || ((!topt.left) && (!topt.right) && (!topt.top) && (!topt.bottom))){
			console.warn("Missing position attributes for Zoomable Image target");
			this.opts.target = null;
		} else {
			var newDom = $($.parseHTML("<div class=\"zoomable\"></div>"));
			var resOpts = {
				height: topt.height,
				width: topt.width,
				top: original.position().top,
				left: original.position().left
			};
			if(!!topt.top)		resOpts.top		= original.position().top - (topt.height + topt.top);
			if(!!topt.bottom)	resOpts.top		= original.position().top + original.height() + topt.bottom;
			if(!!topt.left)		resOpts.left	= original.position().left - (topt.width + topt.left);
			if(!!topt.right)	resOpts.left	= original.position().left + original.width() + topt.right;
			newDom.css($.extend(resOpts, {
				position: "absolute"
			}));
			this.opts.target = newDom;
			original.parent().append(newDom);
		}
	}

	//this.zoomedImage;
	var original = $(selector);
	var wrapper = this.opts.target;
	var antiSubstractedProportions;
	var substractedDims;
	var offsetProportion;
	var proportion;
	var dims;
	var inPlace;
	var proportionFactor;
	var scrollOn;
	Object.defineProperties(this, {
		proportion: {
			get: function(){return proportion;}
		}
	});	
	original.load(function(){
		self.zoomedImage = original.clone().addClass("zoomed");
		if(!wrapper){
			wrapper = self.zoomedImage.wrap('<div class="zoomable zoomableInPlace"></div>').parent();
			original.parent().append(wrapper);
			inPlace = true;
		} else {
			wrapper.addClass("zoomable").append(self.zoomedImage);
			inPlace = false;
		}

		$(window).resize(self.recalcDimensions);
		self.recalcDimensions();
		var transitionString = "opacity " + self.opts.appearDuration + "s, top 0.1s, left 0.1s";	
		self.zoomedImage.css({
			WebkitTransition: transitionString,
			MozTransition: transitionString,
			transition: transitionString,
		})
		self.enable();
	});
	this.enable = function(){
		original
			.bind("mousemove", recalcOffsets)
			.bind("mouseenter", setActive)
			.bind("mouseleave", setInactive);
	}
	this.disable = function(){
		original
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
			var percentScroll;
			if(e[offsetName] < self.opts.deadarea * dims[axis]){
				percentScroll = 0;
			} else if(e[offsetName] > (1 - self.opts.deadarea) * dims[axis]){
				percentScroll = 100;
			} else {
				percentScroll = ((e[offsetName] - substractedDims[axis]) / scrollOn[axis]) * 100;
			}
			offsets[axis] = (percentScroll * proportionFactor[axis]) / 100;
			//console.log("Scroll " + axis + ": " + percentScroll + "%");
		}
		self.zoomedImage.css({
			top: -offsets.y,
			left: -offsets.x,
		});
	}
	this.recalcDimensions = function(){
		dims = {
			x: original.width(),
			y: original.height()
		};
		scrollOn = {
			x: dims.x * (1 - (2 * self.opts.deadarea)),
			y: dims.y * (1 - (2 * self.opts.deadarea))
		};
		if(inPlace){
			wrapper.css({
				top:	original.position().top,
				left:	original.position().left,
				width:	dims.x,
				height:	dims.y
			});
		}
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
		proportionFactor = {
			x: dims.x * proportion - wrapper.width(),
			y: dims.y * proportion - wrapper.height(),
		};
		substractedDims = {
			x: self.opts.deadarea * dims.x,
			y: self.opts.deadarea * dims.y
		};
		antiSubstractedProportions = offsetProportion / (1 - (self.opts.deadarea * 2));
	}
}