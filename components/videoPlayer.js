import React from 'react';
import YouTube from 'react-youtube';
import RelatedVideoSection from './relatedVideoSection';

let newReactScroll = require('react-scroll');

class ScrollListElement extends newReactScroll.Element {
	render() {
		return (React.createElement('li', this.props))
	}
}

class VideoPlayer extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			relatedVideos: []
		}
		this.getRelatedVideos = this.getRelatedVideos.bind(this);
		this.scrollCurrentVideoToTop = this.scrollCurrentVideoToTop.bind(this);
	};
	shouldComponentUpdate(nextProps, nextState) {
		if (nextProps.videoData.resourceId.videoId != this.props.videoData.resourceId.videoId) {
			this.state.relatedVideos = [];
			this.setState({relatedVideos: this.state.relatedVideos});
		}
		return true;
	}
	scrollCurrentVideoToTop(newCurrentVideo, playNewVideo) {
		newReactScroll.scroller.scrollTo(newCurrentVideo, {containerId: 'lineupSectionContainer'});
		playNewVideo();
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
					{this.props.prevData.title == undefined ? <div></div> : <button className="prevButton" onClick={() => this.scrollCurrentVideoToTop('pli' + (this.props.index - 2), this.props.prevClick)}><div className="matIcon miPrev">skip_previous</div></button>}
					{this.props.prevData.title == undefined ? '' : <div className="vnInfo prevInfo"><p>Previous: {this.props.prevData.title}</p><img src={this.props.prevData.thumbnails.default.url} /></div>}
					
					{this.props.nextData.title == undefined ? <div></div> : <button className="nextButton" onClick={() => this.scrollCurrentVideoToTop('pli' + this.props.index, this.props.nextClick)}><div className="matIcon miNext">skip_next</div></button>}
					{this.props.nextData.title == undefined ? '' : <div className="vnInfo nextInfo"><p>Next: {this.props.nextData.title}</p><img src={this.props.nextData.thumbnails.default.url} /></div>}
				</div>
				<YouTube videoId={this.props.videoData.resourceId.videoId} id="generatedPlayer" opts={opts} onReady={this.props.videoReady} onEnd={this.props.videoDone} onStateChange={this.props.videoSC} />
				<div className="playOpts">
					<input type="checkbox" id="showVideoDesc" className="hiddenInput" checked={this.props.showDesc} onChange={this.props.svc} />
					<label className="poWrap" htmlFor="showVideoDesc" title={this.props.showDesc ? 'Hide Video Description' : 'Show Video Description'}>
						<div className="matIcon loopIcon">subject</div>
					</label>
					<input type="checkbox" id="loopVideo" className="hiddenInput" checked={this.props.loopVid} onChange={this.props.lv} />
					<label className="poWrap" htmlFor="loopVideo" title="Loop Video">
						<div className="matIcon loopIcon">replay</div>
					</label>
					<input type="checkbox" id="loopPlay" className="hiddenInput" checked={this.props.loop} onChange={this.props.lp} />
					<label className="poWrap" htmlFor="loopPlay" title="Loop Playlist">
						<div className="matIcon loopIcon">loop</div>
					</label>
					<button className="poWrap">
						<div className="matIcon shuffleIcon" title="Shuffle" onClick={this.props.shuffleClick}>shuffle</div>
					</button>
					<button className="poWrap">
						<div className="matIcon relatedIcon" title="Related Videos" onClick={() => this.getRelatedVideos(this.props.videoData.resourceId.videoId, '')}>library_add</div>
					</button>
					<input type="checkbox" id="showUsersPlaylists" className="hiddenInput" checked={this.props.dup} onChange={this.props.sup} />
					<label className="poWrap" htmlFor="showUsersPlaylists" title="Show User Playlists">
						<div className="matIcon loopIcon">view_list</div>
					</label>
				</div>
				<div className={this.props.showDesc ? 'videoDescription' : 'videoDescription closed'}>
					{this.props.videoData.description}
				</div>
				<div id="lineupSectionContainer" className={this.state.relatedVideos.length > 0 ? 'lineupSection half' : 'lineupSection'}>
					<ol>
						{this.props.gli.map(
							(video, i) => <ScrollListElement name={'pli' + i} key={i} className={this.props.index - 1 == i ? 'currentPlaylistItem' : ''}>
								<span title={video.snippet.title + ' - ' + video.playlistName} onClick={() => this.props.goto(i)}>
									<span className="videoName">{video.snippet.title} - [{video.playlistName}]</span>
									{this.props.index - 1 == i ? <span className={'matIcon playingIcon ' + this.props.ci}>{this.props.ci}</span> : ''}
								</span>
							</ScrollListElement>
						)}
					</ol>
				</div>
				{this.state.relatedVideos.length > 0 ? <RelatedVideoSection related={this.state.relatedVideos} /> : ''}
			</div>
		);
	}
}

module.exports = VideoPlayer;