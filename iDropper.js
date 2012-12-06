(function($) {

	/**
	 * Color math and other utility functions
	 */
	var

	isValidHex = function(hex) { return typeof hex === "string" && hex.match(/^#?[0-9a-fA-F]{6}$/i); },

	RgbFromHCM = function(hue, chroma, match) {
		var rgb, hp = hue/60, x = chroma*(1 - Math.abs(hp%2 - 1));
		if(hp < 1) rgb = [chroma,x,0];
		else if(hp < 2) rgb = [x,chroma,0];
		else if(hp < 3) rgb = [0,chroma,x];
		else if(hp < 4) rgb = [0,x,chroma];
		else if(hp < 5) rgb = [x,0,chroma];
		else if(hp < 6) rgb = [chroma,0,x];
		return [parseInt(255*(rgb[0]+match),10), parseInt(255*(rgb[1]+match),10), parseInt(255*(rgb[2]+match),10)];
	},
	HslToRgb = function(hsl) {
		var h = hsl[0], s = hsl[1], l = hsl[2],
			c = (1 - Math.abs(2*l - 1))*s,
			m = l - 0.5*c;
		return RgbFromHCM(h,c,m);
	},
	HsvToRgb = function(hsv) {
		var h = hsv[0], s = hsv[1], v = hsv[2],
			c = v*s, m = v - c;
		return RgbFromHCM(h,c,m);
	},
	_RgbToHex = function(rgb) {
		var hex = [], bit;
		if(rgb[3] === 0) return 'transparent';
		for(var i = 0; i < 3; i++) {
			bit = (rgb[i] - 0).toString(16);
			hex.push(bit.length == 1 ? ('0' + bit) : bit);
		}
		return '#' + hex.join('');
	},
	RgbToHex = function(rgb) {
		var match;
		if(typeof rgb === "string") {
			if(isValidHex(rgb)) return rgb;
			match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
			if(match) {
				match.shift();
				rgb = match;
			}
		}
		if(typeof rgb !== "object" || !(rgb instanceof Array)) return null;
		else return _RgbToHex(rgb);
	},
	HexToRgb = function(hex) {
		hex = hex.replace(/#/g,'');

		if(hex.length !== 6) return false;

		var
		r = parseInt(hex.substr(0,2), 16),
		g = parseInt(hex.substr(2,2), 16),
		b = parseInt(hex.substr(4,2), 16);
		return [r,g,b];
	},
	RgbToHsl = function(rgb) {
		var r = rgb[0]/255,
			g = rgb[1]/255,
			b = rgb[2]/255,
			max = Math.max(r, g, b),
			min = Math.min(r, g, b),
			d, h, s, l = (max + min) / 2;

		if(max === min){
			h = s = 0;
		} else {
			d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch(max){
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
			h *= 60;
		}
		return [h,s,l];
	},
	RgbToHsv = function(rgb){
		var r = rgb[0]/255,
			g = rgb[1]/255,
			b = rgb[2]/255,
			max = Math.max(r, g, b),
			min = Math.min(r, g, b),
			h, s, v = max,
			d = max - min;

		s = max === 0 ? 0 : d / max;

		if(max === min){
			h = 0;
		} else {
			switch(max){
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
			h *= 60;
		}
		return [h, s, v];
	},

	HexToHsl = function(hex) { return RgbToHsl(HexToRgb(hex)); },
	HslToHex = function(hsl) { return _RgbToHex(HslToRgb(hsl)); },

	HexToHsv = function(hex) { return RgbToHsv(HexToRgb(hex)); },
	HsvToHex = function(hsv) { return _RgbToHex(HsvToRgb(hsv)); },

	HsvToHsl = function(hsv) {
		var h=hsv[0], s=hsv[1], v=hsv[2],
		L = v-0.5*v*s,
		S = v*s/(1-Math.abs(2*L-1));
		if(!S) S = 0;
		return [h,S,L];
	},

	/**
	 * Forces the number to be within a range. Format is [lower, upper)
	 * @param       n           Number to force within range
	 * @param       lower       Number lower range
	 * @param       upper       Number upper range
	 * @param       wrap        Boolean optional, determines if number should wrap around
	 */
	wrapInRange = function(n, lower, upper, wrap) {
		if(lower > upper) { var tmp = lower; lower = upper; upper = tmp; }

		if(wrap) {
			var d = upper - lower;      // normalize
			n = (n-lower)%d;

			if(n < 0) n += d;
			else if(n > d) n -= d;
			n += lower;
		} else {
			if(n < 0) n = lower;
			else if(n > upper) n = upper;
		}
		return n;
	},

	/**
	 * Performs color math on the given hex. If changes.wrap is set, will wrap lightness && saturation
	 * @param       hex         String representing the color to change
	 * @param       changes     Object where hash is either 'h', 's', or 'l' with amt value
	 */
	changeColor = function(hex, changes) {
		if(typeof changes !== 'object') return null;
		var hsl;

		if(isValidHex(hex)) {
			hsl = HexToHsl(hex);
		} else if(Object.prototype.toString.call(hex) === '[object Array]' && hex.length === 3) {
			hsl = [hex[0], hex[1], hex[2]];
		} else {
			return null;
		}

		if(typeof changes.h === 'number') {
			hsl[0] = wrapInRange(hsl[0] + changes.h, 0, 360, true);
		}
		if(typeof changes.s === 'number') {
			hsl[1] = wrapInRange(hsl[1] + changes.s, 0, 1, changes.wrap || changes.wrapS);
		}
		if(typeof changes.l === 'number') {
			hsl[2] = wrapInRange(hsl[2] + changes.l, 0, 1, changes.wrap || changes.wrapL);
		}
		return HslToHex(hsl);
	},

	lighten = function(hex, amt) { return changeColor(hex, {'l': amt}); },
	darken = function(hex, amt) { return lighten(hex, -amt); },
	saturate = function(hex, amt) { return changeColor(hex, {'s': amt}); },
	desaturate = function(hex, amt) { return saturate(hex, -amt); },
	changeHue = function(hex, deg) { return changeColor(hex, {'h': deg}); },
	complement = function(hex) { return changeColor(hex, {'h': 180}); },

	/**
	 * Function to write out CSS rule
	 * @param      selector      String css selector
	 * @param      attrObj       Object where key represents attribute and val represents value
	 */
	cssStringify = function(selector, attrObj) {
		var str = selector + " {\n";
		for(var key in attrObj) if(attrObj.hasOwnProperty(key)) {
			str += "\t" + key + ": " + attrObj[key] + ";\n";
		}
		str += "}\n";
		return str;
	};


	/**
	 * Utilities and stuff
	 */
	$.iDropper = {
		lighten:          lighten,
		darken:           darken,
		saturate:         saturate,
		desaturate:       desaturate,
		changeHue:        changeHue,
		complement:       complement,
		changeColor:      changeColor,
		RgbToHex:         RgbToHex,
		HslToHex:         HslToHex,
		cssStringify:     cssStringify
	};



	// tweet-sized templating
	// http://mir.aculo.us/2011/03/09/little-helpers-a-tweet-sized-javascript-templating-engine/
	function t(s,d){
		for(var p in d) s=s.replace(new RegExp('{'+p+'}','g'), d[p]);
		return s;
	}

	var template = '\
		<div class="iD iD-layout-{layout}">\
			<div class="iD-sv-container iD-sv-container-{layout}">\
				<img src="{srcSatVal}" class="iD-img">\
				<div class="iD-indicator-color"></div>\
				<div class="iD-cover-color iD-pick iD-sv-pick"></div>\
			</div>\
			<div class="iD-hue-container iD-hue-container-{layout}">\
				<img src="{srcHue}" class="iD-img">\
				<div class="iD-indicator-hue"></div>\
				<div class="iD-cover-hue iD-pick iD-hue-pick"></div>\
			</div>\
			<div class="iD-preview-input">\
				<div class="iD-preview"></div>\
				<div class="iD-input-container">\
					<input class="iD-input-field" type="text">\
				</div>\
			</div>\
		</div>';


	/**
	 * Figuring out image path
	 * In order to support setting colorpicker dimension without relying on CSS3 (background-size) or Canvas to draw the picker model,
	 * we must represent with an image and resize it accordingly. The only way to reliably predict the path of the image to set on the
	 * src attribute (and also to keep a formal layer separation), the image is set as the background of a class in the CSS, we can
	 * then pull the image path by reading the background-image css attribute on that class.
	 */
	var $imgPathEl = $('<div/>').appendTo($("body")),
		URL = {
			SATVAL:   $imgPathEl.attr('class','iD-img-sv').css('background-image').replace(/"/g,"").replace(/url\(|\)$/ig, ""),
			HUEBAR:   $imgPathEl.attr('class','iD-img-huebar').css('background-image').replace(/"/g,"").replace(/url\(|\)$/ig, ""),
			HUERING:  $imgPathEl.attr('class','iD-img-huering').css('background-image').replace(/"/g,"").replace(/url\(|\)$/ig, "")
		};
		$imgPathEl.remove();


	/**
	 * Global dimension setup
	 */
	var fullSize =    256,										// original width of the saturation-value map
		fullRSize =   482,										// full ring size, original width of hue ring
		ringHalf =    50/2,										// Hue ring's (outter_radius - inner_radius)/2

		indicatorPercent = (fullRSize/2-ringHalf)/fullRSize,	// percent of hue ring's width from center point where indicator sits
		radiansToDegrees = 360/(2*Math.PI),

		IE = /MSIE (\d+\.\d+);/.test(navigator.userAgent) ? parseFloat(RegExp.$1) : NaN,
		IE6 = IE === 6,

		keysToAccept = // Keys to filter in when user types in input field
		//BKSPACE TAB  LEFT UP  RIGHT DOWN  0  1  2  3  4  5  6  8  8  9    a  b  c  d  e  f    v    numpad 0-9
		 [8,      9,   37,  38, 39,   40,   48,49,50,51,52,53,54,55,56,57,  65,66,67,68,69,70,  86,  96,97,98,99,100,101,102,103,104,105];



	 var dragCtx = null;
	 function bindMouseEventsOnBody($body) {
		 if(!$body.data('iDropper_drag_bounded')) {
			 if(IE) $body.addClass("ie ie"+IE);
			 $body.data('iDropper_drag_bounded', true);
			 $body.on('mouseup.idropper', function(e) { if(dragCtx) dragCtx.dragDone(e); });
			 $body.on('mousemove.idropper', function(e) { if(dragCtx) dragCtx.dragMove(e); });
		 }
	 }



	/**
	 * Color Picker Class
	 *
	 * Possible option settings:
	 * @param   size        Integer pixel of the width/height of the square hue/value box
	 * @param   onChange    Function that's triggered when the color selection changes
	 * @param   type        String indicates which type of layout to use. Either 'bar' or 'ring'. Default 'bar'
	 */
	 var IDropper = function() { IDropper.prototype.initialize.apply(this, arguments); };
	 IDropper.prototype = {

		 initialize: function(opts) {
			 var $el =   this.$el = opts.$el;
			 var $body = this.$body = this.$el.parents('body');
			 var doc =   this.doc = $el[0].ownerDocument;
			 var win =   this.win = doc.defaultView || doc.parentWindow;
			 this.$win = $(win);


			 this.hideHash = opts.hideHash;                           // Toggle for hash character in input field
			 this.size =  opts.size || fullSize;                      // width-height of square saturation-value container
			 this.hsv = [0,1,1],                                      // current color of picker
			 this.utils = $.iDropper;                                 // Expose color math and utility functions
			 this.ringSize = fullRSize*this.size/fullSize,            // hue ring is proportional to size input
			 this.ringRadius = this.ringSize/2,                       // allows for normalizing axis later
			 this.hypotenuse = this.ringSize*indicatorPercent,        // hue ring's indicator radius
			 this.layout = opts.layout === 'ring' ? 'ring' : 'bar',   // layout is either bar or ring

			 // bind drag event to body of element (not necessary window in which $ lives)
			 bindMouseEventsOnBody($body);

			 // Prevents dragging image ghost
			 $body.on('mousedown', 'img.iD-pick', function(e) { e.preventDefault(); });

			 $el.on('mousedown', '.iD-hue-pick', $.proxy(function(e) { this.dragStart(e, 'hue'); }, this));
			 $el.on('mousedown', '.iD-sv-pick', $.proxy(function(e) { this.dragStart(e, 'sv'); }, this));
			 $el.on('keydown', '.iD-input-field', $.proxy(this, 'inputKeydown'));
			 $el.on('keyup', '.iD-input-field', $.proxy(this, 'inputKeyup'));

			 // Bind user-specified events
			 if(typeof opts.onChange === "function") $el.on('change', $.proxy(opts.onChange,this));
			 if(typeof opts.onStart === "function") $el.on('start', $.proxy(opts.onStart,this));
			 if(typeof opts.onDrag === "function") $el.on('drag', $.proxy(opts.onDrag,this));
			 if(typeof opts.onEnd === "function") $el.on('end', $.proxy(opts.onEnd,this));


			// burning out template into instantiated element
			this.$iD = $(t(template, {
				layout: this.layout,
				srcSatVal: URL.SATVAL,
				srcHue: this.layout === 'ring' ? URL.HUERING : URL.HUEBAR
			})).appendTo($el);

			// Element Reference, tabbed in tree heirarchy
			this.$svContainer = this.$iD.find('.iD-sv-container');
				this.$svImg = this.$svContainer.find('.iD-img');
				this.$colorIndicator = this.$svContainer.find('.iD-indicator-color');
				this.$colorCover = this.$svContainer.find('.iD-cover-color');
			this.$hueContainer = this.$iD.find('.iD-hue-container');
				this.hueImg = this.$hueContainer.find('.iD-img');
				this.$hueIndicator = this.$hueContainer.find('.iD-indicator-hue');
				this.$hueCover = this.$hueContainer.find('.iD-cover-hue');
			this.$previewInputContainer = this.$iD.find('.iD-preview-input');
				this.$preview = this.$previewInputContainer.find('.iD-preview');
				this.$inputContainer = this.$previewInputContainer.find('.iD-input-container');
					this.$input = this.$inputContainer.find('.iD-input-field');


			/**
			 * Final initializing and such
			 */
			var hueWidth = parseInt(this.size/13,10);
			if(typeof opts.size === 'number') {
				this.$svContainer.css({ width: this.size, height: this.size });

				if(this.layout === 'ring') {
					this.$iD.css({ width: this.ringSize, height: this.ringSize });
					this.$hueContainer.css({ width: this.ringSize, height: this.ringSize });
				} else {
					this.$hueContainer.css({ width: hueWidth, height: this.size });
				}
			}

			if(IE6) {
				if(this.layout === 'ring') {
					this.$hueImg.remove();
					$('<span/>')
						.addClass('iD-ie6huefix iD-pick')
						.prependTo(this.$hueContainer)
						.height(this.ringSize);
				}
				this.$svImg.remove();
				$('<span/>')
					.addClass('iD-ie6svfix iD-pick')
					.prependTo(this.$svContainer)
					.height(this.size);
			}

			// Set initial color
			opts.color = opts.color || '#ff0000';
			this.setColor(opts.color, true);
		 },


		 /**
		  * Keydown from input field, filters out invalid characters
		  */
		 inputKeydown: function(e) {
			 return ($.inArray(e.keyCode, keysToAccept) !== -1);
		 },

		 /**
		  * Keyup from input field, only trigger "change" event if hex is valid
		  */
		inputKeyup: function() {
			var hex = fn.setColor($input.val());
			if(hex) this.$el.trigger('change', hex, this.hsl);
			return false;
		},

			// Updates text input field
			updateInput: function(hex) {
				if(this.hideHash) hex = hex.substr(1);
				this.$input.val(hex);
			},

			// Convert hsv to hex (or use instance's activeHSV if none is defined)
			getHex: function(hsv) {
				if(!hsv) hsv = this.hsv;
				return _RgbToHex(HsvToRgb(hsv));
			},
			setPreview: function(hex) {
				if(!hex) hex = this.getHex();
				if(isValidHex(hex)) {
					if(hex.charAt(0) !== "#") hex = "#"+hex;
					this.$preview.css('background-color', hex);
					return hex;
				}
			},
		 setColor: function(hex, disableCallback) {
			 hex = this.setColorSilent(hex);
			 if(hex) {
				 this.updateInput(hex);

				 // Option to disable "change" callback (in case we *only* want to update the color)
				 if(!disableCallback) this.$el.trigger('change', hex, this.hsl);
			 }
			 return hex;
		 },

		 setColorSilent: function(hex) {
			 hex = RgbToHex(hex);
			 if(isValidHex(hex)) {
				 var hsv = HexToHsv(hex);

				 // sets instance's active hsv and color
				 this.hsv = hsv;
				 this.hex = hex;
				 this.hsl = HsvToHsl(hsv);

				 // Setting hue
				 if(this.layout === 'ring') this._hueDrag({theta: (270-hsv[0])/radiansToDegrees});
				 else this._hueDrag({y: this.size - this.size*hsv[0]/360});

				 // Setting saturation/value
				 this._svDrag({x: this.size*hsv[1], y: this.size*(1-hsv[2])});

				 hex = this.setPreview(hex);
				 return hex;
			 }
	 },



			colorMath: function(hex, set) { if(set) this.set(hex); return hex; },
			darken: function(val, set) { return this.colorMath(darken(this.hsl, val), set); },
			lighten: function(val, set) { return this.colorMath(lighten(this.hsl, val), set); },
			saturate: function(val, set) { return this.colorMath(saturate(this.hsl, val), set); },
			desaturate: function(val, set) { return this.colorMath(desaturate(this.hsl, val), set); },
			changeHue: function(val, set) { return this.colorMath(changeHue(this.hsl, val), set); },
			complement: function(val, set) { return this.colorMath(complement(this.hsl, val), set); },
			changeColor: function(changes, set) { return this.colorMath(changeColor(this.hsl, changes), set); },

		/**
		 * Stores information about the drag
		 */
		 dragStart: function(e, type) {
			 dragCtx = this;
			 var tOffset = e.manual ? e : $(e.target).offset();
			 this.dragData = {
				 type: type,
				 ctx: this,
				 $el: this.$el,
				 tx: tOffset.left - this.$win.scrollLeft(),
				 ty: tOffset.top - this.$win.scrollTop() || 0
			 };
			 this.$body.addClass('iD-dragging');
			 this.$el.trigger('iD.start', this.dragData);
		 },

		 dragDone: function(e) {
			 dragCtx = null;
			 this.$el.trigger('end', this.hex);
			 this.$el.trigger('change', this.hex);
			 this.$body.removeClass('iD-dragging');
		 },

		 dragMove: function(e) {
			 var hex, m = { x : e.clientX - this.dragData.tx, y : e.clientY - this.dragData.ty };

			 // Keep drag within valid boundary
			 if(m.x < 0) m.x = 0;
			 if(m.y < 0) m.y = 0;

			 // fires either svdrag or huedrag, hsv gets updated
			 this['_'+this.dragData.type + 'Drag'](m);

			 hex = this.setPreview();
			 if(hex) {
				 this.hex = hex;
				 this.hsl = HsvToHsl(this.hsv);

				 this.updateInput(hex);
				 this.$el.trigger('drag', hex, this.hsl);
			 }
		 },

		 _svDrag: function(m) {
			 var size = this.size;
			 var hsv = this.hsv;
			 if(m.x > size) m.x = size;
			 if(m.y > size) m.y = size;

			 this.$colorIndicator.css({ left: m.x-3, top: m.y-3 });
			 hsv[1] = m.x/this.size;
			 hsv[2] = 1-m.y/this.size;
		 },

		 _hueRingDrag: function(m) {
			 var x, y, t, d;

			 if(m.theta) {
				 t = m.theta;
			 } else {
				 if(m.y > this.ringSize) m.y = this.ringSize;

				 x = m.x - this.ringRadius;
				 y = m.y - this.ringRadius;

				 if(x === 0) x = 0.00000001;
				 if(y === 0) y = 0.00000001;

				 t = Math.atan(y/x);
				 d = 90 - t*radiansToDegrees;

				 if((x>0 && y>0) || (x>0 && y < 0)) d+= 180;
				 this.hsv[0] = parseInt(d - 1, 10);
			 }

			 x = parseInt(this.hypotenuse*Math.cos(t) + this.ringRadius, 10);
			 y = parseInt(this.hypotenuse*Math.sin(t) + this.ringRadius, 10);

			 if(m.x < this.ringRadius) {
				 x = this.ringSize-x;
				 y = this.ringSize-y;
			 }

			 this.$hueIndicator.css({ top: y, left: x });
		 },
		 _hueBarDrag: function(m) {
			 if(m.y > this.size) m.y = this.size-1;
			 this.hsv[0] = parseInt(360*(1 - m.y/this.size), 10);
			 if(this.hsv[0] >= 360) this.hsv[0] = 359;
			 this.$hueIndicator.css({ top: m.y });
		 },
		 _hueDrag: function(m) {
			 if(this.layout === 'ring') this._hueRingDrag(m);
			 else if(this.layout === 'bar') this._hueBarDrag(m);
			 this.$svContainer.css('background-color', hex = this.getHex([this.hsv[0], 1, 1]));
		 }

	 };



	$.fn.iDropper = function(opts) {
		var $els = this;
		return this.each(function(i, el){
			var $el = $els.eq(i), settings = $.extend({ $el: $el }, opts);
			$el.data('iDropper', new IDropper(settings));
		});
	};

})(jQuery);