
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

	/**
	 * @param 	hsl 	Array where  0<=h<360 0<=s<=1 0<=l<=1
	 */
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






var ColorPicker = function(opts) {


	// Makes sure opts.el is a jquery element
	if(!opts.el.jquery) opts.el = $(opts.el);


	/**
	 * Flags and initial values
	 */
	var hueDown = false,
		svDown = false,
		activeHue = 0,
		activeSaturation = 1,
		activeValue = 1,
		height = opts.height;


	/**
	 * Element Reference
	 */
	var $svContainer = opts.el.find('.cp-sv-container'),
		$preview = $('.cp-preview'),
		$colorIndicator = $('.cp-indicator-color'),
		$hueIndicator = $('.cp-indicator-hue');


	/**
	 * Events & delegation
	 */
	var events = [
		['.cp-pick', 'mousedown', 'preventGhost'],
		['.cp-hue-pick', 'mousedown', 'setHueFlag'],
		['.cp-hue-pick', 'mousemove', 'setHueDegree'],
		['.cp-sv-pick', 'mousedown', 'setSVFlag'],
		['.cp-sv-pick', 'mousemove', 'svMousemove']
	];
	var fn = {
		/**
		 * Stops bubbling, prevents browser from dragging image ghost
		 */
		preventGhost: function() { return false; },

		setHueFlag: function() { hueDown = true; },

		setHueDegree: function(e) {
			if(hueDown) {
				$hueIndicator.css({ top: e.offsetY });

				var h = parseInt(360*(1 - e.offsetY/height), 10) - 1,
					hsv = [h, 1, 1],
					rgb = utils.HsvToRgb(hsv),
					hex = utils.RgbToHex(rgb);

				$svContainer.css('background-color', hex);
				activeHue = h;
				fn.setPreview();
			}
		},

		setSVFlag: function() { svDown = true; },

		svMousemove: function(e) { if(svDown) fn.setPreview(fn.getColor(e.offsetX, e.offsetY)); },
		
		getColor: function(offx, offy) {
			$colorIndicator.css({ left: offx, top: offy });

			var s = offx/height, v = 1-offy/height,
				hsv = [activeHue,s,v],
				rgb = utils.HsvToRgb(hsv),
				hex = utils.RgbToHex(rgb);
			
			activeSaturation = s;
			activeValue = v;

			return hex;
		},

		setPreview: function(hex) {
			if(!hex) hex = utils.RgbToHex(utils.HsvToRgb([activeHue, activeSaturation, activeValue]));
			$preview.css('background-color', hex).html(hex);
		}
	}
	for(var i=0; i<events.length; i++) opts.el.delegate(events[i][0], events[i][1], fn[events[i][2]]);


	$('body').mouseup(function(){ hueDown = svDown = false; });
	fn.setPreview();

};