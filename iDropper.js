jQuery.fn.iDropper = (function($) {


	/**
	 * Color math and other utility functions
	 */
	var utils = (function(){
		var

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
				m = l - .5*c, rgb = [];
			return RgbFromHCM(h,c,m);
		},
		HsvToRgb = function(hsv) {
			var h = hsv[0], s = hsv[1], v = hsv[2],
				c = v*s, m = v - c, rgb = [];
			return RgbFromHCM(h,c,m);
		},
		RgbToHex = function(rgb) {
		    var hex = [], bit;
		    if(rgb[3] == 0) return 'transparent';
		    for(var i = 0; i < 3; i++) {
		        bit = (rgb[i] - 0).toString(16);
		        hex.push(bit.length == 1 ? ('0' + bit) : bit);
		    }
		    return '#' + hex.join('');
		},
		RgbToHsl = function(rgb) {
			var min = Math.min(rgb[0], Math.min(rgb[1], rgb[2])),
				max = Math.max(rgb[0], Math.max(rgb[1], rgb[2])),
				d = max-min,
				hsl = [], s, l = 0.5*(min + max);

			if(min == max) s = 0;
			if(l < 1/2)	s = (max-min)/(max+min);
			else s = (max - min) / (2 - (max + min));

			hsl[0] = utils.getHue(rgb,min,max,d); /* hue */
			hsl[1] = s; /* saturation */
			hsl[2] = l;   /* lightness */
			return hsl;
		},
		getHue = function(rgb,min,max,d) {
		    var hue; 
		    if (max === min) {
		        return 0;
		    } else {
				if(rgb[0] === max) hue = (rgb[1] - rgb[2]) / d; //between yellow & magenta
				else if(rgb[1] === max) hue = 2 + (rgb[2] - rgb[0]) / d; //between cyan & yellow
				else hue = 4 + (rgb[0] - rgb[1]) / delta; //between magenta & cyan

				hue = parseInt(hue * 60, 10);
				if(hue < 0) hue += 360;
			}
		    return hue;
		};

		return {
			HslToRgb: HslToRgb,
			HsvToRgb: HsvToRgb,
			RgbToHex: RgbToHex,
			RgbToHsl: RgbToHsl
		};
	})();







	/**
	 * Mouse up and move events (drag and dragend) are attached only once on the body
	 */
	var $body = $('body');
	var activeDropper = null;
	var iDfn = {
		preventGhost: function() { return false; }, // Stops bubbling, prevents dragging image ghost
		mouseup: function() { activeDropper = null; },
		mousemove: function(e) { if(activeDropper){ activeDropper.trigger('mousedrag', e); } }
	};
	$body.bind('mousemove.iDfn', iDfn['mousemove']);
	$body.bind('mouseup.iDfn', iDfn['mouseup']);
	$body.delegate('img.iD-pick', 'mousedown', iDfn['preventGhost']);





	/**
	 * Figuring out image path
	 * In order to support setting colorpicker dimension without relying on CSS3 (background-size) or Canvas to draw the picker model,
	 * we must represent with an image and resize it accordingly. The only way to reliably predict the path of the image to set on the
	 * src attribute (and also to keep a formal layer separation), the image is set as the background of a class in the CSS, we can
	 * then pull the image path by reading the background-image css attribute on that class.
	 */
	var $imgPathEl = $('<div/>').appendTo($body),
		URL = {
			SATVAL: $imgPathEl.attr('class','iD-img-sv').css('background-image').replace(/"/g,"").replace(/url\(|\)$/ig, ""),
			HUEBAR: $imgPathEl.attr('class','iD-img-huebar').css('background-image').replace(/"/g,"").replace(/url\(|\)$/ig, ""),
			HUERING: $imgPathEl.attr('class','iD-img-huering').css('background-image').replace(/"/g,"").replace(/url\(|\)$/ig, "")
		};
		$imgPathEl.remove();




	/**
	 * Color Picker Class
	 * 
	 * Possible option settings:
	 * @param 	size 		Integer pixel of the width/height of the square hue/value box
	 * @param 	onChange 	Function that's triggered when the color selection changes
	 * @param 	type 		String indicates which type of layout to use. Either 'bar' or 'ring'. Default 'bar'
	 */
	 var IDropper = function(opts) {

	 	
	 	var self = this;
	 	this.hooks = {};



		var size = opts.size || 256,								// width/height of square hue/value container
			layout = opts.layout === 'ring' ? 'ring' : 'bar',		// layout is either bar or ring
			percentRadius = 0.4999225219951447,						// percent of hue ring's width which we consider "radius"
			hueRingSize = size*482/256,
			radiansToDegrees = 360/(2*Math.PI),
			activeHSV = [0,1,1],									// current color of picker
			dragInfo = { type: '', tx: 0, ty: 0 };					// indicates either hue or sv dragging



		/**
		 * Element Reference
		 */
		var $el = opts.$el,
			$iD = $('<div/>').addClass('iD iD-layout-'+layout).appendTo($el),
				$svContainer = $('<div/>').addClass('iD-sv-container').appendTo($iD),
					$svPick = $('<img/>').addClass('iD-pick iD-sv-pick').attr('src',URL.SATVAL).appendTo($svContainer),
					$colorIndicator = $('<div/>').addClass('iD-indicator-color').appendTo($svContainer),
				$hueContainer = $('<div/>').addClass('iD-hue-container').appendTo($iD),
					$huePick = $('<img/>').addClass('iD-pick iD-hue-pick').attr('src',(layout === 'ring' ? URL.HUERING : URL.HUEBAR)).appendTo($hueContainer),
					$hueIndicator = $('<div/>').addClass('iD-indicator-hue').appendTo($hueContainer),
				$preview = $('<div/>').addClass('iD-preview').appendTo($iD);



		/**
		 * Functions
		 */
		var fn = {
			setFlag: function(e, type) {
				var tOffset = $(e.target).offset();
				activeDropper = self;
				dragInfo = { type: type, tx: tOffset.left, ty: tOffset.top };
			},
			setSVFlag: function(e) { fn.setFlag(e,'sv'); fn.mousedrag(e); },
			setHueFlag: function(e) { fn.setFlag(e,'hue'); fn.mousedrag(e); },

			mousedrag: function(e) {
				var m = { x : e.clientX - dragInfo.tx, y : e.clientY - dragInfo.ty };

				if(m.x<0) m.x=0;

				if(dragInfo.type === 'hue') self.trigger('huedrag', m);
				else if(dragInfo.type === 'sv') self.trigger('svdrag', m);
				fn.setPreview();
			},
			huedrag: function(m) {
				if(m.y < 0) m.y = 0;
				if(m.y > size) m.y = size;

				if(layout === 'ring') {
					var x = m.x - hueRingSize/2,
						y = m.y - hueRingSize/2,
						t = Math.atan(y/x),
						d = t*radiansToDegrees;
					
					d = 90 - d;
					if((x>0 && y>0) || (x>0 && y < 0)) d+= 180;
					activeHSV[0] = parseInt(d - 1);
				} else {
					$hueIndicator.css({ top: m.y });
					activeHSV[0] = parseInt(360*(1 - m.y/size), 10) - 1;
				}
				$svContainer.css('background-color', fn.getHex([activeHSV[0], 1, 1]));
			},
			svdrag: function(m) {
				if(m.x < 0) m.x = 0;
				if(m.y < 0) m.y = 0;
				if(m.x > size) m.x = size;
				if(m.y > size) m.y = size;

				$colorIndicator.css({ left: m.x, top: m.y });
				activeHSV[1] = m.x/size;
				activeHSV[2] = 1-m.y/size;
			},

			getHex: function(hsv) {
				if(!hsv) hsv = activeHSV;
				return utils.RgbToHex(utils.HsvToRgb(hsv));
			},
			setPreview: function(hex) {
				if(!hex) hex = fn.getHex();
				$preview.css('background-color', hex).html(hex);
				self.trigger('change', hex);
			}
		}

		/**
		 * Event binding and delegation
		 */
		var events = [
			['.iD-hue-pick', 'mousedown', 'setHueFlag'],
			['.iD-sv-pick', 'mousedown', 'setSVFlag']
		];
		for(var i=0; i<events.length; i++) $el.delegate(events[i][0], events[i][1], fn[events[i][2]]);
		this.bind('mousedrag', fn['mousedrag']);
		this.bind('huedrag', fn['huedrag']);
		this.bind('svdrag', fn['svdrag']);
		this.bind('change', opts.onChange);


		/**
		 * Final initializing and such
		 */
		if(typeof opts.size === 'number') {
			var hueWidth = parseInt(size/13,10);
			$svContainer.css({ width: size, height: size });

			if(layout === 'ring') {
				$iD.css({ width: hueRingSize, height: hueRingSize });
				$hueContainer.css({ width: hueRingSize, height: hueRingSize });
			} else {
				$hueContainer.css({ width: hueWidth, height: size });
				$hueIndicator.width(hueWidth);
			}
		}

		fn.setPreview();

	};
	IDropper.prototype.bind = function(event, fn) {
		if(typeof fn !== 'function') return false;
		if(!this.hooks[event]) this.hooks[event] = [];
		this.hooks[event].push(fn);
	};
	IDropper.prototype.trigger = function(event, param) {
		var fns = this.hooks[event];
		if(!fns) return false;
		for(var i=0; i<fns.length; i++) fns[i](param);
	};


	return function(opts) {
		// iDropper should be instantiated uniquely and only once
		if(this.length>1) this = this.eq(0);

		opts.$el = this;
		this.iDropper = new IDropper(opts);
	};

})(jQuery);