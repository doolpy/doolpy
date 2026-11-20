import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const outputPath = new URL("./고스톱-점수판-오프라인.html", import.meta.url);
const [html, css, scoreModule, stateModule, appModule] = await Promise.all([
  readFile(new URL("./index.html", import.meta.url), "utf8"),
  readFile(new URL("./styles.css", import.meta.url), "utf8"),
  readFile(new URL("./src/score.js", import.meta.url), "utf8"),
  readFile(new URL("./src/state.js", import.meta.url), "utf8"),
  readFile(new URL("./src/app.js", import.meta.url), "utf8"),
]);

const inlineModule = (source) =>
  source
    .replace(/^import\s*\{[\s\S]*?\}\s*from\s*["']\.\/(?:score|state)\.js["'];\s*/gm, "")
    .replace(/^export\s+/gm, "");
const inlineApp = [scoreModule, stateModule, appModule].map(inlineModule).join("\n")
  .replace(/<\/script/gi, "<\\/script");
const standaloneHtml = html
  .replace('<html lang="ko">', '<html lang="ko" data-standalone-offline>')
  .replace(
    /^\s*<link rel="stylesheet" href="\.\/styles\.css"\s*\/>\s*$/m,
    `    <style>\n${css}\n    </style>`,
  )
  .replace(/^\s*<link rel="manifest" href="\.\/manifest\.webmanifest"\s*\/>\s*$/m, "")
  .replace(/^\s*<link rel="apple-touch-icon" href="\.\/icons\/apple-touch-icon\.png"\s*\/>\s*$/m, "")
  .replace('href="./"', 'href=""')
  .replace(
    /^\s*<script type="module" src="\.\/src\/app\.js"><\/script>\s*$/m,
    "",
  )
  .replace(
    "</body>",
    `    <script>\n(() => {\n${inlineApp}\n})();\n    </script>\n  </body>`,
  );

if (
  standaloneHtml.includes('<html lang="ko">') ||
  standaloneHtml.includes('type="module"') ||
  standaloneHtml.includes('href="./styles.css"') ||
  standaloneHtml.includes('src="./src/app.js"')
) {
  throw new Error("Failed to inline the stylesheet and app modules into the offline file.");
}

if (standaloneHtml.includes('href="./manifest.webmanifest"') || standaloneHtml.includes('href="./icons/')) {
  throw new Error("The standalone offline file must not depend on installable-app assets.");
}

await writeFile(outputPath, standaloneHtml, "utf8");
console.log(`오프라인 점수판 생성 완료: ${fileURLToPath(outputPath)}`);
