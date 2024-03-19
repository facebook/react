/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * INSTALLATION:
 *   - $ npm install octokit
 *   - Update TOKEN after creating token from
 *     https://github.com/settings/tokens
 *   - Update REPO_LOCAL_PATH to point to local Forget repo
 *
 *  USAGE:
 *   - $ git filter-branch -f --msg-filter "node script-filter-branch.mjs" 2364096862b72cf4d801ef2008c54252335a2df9..HEAD
 */

import { Octokit, App } from "octokit";

/*
 * UPDATE ${TOKEN} and ${REPO_LOCAL_PATH} before running this!
 */
const TOKEN = "";
const REPO_LOCAL_PATH = "";

const OWNER = "facebook";
const REPO = "react-forget";
const octokit = new Octokit({ auth: TOKEN });

const fetchPullRequest = async (pullNumber) => {
  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}",
    {
      owner: OWNER,
      repo: REPO,
      pull_number: pullNumber,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );
  return { body: response.data.body, title: response.data.title };
};

function formatCommitMessage(str) {
  let formattedStr = "";
  let line = "";

  const trim = str.replace(/(\r\n|\n|\r)/gm, " ").trim();
  if (!trim) {
    return "";
  }

  // Split the string into words
  const words = trim.split(" ");
  // Iterate over each word
  for (let i = 0; i < words.length; i++) {
    // If adding the next word doesn't exceed the line length limit, add it to the line
    if ((line + words[i]).length <= 80) {
      line += words[i] + " ";
    } else {
      // Otherwise, add the line to the formatted string and start a new line
      formattedStr += line + "\n";
      line = words[i] + " ";
    }
  }
  // Add the last line to the formatted string
  formattedStr += line;
  return formattedStr;
}

function filterMsg(response) {
  const { body, title } = response;

  const msgs = body.split("\n\n").flatMap((x) => x.split("\r\n"));

  const newMessage = [];

  // Add title
  msgs.unshift(title);

  for (const msg of msgs) {
    // remove "Stack from [ghstack] blurb"
    if (msg.startsWith("Stack from ")) {
      continue;
    }

    // remove "* #1234"
    if (msg.startsWith("* #")) {
      continue;
    }

    // remove "* __->__ #1234"
    if (msg.startsWith("* __")) {
      continue;
    }

    const formattedStr = formatCommitMessage(msg);
    if (!formattedStr) {
      continue;
    }
    newMessage.push(formattedStr);
  }

  const updatedMsg = newMessage.join("\n\n");
  return updatedMsg;
}

function parsePullRequestNumber(text) {
  if (!text) {
    return null;
  }
  const regex = /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/(\d+)/;
  const match = text.match(regex);
  return match ? match[1] : null;
}

async function main() {
  const data = fs.readFileSync(0, "utf-8");
  const pr = parsePullRequestNumber(data);

  if (pr) {
    try {
      const response = await fetchPullRequest(pr);
      if (!response.body) {
        console.log(data);
        return;
      }
      const newMessage = filterMsg(response);
      console.log(newMessage);
      return;
    } catch (e) {
      console.log(data);
      return;
    }
  }

  console.log(data);
}

main();
