const path = require('path')
const mode = 'production'
const workspaceRoot = require('@nrwl/workspace/src/utils/app-root').appRootPath
const appRoot = path.resolve(workspaceRoot, 'apps/example-subscriptions')

module.exports = {
  target: 'webworker',
  entry: path.resolve(appRoot, './src/index.ts'),
  resolve: {
    extensions: ['.ts', '.js'],
    plugins: [],
    modules: [path.resolve(workspaceRoot, 'node_modules')],
    alias: {
      graphql$: path.resolve(workspaceRoot, 'node_modules', 'graphql', 'index.js'),
      // While Apollo Server doesn't use the 'fs' Node.js builtin itself,
      // its dependency - graphql-upload - does leverage it.
      // An intention is for Apollo Server 3.x to no longer directly rely on
      // graphql-upload, so this may be re-visited when that release occurs.
      fs: path.resolve(appRoot, './null.js'),

      // The 'net' and 'tls' Node.js built-in usage within Apollo Server
      // is merely to run `instanceof` checks against an existing,
      // user-supplied "server" instance when subscriptions are desired to
      // be bound to an already-created server.  For the purposes of
      // Cloudflare, where none of these Node.js builtins exist, this
      // instanceof check is irrelevant because such a class could not
      // exist.
      net: path.resolve(appRoot, './null.js'),
      tls: path.resolve(appRoot, './null.js')
    }
  },
  // optimization: {
  //   usedExports: true
  // },
  optimization: {
    minimize: false
  },
  mode,
  output: {
    filename: `worker.js`,
    path: path.join(workspaceRoot, 'dist', 'example-subscriptions')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          configFile: require.resolve(
            path.resolve(appRoot, 'tsconfig.app.json')
          )
          // transpileOnly: true
        }
      }
    ]
  }
}
