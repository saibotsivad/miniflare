import { SchedulerError, SchedulerPlugin } from "@miniflare/scheduler";
import { Compatibility } from "@miniflare/shared";
import {
  NoOpLog,
  logPluginOptions,
  parsePluginArgv,
  parsePluginWranglerConfig,
} from "@miniflare/shared-test";
import test from "ava";

const compat = new Compatibility();

test("SchedulerPlugin: parses options from argv", (t) => {
  let options = parsePluginArgv(SchedulerPlugin, [
    "--cron",
    "15 * * * *",
    "--cron",
    "30 * * * *",
  ]);
  t.deepEqual(options, { crons: ["15 * * * *", "30 * * * *"] });
  options = parsePluginArgv(SchedulerPlugin, [
    "-t",
    "15 * * * *",
    "-t",
    "30 * * * *",
  ]);
  t.deepEqual(options, { crons: ["15 * * * *", "30 * * * *"] });
});
test("SchedulerPlugin: parses options from wrangler config", (t) => {
  const options = parsePluginWranglerConfig(SchedulerPlugin, {
    triggers: { crons: ["15 * * * *", "30 * * * *"] },
  });
  t.deepEqual(options, { crons: ["15 * * * *", "30 * * * *"] });
});
test("SchedulerPlugin: logs options", (t) => {
  const logs = logPluginOptions(SchedulerPlugin, {
    crons: ["15 * * * *", "30 * * * *"],
  });
  t.deepEqual(logs, ["CRON Expressions: 15 * * * *, 30 * * * *"]);
});

test("SchedulerPlugin: setup: accepts valid CRON expressions", async (t) => {
  const plugin = new SchedulerPlugin(new NoOpLog(), compat, {
    crons: ["0 12 * * MON", "* * * * *"],
  });
  await plugin.setup();
  t.deepEqual(plugin.validatedCrons, ["0 12 * * MON", "* * * * *"]);
});
test("SchedulerPlugin: setup: throws on invalid CRON expressions", async (t) => {
  let plugin = new SchedulerPlugin(new NoOpLog(), compat, {
    crons: ["* * * * BAD"],
  });
  await t.throwsAsync(plugin.setup(), {
    instanceOf: SchedulerError,
    code: "ERR_INVALID_CRON",
    message: /^Unable to parse CRON "\* \* \* \* BAD"/,
  });
  plugin = new SchedulerPlugin(new NoOpLog(), compat, { crons: ["*"] });
  await t.throwsAsync(plugin.setup(), {
    instanceOf: SchedulerError,
    code: "ERR_INVALID_CRON",
    message: /^Unable to parse CRON "\*"/,
  });
});