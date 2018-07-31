import React from 'react';
import update from 'react-addons-update';
import {Helmet} from "react-helmet";
import {animateScroll as scroll} from 'react-scroll';
import LoadingWheel from './loadingWheel';
import ListElement from './listElement';
import VideoPlayer from './videoPlayer';

class Playlists extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			playlists: [],
			combineIds: [],
			currentCombineId: 0,
			generatedList: [],
			pageTitle: 'Troy\'s YouTube Randomizer',
			currentVideoId: 0,
			currentIcon: '',
			displayVideoDescripion: true,
			loopPlay: false,
			loopCurrentVideo: false,
			displayUsersPlaylists: true,
			retrievingPlaylists: false,
			combiningPlaylists: false,
			playlistError: ''
		}
		this.addUser = require('../util.js').addUser;
		this.addCombination = require('../util.js').addCombination;
		this.historyCombinations = require('../util.js').isCombination;
		this.getCombination = require('../util.js').getCombination;
		this.selectPlaylistsFromStorage = this.selectPlaylistsFromStorage.bind(this);
		this.selectPlaylistProperty = this.selectPlaylistProperty.bind(this);
		this.selectAllPlaylists = this.selectAllPlaylists.bind(this);
		this.combineButton = this.combineButton.bind(this);
		this.previousVideo = this.previousVideo.bind(this);
		this.nextVideo = this.nextVideo.bind(this);
		this.goToVideo = this.goToVideo.bind(this);
		this.autoPlay = this.autoPlay.bind(this);
		this.finishedVideo = this.finishedVideo.bind(this);
		this.videoStateChanged = this.videoStateChanged.bind(this);
		this.showDescription = this.showDescription.bind(this);
		this.loopVideo = this.loopVideo.bind(this);
		this.loopPlaylist = this.loopPlaylist.bind(this);
		this.showUsersPlaylists = this.showUsersPlaylists.bind(this);
		this.randomizePlaylist = this.randomizePlaylist.bind(this);
	};
	//The ChannelID has to be passed in case the user changes the user name he searches playlists for
	getPlaylists(page, userId) {
		let that = this;
		let u = new URLSearchParams();
		u.append('part', 'snippet');
		u.append('fields', 'nextPageToken,items(id,snippet(title,thumbnails))');
		u.append('maxResults', '50');
		u.append('channelId', userId);
		u.append('key', 'AIzaSyArX5eV_PIIYzNMt-ua9uiJiD0xjTia-Xk');
		if (page != '') u.append('pageToken', page);
		this.setState({retrievingPlaylists: true});
		fetch('https://www.googleapis.com/youtube/v3/playlists?' + u).then(function(response) {
			response.json().then(function(data) {
				that.state.playlists = that.state.playlists.concat(data.items);
				if (that.state.playlists.length > 0) {
					that.addUser(userId, that.props.userName);
				}
				let previouslySelected = [];
				if (data.nextPageToken != undefined) {
					that.getPlaylists(data.nextPageToken, userId);
				} else {
					//Add property whether user has selected playlist
					let len = that.state.playlists.length;
					if (window.location.search.indexOf('combineList=') > -1) previouslySelected = window.location.search.split('combineList=')[1].split('&')[0].split(',');
					for (let i = 0; i < len; i++) {
						if (previouslySelected.indexOf(that.state.playlists[i].id) > -1) that.state.playlists[i].checked = true;
						else that.state.playlists[i].checked = false;
					}
					that.setState({playlists: that.state.playlists, retrievingPlaylists: false});
				}
				if (previouslySelected.length > 0) that.combinePlaylists('params');
			});
		}).catch(function(error) {
			console.log('error ' + error);
		});
	}
	combinePlaylists(source) {
		this.state.playlistError = '';
		let playlistsToCombine = this.state.playlists.filter(function(p) {
			return p.checked == true;
		}).map(function(current) {
			return {id: current.id, name: current.snippet.title};
		});
		if (playlistsToCombine.length == 0) {
			switch (source) {
				case 'params':
					this.state.playlistError = 'There are no valid playlist ids in your link';
					break;
				case 'button':
					this.state.playlistError = 'Please select at least one playlist';
					break;
				case 'local':
					this.state.playlistError = 'Looks like all the playlists are old';
					break;
			}
		}
		this.setState({combineIds: playlistsToCombine, playlistError: this.state.playlistError});
		let updatedURL = window.location.protocol + "//" + window.location.host + window.location.pathname + '?userId=' + this.props.channelId + '&userName=' + this.props.userName + '&combineList=' + playlistsToCombine.map(function(current){return current.id}).toString();
		window.history.pushState({path:updatedURL}, '', updatedURL);
		this.addCombination(this.props.channelId, playlistsToCombine.map(function(current){return current.id}));
		//For some reason the state is stale, so the array has to be passed to get the updated list of playlists
		if (playlistsToCombine.length > 0) this.loopLists(playlistsToCombine);
	}
	loopLists(selectedPlaylists) {
		this.state.generatedList = [];
		this.setState({generatedList: this.state.generatedList, combiningPlaylists: true});
		this.getPlaylistItems(selectedPlaylists[0].id, '');
	}
	getPlaylistItems(id, page) {
		let that = this;
		let u = new URLSearchParams();
		u.append('part', 'snippet');
		u.append('fields', 'nextPageToken,items(snippet)');
		u.append('maxResults', '50');
		u.append('key', 'AIzaSyArX5eV_PIIYzNMt-ua9uiJiD0xjTia-Xk');
		u.append('playlistId', id);
		if (page != '') u.append('pageToken', page);
		fetch('https://www.googleapis.com/youtube/v3/playlistItems?' + u).then(function(response) {
			response.json().then(function(data) {
				that.state.generatedList = that.state.generatedList.concat(data.items);
				if (data.nextPageToken != undefined) {
					that.getPlaylistItems(id, data.nextPageToken);
				} else if (that.state.currentCombineId < that.state.combineIds.length - 1) {
					that.state.currentCombineId++;
					that.getPlaylistItems(that.state.combineIds[that.state.currentCombineId].id, '');
				} else {
					//Randomize playlist
					that.randomizePlaylist();
					let len = that.state.generatedList.length;
					for (let i = 0; i < len; i++) {
						that.state.generatedList[i].playlistName = that.state.combineIds.find(function(x) {
							return x.id == that.state.generatedList[i].snippet.playlistId;
						}).name;
					}
					that.setState({combiningPlaylists: false});
					that.smoothScrollToTop();
				}
			});
		}).catch(function(error) {
			console.log('error ' + error);
		});
	}
	randomizePlaylist() {
		let len = this.state.generatedList.length;
		let tempGL = [];
		for (var i = 0; i < len - 1; i++) {
			//This removes one random element from generatedList and pushes it onto tempGL
			tempGL.push(this.state.generatedList.splice(Math.floor(Math.random() * this.state.generatedList.length), 1)[0]);
		}
		// Push the remaining item onto tempArr
		tempGL.push(this.state.generatedList[0]);
		this.state.generatedList = tempGL;
		this.state.currentCombineId = 0;
		this.state.currentVideoId = 0;
		this.setState({currentCombineId: this.state.currentCombineId, generatedList: this.state.generatedList, currentVideoId: this.state.currentVideoId});
	}
	smoothScrollToTop() {
		scroll.scrollToTop();
	}
	componentDidMount() {
		this.state.playlists = [];
		this.getPlaylists('', this.props.channelId);
	}
	componentDidUpdate() {
		/*let playlistsToCombine = this.state.playlists.filter(function(p) {
			return p.checked == true;
		}).map(function(current) {
			return current.id;
		});
		console.log(playlistsToCombine);*/
	}
	componentWillReceiveProps(x) {
		if (x.channelId != this.props.channelId) {
			this.state.playlists = [];
			this.getPlaylists('', x.channelId);
		}
	}
	selectPlaylistsFromStorage(event) {
		let combo = this.getCombination(this.props.channelId);
		for (let i = 0; i < this.state.playlists.length; i++) {
			if (combo.indexOf(this.state.playlists[i].id) > -1) this.state.playlists[i].checked = true;
			else this.state.playlists[i].checked = false;
		}
		this.setState({playlists: this.state.playlists});
		this.combinePlaylists('local');
	}
	selectPlaylistProperty(event) {
		let selectedPlaylist = this.state.playlists.filter(function(p) {
			return p.id == event.target.value;
		});
		let checked = selectedPlaylist[0].checked;
		let selectedIndex = this.state.playlists.findIndex(function(p) {
			return p.id == event.target.value;
		});
		this.setState({
			playlists: update(this.state.playlists, {[selectedIndex]: {checked: {$set: !checked}}})
		});
	}
	selectAllPlaylists(event) {
		let allPlaylists = this.state.playlists.map(function(current, index, arr) {
			arr[index].checked = event.target.checked;
		});
		this.setState({playlists: this.state.playlists});
	}
	combineButton(event) {
		this.combinePlaylists('button');
	}
	previousVideo(event) {
		if (this.state.currentVideoId > 0) {
			this.state.currentVideoId--;
			this.setState({currentVideoId: this.state.currentVideoId});
		//Checks if user wants playlist to loop
		} else if (this.state.loopPlay) {
			this.state.currentVideoId = this.state.generatedList.length - 1;
			this.setState({currentVideoId: this.state.currentVideoId});
		}
	}
	nextVideo(event) {
		if (this.state.currentVideoId < this.state.generatedList.length - 1) {
			this.state.currentVideoId++;
			this.setState({currentVideoId: this.state.currentVideoId});
		//Checks if user wants playlist to loop
		} else if (this.state.loopPlay) {
			this.state.currentVideoId = 0;
			this.setState({currentVideoId: this.state.currentVideoId});
		}
	}
	goToVideo(index) {
		if (index != this.state.currentVideoId) {
			this.state.currentVideoId = index;
			this.setState({currentVideoId: this.state.currentVideoId});
		}
	}
	autoPlay(event) {
		event.target.playVideo();
		this.state.pageTitle = 'Playing: ' + this.state.generatedList[this.state.currentVideoId].snippet.title + ' on Troy\'s YouTube Randomizer';
		this.setState({pageTitle: this.state.pageTitle});
	}
	finishedVideo(event) {
		if (this.state.loopCurrentVideo) {
			//Checks if user wants video to loop
			event.target.playVideo();
		} else if (this.state.currentVideoId < this.state.generatedList.length - 1) {
			this.state.currentVideoId++;
			this.setState({currentVideoId: this.state.currentVideoId});
		} else {
			//Checks if user wants playlist to loop
			if (this.state.loopPlay) {
				this.state.currentVideoId = 0;
				this.setState({currentVideoId: this.state.currentVideoId});
			}
		}
	}
	videoStateChanged(event) {
		switch (event.data) {
			case 0:
				this.state.pageTitle = 'Stopped: ' + this.state.generatedList[this.state.currentVideoId].snippet.title + ' on Troy\'s YouTube Randomizer';
				this.state.currentIcon = 'stop';
				break;
			case 1:
				this.state.pageTitle = 'Playing: ' + this.state.generatedList[this.state.currentVideoId].snippet.title + ' on Troy\'s YouTube Randomizer';
				this.state.currentIcon = 'play_arrow';
				break;
			case 2:
				this.state.pageTitle = 'Paused: ' + this.state.generatedList[this.state.currentVideoId].snippet.title + ' on Troy\'s YouTube Randomizer';
				this.state.currentIcon = 'pause';
				break;
			case 3:
				this.state.pageTitle = 'Loading: ' + this.state.generatedList[this.state.currentVideoId].snippet.title + ' on Troy\'s YouTube Randomizer';
				this.state.currentIcon = 'equalizer';
				break;
			case 5:
				this.state.pageTitle = 'Swapping: ' + this.state.generatedList[this.state.currentVideoId].snippet.title + ' on Troy\'s YouTube Randomizer';
				this.state.currentIcon = 'swap_calls';
				//The onReady event only occurs for the first video, so to get autoplay after that it must be triggered here
				event.target.playVideo();
				break;
			default:
				this.state.pageTitle = 'Troy\'s YouTube Randomizer';
				this.state.currentIcon = '';
		}
		this.setState({pageTitle: this.state.pageTitle, currentIcon: this.state.currentIcon});
	}
	loopPlaylist(event) {
		this.state.loopPlay = event.target.checked;
		this.setState({loopPlay: this.state.loopPlay});
	}
	showUsersPlaylists(event) {
		this.state.displayUsersPlaylists = event.target.checked;
		this.setState({displayUsersPlaylists: this.state.displayUsersPlaylists});
	}
	showDescription(event) {
		this.state.displayVideoDescripion = event.target.checked;
		this.setState({displayVideoDescripion: this.state.displayVideoDescripion});
	}
	loopVideo(event) {
		this.state.loopCurrentVideo = event.target.checked;
		this.setState({loopCurrentVideo: this.state.loopCurrentVideo});
	}
	render() {
		let prevVidSnip = {};
		let nextVidSnip = {};
		if (this.state.currentVideoId > 0) {
			prevVidSnip = this.state.generatedList[this.state.currentVideoId - 1].snippet;
		} else if (this.state.loopPlay) {
			prevVidSnip = this.state.generatedList[this.state.generatedList.length - 1].snippet;
		}
		if (this.state.currentVideoId < this.state.generatedList.length - 1) {
			nextVidSnip = this.state.generatedList[this.state.currentVideoId + 1].snippet;
		} else if (this.state.loopPlay) {
			nextVidSnip = this.state.generatedList[0].snippet;
		}
		return (
			<div className='main'>
				<Helmet defer={false}>
					<title>{this.state.pageTitle}</title>
				</Helmet>
				<div className={this.state.displayUsersPlaylists ? 'playlistSection' : 'playlistSection pushed'}>
					<p>Enter a user name:</p>
					<form onSubmit={this.props.suf}>
						<input id="changeUserName" value={this.props.userName} onChange={this.props.changeUserName} />
						<button onClick={this.props.su}>Search</button>
					</form>
					{this.historyCombinations(this.props.channelId) && this.state.playlists.length > 0 ? <p className="psHistoryCombo">
						<span>Would you like to use the last combination?</span>
						<button onClick={this.selectPlaylistsFromStorage}>Yes</button>
					</p>: ''}
					<ul>
						<li>
							<input type="checkbox" id="selectAll" onChange={this.selectAllPlaylists} />
							<label htmlFor="selectAll">Select All</label>
						</li>
						{this.state.playlists.map((list, i) => <ListElement key={i} componentData={list} spp={this.selectPlaylistProperty} />)}
					</ul>
					{this.state.retrievingPlaylists ? <LoadingWheel containerClass='' message='Loading Playlists' showWheel={this.state.retrievingPlaylists} /> : ''}
					<button onClick={this.combineButton}>Combine</button>
					<span className="error">{this.state.playlistError}</span>
				</div>
				{this.state.generatedList.length > 0 ? <VideoPlayer showHalfSize={this.state.displayUsersPlaylists} index={this.state.currentVideoId + 1} totalVids={this.state.generatedList.length} prevClick={this.previousVideo} prevData={prevVidSnip} nextClick={this.nextVideo} nextData={nextVidSnip} videoData={this.state.generatedList[this.state.currentVideoId].snippet} videoReady={this.autoPlay} videoDone={this.finishedVideo} videoSC={this.videoStateChanged} showDesc={this.state.displayVideoDescripion} svc={this.showDescription} loopVid={this.state.loopCurrentVideo} lv={this.loopVideo} loop={this.state.loopPlay} lp={this.loopPlaylist} shuffleClick={this.randomizePlaylist} gli={this.state.generatedList} ci={this.state.currentIcon} goto={this.goToVideo} dup={this.state.displayUsersPlaylists} sup={this.showUsersPlaylists} /> : <LoadingWheel containerClass='videoSection' message='Loading Videos' showWheel={this.state.combiningPlaylists} />}
			</div>
		);
	}
}

module.exports = Playlists;