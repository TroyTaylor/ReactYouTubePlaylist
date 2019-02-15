import React from 'react';

export default class RelatedVideoSection extends React.Component {
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