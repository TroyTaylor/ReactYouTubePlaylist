import React from 'react';
import PreviousUserItem from './previousUserItem';

class PreviousUser extends React.Component {
	render() {
		return (
			<div className='previousUser'>
				<p>Would like to select:</p>
				<ul>
					{this.props.users.map((list, i) => <PreviousUserItem key={i} componentData={list} su={this.props.su} />)}
				</ul>
			</div>
		);
	}
}

module.exports = PreviousUser;