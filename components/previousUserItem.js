import React from 'react';

export default class PreviousUserItem extends React.Component {
	render() {
		return (
			<li>
				<button onClick={() => this.props.su(this.props.componentData.id, this.props.componentData.name)}>{this.props.componentData.name}</button>
			</li>
		);
	}
}