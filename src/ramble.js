/**
 * Ramble Javascript API
 * @author Will Potter
 * @attribution
 */

/**
 * Strabo Object
 */
var S = {};

/**
 * Utilities Class for Strabo Functions
 * @type {Object}
 */
S.Util = {
	/**
	 * Converts point responses from the server into L.LatLngs
	 * @param  {Array} points An array of point object responses from the server.
	 * @return {Array}        An array of L.LatLngs of the points in the track.
	 */
	pointsToLatLngs: function (points) {
		var results = [];
		for(var x in points) {
			results.push(new L.LatLng(points[x].coords[0],points[x].coords[1]));
		}
		return results;
	}

};
/**
 * A leaflet-based marker that can handle icon rotation.
 * @constructor Creates a new map marker.
 * @param {L.LatLng} point The position of the marker on the map.
 */
S.Marker = L.Marker.extend({
	_reset: function() {
		var pos = this._map.latLngToLayerPoint(this._latlng).round();

		L.DomUtil.setPosition(this._icon, pos);
		if (this._shadow) {
			this._shadow.style.display="none";
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
	/**
	 * Sets the angle of an Icon.
	 * @param {Number} iconAngle Degrees of rotation for the icon.
	 */
	setIconAngle: function(iconAngle) {

		this.options.iconAngle = iconAngle;

		if (this._map) {
			this._reset();
		}
	},
	/**
	 * Returns the angle of rotation in an angle.
	 * @return {Number} Degrees of rotation for an icon.
	 */
	getIconAngle: function() {
		return this.options.iconAngle || 0;
	}
});

/**
 * The primary class for the Strabo Ramble API. Creates a new Ramble Object (photo/video).
 * @constructor 				Creates a new instance of a Ramble Object.
 * @param {L.Map} 	map    		An instance of a leaflet map.
 * @param {String} 	rambleID 	The unique identifier for a ramble ID
 * @param {Object} 	opts		An array of options for S.Ramble.
 */
S.Ramble = function(map, rambleID, opts) {
	this._listeners = {};
	// Constructor Error Handling
	if (!map) {
		console.error("Map parameter cannot be undefined.");
	}
	if (!rambleID) {
		console.error("rambleID parameter cannot be undefined.");
	}
	/**
	 * Ramble Unique Identifier. Used to query the server for information regarding a ramble.
	 * @type {String}
	 */
	this.id           = rambleID;
	/**
	 * Object to hold options related to a Ramble.
	 * @type {Object}
	 */
	this._options     = opts;
	/**
	 * An instance of a L.Map to draw the S.Ramble on.
	 * @type {L.Map}
	 */
	this.map          = map;
	
	/**
	 * Width of the Map
	 * @type {Number}
	 */
	this.MAP_WIDTH        = map.getSize().x;
	/**
	 * Height of the Map
	 * @type {Number}
	 */
	this.MAP_HEIGHT       = map.getSize().y;
	/**
	 * Options for the Map
	 * @type {Object}
	 */
	this._options     = opts || {};

	this.videoLoaded  = false;

	/**
	 * Index for the Points Array
	 * @default 0
	 * @type {Number}
	 */	
	this.currentPoint = 0;
	
	/* Element Properties */
	/**
	 * Ramble Title
	 * @type {String}
	 */
	this.title        = "";
	/**
	 * Ramble Starting Latitude
	 * @type {Number}
	 */
	this.latitude     = 0;
	/**
	 * Ramble Starting Longitude
	 * @type {Number}
	 */
	this.longitude    = 0;
	/**
	 * Ramble Starting Heading
	 * @type {Number}
	 */
	this.heading      = 0;
	/**
	 * An array of geodata information to be played from the server.
	 * @type {Array}
	 */
	this.points       = [];
	/**
	 * The user-generated description of the Ramble.
	 * @type {String}
	 */
	this.description  = "";
	/**
	 * The unique token used for querying the server and pulling a Ramble from the Ramble API.
	 * @type {String}
	 */
	this.token        = "";
	/**
	 * Date of Capture for the Ramble
	 * @type {Date}
	 */
	this.createdAt    = null;
	/**
	 * Date of Upload for the Ramble
	 * @type {Date}
	 */
	this.uploadedAt   = null;
	/**
	 * Type of Track for the Ramble (Video vs. Photo)
	 * @type {String}
	 */
	this.type         = null;
	/**
	 * The video element holding the video component of the Ramble.
	 * @type {HTMLVideoElement}
	 */
	this.video        = null;
	/**
	 * The image element holding the image component of the Ramble.
	 * @type {Image}
	 */
	this.photo        = null;
	/**
	 * The starting L.LatLng for the Track.
	 * @type {L.LatLng}
	 */
	this.start        = null;
	/**
	 * The L.Marker for the Track
	 * @type {L.Marker}
	 */
	this.marker       = null;
	/**
	 * The L.Polyline representing the path of the Track.
	 * @type {L.Polyline}
	 */
	this.route        = null;

	// Talk to the Server to Retrieve Geo-Data
	this.pull();
	

}

S.Ramble.prototype.pull = function() {
	var theObject = this;
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
				response              = response.response;
				theObject.title       = response.title;
				theObject.latitude    = parseFloat(response.latitude);
				theObject.longitude   = parseFloat(response.longitude);
				theObject.heading     = parseFloat(response.heading);
				theObject.points      = response.points;
				theObject.description = response.description;
				theObject.token       = response.token;
				theObject.createdAt   = response.created_at;
				theObject.uploadedAt  = response.uploaded_at;
				theObject.type        = response.type;
				
				theObject.start       = new L.LatLng(theObject.latitude,theObject.longitude);
				theObject._latLngs    = S.Util.pointsToLatLngs(theObject.points);
				theObject.marker      = new S.Marker(theObject.start);

				theObject.map.addLayer(theObject.marker);
				if(theObject._latLngs.length > 1) {
					theObject.route = new L.Polyline(theObject._latLngs);
					theObject.map.addLayer(theObject.route);
				}
				if (theObject.type == "video") {
					theObject.video = document.createElement('video');
					video.addEventListener('timeupdate', theObject.updateMap);
				} else if (theObject.type == "photo") {
					theObject.photo = new Image();
				}
				theObject.fireEvent('mapdraw');
			} else {
				console.log('There was a problem with the request.');
			}
		}
	}
	xhr.open('GET', "http://localhost/api.strabogis.com/examples/test.json");
	xhr.send();
};

S.Ramble.prototype.updateMap = function() {};

S.Ramble.prototype.closeTrack = function() {};

S.Ramble.prototype.loadTrack = function() {};



/**
 * Plays the video if the video element isn't null.
 */
S.Ramble.prototype.play = function() {
	if (this.video) {
		this.video = play();
	}
};



/**
 * Pauses the video if the video element isn't null.
 */
S.Ramble.prototype.pause = function() {
	if (this.video) {
		this.video = pause();
	}
};



/**
 * Toggles the playing vs. paused with the video.
 */
S.Ramble.prototype.playPause = function() {
	if (this.video) {
		if (this.video.paused) {
			this.play();
		} else {
			this.pause();
		}
	}
};



/**
 * Adds an event listener to an object.
 * @param {String}   type    The type of event to listen for.
 * @param {Function} fn      The callback function to perform upon execution of the event.
 * @param {Object}   context The scope of the callback function.
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
 * Checks if an object has a certain event listener.
 * @param  {String}  type The type of event to check for.
 * @return {Boolean}      True if an event listener exists.
 */
S.Ramble.prototype.hasEventListeners = function(type) {
	var k = '_events';
	return (k in this) && (type in this[k]) && (this[k][type].length > 0);
};
/**
 * Removes a specific event listener from an Object.
 * @param  {String}   type    The type of event to remove.
 * @param  {Function} fn      The callback function to execute upon removal.
 * @param  {Object}   context The scope of the callback function.
 * @return {Object}           The object that is triggering the event.
 */
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
/**
 * Triggers event listeners by performing an event.
 * @param  {String} type The type of event being performed.
 * @param  {Object} data The data to pass to the callback function.
 * @return {Object}      The object that is triggering the event.
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

