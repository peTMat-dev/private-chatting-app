const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./index.web.js",

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },

  resolve: {
    alias: {
      "react-native$": "react-native-web",
    },
    extensions: [".web.js", ".js", ".jsx", ".ts", ".tsx"],
    fullySpecified: false,
  },

module: {
  rules: [
    {
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    },
    {
      test: /\.(png|jpe?g|gif|svg)$/i,
      type: "asset/resource",
    },
    {
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: /node_modules/,
      use: {
        loader: "babel-loader",
      },
    },
  ],
},

plugins: [
  new webpack.DefinePlugin({
    __DEV__: JSON.stringify(true),
  }),
  new HtmlWebpackPlugin({
    template: "./web/index.html",
  }),
],

  devServer: {
    host: "0.0.0.0",
    port: 8081,
  },
};