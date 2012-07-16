var S = {};
S.Config = {
	SITE_BASE_URL: "http://s3.amazonaws.com/api.ramble",
	MEDIA_URL: "http://s3.amazonaws.com/api.ramble/data"
};
S.Util = {
	pointsToLatLngs: function(points) {
		var results = [];
		for (var x in points) {
			results.push(new L.LatLng(points[x].latitude, points[x].latitude));
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
/*

		if (this._popup) {
			this._popup.setLatLng(latlng);
		}
*/
	}
});
S.Ramble = function(map, rambleID, opts) {
	this._listeners = {};
	// Constructor Error Handling
	if (!map) {
		console.error("Map parameter cannot be undefined.");
	}
	if (!rambleID) {
		console.error("rambleID parameter cannot be undefined.");
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
}
S.Ramble.prototype.pull = function() {
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
				console.log("Response:", response);
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
				r.map.addLayer(r.marker);
				if (r._latLngs.length > 1) {
					r.route = new L.Polyline(r._latLngs);
					r.map.addLayer(r.route);
				}
				if (r.type == "video") {
					r.initializeVideoPopup();
					r.video.addEventListener('timeupdate', function() {
						console.log("TimeUpdate");
						r.updateMap();
					});
					r.video.addEventListener("ended", function() {
						console.log("Ended");
						r.reset();
					});
					r.video.addEventListener("seeking", function() {
						console.log("Seeking");
						r.syncVideo();
					});
					r.video.addEventListener("seeked", function() {
						console.log("Seeked");
						r.syncVideo();
					});
					r.video.addEventListener("play", function() {
						console.log('Playing');
					});
					r.video.addEventListener("pause", function() {
						console.log('Paused');
					});
				} else if (r.type == "photo") {
					r.photo = new Image();
				}
				r.fireEvent('mapdraw');
			} else {
				console.log('There was a problem with the request.');
			}
		}
	}
	xhr.open('GET', S.Config.MEDIA_URL + "/" + r.id + "/" + r.id + ".json");
	xhr.send();
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
	} else console.error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype.updateMap = function() {
	if (this.type == "video" && this.points != null) {
		var pointTime;
		var cTime = this.video.currentTime;
		if (cTime > this.video.duration) { // If video is done.
			console.log('wtf');
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
	} else console.error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype.syncVideo = function() {
	if (this.video) {
		this.getPointByTime(this.video.currentTime);
		this.setCurrentPoint(this.currentPoint);
	} else console.error(S.Util.ERROR_NOT_VIDEO);
}
S.Ramble.prototype.reset = function() {
	if (this.video) {
		this.setCurrentTime(0);
	} else console.error(S.Util.ERROR_NOT_VIDEO)
}
S.Ramble.prototype.getPointByTime = function(timestamp, head, tail) {
	head = head || 0;
	tail = tail || this.points.length;
	var midpoint = parseInt((tail + head) / 2);
	var length = tail - head;
	if (length <= 1) {
		this.currentPoint = midpoint;
	} else if (timestamp == this.points[midpoint].timestamp) {
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

	} else console.error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype.setCurrentTime = function(newTime) {
	if (this.video) {
		this.video.currentTime = 0;
		this.getPointByTime(newTime);
		this.setCurrentPoint(this.currentPoint);
	}
	console.error(S.Util.ERROR_NOT_VIDEO);
}
S.Ramble.prototype.closeTrack = function() {};
S.Ramble.prototype.loadTrack = function() {};
/*
S.Ramble.prototype.play = function() {
	if (this.video) {
		this.video.play();
	} else console.error(S.Util.ERROR_NOT_VIDEO);
};
S.Ramble.prototype.pause = function() {
	if (this.video) {
		this.video.pause();
	} else console.error(S.Util.ERROR_NOT_VIDEO);
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
*/
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