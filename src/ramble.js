"use strict";
var S = {};
S.Config = {
/* 	SITE_BASE_URL: "http://api.strabo.co/", */
/* 	MEDIA_URL: "http://api.strabo.co/data" */
	SITE_BASE_URL: "http://localhost:8000/",
	MEDIA_URL: "http://localhost:8000/data"
	
};
S.Util = {
	pointsToLatLngs: function(points) {
		var results = [];
		for (var x in points) {
			results.push(new L.LatLng(points[x].latitude, points[x].longitude));
		}
		return results;
	},
	videoURL: function(token) {
		return S.Config.MEDIA_URL + "/" + token + "/" + token;
	},
	createVideo: function(token) {
		var video = document.createElement('video');
		video.autoplay = false;
		if (video.canPlayType('video/webm')) video.src = S.Util.videoURL(token) + ".webm";
		else if (video.canPlayType('video/mp4')) video.src = S.Util.videoURL(token) + ".mp4";
		else if (video.canPlayType('video/ogg')) video.src = S.Util.videoURL(token) + ".ogg";
		else video.innerHTML = S.ERROR_CANNOT_PLAY_TYPE;
		video.controls = "controls";
		return video;
	},
	ERROR_CANNOT_PLAY_TYPE: "Sorry, your browser cannot play HTML5 Video. Please try using <a href='http://google.com/chrome'>Google Chrome</a> for best results",
	ERROR_NOT_VIDEO: "This method can only be called on video typed rambles.",
	ERROR_NOT_PHOTO: "This method can only be called on photo typed rambles."


};
S.Marker = L.Marker.extend({
	_reset: function() {
		var pos = this._map.latLngToLayerPoint(this._latlng).round();
		L.DomUtil.setPosition(this._icon, pos);
		if (this._shadow) {
			this._shadow.style.display = "none";
		}
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
		this._icon.style.zIndex = pos.y;
	},
	_zoomAnimation: function (opt) {
		var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center);

		this._setPos(pos);
	},
	_setPos: function (pos) {
		L.DomUtil.setPosition(this._icon, pos);

		if (this._shadow) {
			L.DomUtil.setPosition(this._shadow, pos);
		}
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

		this._icon.style.zIndex = pos.y + this.options.zIndexOffset;
	},
	setIconAngle: function(iconAngle) {
		this.options.iconAngle = iconAngle || 0;
		if (this._map) {
			this._reset();
		}
	},
	getIconAngle: function() {
		return this.options.iconAngle || 0;
	},
	setLatLng: function (latlng) {
		this._latlng = latlng;

		this._reset();
		if (this._popup) {
			this._popup.setLatLng(latlng);
		}

	}
});
S.Popup = L.Popup.extend({
	_initLayout: function () {
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

	_update: function () {
		if (!this._map) { return; }

		this._container.style.visibility = 'hidden';

		this._updateLayout();
		this._updatePosition();

		this._container.style.visibility = '';

		this._adjustPan();
	}
});

S.Marker.include({
	openPopup: function () {
		if (this._popup && this._map) {
			this._popup.setLatLng(this._latlng);
			this._map.openPopup(this._popup);
		}

		return this;
	},

	closePopup: function () {
		if (this._popup) {
			this._popup._close();
		}
		return this;
	},

	bindPopup: function (content, options) {
		var anchor = this.options.icon.options.popupAnchor || new L.Point(0, 0);

		if (options && options.offset) {
			anchor = anchor.add(options.offset);
		}

		options = L.Util.extend({offset: anchor}, options);

		if (!this._popup) {
			this.on('click', this.openPopup, this);
		}

		this._popup = new S.Popup(options, this)
			.setContent(content);

		return this;
	},

	unbindPopup: function () {
		if (this._popup) {
			this._popup = null;
			this.off('click', this.openPopup);
		}
		return this;
	}
});


S.Ramble = function(map, rambleID, opts) {
	this.fireEvent("constructed");
	this._listeners = {};
	// Constructor Error Handling
	if (!map) {
		this.error("Map parameter cannot be undefined.");
	}
	if (!rambleID) {
		this.error("rambleID parameter cannot be undefined.");
	}
	this.id = rambleID;
	this._options = opts;
	this.map = map;
	this.MAP_WIDTH = map.getSize().x;
	this.MAP_HEIGHT = map.getSize().y;
	this._options = opts || {};
	this.videoLoaded = false;
	this.currentPoint = 0;
	this.title = "";
	this.latitude = 0;
	this.longitude = 0;
	this.heading = 0;
	this.points = [];
	this.description = "";
	this.token = "";
	this.createdAt = null;
	this.uploadedAt = null;
	this.type = null;
	this.video = null;
	this.photo = null;
	this.start = null;
	this.marker = null;
	this.route = null;
	// Talk to the Server to Retrieve Geo-Data
	this.pull();
};
S.Ramble.prototype.pull = function() {
	this.fireEvent("geodatapull");
	var r = this;
	var xhr;
	if (window.XMLHttpRequest) {
		xhr = new XMLHttpRequest();
	} else if (window.ActiveXObject) {
		xhr = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				var response = JSON.parse(xhr.responseText);
				response = response.response;
				r.title = response.title;
				r.latitude = parseFloat(response.latitude);
				r.longitude = parseFloat(response.longitude);
				r.heading = parseFloat(response.heading);
				r.points = response.points;
				r.description = response.description;
				r.token = response.token;
				r.createdAt = response.created_at;
				r.uploadedAt = response.uploaded_at;
				r.type = response.type;
				r.start = new L.LatLng(r.latitude, r.longitude);
				r._latLngs = S.Util.pointsToLatLngs(r.points);
				r.marker = new S.Marker(r.start);
				r.marker.setIconAngle(Math.round((r.points[0].heading)));
				if (r._latLngs.length > 1) {
					r.polyline = new L.Polyline(r._latLngs, {color:"#DB6C4D"});
				}
				r.show();
				if (r.type == "video") {
					r.initializeVideoPopup();
					r.video.addEventListener('timeupdate', function() {
						r.updateMap();
						r.fireEvent("timeupdate");
					});
					r.video.addEventListener("ended", function() {
						r.reset();
						r.fireEvent("ended");
					});
					r.video.addEventListener("seeking", function() {
						r.syncVideo();
						r.fireEvent("seeking");
					});
					r.video.addEventListener("seeked", function() {
						r.syncVideo();
						r.fireEvent("seeked");
					});
					r.video.addEventListener("play", function() {
						r.fireEvent("play");
					});
					r.video.addEventListener("pause", function() {
						r.fireEvent("pause");
					});
				} else if (r.type == "photo") {
					r.photo = new Image();
				}
				r.fireEvent('geodatapulled');
			} else {
				r.error('There was a problem with the request.');
			}
		}
	};
	xhr.open('GET', S.Config.MEDIA_URL + "/" + r.id + "/" + r.id + ".json");
	xhr.send();
};
S.Ramble.prototype.show = function() {
	if(this.polyline) this.map.addLayer(this.polyline);
	this.map.addLayer(this.marker);				
};
S.Ramble.prototype.hide = function() {
	if(this.polyline) this.map.removeLayer(this.polyline);
	this.map.removeLayer(this.marker);	
};
S.Ramble.prototype.initializeVideoPopup = function() {
	if (this.type == "video") {
		var container = document.createElement('div');
		var videoTitle = document.createElement('div');
		videoTitle.setAttribute('class', 'video-popup-title');
		videoTitle.innerHTML = this.title;
		this.video = S.Util.createVideo(this.token);
		container.appendChild(videoTitle);
		container.appendChild(this.video);
		this.marker.bindPopup(container);
	} else this.error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype.updateMap = function() {
	if (this.type == "video" && this.points) {
		var pointTime;
		var cTime = this.video.currentTime;
		if (cTime > this.video.duration) { // If video is done.
			this.error('wtf');
			this.currentPoint = 0;
		} else {
			if (this.currentPoint >= this.points.length) {
				this.currentPoint = this.points.length - 1;
			}
			pointTime = this.points[this.currentPoint].timestamp;
			while (cTime > pointTime && this.currentPoint < this.points.length - 1) {
				this.currentPoint++;
				pointTime = this.points[this.currentPoint].timestamp;
			}
			this.setCurrentPoint(this.currentPoint);
		}
	} else this.error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype.syncVideo = function() {
	if (this.video) {
		this.getPointByTime(this.video.currentTime);
		this.setCurrentPoint(this.currentPoint);
	} else this.error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype.reset = function() {
	if (this.video) {
		this.setCurrentTime(0);
		this.fireEvent("reset");
	} else this.error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype.getPointByTime = function(timestamp, head, tail) {
	head = head || 0;
	tail = tail || this.points.length;
	var midpoint = parseInt((tail + head) / 2,10);
	var length = tail - head;
	if (length <= 1 || timestamp == this.points[midpoint].timestamp) {
		this.currentPoint = midpoint;
	} else if (timestamp > this.points[midpoint].timestamp) {
		this.getPointByTime(timestamp, midpoint, tail);
	} else if (timestamp < this.points[midpoint].timestamp) {
		this.getPointByTime(timestamp, head, midpoint);
	}
};
S.Ramble.prototype.setCurrentPoint = function(currentPoint) {
	if (this.video && this.marker) {

		this.currentPoint = currentPoint;
		var currentAngle = this.marker.getIconAngle();
		var nextAngle = Math.round(this.points[this.currentPoint].heading);
		var delta = (nextAngle - currentAngle);
		if (delta > 180) {
			delta -= 360;
		}
		this.marker.setIconAngle(currentAngle + delta);
		this.marker.setLatLng(new L.LatLng(this.points[this.currentPoint].latitude, this.points[this.currentPoint].longitude));

	} else this.error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype.setCurrentTime = function(newTime) {
	if (this.video) {
		this.video.currentTime = 0;
		this.getPointByTime(newTime);
		this.setCurrentPoint(this.currentPoint);
	} else this.error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype.closeTrack = function() {};
S.Ramble.prototype.loadTrack = function() {};

S.Ramble.prototype.play = function() {
	if (this.video) {
		this.video.play();
	} else this.error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype.pause = function() {
	if (this.video) {
		this.video.pause();
	} else this.error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype.playPause = function() {
	if (this.video) {
		if (this.video.paused) {
			this.play();
		} else {
			this.pause();
		}
	} else console.error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype.addEventListener = function(type, fn, context) {
	var events = this._events = this._events || {};
	events[type] = events[type] || [];
	events[type].push({
		action: fn,
		context: context || this
	});
	return this;
};

S.Ramble.prototype.hasEventListeners = function(type) {
	var k = '_events';
	return (k in this) && (type in this[k]) && (this[k][type].length > 0);
};

S.Ramble.prototype.removeEventListener = function(type, fn, context) {
	if (!this.hasEventListeners(type)) {
		return this;
	}
	for (var i = 0, events = this._events, len = events[type].length; i < len; i++) {
		if ((events[type][i].action === fn) && (!context || (events[type][i].context === context))) {
			events[type].splice(i, 1);
			return this;
		}
	}
	return this;
};

S.Ramble.prototype.fireEvent = function(type, data) {
	if (!this.hasEventListeners(type)) {
		return this;
	}
	var event = L.Util.extend({
		type: type,
		target: this
	}, data);
	var listeners = this._events[type].slice();
	for (var i = 0, len = listeners.length; i < len; i++) {
		listeners[i].action.call(listeners[i].context || this, event);
	}
	return this;
};
S.Ramble.prototype.error = function(parameter) {
	this.fireEvent(parameter, {"text":parameter});
	if(console) console.error(parameter);
};