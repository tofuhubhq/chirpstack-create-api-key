import { chromium } from 'playwright';
import path from 'path';
import { startBrowserAgent } from 'magnitude-core'; // or whatever you're using
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const userDataDir = path.resolve('./user-data');

  const browserContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: ['--start-maximized'],
    viewport: null,
  });

  const agent = await startBrowserAgent({
    url: "https://lorawan.nxtgrid.co",
    browser: {
      context: browserContext,
    },
    llm: {
      provider: 'openai-generic',
      options: {
        baseUrl: 'https://openrouter.ai/api/v1',
        model: 'qwen/qwen2.5-vl-72b-instruct',
        apiKey: process.env.OPENROUTER_API_KEY,
      },
    },
  });

  try {
    await agent.act(`Insert "admin" into the username field`);
    await agent.act(`Insert "admin" into the password field`);
    await agent.act(`Press the "submit" button`);

    console.log('✅ Login completed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Agent failed:', err);
    process.exit(1);
  } finally {
    await browserContext.close();
  }
}

main();
