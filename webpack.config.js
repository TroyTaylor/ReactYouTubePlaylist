__dirname = __dirname.charAt(0).toUpperCase() + __dirname.slice(1);
var config = {
	entry: './main.js',
	mode: 'development',
	
	output: {
		path: __dirname,
		filename: 'index.js',
	},
	
	devServer: {
		inline: true,
		port: 8080
	},
	
	module: {
		rules: [
			{
				test: /\.jsx?$/,
				exclude: /node_modules/,
				loader: 'babel-loader',
				query: {
					presets: ['es2015', 'react']
				}
			},
			{
				test: /\.css$/,
				loader: "style-loader!css-loader"
			}
		]
	}
}

module.exports = config;