const path = require('path')

// const dirname = path.resolve(__dirname, '../packages/stripe/node_modules')

// const resolveAlias = name => ({ [name]: dirname + '/' + name })

// const alias = ['graphql-import-node'].reduce(
//   (prev, curr) => ({ ...prev, ...resolveAlias(curr) }),
//   {}
// )

module.exports = {
  resolve: {
    extensions: ['.wasm', '.mjs', '.js', '.json', '.ts', '.graphql'],
    // alias
  },
  module: {
    rules: [
      // {
      //   exclude: /node_modules/,
      //   test: /\.graphql$/,
      //   use: [{ loader: 'graphql-import-loader' }]
      // },
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          }
        ]
      }
    ]
  }
}
