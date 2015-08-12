monolist-api
============

node.js server and Express API for the Monolist application. All endpoints can be seen in [`api/index.js`](https://github.com/jakemmarsh/monolist-api/blob/master/api/index.js).

---

#### To get up and running:

1. Clone this repo
2. Install node.js and NPM globally if you have not before. [Instructions here](http://blog.nodeknockout.com/post/65463770933/how-to-install-node-js-and-npm)
3. **Only necessary for development/testing:** install redis with `brew install redis` (using [Homebrew](http://brew.sh/) on OSX)
4. Run `npm install` from root project directory
5. Run `npm start` to simply start the server, or `npm run dev` to run Supervisor and Redis server

The API is served at `localhost:3000` by default, with all endpoints behind `localhost:3000/v1/`.

---

#### To run tests and generate coverage files:

1. Clone repo, install dependencies (Steps 1-3 above) **Note:** redis-server is necessary for running tests locally.
2. Run `npm test` to run all tests. Coverage files are output to `__coverage__/` directory.
3. Individual tests can be run with `node_modules/.bin/_mocha <path_to_file`.

---

#### Sample .env configuration file

Below is a `.env` file (with any actual keys/credentials removed). This same structure can be used to add any extra configuration information you may need, available at `process.env.*` while running on the server-side.

```

```
