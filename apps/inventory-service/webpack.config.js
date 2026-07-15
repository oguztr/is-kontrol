const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { IgnorePlugin } = require('webpack');
const { join } = require('path');

module.exports = {
  // @nestjs/swagger kök node_modules'ta olmadığı için nodeExternals onu (ve
  // swagger-ui-dist'i) bundle'a gömüyor; bundle içinde swagger-ui-dist'in
  // __dirname'i dist'i gösterdiğinden Swagger UI asset'leri 404 veriyor.
  // Externalize edilince asset yolu gerçek paketten çözülür.
  externals: [{ '@nestjs/swagger': 'commonjs @nestjs/swagger' }],
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ["./src/assets"],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
      mergeExternals: true,
    }),
    // class-validator/transformer kullanılmıyor (doğrulama zod ile);
    // @nestjs/mapped-types bunları try/catch içinde opsiyonel yükler.
    new IgnorePlugin({ resourceRegExp: /^class-(validator|transformer)(\/.*)?$/ }),
  ],
};
