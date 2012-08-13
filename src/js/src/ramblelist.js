S.RambleList = function(map, ids, options) {
	this.options = options || {};
	this.options.clustering = options.clustering || false;
	this.options.showRoutes = options.showRoutes || false;
	this.map = map;
	this.ids = ids;
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
};
S.RambleList.prototype.show = function() {
	for (var x in this.rambles) {
		this.rambles[x].show();
	}
};
S.RambleList.prototype.hide = function() {
	for (var x in this.rambles) {
		this.rambles[x].hide();
	}
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
					console.log(string);
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
						var popupContent = "";
						for (var z in this.displayMarkers[y].children) {
							console.log(this.displayMarkers[y].children[z].isClusterMarker());
							popupContent += '<div class="ss-capture">';
							popupContent += this.displayMarkers[y].children[z]._popup._content.innerHTML;
							popupContent += '</div>';
						}
						this.displayMarkers[y].bindPopup(popupContent);
						this.displayMarkers[y].on("click", function() {
							console.log("Click Detected. Expanding " + this.children.length + " child nodes.");
							this.openPopup(this._popup);
							$('.ss-capture').css('display', 'none');
							var q = this.currentContentIndex;
							$('.ss-capture')[q].style.display = 'block';
							this.on("click", function() {
								this.moveRight();
							});
/*

						var m = this;
						map.removeLayer(m);
						for (var x in m.children) {
							map.addLayer(m.children[x]);
						}
*/
/*
						window.setTimeout(function() {
							for (var x in m.children) {
								map.removeLayer(m.children[x]);
							}
							map.addLayer(m);
						}, 3000);
*/
						});
					} else {
						this.displayMarkers[y].on("click", function() {
							map.zoomIn();
						});
					}
				} else {}
			}
			if (!shouldCluster) {
				console.log("Forming a new cluster.");
				this.displayMarkers.push(tmp);
			}
		}
	}
	for (x in this.displayMarkers) {
		this.map.addLayer(this.displayMarkers[x]);
	}
};
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