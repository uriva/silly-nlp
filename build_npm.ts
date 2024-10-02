import { build, emptyDir } from "jsr:@deno/dnt";

const outDir = "./dist";

await emptyDir(outDir);

await build({
  entryPoints: ["./src/index.ts"],
  outDir,
  scriptModule: false,
  typeCheck: false,
  shims: { deno: true },
  package: {
    name: "silly-nlp",
    version: Deno.args[0],
    description: "Silly nlp utils",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/uriva/silly-nlp.git",
    },
    bugs: { url: "https://github.com/uriva/silly-nlp/issues" },
  },
  postBuild() {
    Deno.copyFileSync("./LICENSE", `${outDir}/LICENSE`);
    Deno.copyFileSync("./README.md", `${outDir}/README.md`);
  },
});
