import fs from 'node:fs';
import yaml from 'yaml';

test('BFF OpenAPI v1 snapshot', () => {
  const raw = fs.readFileSync('packages/contracts/openapi/bff.v1.yaml', 'utf8');
  const doc = yaml.parse(raw);
  expect(doc.openapi).toBe('3.0.3');
  expect(doc.info?.version).toBeDefined();
  expect(doc.paths?.['/v1/search']).toBeDefined();
  expect(doc).toMatchSnapshot();
});
