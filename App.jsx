import React from 'react';
import update from 'react-addons-update';
import YouTube from 'react-youtube';
//AIzaSyArX5eV_PIIYzNMt-ua9uiJiD0xjTia-Xk
//UC3I1jgVvwDgsCqdSlV3j8Cw

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			userName: '',
			id: ''
		}
		this.enterUser = this.enterUser.bind(this);
		this.searchUser = this.searchUser.bind(this);
		this.searchUserForm = this.searchUserForm.bind(this);
	};
	enterUser(event) {
		this.setState({userName: event.target.value});
	}
	searchUser() {
		let that = this;
		let u = new URLSearchParams();
		u.append('part', 'snippet');
		u.append('fields', 'items(id)');
		u.append('forUsername', that.state.userName);
		u.append('key', 'AIzaSyArX5eV_PIIYzNMt-ua9uiJiD0xjTia-Xk');
		fetch('https://www.googleapis.com/youtube/v3/channels?' + u).then(function(response) {
			response.json().then(function(dataResponse) {
				if (dataResponse.items.length > 0) {
					that.setState({id: dataResponse.items[0].id});
				} else {
					//error
				}
			});
		}).catch(function(error) {
			console.log('error ' + error);
		});
	}
	searchUserForm(event) {
		event.preventDefault();
		this.searchUser();
	}
	render() {
		return (
			<div>
				<Header/>
				{this.state.id.length > 0 ? '' : <p>Enter a user name:</p>}
				{this.state.id.length > 0 ? '' : <form onSubmit={this.searchUserForm}>
					<input id="userName" value={this.state.userName} onChange={this.enterUser} />
					<button onClick={this.searchUser}>Search</button>
				</form>}
				{this.state.id.length > 0 ? <Playlists channelId={this.state.id} suf={this.searchUserForm} userName={this.state.userName} changeUserName={this.enterUser} su={this.searchUser} /> : ''}
			</div>
		);
	}
}

class Header extends React.Component {
	render() {
		return (
			<div>
				<h1>New and Improved YouTube Randomizer</h1>
			</div>
		);
	}
}

class Playlists extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			playlists: [],
			combineIds: [],
			currentCombineId: 0,
			generatedList: [],
			currentVideoId: 0,
			currentIcon: '',
			displayVideoDescripion: true,
			loopPlay: false,
			loopCurrentVideo: false,
			displayUsersPlaylists: true
		}
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
		fetch('https://www.googleapis.com/youtube/v3/playlists?' + u).then(function(response) {
			response.json().then(function(data) {
				that.state.playlists = that.state.playlists.concat(data.items);
				if (data.nextPageToken != undefined) {
					that.getPlaylists(data.nextPageToken, userId);
				} else {
					//Add property whether user has selected playlist
					let len = that.state.playlists.length;
					for (let i = 0; i < len; i++) {
						that.state.playlists[i].checked = false;
					}
					that.setState({playlists: that.state.playlists});
				}
			});
		}).catch(function(error) {
			console.log('error ' + error);
		});
	}
	loopLists(selectedPlaylists) {
		this.state.generatedList = [];
		this.setState({generatedList: this.state.generatedList});
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
					that.smoothScrollToTop();
					setTimeout(function(){
						that.smoothScrollToTop();
					}, 40);
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
		let that = this;
		if (window.scrollY > 0) {
			window.scrollTo(0, window.scrollY - 100);
			setTimeout(function(){
				that.smoothScrollToTop();
			}, 40);
		}
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
		let playlistsToCombine = this.state.playlists.filter(function(p) {
			return p.checked == true;
		}).map(function(current) {
			return {id: current.id, name: current.snippet.title};
		});
		this.setState({combineIds: playlistsToCombine});
		//For some reason the state is stale, so the array has to be passed to get the updated list of playlists
		if (playlistsToCombine.length > 0) this.loopLists(playlistsToCombine);
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
		document.title = 'React App Playing: ' + this.state.generatedList[this.state.currentVideoId].snippet.title;
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
				this.state.currentIcon = 'stop';
				break;
			case 1:
				this.state.currentIcon = 'play_arrow';
				break;
			case 2:
				this.state.currentIcon = 'pause';
				break;
			case 3:
				this.state.currentIcon = 'equalizer';
				break;
			case 5:
				this.state.currentIcon = 'swap_calls';
				//The onReady event only occurs for the first video, so to get autoplay after that it must be triggered here
				event.target.playVideo();
				document.title = 'React App Playing: ' + this.state.generatedList[this.state.currentVideoId].snippet.title;
				break;
			default:
				this.state.currentIcon = '';
		}
		this.setState({currentIcon: this.state.currentIcon});
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
		let videoList = this.state.generatedList.map(function(current) {
			return current.snippet.resourceId.videoId;
		});
		return (
			<div>
				<div className={this.state.displayUsersPlaylists ? 'playlistSection' : 'playlistSection pushed'}>
					<p>Enter a user name:</p>
					<form onSubmit = {this.props.suf}>
						<input id="changeUserName" value={this.props.userName} onChange={this.props.changeUserName} />
						<button onClick={this.props.su}>Search</button>
					</form>
					<ul>
						<li>
							<input type="checkbox" id="selectAll" onChange={this.selectAllPlaylists} />
							<label htmlFor="selectAll">Select All</label>
						</li>
						{this.state.playlists.map((list, i) => <ListElement key={i} componentData={list} spp={this.selectPlaylistProperty} />)}
					</ul>
					<button onClick={this.combineButton}>Combine</button>
				</div>
				{this.state.generatedList.length > 0 ? <VideoPlayer showHalfSize={this.state.displayUsersPlaylists} index={this.state.currentVideoId + 1} totalVids={this.state.generatedList.length} prevClick={this.previousVideo} prevData={prevVidSnip} nextClick={this.nextVideo} nextData={nextVidSnip} videoData={this.state.generatedList[this.state.currentVideoId].snippet} videoReady={this.autoPlay} videoDone={this.finishedVideo} videoSC={this.videoStateChanged} showDesc={this.state.displayVideoDescripion} svc={this.showDescription} loopVid={this.state.loopCurrentVideo} lv={this.loopVideo} loop={this.state.loopPlay} lp={this.loopPlaylist} shuffleClick={this.randomizePlaylist} gli={this.state.generatedList} ci={this.state.currentIcon} goto={this.goToVideo} dup={this.state.displayUsersPlaylists} sup={this.showUsersPlaylists} /> : ''}
			</div>
		);
	}
}

class ListElement extends React.Component {
	render() {
		return (
			<li>
				<input type="checkbox" value={this.props.componentData.id} checked={this.props.componentData.checked} id={this.props.componentData.id} onChange={this.props.spp} />
				<label htmlFor={this.props.componentData.id}>{this.props.componentData.snippet.title}</label>
			</li>
		);
	}
}

class VideoPlayer extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			relatedVideos: []
		}
		this.getRelatedVideos = this.getRelatedVideos.bind(this);
	};
	shouldComponentUpdate(nextProps, nextState) {
		if (nextProps.videoData.resourceId.videoId != this.props.videoData.resourceId.videoId) {
			this.state.relatedVideos = [];
			this.setState({relatedVideos: this.state.relatedVideos});
		}
		return true;
	}
	getRelatedVideos(id, page) {
		let that = this;
		let u = new URLSearchParams();
		u.append('part', 'snippet');
		u.append('fields', 'nextPageToken,items(id,snippet(title,thumbnails(default)))');
		u.append('maxResults', '50');
		u.append('type', 'video');
		u.append('key', 'AIzaSyArX5eV_PIIYzNMt-ua9uiJiD0xjTia-Xk');
		u.append('relatedToVideoId', id);
		if (page != '') u.append('pageToken', page);
		fetch('https://www.googleapis.com/youtube/v3/search?' + u).then(function(response) {
			response.json().then(function(data) {
				that.state.relatedVideos = that.state.relatedVideos.concat(data.items);
				if (data.nextPageToken != undefined) {
					that.getRelatedVideos(id, data.nextPageToken);
				} else {
					//This filters out the related videos that are already in the selected playlists
					let videoList = that.props.gli.map(function(current) {
						return current.snippet.resourceId.videoId;
					});
					that.state.relatedVideos = that.state.relatedVideos.filter(function(e) {
						return this.indexOf(e.id.videoId) < 0;
					}, videoList);
					that.setState({relatedVideos: that.state.relatedVideos});
				}
			});
		}).catch(function(error) {
			console.log('error ' + error);
		});
	}
	render() {
		const opts = {
			height: '480',
			width: '640'
		};
		return (
			<div className={this.props.showHalfSize ? 'videoSection' : 'videoSection full'}>
				<p className="currentTitle"><span className="currentTitleName">{this.props.videoData.title}</span> <span className="currentTitleCount">{this.props.index} of {this.props.totalVids}</span></p>
				<div className="videoNav">
					{this.props.prevData.title == undefined ? '' : <button className="prevButton" onClick={this.props.prevClick}><div className="matIcon miPrev">skip_previous</div></button>}
					{this.props.prevData.title == undefined ? '' : <div className="vnInfo prevInfo"><p>Previous: {this.props.prevData.title}</p><img src={this.props.prevData.thumbnails.default.url} /></div>}
					
					{this.props.nextData.title == undefined ? '' : <button className="nextButton" onClick={this.props.nextClick}><div className="matIcon miNext">skip_next</div></button>}
					{this.props.nextData.title == undefined ? '' : <div className="vnInfo nextInfo"><p>Next: {this.props.nextData.title}</p><img src={this.props.nextData.thumbnails.default.url} /></div>}
				</div>
				<div className="clear"></div>
				<YouTube videoId={this.props.videoData.resourceId.videoId} id="generatedPlayer" opts={opts} onReady={this.props.videoReady} onEnd={this.props.videoDone} onStateChange={this.props.videoSC} />
				<div className="playOpts">
					<input type="checkbox" id="showVideoDesc" checked={this.props.showDesc} onChange={this.props.svc} />
					<label htmlFor="showVideoDesc" title="Show Video Description">
						<div className="poWrap">
							<div className="matIcon loopIcon">subject</div>
						</div>
					</label>
					<input type="checkbox" id="loopVideo" checked={this.props.loopVid} onChange={this.props.lv} />
					<label htmlFor="loopVideo" title="Loop Video">
						<div className="poWrap">
							<div className="matIcon loopIcon">replay</div>
						</div>
					</label>
					<input type="checkbox" id="loopPlay" checked={this.props.loop} onChange={this.props.lp} />
					<label htmlFor="loopPlay" title="Loop Playlist">
						<div className="poWrap">
							<div className="matIcon loopIcon">loop</div>
						</div>
					</label>
					<div className="poWrap">
						<div className="matIcon shuffleIcon" title="Shuffle" onClick={this.props.shuffleClick}>shuffle</div>
					</div>
					<div className="poWrap">
						<div className="matIcon relatedIcon" title="Related Videos" onClick={() => this.getRelatedVideos(this.props.videoData.resourceId.videoId, '')}>library_add</div>
					</div>
					<input type="checkbox" id="showUsersPlaylists" checked={this.props.dup} onChange={this.props.sup} />
					<label htmlFor="showUsersPlaylists" title="Show User Playlists">
						<div className="poWrap">
							<div className="matIcon loopIcon">view_list</div>
						</div>
					</label>
				</div>
				<div className={this.props.showDesc ? 'videoDescription' : 'videoDescription closed'}>
					{this.props.videoData.description}
				</div>
				<div className={this.state.relatedVideos.length > 0 ? 'lineupSection half' : 'lineupSection'}>
					<ul>
						{this.props.gli.map(
							(video, i) => <li key={i} className={this.props.index - 1 == i ? 'currentPlaylistItem' : ''}>
								<span>{(i + 1) + '. '}</span>
								<a href="javascript:void(0)" title={video.snippet.title} onClick={() => this.props.goto(i)}>
									<span>{video.snippet.title} - [{video.playlistName}] {this.props.index - 1 == i ? <div className={'matIcon playingIcon ' + this.props.ci}>{this.props.ci}</div> : ''}</span>
								</a>
							</li>
						)}
					</ul>
				</div>
				{this.state.relatedVideos.length > 0 ? <RelatedVideoSection related={this.state.relatedVideos} /> : ''}
			</div>
		);
	}
}

class RelatedVideoSection extends React.Component {
	render() {
		return (
			<div className="relatedSection">
				<p>Related Videos</p>
				<ul>
					{this.props.related.map(
						(video, i) => <li key={i}>
							<a href={'https://www.youtube.com/watch?v=' + video.id.videoId} title={video.snippet.title} target="_blank">
								<span>{video.snippet.title}</span>
								<img src={video.snippet.thumbnails.default.url} alt={video.snippet.title} />
							</a>
						</li>
					)}
				</ul>
			</div>
		);
	}
}

export default App;