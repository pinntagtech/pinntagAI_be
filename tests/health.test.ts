import request from "supertest";
import { buildApp } from "../src/app";
import { describe, it } from "node:test";

describe("health", () => {
  it("returns ok", async () => {
    const app = buildApp();
    await request(app).get("/health").expect(200);
  });
});
