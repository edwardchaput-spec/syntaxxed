// @ts-check

'use strict';

const path = require('node:path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const COPYRIGHT_BANNER =
	'Copyright (c) 2026 Edward Chaput de Saintonge.\n' +
	'Licensed under the Apache License, Version 2.0. See LICENSE and NOTICE.';
const COPYRIGHT_COMMENT_PATTERN =
	/Copyright \(c\) 2026 Edward Chaput de Saintonge/;

/** @typedef {import('webpack').Configuration} WebpackConfiguration */

/**
 * @param {Record<string, unknown>} _environment
 * @param {import('webpack').Configuration} arguments_
 * @returns {WebpackConfiguration[]}
 */
module.exports = (_environment, arguments_) => {
	const isProduction = arguments_.mode === 'production';
	/** @returns {NonNullable<WebpackConfiguration['optimization']>} */
	const optimization = () =>
		isProduction
			? {
					minimize: true,
					minimizer: [
						new TerserPlugin({
							extractComments: false,
							terserOptions: {
								compress: {
									passes: 3,
								},
								mangle: {
									toplevel: true,
								},
								format: {
									ascii_only: true,
									comments: COPYRIGHT_COMMENT_PATTERN,
								},
							},
						}),
					],
			  }
			: { minimize: false };
	/** @returns {import('webpack').BannerPlugin} */
	const copyrightBanner = () =>
		new webpack.BannerPlugin({
			banner: COPYRIGHT_BANNER,
			raw: false,
		});
	/**
	 * @param {string} configFile
	 * @returns {NonNullable<WebpackConfiguration['module']>}
	 */
	const typescriptModule = (configFile) => ({
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: {
					loader: 'ts-loader',
					options: {
						configFile,
						transpileOnly: false,
					},
				},
			},
		],
	});

	/** @type {WebpackConfiguration} */
	const shared = {
		target: 'node',
		mode: isProduction ? 'production' : 'development',
		resolve: {
			extensions: ['.ts', '.js'],
		},
		devtool: isProduction ? false : 'nosources-source-map',
		infrastructureLogging: {
			level: 'warn',
		},
	};

	/** @type {WebpackConfiguration} */
	const extension = {
		...shared,
		name: 'extension',
		entry: './src/extension.ts',
		module: typescriptModule('tsconfig.json'),
		optimization: optimization(),
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: 'extension.js',
			library: { type: 'commonjs2' },
			clean: { keep: /^cli\// },
		},
		externals: {
			vscode: 'commonjs vscode',
		},
		plugins: [copyrightBanner()],
	};

	/** @type {WebpackConfiguration} */
	const cli = {
		...shared,
		name: 'cli',
		entry: './src/cli/index.ts',
		module: typescriptModule('tsconfig.cli.json'),
		optimization: optimization(),
		output: {
			path: path.resolve(__dirname, 'dist', 'cli'),
			filename: 'index.js',
			library: { type: 'commonjs2' },
			clean: true,
		},
		plugins: [
			copyrightBanner(),
			new webpack.BannerPlugin({
				banner: '#!/usr/bin/env node',
				raw: true,
				entryOnly: true,
			}),
		],
	};

	return [extension, cli];
};
