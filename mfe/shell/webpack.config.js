const HtmlWebpackPlugin = require('html-webpack-plugin')
const { container } = require('webpack')
const path = require('node:path')
const { dependencies } = require('./package.json')
const { loadEnv } = require('../env')

const { ModuleFederationPlugin } = container

module.exports = (_env, argv) => {
  const urls = loadEnv(argv.mode ?? 'production')

  return {
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
    devServer: { port: 4000, hot: true, historyApiFallback: true },
    plugins: [
      new ModuleFederationPlugin({
        name: 'shell',
        remotes: {
          tasks: `tasks@${urls.TASKS_URL}/remoteEntry.js`,
          users: `users@${urls.USERS_URL}/remoteEntry.js`,
          // El nombre del contenedor debe ser un identificador válido (sin guiones).
          queryLab: `queryLab@${urls.QUERY_LAB_URL}/remoteEntry.js`,
        },
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
}
