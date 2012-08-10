"use strict";
S.Popup = L.Popup.extend({
	connected: true,
	options: {
		minWidth: 50,
		maxWidth: 300,
		maxHeight: null,
		autoPan: true,
		closeButton: true,
		offset: new L.Point(0, 6),
		autoPanPadding: new L.Point(5, 5),
		className: ''
	},
	_initLayout: function() {
		var prefix = 'strabo-popup',
			container = this._container = L.DomUtil.create('div', prefix + ' ' + this.options.className + ' strabo-zoom-animated'),
			closeButton;
		if (this.options.closeButton) {
			closeButton = this._closeButton = L.DomUtil.create('a', prefix + '-close-button', container);
			closeButton.href = '#close';
			L.DomEvent.addListener(closeButton, 'click', this._onCloseButtonClick, this);
		}
		var wrapper = this._wrapper = L.DomUtil.create('div', prefix + '-content-wrapper', container);
		L.DomEvent.disableClickPropagation(wrapper);
		this._contentNode = L.DomUtil.create('div', prefix + '-content', wrapper);
		L.DomEvent.addListener(this._contentNode, 'mousewheel', L.DomEvent.stopPropagation);
		this._tipContainer = L.DomUtil.create('div', prefix + '-tip-container', container);
		this._tip = L.DomUtil.create('div', prefix + '-tip', this._tipContainer);
	},
	_update: function() {
		if (!this._map) {
			return;
		}
		this._container.style.visibility = 'hidden';
		this._updateLayout();
		this._updatePosition();
		this._container.style.visibility = '';
		this._adjustPan();
	}
});
S.Marker.include({
	openPopup: function() {
		if (this._popup && this._map) {
			this._popup.setLatLng(this._latlng);
			this._map.openPopup(this._popup);
		}
		return this;
	},
	closePopup: function() {
		if (this._popup) {
			this._popup._close();
		}
		return this;
	},
	bindPopup: function(content, options) {
		var anchor = this.options.icon.options.popupAnchor || new L.Point(0, 0);
		if (options && options.offset) {
			anchor = anchor.add(options.offset);
		}
		options = L.Util.extend({
			offset: anchor
		}, options);
		if (!this._popup) {
			this.on('click', this.openPopup, this);
		}
		this._popup = new S.Popup(options, this).setContent(content);
		return this;
	},
	unbindPopup: function() {
		if (this._popup) {
			this._popup = null;
			this.off('click', this.openPopup);
		}
		return this;
	}
});