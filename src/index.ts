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

// fastify.post('/supabase-github', async (request, reply) => {
//   // if (!browserContext) {
//   //   return reply.send({ message: 'Browser not started' });
//   // }

//   try {
    
//     const userDataDir = path.resolve('./user-data') ;
//     // console.info(userDataDir)
//     // const proc = spawn(chromium.executablePath(), [
//     //   `--remote-debugging-port=9222`,
//     //   `--user-data-dir=${userDataDir}`,
//     //   `--no-sandbox`,
//     //   `--disable-dev-shm-usage`,
//     //   `--disable-gpu`,
//     //   `https://supabase.com`
//     // ], {
//     //   stdio: 'ignore',
//     //   detached: true
//     // });
//     // proc.unref(); // 🔑 Let it run independently
    
//     // await waitOn({
//     //   resources: ['http://localhost:9222/json/version'],
//     //   timeout: 5000,
//     //   validateStatus: (status: any) => status === 200,
//     // });

//     // await waitOn({ resources: ['http://localhost:9222'], timeout: 5000 });

//     browserContext = await chromium.launchPersistentContext(userDataDir, {
//       headless: false,
//       args: ['--start-maximized'],
//       viewport: null,
//     });
//     // console.info(browserContext)
//     // const bro = browserContext.browser();
    
//     // if (!bro) throw new Error("Browser instance is null");

//     console.info(process.env.OPENROUTER_API_KEY)
//     // console.info(`reached here`)  
//     // const userDataDir = './user-data';

//     // browserContext = await chromium.launchPersistentContext(userDataDir, {
//     //   headless: false,
//     //   args: ['--start-maximized'],
//     //   viewport: null,
//     // });
    
//     // doStuff(agent)
//     // console.info(`reached there`)
    
//     // createGithubApp(agent);

//     return reply.send({ message: 'Browser started' });
//   } catch (err) {
//     console.info(err)
//     return reply.status(500).send({ error: 'Failed to start browser' });
//   }
// });

// const createGithubApp = async (agent: any) => {
//   await agent.nav(`https://github.com/settings/applications/new`)

//   await agent.act(`Insert "Some new application" in the application name input`)
//   await agent.act(`Insert "https://google.com" in the homepage url input`)
//   await agent.act(`Insert "https://google.com" in the callback url input`)

//   await agent.act(`Click on Register Application`)

//   const clientId = await agent.extract(
//       'What is the Client ID?',
//       z.string()
//   );
//   console.info(clientId)
  
//   await agent.act(`Click on the button "Generate a new client secret"`)
//   const clientSecret = await agent.extract(
//     'What is the Client Secret?',
//     z.string()
//   );
//   console.info(clientSecret)

//   await agent.nav(`https://supabase.com/dashboard/project/odmygqlhpwdvzopggqhs/auth/providers?provider=GitHub`)

//   await agent.act(`Insert ${clientId} into the "Client ID" input`)

//   await agent.act(`Press the Enable Github toggle`)

//   await agent.act(`Insert ${clientSecret} into the Client Secret input`)

//   await agent.act(`Press the "Save" button`)
// }

// const doStuff = async (agent: any) => {
//   console.info(`Before scroll`)
//   await agent.act(`Scroll to the bottom of the page`)
//   console.info(`After scroll`)
//   // await agent.act(`Under the "Supabase auth" section, look for the "Twitch" provider toggle in the page`)

//   // await agent.act(`Click on "Tofuhub" button`)

//   // await agent.act(`Click on "Tofuhub" button`)

//   // await agent.act(`Navigate to "Authentication" menu`)
// }

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log('🚀 Fastify server is running at http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
