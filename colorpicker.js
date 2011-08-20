jQuery.fn.iDroppr = (function($) {


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
	 * Color Picker Class
	 * 
	 * Possible option settings:
	 * @param 	size 		integer pixel of the width/height of the square hue/value box
	 * @param 	onChange 	function that's triggered when the color selection changes
	 */
	 var IDroppr = function(opts) {
	 	
	 	var self = this;
	 	this.hooks = {};

		/**
		 * Element Reference
		 */
		var $el = opts.$el,
			$iD = $('<div/>').addClass('iD').appendTo($el),
				$svContainer = $('<div/>').addClass('iD-sv-container').appendTo($iD),
					$svPick = $('<img/>').addClass('iD-pick iD-sv-pick').attr('src','images/sloverlay.png').appendTo($svContainer),
					$colorIndicator = $('<div/>').addClass('iD-indicator-color').appendTo($svContainer),
				$hueContainer = $('<div/>').addClass('iD-hue-container').appendTo($iD),
					$huePick = $('<img/>').addClass('iD-pick iD-hue-pick').attr('src','images/hue.png').appendTo($hueContainer),
					$hueIndicator = $('<div/>').addClass('iD-indicator-hue').appendTo($hueContainer),
				$preview = $('<div/>').addClass('iD-preview').appendTo($iD);



		var size = opts.size || 256,	// width/height of square hue/value container
			activeHSV = [0,1,1],		// current color of picker
			dragInfo = { type: '', tx: 0, ty: 0 };



		/**
		 * Functions
		 */
		var fn = {
			setFlag: function(e, type) {
				var tOffset = $(e.target).offset();
				activeDropper = self;
				dragInfo = { type: type, tx: tOffset.left, ty: tOffset.top };
			},
			setSVFlag: function(e) { fn.setFlag(e,'sv'); },
			setHueFlag: function(e) { fn.setFlag(e,'hue'); },

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
				$hueIndicator.css({ top: m.y });
				activeHSV[0] = parseInt(360*(1 - m.y/size), 10) - 1;
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
			$hueContainer.css({ width: hueWidth, height: size });
			$hueIndicator.width(hueWidth);
		}
		fn.setPreview();

	};
	IDroppr.prototype.bind = function(event, fn) {
		if(typeof fn !== 'function') return false;
		if(!this.hooks[event]) this.hooks[event] = [];
		this.hooks[event].push(fn);
	};
	IDroppr.prototype.trigger = function(event, param) {
		var fns = this.hooks[event];
		if(!fns) return false;
		for(var i=0; i<fns.length; i++) fns[i](param);
	};


	return function(opts) {
		// iDropper should be instantiated uniquely and only once
		if(this.length>1) this = this.eq(0);

		opts.$el = this;
		this.iDroppr = new IDroppr(opts);
	};

})(jQuery);