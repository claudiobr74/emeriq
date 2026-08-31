import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { hashBlindCases } from "./hash";
import { BLIND_V14_CASES } from "./v1.4";

const hash = hashBlindCases(BLIND_V14_CASES);
const freezePath = path.join(process.cwd(), "evaluation/blind/V1_3_FREEZE.md");
const freeze = readFileSync(freezePath, "utf8");
if (freeze.includes("_pendente")) {
  writeFileSync(
    freezePath,
    freeze.replace(
      "| BLIND_CASESET_SHA256 | _pendente — gerar com `pnpm eval:clinical:blind:hash`_ |",
      `| BLIND_CASESET_SHA256 | \`${hash}\` |`,
    ),
  );
  console.log(`Freeze atualizado com hash ${hash}`);
} else if (!freeze.includes(hash)) {
  console.error("Freeze já tem hash diferente. Não sobrescrever após FIRST_RUN.");
  process.exitCode = 1;
} else {
  console.log(hash);
}
