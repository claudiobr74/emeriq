import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { hashComplexCases } from "./hash";
import { ECCV_V1_CASES } from "./v1";

const hash = hashComplexCases(ECCV_V1_CASES);
const freezePath = path.join(process.cwd(), "evaluation/complex-vignettes/v1/FREEZE.md");
const freeze = readFileSync(freezePath, "utf8");

if (freeze.includes("_pending_")) {
  writeFileSync(
    freezePath,
    freeze.replace("| DATASET_SHA256 | _pending_ |", `| DATASET_SHA256 | \`${hash}\` |`),
  );
  console.log(`Freeze atualizado com hash ${hash}`);
} else if (!freeze.includes(hash)) {
  console.error("Freeze já tem hash diferente. Não sobrescrever após FIRST_RUN.");
  process.exitCode = 1;
} else {
  console.log(hash);
}
console.log(`cases=${ECCV_V1_CASES.length}`);
