import React from 'react';

class ListElement extends React.Component {
	render() {
		return (
			<li>
				<input type="checkbox" value={this.props.componentData.id} checked={(this.props.componentData.checked === undefined) ? false : this.props.componentData.checked} id={this.props.componentData.id} onChange={this.props.spp} />
				<label htmlFor={this.props.componentData.id}>{this.props.componentData.snippet.title}</label>
			</li>
		);
	}
}

module.exports = ListElement;