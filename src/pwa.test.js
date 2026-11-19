import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("PWA manifest is configured as a Korean standalone app with tablet orientation", async () => {
  const manifest = JSON.parse(await readFile(new URL("manifest.webmanifest", root), "utf8"));

  assert.equal(manifest.lang, "ko-KR");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.orientation, "any");
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.deepEqual(
    manifest.icons.map(({ sizes, type }) => [sizes, type]),
    [["192x192", "image/png"], ["512x512", "image/png"]],
  );
  assert.ok(manifest.icons.every(({ src }) => src.startsWith("./")));
});

test("service worker pre-caches the app UI and score data needed offline", async () => {
  const worker = await readFile(new URL("service-worker.js", root), "utf8");

  for (const asset of ["", "index.html", "styles.css", "src/app.js", "src/score.js", "manifest.webmanifest"]) {
    assert.ok(worker.includes(`"${asset}"`), `Missing offline app asset: ${asset}`);
  }
  assert.match(worker, /request\.mode === "navigate"/);
  assert.match(worker, /new URL\(path, APP_BASE_URL\)\.href/);
  assert.match(worker, /caches\.match\(APP_ENTRY_URL\)/);
});

test("app assets use relative URLs so GitHub Pages project paths work", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");

  for (const asset of ["manifest.webmanifest", "icons/apple-touch-icon.png", "styles.css", "src/app.js"]) {
    assert.ok(html.includes(`"./${asset}"`), `Expected a relative URL for ${asset}`);
  }
  assert.doesNotMatch(html, /(?:href|src)="\/(?:styles\.css|src\/app\.js|manifest\.webmanifest|icons\/)/);
});

test("the app registers offline support during startup rather than after a user action", async () => {
  const app = await readFile(new URL("src/app.js", root), "utf8");

  assert.ok(
    app.indexOf('if (!standaloneOfflineFile && location.protocol !== "file:")') >
      app.lastIndexOf('app.addEventListener("change"'),
  );
});

test("the standalone file uses a classic script and skips service-worker registration", async () => {
  const [builder, app] = await Promise.all([
    readFile(new URL("build-offline.mjs", root), "utf8"),
    readFile(new URL("src/app.js", root), "utf8"),
  ]);

  assert.ok(builder.includes('data-standalone-offline'));
  assert.ok(builder.includes('    <script>\\n(() => {\\n${inlineApp}\\n})();\\n    </script>\\n  </body>'));
  assert.ok(app.includes('const standaloneOfflineFile = document.documentElement.hasAttribute("data-standalone-offline")'));
});
