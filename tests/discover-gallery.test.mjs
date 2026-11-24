import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../src/app/discover/discover-gallery.tsx", import.meta.url), "utf8");
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const loaded = { exports: {} };
const dependencies = {
  react: React,
  "react/jsx-runtime": require("react/jsx-runtime"),
  "next/link": { default: ({ href, children }) => React.createElement("a", { href }, children) },
  "next/image": { default: ({ src, alt }) => React.createElement("img", { src, alt }) },
  "../experience.module.css": { default: {} },
};
new Function("require", "module", "exports", javascript)((name) => {
  if (name in dependencies) return dependencies[name];
  throw new Error(`Unexpected dependency: ${name}`);
}, loaded, loaded.exports);

test("artist links appear in discovery but not on the artist's own profile", () => {
  const works = [{ title: "Work", artist: "Artist", medium: "Painting", image: "/work.jpg", alt: "Work", profileHref: "/artists/artist" }];
  const render = (showArtistLinks) => renderToStaticMarkup(
    React.createElement(loaded.exports.DiscoverGallery, { works, showArtistLinks }),
  );
  assert.match(render(true), /href="\/artists\/artist"/);
  assert.doesNotMatch(render(false), /href="\/artists\/artist"|Artist profile coming soon/);
});
