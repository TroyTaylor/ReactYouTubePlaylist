import React from 'react';

class LoadingWheel extends React.Component {
	constructor(props) {
		super(props);
	};
	render() {
		return (
			<div className={this.props.containerClass}>
				{this.props.showWheel ? <p>{this.props.message}</p> : ''}
				{this.props.showWheel ? <div className='loadingWheel'></div> : ''}
			</div>
		);
	}
}

module.exports = LoadingWheel;