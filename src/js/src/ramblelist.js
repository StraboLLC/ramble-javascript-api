"use strict";

S.RambleList = function(map, ids, options) {
	var theRambleList = this;
	this.options = options || {};
	this.map = map;
	this.ids = ids;
	this.rambles = [];

	this.cluster = new L.MarkerClusterGroup();

	var toCluster=this.options.clustering;
	var popup = new L.Popup();

	for (var x in ids) {
		var aRamble = new S.Ramble(map, ids[x], {
			addToMap: false,
			list: theRambleList,
			clustering: toCluster
		});
		this.rambles.push(aRamble);
	}
	if(this.options.clustering) {

/*
		map.on("zoomend", function() {
			theRambleList.checkMarkers();
		});
		for(var x in this.rambles) {
			this.rambles[x].addEventListener("geodatapulled",function() {
				theRambleList.checkMarkers();
			});
		}
*/
		this.map.addLayer(this.cluster);
	}
}
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
	for(var x in this.displayMarkers) {
		this.map.removeLayer(this.displayMarkers[x]);
	}
	this.displayMarkers=[];
	var shouldProceed=true;
	for(var x in this.rambles) {
		if(!this.rambles[x].marker) {
			shouldProceed=false;
		}
	}
	if(shouldProceed) {
		for(var x in this.rambles) {
			var tmp = this.rambles[x].marker;

			this.map.removeLayer(tmp);


			if(this.displayMarkers.length === 0) {
				tmp.count=1;
				this.displayMarkers.push(tmp);

			}
			var shouldCluster=false;

			for(var y in this.displayMarkers) {
				var tmp2 = this.displayMarkers[y];

				if(tmp.getLatLng().distanceTo(tmp2.getLatLng()) <
	(this.map.getBounds().getNorthEast().distanceTo(this.map.getBounds().getSouthWest())*0.01)) {

					shouldCluster=true;
					this.displayMarkers[y]=new L.Marker(new L.LatLng((tmp.getLatLng().lat+tmp2.getLatLng().lat)/2,(tmp.getLatLng().lng+tmp2.getLatLng().lng)/2), {
						icon: new L.HtmlIcon({
						    html : "<div class='strabo-count-marker'>"+(tmp2.count+1)+"</div>",
						})
					});
					this.displayMarkers[y].generatedMarker=true;
					this.displayMarkers[y].children=[];

					this.displayMarkers[y].children=this.displayMarkers[y].children.concat(this.pullChildren(tmp));
					this.displayMarkers[y].children=this.displayMarkers[y].children.concat(this.pullChildren(tmp2));
					this.displayMarkers[y].on("click", function() {
						console.log("Click Detected");
						var m = this;
						map.removeLayer(m);
						for(var x in m.children) {
							map.addLayer(m.children[x]);
							var degToFan = (x*2*Math.PI)/m.children.length;
							console.log(degToFan);
							var xDistance = Math.cos(degToFan);
							var yDistance = Math.sin(degToFan);
							xDistance *= map.getBounds().getNorthEast().distanceTo(map.getBounds().getSouthWest());
							yDistance *= map.getBounds().getNorthEast().distanceTo(map.getBounds().getSouthWest());
							xDistance *= 0.0000001;
							yDistance *= 0.0000001;
							console.log(xDistance,yDistance);
							m.children[x].oldLatLng=m.children[x].getLatLng();
							m.children[x].setLatLng(new L.LatLng(m.children[x].getLatLng().lat+xDistance, m.children[x].getLatLng().lng+yDistance));

						}
/*
						window.setTimeout(function() {
							map.addLayer(m);
						}, 1000);
*/
					});
					this.displayMarkers[y].count = tmp2.count+1;
				} else {

				}
			}
			if(shouldCluster==false) {
				tmp.count=1;
				this.displayMarkers.push(tmp);
			} else {

			}
		}
	}
	for(x in this.displayMarkers) {
		this.map.addLayer(this.displayMarkers[x]);
	}

}
S.RambleList.prototype.pullChildren = function(marker) {
	var result = [];
	if(marker.children) {
		for(var x in marker.children) {
			result = result.concat(this.pullChildren(marker.children[x]));
		}
	} else {
		result.push(marker);
	}
	return result;
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