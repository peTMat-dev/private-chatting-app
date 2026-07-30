 const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
entry: './index.web.js',

output: {
path: path.resolve(__dirname, 'dist'),
filename: 'bundle.js',
},

resolve: {
alias: {
'react-native$': 'react-native-web',
},
extensions: ['.web.js', '.js', '.jsx'],
},

module: {
rules: [
{
test: /\.(js|jsx)$/,
exclude: /node_modules/,
use: {
loader: 'babel-loader',
},
},
],
},

plugins: [
new HtmlWebpackPlugin({
template: './web/index.html',
}),
],

devServer: {
host: '0.0.0.0',
port: 8081,
},
};