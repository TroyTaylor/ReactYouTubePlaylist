import React from 'react';

let setLocalStore = function() {
	let history = {
		users: []
	}
	if (JSON.parse(localStorage.getItem('youtubePlaylistHistory')) == null) {
		localStorage.setItem('youtubePlaylistHistory', JSON.stringify(history));
	}
}

let addUser = function(id, name) {
	let history = JSON.parse(localStorage.getItem('youtubePlaylistHistory'));
	let checkForExisting = history.users.filter(function(a) {
		return a.id == id;
	});
	if (checkForExisting.length == 0) {
		history.users.push({id: id, name: name, lastCombination: []});
		localStorage.setItem('youtubePlaylistHistory', JSON.stringify(history));
	}
}

let getUsers = function() {
	let history = JSON.parse(localStorage.getItem('youtubePlaylistHistory'));
	if (JSON.parse(localStorage.getItem('youtubePlaylistHistory')) == null) {
		return [];
	} else {
		return history.users;
	}
}

let addCombination = function(id, list) {
	let history = JSON.parse(localStorage.getItem('youtubePlaylistHistory'));
	let existingUserIndex = -1;
	let existingUser = history.users.filter(function(a, b) {
		if (a.id == id) {
			existingUserIndex = b;
			return true;
		} else return false;
	});
	if (existingUserIndex > -1) {
		history.users[existingUserIndex].lastCombination = list;
		localStorage.setItem('youtubePlaylistHistory', JSON.stringify(history));
	}
}

let isCombination = function(id) {
	let history = JSON.parse(localStorage.getItem('youtubePlaylistHistory'));
	if (history.users.filter(function(a) {return a.id == id;}).length > 0) return true;
	else return false;
}

let getCombination = function(id) {
	let history = JSON.parse(localStorage.getItem('youtubePlaylistHistory'));
	let lastCombo = history.users.filter(function(a) {return a.id == id;})[0];
	return lastCombo.lastCombination;
}

exports.setLocalStore = setLocalStore;
exports.addUser = addUser;
exports.getUsers = getUsers;
exports.addCombination = addCombination;
exports.isCombination = isCombination;
exports.getCombination = getCombination;