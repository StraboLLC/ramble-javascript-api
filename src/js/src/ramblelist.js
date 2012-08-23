S.RambleList = function(map, ids, options) {
	this.options = options || {};
	this.map = map;
	var map = this.map;
	this.ids = ids;
	this.size = ids.length;
	this.completed = 0;
	this.rambles = [];
	this.clusterInterval = this.options.clusterInterval || 0.05;
	var theRambleList = this,
		clustering = this.options.clustering,
		showRoutes = this.options.showRoutes;
	for (var x in ids) {
		var aRamble = new S.Ramble(map, ids[x], {
			addToMap: false,
			list: theRambleList,
			clustering: clustering,
			showRoutes: showRoutes
		});
		aRamble.addEventListener("geodatapulled", function() {
			this.completed += 1;
			if (this.completed == this.size) {
				this.fireEvent("geodatapulled", {
					size: this.size
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
	this.fireEvent("constructed", this);
};
S.RambleList.prototype.show = function() {
	for (var x in this.rambles) {
		this.rambles[x].show();
	}
	this.fireEvent("show", this);
};
S.RambleList.prototype.hide = function() {
	for (var x in this.rambles) {
		this.rambles[x].hide();
	}
	this.fireEvent("hide", this);
};
S.RambleList.prototype.hideRoutes = function() {
	if (!this.options.showRoutes) {
		for (var x in this.rambles) {
			this.rambles[x].hideRoute();
		}
		this.fireEvent("hideRoutes", this);
	}
};
// Clustering Algorithm
S.RambleList.prototype.checkMarkers = function() {
	var theRambleList = this;
	for (var x in this.displayMarkers) {
		this.map.removeLayer(this.displayMarkers[x]);
	}
	this.displayMarkers = [];
	// Will wait until all markers in the RambleList have been created
	for (x in this.rambles) {
		if (this.rambles[x].marker) {
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
				if (mapDist < (mapSize * this.clusterInterval)) {
					shouldCluster = true;
					this.displayMarkers[y] = new S.Marker(new L.LatLng((tmp.getLatLng().lat + tmp2.getLatLng().lat) / 2, (tmp.getLatLng().lng + tmp2.getLatLng().lng) / 2), {
						icon: new L.HtmlIcon({
							html: "<div class='strabo-count-marker'>" + (tmp.getCount() + tmp2.getCount()) + "</div>"
						}),
						count: tmp.getCount() + tmp2.getCount(),
						isClusterMarker: true
					});
					this.displayMarkers[y].position = new L.LatLng(this.displayMarkers[y].getLatLng().lat, this.displayMarkers[y].getLatLng().lng);
					this.displayMarkers[y].bounds = new L.LatLngBounds();
					this.displayMarkers[y].bounds.extend(tmp.getLatLng());
					this.displayMarkers[y].bounds.extend(tmp2.getLatLng());
					if (tmp2.bounds) {
						this.displayMarkers[y].bounds.extend(tmp2.bounds.getNorthEast());
						this.displayMarkers[y].bounds.extend(tmp2.bounds.getSouthWest());
					}
					this.displayMarkers[y].htmlIcon = this.displayMarkers[y].options.icon;
					this.displayMarkers[y].generatedMarker = true;
					this.displayMarkers[y].children = [];
					this.displayMarkers[y].children = this.displayMarkers[y].children.concat(this.pullChildren(tmp));
					this.displayMarkers[y].children = this.displayMarkers[y].children.concat(this.pullChildren(tmp2));
					if (this.map.getZoom() >= this.map.getMaxZoom()) {
						var popupContent = '<div class="seek-left unselectable"></div><div class="seek-content">';
						for (var z in this.displayMarkers[y].children) {
							popupContent += '<div class="ss-capture unselectable">';
							popupContent += this.displayMarkers[y].children[z]._popup._content.innerHTML;
							popupContent += '</div>';
						}
						popupContent += '</div><div class="seek-right unselectable"></div>';
						this.displayMarkers[y].bindPopup(popupContent, {
							autoPan: true
						});
						this.displayMarkers[y].on("click", function() {
							this.currentContentIndex=0;
							var marker = this;
							this.openPopup(this._popup);
							this.setIcon(this.children[this.currentContentIndex].options.icon);
							this.setIconAngle(this.children[this.currentContentIndex].options.iconAngle)
							map.on("click", function() {
								theRambleList.hideRoutes();
								marker.setIcon(marker.htmlIcon);
								marker.setLatLng(new L.LatLng(marker.position.lat, marker.position.lng));
								marker.setIconAngle(null);
							});
							map.on("popupclose", function() {
								theRambleList.hideRoutes();
								marker.setIcon(marker.htmlIcon);
								marker.setLatLng(new L.LatLng(marker.position.lat, marker.position.lng));
								marker.setIconAngle(null);
							});
							var content = this._popup._container;
							var child = this.children[this.currentContentIndex];
							var token = this.children[this.currentContentIndex].token;
							var video = content.getElementsByTagName("video")[this.currentContentIndex];
							var ramble = theRambleList.findRambleByToken(token);
							theRambleList.addMarkerListeners(marker, video, ramble);
							ramble._syncVideo(marker, video);
							$('.ss-capture').css('display', 'none');
							var q = this.currentContentIndex;
							$('.ss-capture')[q].style.display = 'block';
							var pq = this;
							$('.seek-right').click(function() {
								pq.moveRight();
								var q = pq.currentContentIndex;
								var content = pq._popup._container;
								var child = pq.children[q];
								var token = pq.children[q].token;
								var video = content.getElementsByTagName("video")[q];
								var ramble = theRambleList.findRambleByToken(token);
								ramble._syncVideo(marker, video);
								theRambleList.addMarkerListeners(marker, video, ramble);
							});
							$('.seek-left').click(function() {
								pq.moveLeft();
								var q = pq.currentContentIndex;
								var content = pq._popup._container;
								var child = pq.children[q];
								var token = pq.children[q].token;
								var video = content.getElementsByTagName("video")[q];
								var ramble = theRambleList.findRambleByToken(token);
								ramble._syncVideo(marker, video);
								theRambleList.addMarkerListeners(marker, video, ramble);
							});
							$('.strabo-popup-close-button').css('z-index', '150');
						});
					} else {
						this.displayMarkers[y].on("click", function() {
							map.fitBounds(this.bounds);
						});
					}
				} else {}
			}
			if (!shouldCluster) {
				this.displayMarkers.push(tmp);
			}
		}
	}
	for (x in this.displayMarkers) {
		this.map.addLayer(this.displayMarkers[x]);
	}
	this.fireEvent("cluster", this);
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
S.RambleList.prototype.updateMarkers = function() {
	for (var x in this.displayMarkers) {
		this.displayMarkers[x].update();
	}
}
S.RambleList.prototype.findRambleByToken = function(token) {
	var result;
	for (var x in this.rambles) {
		if (this.rambles[x] && this.rambles[x].token == token) {
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
S.RambleList.prototype.addMarkerListeners = function(marker, video, ramble) {
	video.addEventListener('timeupdate', function() {
		ramble._updateMap(marker, video);
		ramble.fireEvent("timeupdate");
	});
	video.addEventListener("ended", function() {
		ramble.reset(marker, video);
		ramble.fireEvent("ended");
	});
	video.addEventListener("seeking", function() {
		if (marker._popup) {
			marker._popup.connected = false;
		}
		ramble._syncVideo(marker, video);
		ramble.fireEvent("seeking");
	});
	video.addEventListener("seeked", function() {
		if (marker._popup) {
			marker._popup.connected = false;
		}
		ramble._syncVideo(marker, video);
		ramble.fireEvent("seeked");
		if (marker._popup) {
			marker._popup.connected = true;
		}
	});
	video.addEventListener("play", function() {
		ramble.fireEvent("play");
	});
	video.addEventListener("pause", function() {
		ramble.fireEvent("pause");
	});
};