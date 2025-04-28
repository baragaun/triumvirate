# Triumvirate

An application that explores the use of an assistant in a new domain

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Deploying

Use `bin/deploy.sh` to deploy to the server. For this to work, you need: 

1) The file `~/apps/ecosystem.config.cjs` on the server.

Here is the content of this file:

```js
module.exports = {
  apps: [{
    name: "triumvirate",
    script: "/home/ubuntu/apps/triumvirate/build/index.js",
    env: {
      PORT: "8080",
      NODE_ENV: "production",
      CONFIG_PATH: "config",
      DATABASE_URL: "<connect-url>",
      AWS_REGION: "xxx",
      AWS_PROFILE_NAME: "xxx",
      MOCK_AI_RESPONSES: "false",
    }
  }]
}
```
 
2) The file `~/bin/deploy.sh` on the server. Copy `bin/remote-deploy.sh` to this file:

```shell
scp bin/remote-deploy.sh ai-chat:bin/deploy.sh
```
