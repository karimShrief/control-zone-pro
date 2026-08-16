import test from "node:test";
import assert from "node:assert/strict";

const shiftTypes = ["Morning", "Evening", "Night"];

function generateRosterForTest({ engineers, mandatoryOff = [], startDate, endDate, required }) {
  const activePool = engineers.filter((id) => !mandatoryOff.includes(id));
  const results = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  let previousNightWorkers = new Set();

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const date = cursor.toISOString().slice(0, 10);
    const dayBlocked = new Set(previousNightWorkers);
    const dayAssignments = { Morning: [], Evening: [], Night: [] };

    for (const type of shiftTypes) {
      const pool = activePool.filter((id) => !dayBlocked.has(id));
      const needed = required[type];
      const chosen = pool.slice(0, needed);
      dayAssignments[type] = chosen;
      chosen.forEach((id) => dayBlocked.add(id));
    }

    results.push({ date, ...dayAssignments });
    previousNightWorkers = new Set(dayAssignments.Night);
  }

  return { roster: results, activePool };
}

test("night workers are followed by an off day before morning assignment and mandatory off engineers reduce the rotation pool", () => {
  const engineers = ["E1", "E2", "E3", "E4", "E5", "E6"];
  const mandatoryOff = ["E1", "E2"];
  const { roster, activePool } = generateRosterForTest({
    engineers,
    mandatoryOff,
    startDate: "2026-08-16",
    endDate: "2026-08-18",
    required: { Morning: 2, Evening: 2, Night: 2 },
  });

  assert.deepEqual(activePool.sort(), ["E3", "E4", "E5", "E6"]);

  const day1 = roster[0];
  const day2 = roster[1];
  const day3 = roster[2];

  assert.equal(
    day1.Night.some((id) => mandatoryOff.includes(id)),
    false,
  );
  assert.equal(
    day2.Morning.some((id) => day1.Night.includes(id)),
    false,
  );
  assert.equal(
    day2.Evening.some((id) => day1.Night.includes(id)),
    false,
  );
  assert.equal(
    day3.Morning.some((id) => day2.Night.includes(id)),
    false,
  );

  assert.ok(day1.Morning.length >= 2);
  assert.ok(day2.Morning.length >= 2);
  assert.ok(day3.Morning.length >= 2);

  const noNightWorkerOnNextMorning = roster.every(
    (day, index) => index === 0 || day.Morning.every((id) => !roster[index - 1].Night.includes(id)),
  );
  assert.equal(noNightWorkerOnNextMorning, true);
});
