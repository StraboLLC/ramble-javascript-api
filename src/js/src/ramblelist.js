S.RambleList = function(map, ids, options) {
	this.options = options || {};
	this.options.clustering = options.clustering || false;
	this.options.showRoutes = options.showRoutes || false;
	this.map = map;
	this.ids = ids;
	this.size = ids.length;
	this.completed = 0;
	this.rambles = [];
	var theRambleList = this,
		clustering = this.options.clustering || false,
		showRoutes = this.options.showRoutes || false;
	for (var x in ids) {
		var aRamble = new S.Ramble(map, ids[x], {
			addToMap: false,
			list: theRambleList,
			clustering: clustering,
			showRoutes: showRoutes
		});
		aRamble.addEventListener("geodatapulled", function() {
			this.completed += 1;
			if(this.completed == this.size) {
				this.fireEvent("geodatapulled", {
					size:this.size
				});
			}
		}, theRambleList);
		this.rambles.push(aRamble);
	}
	if (this.options.clustering) {
		map.on("zoomend", function() {
			theRambleList.checkMarkers();
		});
		for (x in this.rambles) {
			this.rambles[x].addEventListener("geodatapulled", function() {
				theRambleList.checkMarkers();
			});
		}
	}
	this.fireEvent("constructed",this);
};
S.RambleList.prototype.show = function() {
	for (var x in this.rambles) {
		this.rambles[x].show();
	}
	this.fireEvent("show",this);
};
S.RambleList.prototype.hide = function() {
	for (var x in this.rambles) {
		this.rambles[x].hide();
	}
	this.fireEvent("hide",this);
};
// Clustering Algorithm
S.RambleList.prototype.checkMarkers = function() {
	for (var x in this.displayMarkers) {
		this.map.removeLayer(this.displayMarkers[x]);
	}
	this.displayMarkers = [];
	// Will wait until all markers in the RambleList have been creat
	var shouldProceed = true;
	for (x in this.rambles) {
		if (!this.rambles[x].marker) {
			shouldProceed = false;
		}
	}
	if (shouldProceed) {
		for (x in this.rambles) {
			var tmp = this.rambles[x].marker;
			this.map.removeLayer(tmp);
			var shouldCluster = false;
			for (var y in this.displayMarkers) {
				var tmp2 = this.displayMarkers[y];
				var yMapSize = this.map.getBounds().getNorthEast().lat - this.map.getBounds().getSouthWest().lat;
				var xMapSize = this.map.getBounds().getNorthEast().lng - this.map.getBounds().getSouthWest().lng;
				var yMapDist = Math.abs(tmp.getLatLng().lat - tmp2.getLatLng().lat);
				var xMapDist = Math.abs(tmp.getLatLng().lng - tmp2.getLatLng().lng);
				var mapSize = Math.sqrt(Math.pow(xMapSize, 2) + Math.pow(yMapSize, 2));
				var mapDist = Math.sqrt(Math.pow(xMapDist, 2) + Math.pow(yMapDist, 2));
				if (mapDist < (mapSize * 0.05)) {
					shouldCluster = true;
					var string = "Merging a ";
					if (tmp.isClusterMarker()) {
						string += "clustermarker ";
					} else {
						string += "non-clustermarker ";
					}
					string += "with a "
					if (tmp2.isClusterMarker()) {
						string += "clustermarker";
					} else {
						string += "non-clustermarker";
					}
					string += ". The current count for the clustermarker is " + (tmp.getCount() + tmp2.getCount());
					//console.log(string);
					this.displayMarkers[y] = new S.Marker(new L.LatLng((tmp.getLatLng().lat + tmp2.getLatLng().lat) / 2, (tmp.getLatLng().lng + tmp2.getLatLng().lng) / 2), {
						icon: new L.HtmlIcon({
							html: "<div class='strabo-count-marker'>" + (tmp.getCount() + tmp2.getCount()) + "</div>"
						}),
						count: tmp.getCount() + tmp2.getCount(),
						isClusterMarker: true
					});
					this.displayMarkers[y].generatedMarker = true;
					this.displayMarkers[y].children = [];
					this.displayMarkers[y].children = this.displayMarkers[y].children.concat(this.pullChildren(tmp));
					this.displayMarkers[y].children = this.displayMarkers[y].children.concat(this.pullChildren(tmp2));
					if (this.map.getZoom() >= this.map.getMaxZoom()) {
						var popupContent = '<div class="seek-left unselectable"></div><div class="seek-content">';
						for (var z in this.displayMarkers[y].children) {
							//console.log(this.displayMarkers[y].children[z].isClusterMarker());
							popupContent += '<div class="ss-capture unselectable">';
							popupContent += this.displayMarkers[y].children[z]._popup._content.innerHTML;
							popupContent += '</div>';
						}
						popupContent += '</div><div class="seek-right unselectable"></div>';
						this.displayMarkers[y].bindPopup(popupContent);
						this.displayMarkers[y].on("click", function() {
							//console.log("Click Detected. Expanding " + this.children.length + " child nodes.");
							this.openPopup(this._popup);
							$('.ss-capture').css('display', 'none');
							var q = this.currentContentIndex;
							$('.ss-capture')[q].style.display = 'block';
							var pq = this;
							$('.seek-right').click(function() {
								pq.moveRight();
							});
							$('.seek-left').click(function() {
								pq.moveLeft();
							});
							$('.strabo-popup-close-button').css('z-index','150');
						});
					} else {
						this.displayMarkers[y].on("click", function() {
							map.setView(this.getLatLng(), map.getZoom());
							map.zoomIn();
						});
					}
				} else {}
			}
			if (!shouldCluster) {
				//console.log("Forming a new cluster.");
				this.displayMarkers.push(tmp);
			}
		}
	}
	for (x in this.displayMarkers) {
		this.map.addLayer(this.displayMarkers[x]);
	}
	this.fireEvent("cluster",this);
};
// Method for recursively grabbing child elements.
S.RambleList.prototype.pullChildren = function(marker) {
	var result = [];
	if (marker.children) {
		for (var x in marker.children) {
			result = result.concat(this.pullChildren(marker.children[x]));
		}
	} else {
		result.push(marker);
	}
	return result;
};

S.RambleList.prototype.findRambleByToken = function(token) {
	var result;
	for (var x in this.rambles) {
		if (this.rambles[x].token == token) {
			result = this.rambles[x];
		}
	}
	return result;
};
S.RambleList.prototype.addRamble = function(token) {
	this.rambles.push(new S.Ramble(this.map, token));
};
S.RambleList.prototype.addEventListener = function(type, fn, context) {
	var events = this._events = this._events || {};
	events[type] = events[type] || [];
	events[type].push({
		action: fn,
		context: context || this
	});
	return this;
};
S.RambleList.prototype.hasEventListeners = function(type) {
	var k = '_events';
	return (k in this) && (type in this[k]) && (this[k][type].length > 0);
};
S.RambleList.prototype.removeEventListener = function(type, fn, context) {
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
S.RambleList.prototype.fireEvent = function(type, data) {
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
S.RambleList.prototype._error = function(parameter) {
	var msg = "RambleList-" + this.id + ": " + parameter;
	this.fireEvent("error", {
		"text": parameter
	});
	if (console) console.error(msg);
};