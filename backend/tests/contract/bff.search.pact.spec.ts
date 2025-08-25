import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";

describe("BFF OpenAPI snapshot", () => {
  it("has /v1/search schema", () => {
    const p = path.resolve("packages/contracts/openapi/bff.v1.yaml");
    const doc = yaml.parse(fs.readFileSync(p, "utf8"));
    expect(doc.paths["/v1/search"].post.requestBody).toBeDefined();
    expect(doc.components.schemas.SearchResponse).toBeDefined();
  });
});