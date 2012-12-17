(function($) {
	if(!window.IDropper) return;

	var IE = /MSIE (\d+\.\d+);/.test(navigator.userAgent) ? parseFloat(RegExp.$1) : NaN;
	var IE6 = IE === 6;
	var initialize = IDropper.prototype.initialize;

	IDropper.prototype.initialize = function(opts) {
		initialize.apply(this, arguments);
		if(ID) this.$body.addClass('ie ie'+IE);

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
	};
})(jQuery);
