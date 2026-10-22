import { afterEach, expect, it, vi } from "vitest";
import {
  parseCachedPluginCatalog,
  readCachedPluginCatalog,
  serializeCachedPluginCatalog,
  writeCachedPluginCatalog,
  type CachedPluginCatalogEntry,
} from "./catalog-cache";

const files = vi.hoisted(() => new Map<string, string>());

vi.mock("expo-file-system", () => {
  class File {
    name: string;
    constructor(_root: string, _directory: string, name: string) {
      this.name = name;
    }
    get exists(): boolean {
      return files.has(this.name);
    }
    async text(): Promise<string> {
      return files.get(this.name) ?? "";
    }
    create(): void {}
    write(contents: string): void {
      files.set(this.name, contents);
    }
  }
  return { Paths: { document: "document://" }, File };
});

const entry: CachedPluginCatalogEntry = {
  id: "better-paseo",
  clientBundle: "bundle",
  requirements: { paseo: ">=0.12.0" },
};

afterEach(() => {
  files.clear();
});

it("round-trips catalog entries for a stable server id", async () => {
  await writeCachedPluginCatalog("host/1", [entry]);

  expect(files.has("host_1.json")).toBe(true);
  await expect(readCachedPluginCatalog("host/1")).resolves.toEqual([entry]);
});

it("rejects a cache the installer cannot trust", () => {
  expect(parseCachedPluginCatalog("not json")).toBeNull();
  expect(parseCachedPluginCatalog(JSON.stringify({ version: 2, entries: [entry] }))).toBeNull();
  expect(
    parseCachedPluginCatalog(
      JSON.stringify({ version: 1, entries: [{ id: "plugin", clientBundle: 1 }] }),
    ),
  ).toBeNull();
  expect(parseCachedPluginCatalog(serializeCachedPluginCatalog([entry]))).toEqual([entry]);
});

it("does not persist a placeholder server id", async () => {
  await writeCachedPluginCatalog("local:dev", [entry]);

  expect(files.size).toBe(0);
  await expect(readCachedPluginCatalog("local:dev")).resolves.toBeNull();
});
