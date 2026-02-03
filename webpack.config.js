const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development', // Importante para que el servidor sea rápido
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
    clean: true, // Limpia la carpeta dist en cada build
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html', // Tu archivo fuente
    }),
  ],
  devServer: {
    static: './dist',
    hot: true, // Habilita Hot Module Replacement
    port: 3000, // Puedes cambiar el puerto aquí
    open: true, // Abre el navegador automáticamente
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};