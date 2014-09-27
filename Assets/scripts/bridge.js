#pragma strict

var host = 'http:///';

function Start () {

}

function Update () {

}

function devices(state) {

		return jQuery.ajax(host + '/devices/' + state);

}

function acceleration(device, coordinate) {

	return jQuery.ajax(host + '/');

}

function inclination(device, coordinate) {

	return jQuery.ajax(host + device + '/' + coordinate);
}

function beginGesture(device) {

	
}

