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
	createVideo:function(token) {
		var video = document.createElement('video');
		if (video.canPlayType('video/webm')) video.src = S.Util.videoURL(token) + ".webm";
		else if (video.canPlayType('video/mp4')) video.src = S.Util.videoURL(token) + ".mp4";
		else if (video.canPlayType('video/ogg')) video.src = S.Util.videoURL(token) + ".ogg";
		else video.innerHTML = S.VIDEO_ERROR_CANNOT_PLAY_TYPE;
		return video;
	},
	VIDEO_ERROR_CANNOT_PLAY_TYPE: "Sorry, your browser cannot play HTML5 Video. Please try using <a href='http://google.com/chrome'>Google Chrome</a> for best results"

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

		this.options.iconAngle = iconAngle;

		if (this._map) {
			this._reset();
		}
	},
	
	getIconAngle: function() {
		return this.options.iconAngle || 0;
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
				console.log("Response:",response);
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

				r.map.addLayer(r.marker);
				if (r._latLngs.length > 1) {
					r.route = new L.Polyline(r._latLngs);
					r.map.addLayer(r.route);
				}
				if (r.type == "video") {
					r.video = S.Ramble.createVideo(r.token);
					r.marker.bindPopup(r.video);
					r.video.addEventListener('timeupdate', r.updateMap);
				} else if (r.type == "photo") {
					r.photo = new Image();
				}
				r.fireEvent('mapdraw');
			} else {
				console.log('There was a problem with the request.');
			}
		}
	}
	xhr.open('GET', S.Config.MEDIA_URL+"/"+r.id+"/"+r.id+".json");
	xhr.send();
};

S.Ramble.prototype.createPopupContent() {
	var container = document.createElement('div');
	var title = document.createElement('div');

	return container;
};
S.Ramble.prototype.updateMap = function() {

};

S.Ramble.prototype.closeTrack = function() {};

S.Ramble.prototype.loadTrack = function() {};


S.Ramble.prototype.play = function() {
	if (this.video) {
		this.video = play();
	}
};
S.Ramble.prototype.pause = function() {
	if (this.video) {
		this.video = pause();
	}
};
S.Ramble.prototype.playPause = function() {
	if (this.video) {
		if (this.video.paused) {
			this.play();
		} else {
			this.pause();
		}
	}
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
		if (
			(events[type][i].action === fn) && (!context || (events[type][i].context === context))) {
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