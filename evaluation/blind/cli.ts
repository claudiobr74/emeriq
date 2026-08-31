import { runBlindEvaluation } from "./runner";

runBlindEvaluation()
  .then((report) => {
    if (report.gates.overall === "FAILED") {
      process.exitCode = 1;
    }
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
