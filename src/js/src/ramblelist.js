"use strict";

S.RambleList = function(map, ids, options) {
	var theRambleList = this;
	this.options = options;
	this.map = map;
	this.ids = ids;
	this.rambles = [];



	var popup = new L.Popup();

	for (var x in ids) {
		var aRamble = new S.Ramble(map, ids[x], {
			addToMap: false,
			list: theRambleList
		});
		this.rambles.push(aRamble);
	}

	map.on("zoomend", function() {
		theRambleList.checkMarkers();
	});
	for(var x in this.rambles) {
		this.rambles[x].addEventListener("geodatapulled",function() {
			theRambleList.checkMarkers();
		});
	}
}
S.RambleList.prototype.show = function() {
	for (var x in ids) {
		this.rambles[x].show();
	}
};
S.RambleList.prototype.hide = function() {
	for (var x in ids) {
		this.rambles[x].hide();
	}
};
// Clustering Algorithm
S.RambleList.prototype.checkMarkers = function() {
	for(var x in this.displayMarkers) {
		this.map.removeLayer(this.displayMarkers[x]);
	}
	this.displayMarkers=[];
	for(var x in this.rambles) {
		var tmpMarker = this.rambles[x].marker;

		this.map.removeLayer(tmpMarker);

		if(this.displayMarkers.length === 0) {
			tmpMarker.count=1;
			this.displayMarkers.push(tmpMarker);
		}
		var shouldCluster=false;

		for(var y in this.displayMarkers) {
			var tmpMarker2 = this.displayMarkers[y];
			if(tmpMarker.getLatLng().distanceTo(tmpMarker2.getLatLng()) <
(this.map.getBounds().getNorthEast().distanceTo(this.map.getBounds().getSouthWest())*0.01)) {
				console.log("should cluster");
				shouldCluster=true;
				this.displayMarkers[y]=new L.Marker(new L.LatLng((tmpMarker.getLatLng().lat+tmpMarker2.getLatLng().lat)/2,(tmpMarker.getLatLng().lng+tmpMarker2.getLatLng().lng)/2), {
					icon: new L.HtmlIcon({
					    html : "<div class='strabo-count-marker'>"+(tmpMarker2.count+1)+"</div>",
					})
				});
				this.displayMarkers[y].count = tmpMarker2.count+1;
			} else {
				console.log("nothing to cluster with");
			}
		}
		if(shouldCluster==false) {
			tmpMarker.count=1;
			this.displayMarkers.push(tmpMarker);
		} else {

		}
	}
	for(x in this.displayMarkers) {
		this.map.addLayer(this.displayMarkers[x]);
	}
}


S.RambleList.prototype.findRambleByToken = function(token) {
	var result;
	for (var x in this.rambles) {
		if(this.rambles[x].token==token) {
			result=this.rambles[x];
		}
	}
	return result;
}