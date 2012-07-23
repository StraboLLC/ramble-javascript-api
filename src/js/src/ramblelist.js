"use strict";

S.RambleList = function(map, ids, options) {
	this.options = options;
	this.map = map;
	this.ids = ids;
	this.rambles = [];
	for(var x in ids) {
		this.rambles.push(new S.Ramble(map,ids[x]));
	}
}
S.RambleList.prototype.show = function() {
	for(var x in ids) {
		this.rambles[x].show();
	}
};
S.RambleList.prototype.hide = function() {
	for(var x in ids) {
		this.rambles[x].hide();
	}
};