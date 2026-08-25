import "server-only";

import { browserbase, Stagehand } from "@browserbasehq/stagehand";

export async function createResearchBrowser() {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  if (!apiKey) throw new Error("BROWSERBASE_API_KEY is not configured");

  const browser = await browserbase.launch({ apiKey });
  try {
    const stagehand = await Stagehand.create({ browser, logging: { level: "off" } });
    const [page] = await browser.context.pages();
    if (!page) throw new Error("Browserbase did not create a page");
    return { browser, page, stagehand };
  } catch (error) {
    await browser.close();
    throw error;
  }
}
