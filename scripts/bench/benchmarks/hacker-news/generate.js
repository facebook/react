'use strict';

const fetch = require('node-fetch');
const { writeFileSync } = require('fs');
const stories = 50;

async function getStory(id) {
  const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
  return await storyRes.json();
}

async function getTopStories() {
  const topStoriesRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.js');
  const topStoriesIds = await topStoriesRes.json();

  const topStories = [];
  for (let i = 0; i < stories; i++) {
    const topStoriesId = topStoriesIds[i];

    topStories.push(await getStory(topStoriesId));
  }

  writeFileSync('top-stories.json', `window.stories = ${JSON.stringify(topStories)}`);
}

getTopStories();