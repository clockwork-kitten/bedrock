import { describe, it, expect } from "vitest";
import { transform } from "./index.js";
import type { TransformPass } from "./types.js";

describe("transform", () => {
  describe("no-op pass", () => {
    it("returns changed: false when pass does nothing (babel)", () => {
      const source = "const x = 1;";
      const result = transform(source, { parser: "babel", passes: [] });
      expect(result.changed).toBe(false);
      expect(result.source).toBe(source);
    });

    it("returns changed: false when pass does nothing (ts)", () => {
      const source = "const x: number = 1;";
      const result = transform(source, { parser: "ts", passes: [] });
      expect(result.changed).toBe(false);
      expect(result.source).toBe(source);
    });
  });

  describe("traversal pass", () => {
    it("runs a traversal pass without error (babel)", () => {
      const source = "const x = 1; const y = 2;";
      const visited: string[] = [];

      const traversalPass: TransformPass = (root, j) => {
        root.find(j.VariableDeclaration).forEach((path) => {
          visited.push(path.node.kind);
        });
      };

      expect(() =>
        transform(source, { parser: "babel", passes: [traversalPass] }),
      ).not.toThrow();

      expect(visited).toEqual(["const", "const"]);
    });

    it("runs a traversal pass without error (ts)", () => {
      const source = "const x: number = 1;";
      const visited: string[] = [];

      const traversalPass: TransformPass = (root, j) => {
        root.find(j.VariableDeclaration).forEach((path) => {
          visited.push(path.node.kind);
        });
      };

      expect(() =>
        transform(source, { parser: "ts", passes: [traversalPass] }),
      ).not.toThrow();

      expect(visited).toEqual(["const"]);
    });
  });

  describe("mutating pass", () => {
    it("detects a change when source is modified (babel)", () => {
      const source = "var x = 1;";

      const varToConst: TransformPass = (root, j) => {
        root.find(j.VariableDeclaration, { kind: "var" }).forEach((path) => {
          path.node.kind = "const";
        });
      };

      const result = transform(source, {
        parser: "babel",
        passes: [varToConst],
      });

      expect(result.changed).toBe(true);
      expect(result.source).toBe("const x = 1;");
    });

    it("detects a change when source is modified (ts)", () => {
      const source = "var x: number = 1;";

      const varToConst: TransformPass = (root, j) => {
        root.find(j.VariableDeclaration, { kind: "var" }).forEach((path) => {
          path.node.kind = "const";
        });
      };

      const result = transform(source, {
        parser: "ts",
        passes: [varToConst],
      });

      expect(result.changed).toBe(true);
      expect(result.source).toBe("const x: number = 1;");
    });
  });

  describe("multiple passes", () => {
    it("applies passes in order", () => {
      const source = "var x = 1; var y = 2;";
      const log: string[] = [];

      const pass1: TransformPass = (root, j) => {
        root.find(j.VariableDeclaration).forEach(() => {
          log.push("pass1");
        });
      };

      const pass2: TransformPass = (root, j) => {
        root.find(j.VariableDeclaration).forEach(() => {
          log.push("pass2");
        });
      };

      transform(source, { parser: "babel", passes: [pass1, pass2] });

      expect(log).toEqual(["pass1", "pass1", "pass2", "pass2"]);
    });
  });
});
