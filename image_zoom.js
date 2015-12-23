var ZoomableImage = function(selector, options){
	var self = this;

	function attach(d,e,c){d.addEventListener?d.addEventListener(e,c):d.attachEvent(e,c);}
	function detach(d,e,c){d.addEventListener?d.removeEventListener(e,c):d.detachEvent(e,c);}
	function isElement(o){
		return (
			typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
			o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
		);
	}
	function MergeRecursive(obj1, obj2) {
		for (var p in obj2) {
			try {
				// Property in destination object set; update its value.
				if ( obj2[p].constructor==Object ) {
					obj1[p] = MergeRecursive(obj1[p], obj2[p]);
				} else {
					obj1[p] = obj2[p];
				}
			} catch(e) {
				// Property in destination object not set; create it and set its value.
				obj1[p] = obj2[p];
			}
		}
		return obj1;
	}

	var original = document.querySelector(selector);
	this.opts = MergeRecursive({
		maxZoom: 2,
		deadarea: 0.1,
		appearDuration: 0.5,
		target: null,
		imageUrl: null
	}, options);
	var position = null;
	if(this.opts.target && typeof this.opts.target == "object"){
		if(jQuery && (this.opts.target instanceof jQuery)){
			this.opts.target = this.opts.target[0];
		} else if(!isElement(this.opts.target)){
			var topt = this.opts.target;
			if((!topt.width) || (!topt.height) || ((!topt.left) && (!topt.right) && (!topt.top) && (!topt.bottom))){
				console.warn("Missing position attributes for Zoomable Image target");
				this.opts.target = null;
			} else {
				position = topt;
				this.opts.target = document.createElement("div");
				this.opts.target.classList.add("zoomable");
				original.parentNode.appendChild(this.opts.target);
				// inPlace set when test wrapper
			}
		}
	}

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
	self.zoomedImage = original.cloneNode(true);
	self.zoomedImage.classList.add("zoomed");
	self.zoomedImage.removeAttribute("id");
	if(self.opts.imageUrl != null){
		self.zoomedImage.setAttribute("src", self.opts.imageUrl);
	}
	if(wrapper == null){
		wrapper = document.createElement("div");
		wrapper.classList.add("zoomable");
		wrapper.classList.add("zoomableInPlace");
		wrapper.appendChild(self.zoomedImage);
		original.parentNode.appendChild(wrapper);
		inPlace = true;
	} else {
		wrapper.classList.add("zoomable");
		wrapper.appendChild(self.zoomedImage);
		inPlace = false;
	}
	self.zoomedImage.onload = function(){
		// Single trigger
		self.zoomedImage.onload = null;

		var transitionString = "opacity " + self.opts.appearDuration + "s, top 0.1s, left 0.1s";	
		self.zoomedImage.style.webkitTransition = transitionString;
		self.zoomedImage.style.mozTransition = transitionString;
		self.zoomedImage.style.transition = transitionString;
		window.onresize = self.recalcDimensions;
		self.recalcDimensions();
		self.enable();
	}
	this.enable = function(){
		attach(original,"mousemove", recalcOffsets);
		attach(original,"mouseenter", setActive);
		attach(original,"mouseleave", setInactive);
	}
	this.disable = function(){
		detach(original,"mousemove", recalcOffsets);
		detach(original,"mouseenter", setActive);
		detach(original,"mouseleave", setInactive);
	}
	this.delete = function(){
		wrapper.remove();
	}
	function active(active){active?setActive():setInactive();}
	function setActive(){wrapper.classList.add("active");}
	function setInactive(){wrapper.classList.remove("active");}

	function recalcOffsets(e){
		setActive();
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
		}
		self.zoomedImage.style.top	= -offsets.y + "px";
		self.zoomedImage.style.left	= -offsets.x + "px";
	}
	this.recalcDimensions = function(){
		setInactive();
		if(position != null){
			var resOpts = {
				height: position.height,
				width: position.width,
				top: original.offsetTop,
				left: original.offsetLeft,
				position: "absolute"
			};
			if(!!position.top)		resOpts.top		= original.offsetTop - (position.height + position.top);
			if(!!position.bottom)	resOpts.top		= original.offsetTop + original.clientHeight + position.bottom;
			if(!!position.left)		resOpts.left	= original.offsetLeft - (position.width + position.left);
			if(!!position.right)	resOpts.left	= original.offsetLeft + original.clientWidth + position.right;
			for(var k in resOpts)
				self.opts.target.style[k] = resOpts[k];
		}
		dims = {
			x: original.clientWidth,
			y: original.clientHeight
		};
		scrollOn = {
			x: dims.x * (1 - (2 * self.opts.deadarea)),
			y: dims.y * (1 - (2 * self.opts.deadarea))
		};
		if(inPlace){
			wrapper.style.top		= original.offsetTop + "px";
			wrapper.style.left		= original.offsetLeft + "px";
			wrapper.style.width 	= dims.x + "px";
			wrapper.style.height	= dims.y + "px";
		}
		proportion = Math.min(
			self.zoomedImage.naturalWidth / dims.x,
			self.zoomedImage.naturalHeight / dims.y,
			self.opts.maxZoom
		);
		offsetProportion = (proportion - 1);
		self.zoomedImage.style.width	= (dims.x * proportion) + "px";
		self.zoomedImage.style.height	= (dims.y * proportion) + "px";
		proportionFactor = {
			x: dims.x * proportion - wrapper.clientWidth,
			y: dims.y * proportion - wrapper.clientHeight,
		};
		substractedDims = {
			x: self.opts.deadarea * dims.x,
			y: self.opts.deadarea * dims.y
		};
		antiSubstractedProportions = offsetProportion / (1 - (self.opts.deadarea * 2));
	}
	this.delete = function(){
		self.disable();
		self.zoomedImage.parentNode.removeChild(self.zoomedImage);
		if(wrapper.classList.contains("active"))
			wrapper.classList.remove("active") && setTimeout(function(){wrapper.parentNode.removeChild(wrapper);}, self.opts.appearDuration * 100);
		else
			wrapper.parentNode.removeChild(wrapper);
	}
}