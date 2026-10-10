const HtmlWebpackPlugin = require('html-webpack-plugin')
const { container, DefinePlugin } = require('webpack')
const path = require('node:path')
const { dependencies } = require('./package.json')

const { ModuleFederationPlugin } = container

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: 'auto',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  module: {
    rules: [
      // Documentación: `import doc from './docs.md?raw'` entrega el texto markdown.
      { resourceQuery: /raw/, type: 'asset/source' },
      { test: /\.css$/, use: ['style-loader', 'css-loader', 'postcss-loader'] },
      { test: /\.woff2?$/, type: 'asset/resource' }, // fuentes autoalojadas (@fontsource)
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: { transpileOnly: true },
        exclude: /node_modules/,
      },
    ],
  },
  // react-markdown + axios superan el límite por defecto (244 KiB); es un remote didáctico.
  performance: { maxAssetSize: 600_000, maxEntrypointSize: 600_000 },
  devServer: {
    port: 4003,
    hot: true,
    historyApiFallback: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  plugins: [
    new DefinePlugin({
      'process.env.API_URL': JSON.stringify(process.env.API_URL ?? 'http://localhost:3000'),
    }),
    new ModuleFederationPlugin({
      name: 'queryLab',
      filename: 'remoteEntry.js',
      exposes: { './QueryLabApp': './src/QueryLabApp' },
      shared: {
        react: { singleton: true, requiredVersion: dependencies.react },
        'react-dom': { singleton: true, requiredVersion: dependencies['react-dom'] },
        'react-router': { singleton: true, requiredVersion: dependencies['react-router'] },
        '@tanstack/react-query': {
          singleton: true,
          requiredVersion: dependencies['@tanstack/react-query'],
        },
      },
    }),
    new HtmlWebpackPlugin({ template: './public.html', publicPath: '/' }),
  ],
}
