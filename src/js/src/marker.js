S.Marker = L.Marker.extend({
	currentContentIndex: 0,
	_reset: function() {
		var pos = this._map.latLngToLayerPoint(this._latlng).round();
		L.DomUtil.setPosition(this._icon, pos);
		if (this._shadow) {
			this._shadow.style.display = "none";
			//L.DomUtil.setPosition(this._shadow, pos);
		}
		this._rotate();
		this._icon.style.zIndex = pos.y;
	},
	_rotate: function() {
		if (this.options.iconAngle) {
/*
			this._icon.style.WebkitTransition = "all .15s linear";
			this._icon.style.MozTransition = "all .15s linear";
			this._icon.style.MsTransition = "all .15s linear";
			this._icon.style.OTransition = "all .15s linear";
*/
			this._icon.style.WebkitTransform += 'translate(0px, 12px)  rotate(' + this.options.iconAngle + 'deg)';
			this._icon.style.MozTransform += 'translate(0px, 12px) rotate(' + this.options.iconAngle + 'deg)';
			this._icon.style.MsTransform += 'translate(0px, 12px) rotate(' + this.options.iconAngle + 'deg)';
			this._icon.style.OTransform += 'translate(0px, 12px) rotate(' + this.options.iconAngle + 'deg)';
		}
	},
	update: function() {
		if (!this._icon) {
			return;
		}
		var pos = this._map.latLngToLayerPoint(this._latlng).round();
		this._setPos(pos);
		this._rotate();
	},
	setIconAngle: function(iconAngle) {
		this.options.iconAngle = iconAngle;
		if (this._map) {
			this._reset();
		}
	},
	getIconAngle: function() {
		return this.options.iconAngle || 0;
	},
	setLatLng: function(latlng) {
		this._latlng = latlng;
		this._reset();
		if (this._popup && this._popup.connected) {
			this._popup.setLatLng(latlng);
		}
	},
	getCount: function() {
		return this.options.count || 1;
	},
	setCount: function(count) {
		this.options.count = count;
		return this;
	},
	isClusterMarker: function() {
		return this.options.isClusterMarker || false;
	},
	moveRight: function() {
		this.currentContentIndex+=1;
		if(this.currentContentIndex > (this.children.length-1)) {
			this.currentContentIndex = this.children.length-1;
		}
		$('.ss-capture').css('display', 'none');
		var q = this.currentContentIndex;
		$('.ss-capture')[q].style.display = 'block';
		this.setIcon(this.children[this.currentContentIndex].options.icon);
		this.setIconAngle(this.children[this.currentContentIndex].options.iconAngle)
	},
	moveLeft: function() {
		this.currentContentIndex-=1;
		if(this.currentContentIndex < 0) {
			this.currentContentIndex = 0;
		}
		$('.ss-capture').css('display', 'none');
		var q = this.currentContentIndex;
		$('.ss-capture')[q].style.display = 'block';
		this.setIcon(this.children[this.currentContentIndex].options.icon);
		this.setIconAngle(this.children[this.currentContentIndex].options.iconAngle)
	}
});