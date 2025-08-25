module.exports = {
  search: {
    input: './openapi/search.yaml',
    output: {
      mode: 'split',
      target: './src/generated/',
      client: 'axios',
      schemas: './src/generated/model',
      override: {
        mutator: { path: './src/http.ts', name: 'apiHttp' }
      }
    }
  }
};
