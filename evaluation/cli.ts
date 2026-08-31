import { runClinicalEvaluation, writeReports } from "./runner";

runClinicalEvaluation()
  .then((report) => {
    writeReports(report);
    if (report.totals.fail === report.totals.cases) {
      process.exitCode = 1;
    }
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
