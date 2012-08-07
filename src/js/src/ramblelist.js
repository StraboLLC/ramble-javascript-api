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
S.RambleList.prototype.checkMarkers = function() {
	var displayMarkers=[];
	for(var x in this.rambles) {
		var tmpMarker = this.rambles[x].marker;

		this.map.removeLayer(tmpMarker);
		for(var y in displayMarkers) {
			var tmpMarker2 = displayMarkers[y];


		}
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