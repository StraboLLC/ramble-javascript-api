S.Ramble = function(map, rambleID, opts) {
	this.fireEvent("constructed", {
		map: map,
		id: rambleID
	});
	this._listeners = {};
	if (!map) {
		this._error("Map parameter cannot be undefined.");
	}
	if (!rambleID) {
		this._error("rambleID parameter cannot be undefined.");
	}
	this.id = rambleID;
	//Control Parameters
	this.options = opts || {};
	//Map Properties
	this.map = map;
	this.MAP_WIDTH = map.getSize().x;
	this.MAP_HEIGHT = map.getSize().y;
	//Media/Geodata Properties
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
	this._pull();
};
S.Ramble.prototype._pull = function() {
	this.fireEvent("geodatapull");
	//Process Response Through JSONP Method
	S.rambles[this.id] = this;
	var myscript = document.createElement('script');
	myscript.setAttribute('src', S.Config.MEDIA_URL + "/" + this.id + "/" + this.id + ".js");
	document.body.appendChild(myscript);
};
S.Ramble.prototype._processResponse = function(response) {
	var r = this;
	//response = response.response;
	r.title = response.title;
	r.latitude = parseFloat(response.coords[0]);
	r.longitude = parseFloat(response.coords[1]);
	r.heading = parseFloat(response.heading);
	r.points = response.points;
	r.description = response.description;
	r.token = response.token;
	r.createdAt = response.created_at;
	r.uploadedAt = response.uploaded_at;
	r.type = response.media_type;
	r.start = new L.LatLng(r.latitude, r.longitude);
	r._latLngs = S.Util.pointsToLatLngs(r.points);
	r._icon = r.options.icon || new S.Icon();
	r.marker = new S.Marker(r.start, {
		icon: r._icon,
		count: 1
	});
	r.marker.setIconAngle(Math.round((r.heading)));
	if (r._latLngs.length > 1) {
		r.polyline = new L.Polyline(r._latLngs, {
			color: "#DB6C4D"
		});
	}
	r.show();
	if (r.type === "video") {
		r._initializeVideoPopup();
		r.video.addEventListener('timeupdate', function() {
			r._updateMap();
			r.fireEvent("timeupdate");
		});
		r.video.addEventListener("ended", function() {
			r.reset();
			r.fireEvent("ended");
		});
		r.video.addEventListener("seeking", function() {
			if(r.marker._popup) {
				r.marker._popup.connected=false;
			}
			r._syncVideo();
			r.fireEvent("seeking");
		});
		r.video.addEventListener("seeked", function() {
			if(r.marker._popup) {
				r.marker._popup.connected=false;
			}
			r._syncVideo();
			r.fireEvent("seeked");
			if(r.marker._popup) {
				r.marker._popup.connected=true;
			}
		});
		r.video.addEventListener("play", function() {
			r.fireEvent("play");
		});
		r.video.addEventListener("pause", function() {
			r.fireEvent("pause");
		});
	} else if (r.type === "image") {
		r._initializePhotoPopup();
	}
	r.marker.on("click", function() {
		r.marker.openPopup();
		r.showWithRoute();
	});
	r.fireEvent('geodatapulled');
};
S.Ramble.prototype.show = function() {
	if (this.options.showRoutes && this.polyline && !this.map.hasLayer(this.polyline)) {
		this.map.addLayer(this.polyline);
	}
	if (this.marker && !this.map.hasLayer(this.marker)) {
		this.map.addLayer(this.marker);
	}
};
S.Ramble.prototype.showWithRoute = function() {
	if (this.polyline && !this.map.hasLayer(this.polyline)) {
		this.map.addLayer(this.polyline);
	}
	if (this.marker && !this.map.hasLayer(this.marker)) {
		this.map.addLayer(this.marker);
	}
};
S.Ramble.prototype.hide = function() {
	if (this.polyline) this.map.removeLayer(this.polyline);
	this.map.removeLayer(this.marker);
};
S.Ramble.prototype.hideRoute = function() {
	if (this.polyline) this.map.removeLayer(this.polyline);
};
S.Ramble.prototype._initializeVideoPopup = function() {
	if (this.type == "video") {
		var container = document.createElement('div');
		var videoTitle = document.createElement('div');
		videoTitle.setAttribute('class', 'video-popup-title');
		videoTitle.innerHTML = this.title;
		this.video = S.Util.createVideo(this.token);
		this.video.width = "300";
		container.appendChild(videoTitle);
		container.appendChild(this.video);
		this.marker.bindPopup(container, {
			autoPan:true
		});
		this.marker.on("click", function() {
			$('.strabo-popup-close-button').css('z-index', '150');
			this.openPopup();
		});
	} else {
		this._error(S.Util.ERROR_NOT_VIDEO);
	}
};
S.Ramble.prototype._initializePhotoPopup = function() {
	if (this.type == "image") {
		var container = document.createElement('div');
		var photoTitle = document.createElement('div');
		photoTitle.setAttribute('class', 'photo-popup-title');
		photoTitle.innerHTML = this.title;
		this.photo = S.Util.createPhoto(this.token);
		this.photo.width = "300";
		container.appendChild(photoTitle);
		container.appendChild(this.photo);
		this.marker.bindPopup(container, {
			autoPan:true
		});
	} else this._error(S.Util.ERROR_NOT_PHOTO);
};
S.Ramble.prototype._updateMap = function(aMarker) {
	var marker = aMarker || false;
	if (this.type == "video" && this.points) {
		var pointTime;
		var cTime = this.video.currentTime;
		if (cTime > this.video.duration) { // If video is done.
			this._error('wtf');
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
			if(marker) {
				this._setCurrentPointWithMarker(this.currentPoint, marker);
			} else {
				this._setCurrentPoint(this.currentPoint);
			}
		}
	} else this._error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype._syncVideo = function(aMarker) {
	var marker = aMarker || false;
	if (this.video) {
		this._getPointByTime(this.video.currentTime);
		if(marker) {
			this._setCurrentPointWithMarker(this.currentPoint, marker);
		} else {
			this._setCurrentPoint(this.currentPoint);
		}
	} else this._error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype.reset = function(aMarker) {
	var marker = aMarker || false;
	if (this.video) {
		this.setTime(0, marker);
		this.fireEvent("reset");
	} else this._error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype._getPointByTime = function(timestamp, head, tail) {
	head = head || 0;
	tail = tail || this.points.length;
	var midpoint = parseInt((tail + head) / 2, 10);
	var length = tail - head;
	if (length <= 1 || timestamp == this.points[midpoint].timestamp) {
		this.currentPoint = midpoint;
	} else if (timestamp > this.points[midpoint].timestamp) {
		this._getPointByTime(timestamp, midpoint, tail);
	} else if (timestamp < this.points[midpoint].timestamp) {
		this._getPointByTime(timestamp, head, midpoint);
	}
};
S.Ramble.prototype._setCurrentPoint = function(currentPoint) {
	if (this.video && this.marker) {
		this.currentPoint = currentPoint;
		var currentAngle = this.marker.getIconAngle();
		var nextAngle = Math.round(this.points[this.currentPoint].heading);
		var delta = (nextAngle - currentAngle);
		if (delta > 180) {
			delta -= 360;
		}
		this.marker.setIconAngle(currentAngle + delta);
		this.marker.setLatLng(new L.LatLng(this.points[this.currentPoint].coords[0], this.points[this.currentPoint].coords[1]));
	} else this._error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype._setCurrentPointWithMarker = function(currentPoint, marker) {
	if (this.video && marker) {
		this.currentPoint = currentPoint;
		var currentAngle = marker.getIconAngle();
		var nextAngle = Math.round(this.points[this.currentPoint].heading);
		var delta = (nextAngle - currentAngle);
		if (delta > 180) {
			delta -= 360;
		}
		marker.setIconAngle(currentAngle + delta);
		marker.setLatLng(new L.LatLng(this.points[this.currentPoint].coords[0], this.points[this.currentPoint].coords[1]));
	} else this._error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype.getTime = function() {
	if (this.video) {
		return this.video.currentTime;
	} else this._error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype.setTime = function(newTime, aMarker) {
	var marker = aMarker || false;
	if (this.video) {
		if (newTime < 0 || newTime >= this.video.duration) this._error("Suggested time is out of bounds.");
		this.video.currentTime = 0;
		this._getPointByTime(newTime);
		if(marker) {
			this._setCurrentPointWithMarker(this.currentPoint, marker);
		} else {
			this._setCurrentPoint(this.currentPoint);
		}
		return this;
	} else this._error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype.getLatLng = function() {
	return this.start;
};
S.Ramble.prototype.play = function() {
	if (this.video) {
		this.video.play();
	} else this._error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype.pause = function() {
	if (this.video) {
		this.video.pause();
	} else this._error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype.playPause = function() {
	if (this.video) {
		if (this.video.paused) {
			this.play();
		} else {
			this.pause();
		}
	} else this._error(S.Util.ERROR_NOT_VIDEO);
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
S.Ramble.prototype.getType = function() {
	return this.type;
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
S.Ramble.prototype._error = function(parameter) {
	var msg = "Ramble-" + this.id + ": " + parameter;
	this.fireEvent("error", {
		"text": parameter
	});
	if (console) console.error(msg);
};