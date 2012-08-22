S.Icon = L.Icon.extend({
	options: {
	    iconUrl: S.Config.SITE_BASE_URL+'/build/images/arrow.png',
	    shadowUrl: null,
	    iconSize: new L.Point(31, 40),
	    shadowSize: null,
	    iconAnchor: new L.Point(15, 30),
	    popupAnchor: new L.Point(-3, -20)
    }
});
