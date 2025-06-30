import Fastify from 'fastify';
import z from 'zod';
import { startBrowserAgent, type BrowserOptions } from 'magnitude-core';
import { chromium, type BrowserContext } from 'playwright';
import path from 'path';
const fastify = Fastify({ logger: true });

import dotenv from 'dotenv';

dotenv.config();

let browserContext: BrowserContext | null;
let page: any = null;

fastify.post('/start-browser', async (request, reply) => {
  if (browserContext) return reply.send({ message: 'Browser already started' });

  try {
    const userDataDir = './user-data';

    browserContext = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: ['--start-maximized'],
      viewport: null,
    });

    page = await browserContext.newPage();
    await page.goto('https://lorawan.nxtgrid.co');
    
    return reply.send({ message: 'Browser started' });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Failed to start browser' });
  }
});

fastify.post('/stop-browser', async (request, reply) => {
  if (!browserContext) return reply.send({ message: 'Browser is not running' });

  try {
    await browserContext.close();
    browserContext = null;
    page = null;

    return reply.send({ message: 'Browser stopped' });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Failed to stop browser' });
  }
});

fastify.post('/chirpstack-login', async (request, reply) => {
  const userDataDir = path.resolve('./user-data') ;
  browserContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: ['--start-maximized'],
    viewport: null,
  });

  const agent = await startBrowserAgent({
    url: "https://lorawan.nxtgrid.co",
    browser: {
      context: browserContext
    },
    llm: {
      provider: 'openai-generic',
      options: {
          baseUrl: 'https://openrouter.ai/api/v1',
          model: 'qwen/qwen2.5-vl-72b-instruct',
          apiKey: process.env.OPENROUTER_API_KEY
      }
    }
  });  

  await agent.act(`Insert "admin" into the username field`);
  await agent.act(`Insert "admin" into the password field`);
  await agent.act(`Press the "submit" button`);

})

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Fastify server is running at http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
