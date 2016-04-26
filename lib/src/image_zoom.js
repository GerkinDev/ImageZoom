/**
 * @file Class file for {@link ImageZoom}
 * @author Alexandre Germain <agermain@gerkindevelopment.net>
 * @version 0.2.0:indev
 */

/**
 * @callback EventFunction
 * @param {object} event Event object emitted
 */
/**
 * @typedef DOMElement
 * @type {object}
 * @description {@link http://www.w3schools.com/jsref/dom_obj_all.asp See definition on w3schools.com}
 * @see http://www.w3schools.com/jsref/dom_obj_all.asp
 */
/**
 * @typedef ElementZoomable
 * @type {DOMElement|jQuery|string}
 * @description This type represents every possible type basically handled by ImageZoom
 */

var ImageZoom;
(function(){
	/**
	 * @class ImageZoom
	 * @param   {ElementZoomable}	selector Image           to use for zoom
	 * @param	{object} options Options  for this instance
	 * @param   {number} [options.maxZoom=2] Maximum zoom level done by this instance.
	 * @param   {ImageZoom.mode} [options.mode=variable] Mode for moving zoomed image
	 * @param   {number} [options.deadarea=0.1] Thickness of the inner border delimitating the moving area. 0 <= x < 0.5
	 * @param   {number} [options.appearDuration=0.5] Time of the appear/disappear transition. 0 <= x
	 * @param   {DOMElement|object} [options.targetContainer=null] Element to put zoomed image in. If set to null, the zoomed image will appear of top of original image.
	 * @param   {string} [options.imageUrl=null] Explicit URL to the full size image. If not set, it will be retrieved from attribute 'data-fullwidth-src' of image, falling back on 'src'
	 * @param   {string} [options.backgroundImageColor=null] Explicit CSS value for the background. Transparent if not set.
	 * @param   {boolean} [options.forceNaturalProportions=true] If set to false, image will keep size deformation. If set to true, it will be automatically resized to keep original proportions.
	 */
	ImageZoom = function(selector, options){
		var self = this;

		// Getting the image to zoom
		var original;
		if(jQuery && (selector instanceof jQuery)){
			original = selector[0];
		} else if(typeof selector === "string" || selector instanceof String){
			if(!document.querySelector){
				throw "Your browser does not support querySelector";
			}
			original = document.querySelector(selector);
		} else if(isElement(selector)){
			original = selector;
		}


		// First pass of setting by defaults
		self.opts = mergeRecursive({
			maxZoom: 2,
			deadarea: 0.1,
			appearDuration: 0.5,
			targetContainer: null,
			imageUrl: null,
			backgroundImageColor: null,
			forceNaturalProportions: true
		}, options);
		if(self.opts.targetContainer && typeof self.opts.targetContainer == "object"){
			if(jQuery && (self.opts.targetContainer instanceof jQuery)){ // Target container given as jQuery object. Extract the first
				self.opts.targetContainer = (self.opts.targetContainer.length > 0 ? self.opts.targetContainer[0] : null);
			} else if(isElement(self.opts.targetContainer)){ // Target container directly given as DOMElement
				// No transform needed
			} else if(self.opts.targetContainer.constructor.name == "Object"){ // Target container defined by rect
				// topt => Target options
				var topt = self.opts.targetContainer;
				if(typeof topt.width != "number" || topt.width <= 0){
					topt.width = original.width;
				}
				if(typeof topt.height != "number" || topt.height <= 0){
					topt.height = original.height;
				}
				console.log(topt);
				if((!topt.width) || (!topt.height) || ((!topt.left) && (!topt.right) && (!topt.top) && (!topt.bottom))){
					console.warn("Missing position attributes for Zoomable Image targetContainer: ", topt);
					self.opts.targetContainer = null;
				} else {
					position = topt;
					self.opts.targetContainer = document.createElement("div");
					self.opts.targetContainer.classList.add("zoomable");
					original.parentNode.appendChild(self.opts.targetContainer);
					// inPlace set when test wrapper
				}
			}
		}

		// Defaults depending on targetContainer 
		console.log(self.opts);
		self.opts = mergeRecursive({
			mode: self.opts.targetContainer ? ImageZoom.mode.HOVER : ImageZoom.mode.DRAG
		}, self.opts);

		// Generate wrapper
		var wrapper = self.opts.targetContainer,
			inPlace;
		if(wrapper == null){
			wrapper = document.createElement("div");
			wrapper.classList.add("zoomableInPlace");
			original.parentNode.appendChild(wrapper);
			inPlace = true;
		} else {
			inPlace = false;
		}
		wrapper.classList.add("zoomable");

		// Clone and clean image
		var zoomedImage = original.cloneNode(true);
		zoomedImage.classList.add("zoomed");
		["src","height","width","srcset","sizes","id","style"].forEach(function(attr){
			zoomedImage.removeAttribute(attr);
		});
		if(self.opts.imageUrl != null)
			zoomedImage.setAttribute("src", self.opts.imageUrl);
		else
			zoomedImage.setAttribute("src", original.getAttribute("data-fullwidth-src") ? original.getAttribute("data-fullwidth-src") : original.getAttribute("src"));
		if(self.opts.backgroundImageColor != null)
			zoomedImage.style.background = self.opts.backgroundImageColor;
		self.zoomedImage = zoomedImage;

		// Put image in wrapper
		wrapper.appendChild(zoomedImage);

		console.log(inPlace, self.opts.mode);

		var proportions;

		/**
		 * @snippetStart waitLoaded
		 */
		setTimeout(function(){
			if(zoomedImage.complete && original.complete && zoomedImage.naturalWidth != 0 && zoomedImage.naturalHeight != 0){
				initLoaded();
			} else {
				intervalTestLoaded = setInterval(function(){
					if(zoomedImage.complete && original.complete && zoomedImage.naturalWidth != 0 && zoomedImage.naturalHeight != 0){
						clearInterval(intervalTestLoaded);
						initLoaded();
					}
				}, 50);
			}
		}, 50);
		/**
		 * @snippetEnd waitLoaded
		 */

		/*****************************************\
		|************ PRIVATE INSTANCE ***********|
		\*****************************************/
		var intervalTestLoaded = null;
		/**
		 * @function initLoaded
		 * @memberof ImageZoom
		 * @summary Check if all is ok and end initialization
		 * @description This function meant to be called when natural image is fully loaded. Detection of ready status is done by reading the "complete" status of the target image, and its natural dimensions. Constructor call this: {@snippet waitLoaded}
		 * @private
		 * @instance
		 * @since 0.1.0
		 */
		function initLoaded(){
			clearInterval(intervalTestLoaded);

			var transitionString = "opacity " + self.opts.appearDuration + "s";	
			zoomedImage.style.webkitTransition = transitionString;
			zoomedImage.style.mozTransition = transitionString;
			zoomedImage.style.transition = transitionString;
			attach(window,"resize",checkZoomable);
			checkZoomable();
		}

		/**
		 * @function checkZoomable
		 * @memberof ImageZoom
		 * @summary Check if we need to zoom
		 * @description Check if it is useful to enable the ImageZoom, IE if zoomed image will be bigger than source.
		 * @private
		 * @instance
		 * @since 0.2.0
		 */
		function checkZoomable(){
			var zoomable = self.recalculatePositions();
			if(zoomable){
				self.enable();
			}
		}

		/**
		 * @function active
		 * @memberof ImageZoom
		 * @summary Set visible or not the zoomed image
		 * @description Add or remove classes to set visible or not the zoomed image
		 * @param {boolean} active Active state. True for active, false for inactive
		 * @private
		 * @instance
		 * @since 0.1.0
		 */
		function active(active){!!active?setActive():setInactive();}

		/**
		 * @function setActive
		 * @memberof ImageZoom
		 * @summary Set image visible
		 * @description Shorthand for {@link ImageZoom.active ImageZoom.active(true)}
		 * @private
		 * @instance
		 * @since 0.1.0
		 */
		function setActive(){wrapper.classList.add("active");}

		/**
		 * @function setInactive
		 * @memberof ImageZoom
		 * @summary Set image invisible
		 * @description Shorthand for {@link ImageZoom.active ImageZoom.active(false)}
		 * @private
		 * @instance
		 * @since 0.1.0
		 */
		function setInactive(){wrapper.classList.remove("active");}

		/**
		 * @function recalcOffsets
		 * @memberof ImageZoom
		 * @summary Reposition inner zommed image in container
		 * @description According to configuration, it will convert the relative (percent) needed positionning of child zoomed image to absolute (px) position.
		 * @param {object} e Resize event object
		 * @private
		 * @instance
		 * @since 0.1.0
		 */
		function recalcOffsets(e){
		}


		/*****************************************\
		|*********** PUBLIC INSTANCE *************|
		\*****************************************/
		/**
		 * @function enable
		 * @memberof ImageZoom
		 * @summary Set ImageZoom active. It will catch all required events.
		 * @description Bind all events to the object, allowing ImageZoom to behave like it is intended to behave.
		 * @returns {this} This object for chained calls
		 * @public
		 * @instance
		 * @since 0.1.0
		 */
		this.enable = function(){
			attach(original,"mousemove", recalcOffsets);
			attach(original,"mouseenter", setActive);
			attach(original,"mouseleave", setInactive);
			return self;
		}

		/**
		 * @function disable
		 * @memberof ImageZoom
		 * @summary Set ImageZoom inactive. It won't catch any events.
		 * @description uUnbind all events to the object, setting ImageZoom in a "sleep" status.
		 * @returns {this} This object for chained calls
		 * @public
		 * @instance
		 * @since 0.1.0
		 */
		this.disable = function(){
			detach(original,"mousemove", recalcOffsets);
			detach(original,"mouseenter", setActive);
			detach(original,"mouseleave", setInactive);
			return self;
		}

		this.refreshZoomedPosition = function(){

		}

		/**
		 * @function recalculatePositions
		 * @memberof ImageZoom
		 * @summary Recalculate proportions, zoom factor, dimensions and position.
		 * @description Calculates every required values and check if a zoom is required. Those values will then be used on events to move zoomed image. This function is automatically called on window.onresize, but can be called manually if it behaves anormally
		 * @returns {boolean} True if valid dimensions and zoom can be done. False otherwise
		 * @public
		 * @instance
		 * @since 0.1.0
		 */
		this.recalculatePositions = function(){
			var dims = {
				wrapper: {
					width: wrapper.clientWidth,
					height: wrapper.clientHeight
				},
				image: {
					width: original.clientWidth,
					height: original.clientHeight
				},
				natural: {
					width: original.naturalWidth,
					height: original.naturalHeight
				}
			}
			console.log(wrapper,original, JSON.stringify(dims));
			proportions = {
				width: dims.image.width / dims.natural.width,
				height: dims.image.height / dims.natural.height,
			}
			if(
				(proportions.width >= 1 || proportions.height >= 1) // If original is already stretched
			){
				console.log("Invalid sized image: already stretched");
				return false;
			}
			
			console.log(inPlace);
			if(inPlace){ // Copy size if container overlays the original image
				wrapper.style.top		= original.offsetTop + "px";
				wrapper.style.left		= original.offsetLeft + "px";
				wrapper.style.width = dims.image.width + "px";
				wrapper.style.height = dims.image.height + "px";
			}
			
			return true;
		}

		/**
		 * @function delete
		 * @memberof ImageZoom
		 * @summary Delete the instance's elements
		 * @description Delete event listeners, remove DOM elements created by object, and returns undefined.
		 * @returns {undefined} Undefined to call&assign with delete
		 * @public
		 * @instance
		 * @since 0.1.0
		 */
		this.delete = function(){
			self.disable();
			zoomedImage.parentNode.removeChild(zoomedImage);
			if(wrapper.classList.contains("active"))
				wrapper.classList.remove("active") && setTimeout(function(){wrapper.parentNode.removeChild(wrapper);}, self.opts.appearDuration * 100);
			else
				wrapper.parentNode.removeChild(wrapper);

			return undefined;
		}
	}

	/*****************************************\
	|************** PUBLIC STATIC ************|
	\*****************************************/
	/**
	 * @function batchCreate
	 * @memberof ImageZoom
	 * @summary Create ImageZoom instances on several elements at once
	 * @description Loops through all provided elements and create every possible ImageZoom items. jQuery object will be explored, even if in array, and string will be handled with QuerySelectorAll.
	 * @param {ElementZoomable|ElementZoomable[]} selector Items to create ImageZoom objects on
	 * @param {object} options  Options
	 * @return {ImageZoom[]} Created items
	 * @public
	 * @static
	 * @since 0.2.0
	 */
	ImageZoom.batchCreate = function(selector, options){

	}

	/**
	 * @readonly
	 * @enum {number}
	 * @memberof ImageZoom
	 */
	ImageZoom.mode = {
		/** Zoomed image will tend to follow the pointer. Default for not in place zoomed image, with a thumbnail as map */
		HOVER: 0,
		/** Zoomed image will go in the opposite direction of the cursor, like if it was dragged. Default for in-place */
		DRAG: 1
	}

	/*****************************************\
	|************* PRIVATE STATIC ************|
	\*****************************************/
	/**
	 * @function attach
	 * @memberof ImageZoom
	 * @description Bind events with specified functions on specified elements
	 * @param {DOMElement|DOMElement[]}					a	DOMElements to bind
	 * @param {string|string[]}					b	Events to bind
	 * @param {EventFunction|EventFunction[]}	c	Functions to attach
	 * @private
	 * @static
	 * @since 0.1.0
	 */
	function attach(a,b,c){
		/**
		 * @function _attach
		 * @memberof ImageZoom
		 * @description Single-valued version of {@link ImageZoom.attach attach}. Should not be called directly
		 * @param {DOMElement}			d DOMElement to bind
		 * @param {string}			e Event to bind
		 * @param {EventFunction}	c Function to attach
		 * @private
		 * @static
		 * @since 0.1.0
		 */
		function _attach(a,b,c){a&&b&&c&&(a.addEventListener?a.addEventListener(b,c):a.attachEvent(b,c));}
		if(a==null||typeof a=="undefined"||a.constructor.name!="Array")a=[a];
		if(b==null||typeof b=="undefined"||b.constructor.name!="Array")b=[b];
		if(c==null||typeof c=="undefined"||c.constructor.name!="Array")c=[c];
		var i=0,j=0,k=0,I=a.length,J=b.length,K=c.length;
		for(i=0;i<I;i++){for(j=0;j<J;j++){for(k=0;k<K;k++){
			_attach(a[i],b[j],c[k]);
		}}}
	}

	/**
	 * @function detach
	 * @memberof ImageZoom
	 * @description Unbind events with specified functions on specified elements
	 * @param {DOMElement|DOMElement[]}					a	DOMElements to unbind
	 * @param {string|string[]}					b	Events to unbind
	 * @param {EventFunction|EventFunction[]}	c	Functions to detach
	 * @private
	 * @static
	 * @since 0.1.0
	 */
	function detach(a,b,c){
		/**
		 * @function _detach
		 * @memberof ImageZoom
		 * @description Single-valued version of {@link ImageZoom.detach detach}. Should not be called directly
		 * @param {DOMElement}			d DOMElement to unbind
		 * @param {string}			e Event to unbind
		 * @param {EventFunction}	c Function to detach
		 * @private
		 * @static
		 * @since 0.1.0
		 */
		function _detach(a,b,c){a&&b&&c&&(a.removeEventListener?a.removeEventListener(b,c):a.detachEvent(b,c));}
		if(a==null||typeof a=="undefined"||a.constructor.name!="Array")a=[a];
		if(b==null||typeof b=="undefined"||b.constructor.name!="Array")b=[b];
		if(c==null||typeof c=="undefined"||c.constructor.name!="Array")c=[c];
		var i=0,j=0,k=0,I=a.length,J=b.length,K=c.length;
		for(i=0;i<I;i++){for(j=0;j<J;j++){for(k=0;k<K;k++){
			_detach(a[i],b[j],c[k]);
		}}}
	}

	/**
	 * @function isElement
	 * @memberof ImageZoom
	 * @description Check if provided element is usable for DOM manipulations
	 * @param {object} o Element to check
	 * @return {boolean} True if usable for DOM manipulations
	 * @private
	 * @static
	 * @since 0.1.0
	 */
	function isElement(o){return(typeof HTMLElement==="object"?o instanceof HTMLElement:o&&typeof o==="object"&&o!==null&&o.nodeType===1&&typeof o.nodeName==="string");}

	/**
	 * @function mergeRecursive
	 * @memberof ImageZoom
	 * @description Merges 2 objects recursively.
	 * @param {object} obj1 Base object
	 * @param {object} obj2 Override object
	 * @return {object} Merged
	 * @private
	 * @static
	 * @since 0.1.0
	 */
	function mergeRecursive(obj1, obj2) {
		for (var p in obj2) {
			try {
				// Property in destination object set; update its value.
				if ( obj2[p].constructor==Object ) {
					obj1[p] = mergeRecursive(obj1[p], obj2[p]);
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
})();
