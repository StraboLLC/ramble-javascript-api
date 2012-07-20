"use strict";
/**
 * @class S.Marker
 * @extends L.Marker
 * A custom Marker for use with the Leaflet Maps that supports rotation.
 */
S.Marker = L.Marker.extend({
	_setAngle: function() {
		if (this.options.iconAngle) {
			this._icon.style.WebkitTransition = "all .15s linear";
			this._icon.style.MozTransition = "all .15s linear";
			this._icon.style.MsTransition = "all .15s linear";
			this._icon.style.OTransition = "all .15s linear";
			this._icon.style.WebkitTransform = this._icon.style.WebkitTransform + 'translate(0px, 12px)  rotate(' + this.options.iconAngle + 'deg)';
			this._icon.style.MozTransform = 'translate(0px, 12px) rotate(' + this.options.iconAngle + 'deg)';
			this._icon.style.MsTransform = 'translate(0px, 12px) rotate(' + this.options.iconAngle + 'deg)';
			this._icon.style.OTransform = 'translate(0px, 12px) rotate(' + this.options.iconAngle + 'deg)';
		}		
	},
	_setPos: function(pos) {
		L.DomUtil.setPosition(this._icon, pos);
		if (this._shadow) {
			L.DomUtil.setPosition(this._shadow, pos);
		}
		this._setAngle();
		this._icon.style.zIndex = pos.y + this.options.zIndexOffset;
	},
	_reset: function() {
		var pos = this._map.latLngToLayerPoint(this._latlng).round();
		L.DomUtil.setPosition(this._icon, pos);
		if (this._shadow) {
			this._shadow.style.display = "none";
		}
		this._setAngle();
		this._icon.style.zIndex = pos.y;
	},
	_zoomAnimation: function(opt) {
		var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center);
		this._setPos(pos);
	},
	/**
	 * Sets the rotation for the S.Marker
	 * @param {Number} iconAngle Amount to rotate the S.Marker in degrees.
	 */
	setIconAngle: function(iconAngle) {
		this.options.iconAngle = iconAngle || 0;
		if (this._map) {
			this._reset();
		}
	},
	/**
	 * Gets the rotation for the S.Marker
	 * @return {Number} Amount of rotation in the S.Marker in degrees.
	 */
	getIconAngle: function() {
		return this.options.iconAngle || 0;
	},
	/**
	 * Sets the L.LatLng for the marker. Used to move a S.Marker across the map.
	 * @param {L.LatLng} latlng An L.LatLng containing the latitude and longitude of the S.Marker's destination.
	 */
	setLatLng: function(latlng) {
		this._latlng = latlng;
		this._reset();
		if (this._popup && this._popup.connected) {
			this._popup.setLatLng(latlng);
		}
	}
});