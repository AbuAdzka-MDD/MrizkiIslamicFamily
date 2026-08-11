import assert from "node:assert/strict";
import { calculateDuration, dashboardSummary, financialSummary, rupiah, sanitizeText, seedData } from "../src/logic.mjs";

assert.equal(calculateDuration("21:30", "22:10"), 40);
assert.equal(calculateDuration("23:30", "00:15"), 45);
assert.equal(sanitizeText("<script>Rizki</script>"), "scriptRizki/script");
assert.match(rupiah(1500000).replace(/\s/g, ""), /^Rp1\.500\.000$/);

const data = seedData(new Date("2026-08-11T08:00:00+07:00"));
const finance = financialSummary(data);
assert.equal(finance.income, 10000000);
assert.equal(finance.expenses, 3500000);
assert.equal(finance.cashflow, 6500000);

const summary = dashboardSummary(data);
assert.equal(summary.members, 7);
assert.equal(summary.dailyDonePercent, 100);
assert.equal(summary.spiritualPercent, 100);

console.log("logic tests passed");
