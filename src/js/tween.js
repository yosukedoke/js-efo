/*＠jQuery
 */
(function($)
{
	/**************************************************************************************
	transition ver 0.27
	*/

	window.Tween = function()
	{
		this.init.apply(this, arguments);
	};

	/*
	p_tgt				セレクタ文字列
	p_isBackface		裏の表示の可否
	p_transformOrign	変形の中心点
	p_isAutoDispose		アニメーション終了時にdispose
	*/
	window.Tween.prototype.init = function(p_tgt, p_isBackface, p_transformOrign, p_isAutoDispose)
	{
		var self = this;
		self._arg = arguments;
		self.selector = p_tgt;
		self.tgt = $(p_tgt);
		self.isBackface = !!p_isBackface;
		self.transformOrign = p_transformOrign;
		self.isAutoDispose = !!p_isAutoDispose;
		self.timestamp = "";
		self.tid = 0;
		self.userInfo = Utils.getUserInfo();
		self.tsDuration = 20;//from描画待ち待機時間。16～で安定か？
		if(self.tgt.length >1) throw new Error("Tween target too length!");

		if(self.userInfo.isIE) self.bKey = "";
		else if(self.userInfo.isSafari || self.userInfo.isChrome) self.bKey = "-webkit-";
		else if(self.userInfo.isFirefox) self.bKey = "-moz-";
		else if(self.userInfo.isOpera) self.bKey = "-o-";
		else self.bKey = "-webkit-";

		self.transitionName = self.bKey + "transition";
		self.transformName = self.bKey + "transform";
		self.transformOrignName = self.bKey + "transform-origin";
		self.backfacevisibilityName = self.bKey+"backface-visibility";

		self._cssOn = self._f_createCssOn();
		self.tgt.css(self._cssOn);
	};

	/*直接参照用*/
	window.Tween.ease = {
		linear:"linear",
		easeIn:"ease-in",
		easeOut:"ease-out",
		easeInOut:"ease-in-out",

		cubicIn:"cubic-bezier(0.550, 0.055, 0.675, 0.190)",
		cubicOut:"cubic-bezier(0.215, 0.610, 0.355, 1.000)",
		cubicInOut:"cubic-bezier(0.645, 0.045, 0.355, 1.000)",

		circIn:"cubic-bezier(0.600, 0.040, 0.980, 0.335)",
		circOut:"cubic-bezier(0.075, 0.820, 0.165, 1.000)",
		circInOut:"cubic-bezier(0.785, 0.135, 0.150, 0.860)",

		expoIn:"cubic-bezier(0.950, 0.050, 0.795, 0.035)",
		expoOut:"cubic-bezier(0.190, 1.000, 0.220, 1.000)",
		expoInOut:"cubic-bezier(1.000, 0.000, 0.000, 1.000)",

		quadIn:"cubic-bezier(0.550, 0.085, 0.680, 0.530)",
		quadOut:"cubic-bezier(0.250, 0.460, 0.450, 0.940)",
		quadInOut:"cubic-bezier(0.455, 0.030, 0.515, 0.955)",

		quartIn:"cubic-bezier(0.895, 0.030, 0.685, 0.220)",
		quartOut:"cubic-bezier(0.165, 0.840, 0.440, 1.000)",
		quartInOut:"cubic-bezier(0.770, 0.000, 0.175, 1.000)",

		quintIn:"cubic-bezier(0.755, 0.050, 0.855, 0.060)",
		quintOut:"cubic-bezier(0.230, 1.000, 0.320, 1.000)",
		quintInOut:"cubic-bezier(0.860, 0.000, 0.070, 1.000)",

		sineIn:"cubic-bezier(0.470, 0.000, 0.745, 0.715)",
		sineOut:"cubic-bezier(0.390, 0.575, 0.565, 1.000)",
		sineInOut:"cubic-bezier(0.445, 0.050, 0.550, 0.950)",

		backIn:"cubic-bezier(0.600, -0.280, 0.735, 0.045)",
		backOut:"cubic-bezier(0.175,  0.885, 0.320, 1.275)",
		backInOut:"cubic-bezier(0.680, -0.550, 0.265, 1.550)"
	};

	window.Tween.prototype._transitionEnd = "webkitTransitionEnd transitionend oTransitionEnd";

	window.Tween.prototype._cssOff = {
		"-webkit-transition":"",
		"-moz-transition":"",
		"-ms-transition":"",
		"-o-transition":"",
		"transition":""
	};

	window.Tween.prototype._cssDispose = {
		"-webkit-transition":"",
		"-webkit-transform":"",
		"-webkit-transform-style":"",
		"-webkit-backface-visibility":"",

		"-moz-transition":"",
		"-moz-transform":"",
		"-moz-transform-style":"",
		"-moz-backface-visibility":"",

		"-ms-transition":"",
		"-ms-transform":"",
		"-ms-transform-style":"",
		"-ms-backface-visibility":"",

		"-o-transition":"",
		"-o-transform":"",
		"-o-transform-style":"",
		"-o-backface-visibility":"",

		"transition":"",
		"transform":"",
		"transform-style":"",
		"backface-visibility":""
	};

	window.Tween.prototype._f_createCssOn = function()
	{
		var self = this;
		var _css = {};
		_css["-webkit-transform-style"] = "preserve-3d";
		if(self.transformOrign) _css[self.transformOrignName] = self.transformOrign;
		if(!self.isBackface) _css[self.backfacevisibilityName] = "hidden";
		//_css.overflow = "hidden";//ちらつき防止
		return _css;
	};

	window.Tween.prototype._f_createParams = function(p_param)
	{
		var self = this;
		var _param = "";
		for (key in p_param)
		{
			if(key.indexOf("translate") <0 && key.indexOf("skew") <0 && key.indexOf("rotate") <0 && key.indexOf("scale") <0)
			{
				self._cssOn[key] = p_param[key]+"";
			}
			else
			{
				if(_param !== "") _param += " ";
				if(p_param[key]) _param += key+"("+p_param[key]+")";
			}
		}

		return _param;
	};

	window.Tween.prototype._createTimestamp = function()
	{
		return new Date().getTimestamp();//utils-full_old.js
	};

	window.Tween.prototype.dispose = function()
	{
		var self = this;
		self.tgt.find("h1,h2,h3,h4,p").css({"-webkit-transform-style":""});//ちらつき防止
		self.tgt.css(self._cssDispose);
	};

	/*
	 ～へ
	 */
	window.Tween.prototype.to = function(p_to, p_duration, p_transition, p_delay, p_callback, p_noTransitionCallback)
	{
		var self = this;
		if(!self.userInfo.isTransition)
		{
			if(p_noTransitionCallback) p_noTransitionCallback(self.tgt);
			return;
		}

		clearTimeout(self.tid);
		self._cssOn = self._f_createCssOn();
		if(!p_duration) p_duration = 0;
		if(!p_transition) p_transition = "linear";
		if(!p_delay) p_delay = 0;
		self._cssOn[self.transitionName] = "all " + p_duration +"ms " + p_delay +"ms "+ p_transition;
		self._cssOn[self.transformName] = self._f_createParams(p_to);

		function f_onComplete(e)
		{
			if($(e.target).attr("data-tweenTimestamp") !== self.timestamp) return;
			self.tgt.unbind(self._transitionEnd, f_onComplete);
			self.timestamp = "";
			self.tgt.removeAttr("data-tweenTimestamp");
			//self.tgt.find("h1,h2,h3,h4,p").css({"-webkit-transform-style":""});
			self.tgt.css(self._cssOff);
			if(self.isAutoDispose) self.dispose();
			if(p_callback) p_callback(self);
		}

		if(p_duration <= 0)
		{
			self._cssOn[self.transitionName] = "";
			self.tgt.css(self._cssOn);
			f_onComplete();
		}
		else
		{
			self.tgt.unbind(self._transitionEnd);
			self.tgt.bind(self._transitionEnd, f_onComplete);
			self.tgt.find("h1,h2,h3,h4,p").css({"-webkit-transform-style":"preserve-3d"});//ちらつき防止
			self.tgt.css(self._cssOn);
			self.timestamp = self._createTimestamp();
			self.tgt.attr("data-tweenTimestamp", self.timestamp);
		}
	};

	/*
	 ～から～へ
	 */
	window.Tween.prototype.fromTo = function(p_from, p_to, p_duration, p_transition, p_delay, p_callback, p_noTransitionCallback)
	{
		var self = this;
		if(!self.userInfo.isTransition)
		{
			if(p_noTransitionCallback) p_noTransitionCallback(self.tgt);
			return;
		}

		self.setTransform(p_from);
		clearTimeout(self.tid);
		self.tid = setTimeout(function(){self.to(p_to, p_duration, p_transition, p_delay, p_callback)}, self.tsDuration);
	};

	window.Tween.prototype.setTransform = function(p_prop)
	{
		var self = this;
		self._cssOn = self._f_createCssOn();
		self.dispose();
		self._cssOn[self.transformName] = self._f_createParams(p_prop);
		self.tgt.css(self._cssOn);
	};

	//Loaded
	$(function()
	{

	});
})(jQuery);