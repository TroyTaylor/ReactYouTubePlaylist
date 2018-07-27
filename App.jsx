import React from 'react';
import update from 'react-addons-update';
import YouTube from 'react-youtube';
import {Helmet} from "react-helmet";
import Header from './components/header';
import PreviousUser from './components/previousUser';
import Playlists from './components/playlists';
//AIzaSyArX5eV_PIIYzNMt-ua9uiJiD0xjTia-Xk
//UC3I1jgVvwDgsCqdSlV3j8Cw

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			userName: '',
			id: ''
		}
		this.history = require('./util.js').setLocalStore;
		this.addUser = require('./util.js').addUser;
		this.historyUsers = require('./util.js').getUsers;
		this.setUser = this.setUser.bind(this);
		this.enterUser = this.enterUser.bind(this);
		this.searchUser = this.searchUser.bind(this);
		this.searchUserForm = this.searchUserForm.bind(this);
	};
	componentDidMount() {
		this.history();
		if (window.location.search.indexOf('userId=') > -1) {
			let userId = window.location.search.split('userId=')[1].split('&')[0];
			let userName = '';
			if (window.location.search.indexOf('userName=') > -1) {
				userName = window.location.search.split('userName=')[1].split('&')[0];
				this.setState({userName: userName, id: userId});
			}
		}
	}
	setUser(id, name) {
		this.setState({id: id, userName: name});
	}
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
			<React.Fragment>
				<Helmet>
					<title>Troy's YouTube Randomizer</title>
				</Helmet>
				<Header/>
				{this.state.id.length > 0 ? 
					<Playlists channelId={this.state.id} userName={this.state.userName} suf={this.searchUserForm} userName={this.state.userName} changeUserName={this.enterUser} su={this.searchUser} /> : 
					<div className='playlistSection'>
						<p>Enter a user name:</p>
						<form onSubmit={this.searchUserForm}>
							<input id="userName" value={this.state.userName} onChange={this.enterUser} />
							<button onClick={this.searchUser}>Search</button>
						</form>
						{this.historyUsers().length == 0 || this.state.id.length > 0 ? '' : <PreviousUser users={this.historyUsers()} su={this.setUser} />}
					</div>}
			</React.Fragment>
		);
	}
}

export default App;