"use strict";
/**
 * An instance for a Ramble Video
 * @param {L.Map} 	map      The L.Map to draw the S.Ramble on.
 * @param {String} 	rambleID The unique token of the ramble video to request from the server.
 * @param {Object} 	opts     An object of miscellaneous options to initialize the S.Ramble with.
 */

S.Ramble = function(map, rambleID, opts) {
	/**
	 * @event constructed
	 * Fired when a new S.Ramble is initialized
	 */
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
	this._pull();
};
/**
 * Handles Asynchronous Initialization for the Video (Downloading Geo data as well as map init stuff.)
 */
S.Ramble.prototype._pull = function() {
	/**
	 * @event geodatapull
	 * Fired when a S.Ramble starts to pull geodata from the server.
	 */
	this.fireEvent("geodatapull");

	// $.ajax({
	// 	url: S.Config.MEDIA_URL + "/" + this.id + "/" + this.id + ".js",
	// 	context: this,
	// 	dataType: "jsonp"
	// }).done(function(response){
	// 	this._processResponse(S.currentResponse);
	// });
	S.currentRamble=this;
	var myscript = document.createElement('script');
	myscript.setAttribute('src', S.Config.MEDIA_URL + "/" + this.id + "/" + this.id + ".js");
	document.body.appendChild(myscript);
	// S.currentRamble._processResponse(S.currentResponse);
};
/**
 * Processes the json response element that comes back from the server.
 * @param  {Object} response The response that comes from the server.
 */
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
	r.marker = new S.Marker(r.start);
	console.log(r.start);
	r.marker.setIconAngle(Math.round((r.points[0].heading)));
	if (r._latLngs.length > 1) {
		r.polyline = new L.Polyline(r._latLngs, {
			color: "#DB6C4D"
		});
	}
	r.show();
	if (r.type == "video") {
		console.log("video popup");
		r._initializeVideoPopup();
		r.video.addEventListener('timeupdate', function() {
			r._updateMap();
			/**
			 * @event timeupdate
			 * Fired when the video changes its time.
			 */
			r.fireEvent("timeupdate");
		});
		r.video.addEventListener("ended", function() {
			r.reset();
			/**
			 * @event ended
			 * Fired when the video ends.
			 */
			r.fireEvent("ended");
		});
		r.video.addEventListener("seeking", function() {
			r.syncVideo();
			/**
			 * @event seeking
			 * Fired when seeking for a position in the video.
			 */
			r.fireEvent("seeking");
		});
		r.video.addEventListener("seeked", function() {
			r.syncVideo();
			/**
			 * @event seeked
			 * Fired when a position has been seeked to in the video.
			 */
			r.fireEvent("seeked");
		});
		r.video.addEventListener("play", function() {
			/**
			 * @event play
			 * Fired the video starts playing.
			 */
			r.fireEvent("play");
		});
		r.video.addEventListener("pause", function() {
			/**
			 * @event pause
			 * Fired when the video is paused.
			 */
			r.fireEvent("pause");
		});
	} else if (r.type == "photo") {
		r.photo = new Image();
	}
	/**
	 * @event geodatapulled
	 * Fired when the geodata has been pulled and processed successfully from the server.
	 */
	r.fireEvent('geodatapulled');
}
/**
 * Shows the S.Ramble on the map.
 */
S.Ramble.prototype.show = function() {
	if (this.polyline) this.map.addLayer(this.polyline);
	this.map.addLayer(this.marker);
};
/**
 * Hides the S.Ramble on the map.
 */
S.Ramble.prototype.hide = function() {
	if (this.polyline) this.map.removeLayer(this.polyline);
	this.map.removeLayer(this.marker);
};
S.Ramble.prototype._initializeVideoPopup = function() {
	if (this.type == "video") {
		var container = document.createElement('div');
		var videoTitle = document.createElement('div');
		videoTitle.setAttribute('class', 'video-popup-title');
		videoTitle.innerHTML = this.title;
		this.video = S.Util.createVideo(this.token);
		this.video.style.width = (this.MAP_WIDTH/4)+"px";
		container.appendChild(videoTitle);
		container.appendChild(this.video);
		this.marker.bindPopup(container);
	} else this._error(S.Util.ERROR_NOT_VIDEO);
};

S.Ramble.prototype._updateMap = function() {
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
			this._setCurrentPoint(this.currentPoint);
		}
	} else this._error(S.Util.ERROR_NOT_VIDEO);
};
/**
 * Synchronizes the marker with current video time.
 */
S.Ramble.prototype.syncVideo = function() {
	if (this.video) {
		this._getPointByTime(this.video.currentTime);
		this._setCurrentPoint(this.currentPoint);
	} else this._error(S.Util.ERROR_NOT_VIDEO);
};
/**
 * Sets the video to its initial state.
 */
S.Ramble.prototype.reset = function() {
	if (this.video) {
		this.setCurrentTime(0);
		/**
		 * @event reset
		 * Fired when the video playback is reset to zero.
		 */
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
		this.marker.setLatLng(new L.LatLng(this.points[this.currentPoint].latitude, this.points[this.currentPoint].longitude));
	} else this._error(S.Util.ERROR_NOT_VIDEO);
};
/**
 * Sets the video time to a certain time.
 * @param {Number} newTime The number of seconds into the video to set the playback position.
 */
S.Ramble.prototype.setCurrentTime = function(newTime) {
	if (this.video) {
		if (newTime < 0 || newTime >= video.duration) this._error("Suggested time is out of bounds.");
		this.video.currentTime = 0;
		this._getPointByTime(newTime);
		this._setCurrentPoint(this.currentPoint);
	} else this._error(S.Util.ERROR_NOT_VIDEO);
};
/**
 * Plays the video.
 */
S.Ramble.prototype.play = function() {
	if (this.video) {
		this.video.play();
	} else this._error(S.Util.ERROR_NOT_VIDEO);
};
/**
 * Pauses the video.
 */
S.Ramble.prototype.pause = function() {
	if (this.video) {
		this.video.pause();
	} else this._error(S.Util.ERROR_NOT_VIDEO);
};
/**
 * Toggles between playing and paused.
 */
S.Ramble.prototype.playPause = function() {
	if (this.video) {
		if (this.video.paused) {
			this.play();
		} else {
			this.pause();
		}
	} else console.error(S.Util.ERROR_NOT_VIDEO);
};
/**
 * Adds a specific event listener to the S.Ramble.
 * @param {String}   type    The specific event to listen for.
 * @param {Function} fn      The callback method.
 * @param {Object}   context The context for the callback method.
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
/**
 * Checks for a specific event listener.
 * @param  {String}  type The name of the specific event to check for.
 * @return {Boolean}      Returns true if the event was found, else false.
 */
S.Ramble.prototype.hasEventListeners = function(type) {
	var k = '_events';
	return (k in this) && (type in this[k]) && (this[k][type].length > 0);
};
/**
 * Removes a specific event listener from the S.Ramble.
 * @param  {String}   type    The name of the event.
 * @param  {Function} fn      The callback method.
 * @param  {Object}   context The scope of the callback method.
 * @return {Object}           Returns the instance of the S.Ramble that is being called.
 */
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
/**
 * Method used to fire a specific event.
 * @param  {String} type Name of the event to trigger.
 * @param  {Object} data Data to pass to the callback method.
 * @return {S.Ramble}      Returns the instance of the S.Ramble that is being called.
 */
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
/**
 * Logs error messages to the console as well as fires a specific ramble error listener.
 * @param  {String} parameter The text of the error message to pass to the console.
 */
S.Ramble.prototype._error = function(parameter) {
	var msg = "Ramble-" + this.id + ": " + parameter;
	this.fireEvent("error", {
		"text": parameter
	});
	if (console) console.error(msg);
};