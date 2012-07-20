"use strict";
/**
 * A list to control a large number of rambles.
 *
 * Example:
 *     var map = new L.Map(...);
 *     var ids = ["TOKEN_1","TOKEN_2"];
 *     var list = new S.RambleList(map,ids);
 *
 * 
 * @param {L.Map} map The map to plot the S.Ramble objects
 * @param {Array} ids An array of unique identifier strings to initialize Rambles with.
 *
 * @constructor
 * Creates a new instance of a S.RambleList
 */
S.RambleList = function(map, ids) {
	this.map = map;
	this.ids = ids;
	this.rambles = [];
	for(var x in ids) {
		this.rambles.push(new S.Ramble(map,ids[x]));
	}
}