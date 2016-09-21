---
title: "This Week In React #1"
author: ericnakagawa
---

_This Week In React is a weekly publication highlighting interesting projects and active members from the React community. [Sign up to the weekly newsletter.](http://eepurl.com/cgOjbX)_

![Projects aimed at beginning React developers.](/react/img/blog/thisweekinreact/beginner.png)

####📓 A Visual Intro to Redux & Relay####

Lin Clark has developed a series of visual guides for learning Flux, Redux, and most recently released a four-part visual guide to Relay.


Redux: [https://code-cartoons.com/a-cartoon-intro-to-redux-3afb775501a6](https://code-cartoons.com/a-cartoon-intro-to-redux-3afb775501a6)


Relay: [https://code-cartoons.com/a-cartoon-intro-to-facebook-s-relay-part-1-3ec1a127bca5](https://code-cartoons.com/a-cartoon-intro-to-facebook-s-relay-part-1-3ec1a127bca5)

####🎮 React Game Development ([react-game-kit](https://github.com/FormidableLabs/react-game-kit))####

React Game Kit lets you build a game in React. It supports basic game engine functions like a game loop, sprites and tiles, and also supports a simple physic engine.

You can also learn more about react-game-kit with this interactive presentation built using the game engine. [http://reactnext.surge.sh/](http://reactnext.surge.sh/)

Read more about this project [here](https://formidable.com/blog/2016/09/15/introducing-react-game-kit/).



![Projects aimed at intermediate React developers.](/react/img/blog/thisweekinreact/intermediate.png)

####👾 Animations for Games ([BoxArt](https://github.com/boxart/boxart))####

Animation is a core part of game development. The folks at Bocoup wrote up a guide for integrating Boxart, their library that better supports animations that a game may need. The guide demonstrates adding animations to a simple tile matching game. [https://bocoup.com/weblog/animating-react-elements-with-boxart](https://bocoup.com/weblog/animating-react-elements-with-boxart)

####🎹 Music in React ([react-music](https://github.com/FormidableLabs/react-music))####

The react-music project allows you produce music in JSX. The project supports setting tempo, managing instruments, and applying effects and other things you would expect to find in a sequencer/sampler. [https://formidable.com/blog/2016/08/22/make-dope-beats-with-reactjs/](https://formidable.com/blog/2016/08/22/make-dope-beats-with-reactjs/)


![An interview with someone from the React community.](/react/img/blog/thisweekinreact/interview.png)

Our interview this week is with [Ken Wheeler](https://github.com/kenwheeler) of [Formidable](https://formidable.com/). He is the creator of both react-game-kit and react-music.


**Eric:** Who are you and where are you from?

**Ken:** My name is Ken Wheeler, I work for Formidable and I've lived in the Jersey Shore my entire life.

**Eric:** What brought you to the React community?

**Ken:** A while back I saw React and gave it a shot. It really lended itself to building cool things quickly, so we've basically been in love since.

**Eric:** Why did you build [react-game-kit](https://github.com/FormidableLabs/react-game-kit)?

**Ken: **One of the first things I built with React Native was a game. Next, I built a physics game. I originally wanted to write a lib to bridge SpriteKit via native modules, but wanted things to be cross platform. I also noticed some repetitive patterns in what I was doing, so I wanted to create a set of helpers that handled the noisy stuff, so that users could focus on their game logic. I then proposed some talks on the subject, and the looming deadlines really pushed me to get it done quick and properly. It might not be the best way to write a game, but at the end of the day you definitely have a game and it works. You aren't going to write call of duty with it, but you can certainly build some cool 2d stuff.

**Eric:** Why did you build [react-music](https://github.com/FormidableLabs/react-music)?

**Ken:** Before I became an engineer, I was a music producer. Napster came out and removed music production as a career option, so I fell back on coding. I'm not sure how I got the idea specifically, but I was so pumped that I stayed up for 2 days straight building it. The declarative nature really lends itself to composing web audio nodes, and once my experiments started to work nicely, I got really excited. If i didn't have the music/audio engineering background, the API might not have been as good. But because I did, I was able craft the API the same way I might work with a DAW. All in all its pretty cool. If you also understand how to produce music, its a reasonably legitimate way to compose some music.

**Eric:** You built react-music in only two days?

**Ken:** Sure did. I rewrote it fundamentally a week after it released in one day.

**Eric:** Have any of your React projects brought about any interesting or unexpected uses?

**Ken:** Totally. I was giving a presentation at Seattle ReactJS about Spectacle and this dude Jim Pick comes up to me and showed me how he forked spectacle and turned it into an interactive e learning presentation tool. I was amazed. Also, Simon Vrachliotis just gave a talk at React Sydney about react-music, and had this super dope UI where you could mute tracks and apply varying degrees of effects. And of course, James Kyle built a spectacle extension called spectacle-code-slide which is pretty much the best thing ever made. I always get super pumped when people do cool things and are inspired by the stuff I build.

**Eric:** Are you working on anything new or exciting that you can talk about?

**Ken:** Well, I suppose the next thing I build I want to be the sort of thing that people can use at work every day. I just have to think of what. Expect to see some really cool updates to the Formidable Victory project, where we are adding a tighter hyperterm integration to our victory-cli lib, and a new Victory UIExplorer app we are going to launch. I might look into making an electron or web based version of webpack dashboard, for better windows compat and because people generally want it.
If you want to learn more about what Ken is working he will be speaking at [Seattle ReactJS on September 28, 2016](https://www.meetup.com/seattle-react-js/events/233723976/) and at [React London Meetup on March 18, 2017](https://meetup.react.london/).

_Want us to interview someone from the React community? Contact [community@reactjs.org](mailto:community@reactjs.org?subject=Interview%20Request)_

![A list of upcoming React community events.](/react/img/blog/thisweekinreact/upcoming.png)

__Meetups__

- [Thursday, September 22, 2016 San Francisco @ Minted](https://www.meetup.com/ReactJS-San-Francisco/events/231776842/)
- [Thursday, September 22, 2016 Netherlands @ FrontMen](https://www.meetup.com/ReactJS-NL/events/233099575/)
- [Saturday, September 24, 2016 Bangalore @ Multunus](https://www.meetup.com/ReactJS-Bangalore/events/233685933/)
- [Wednesday, September 28, 2016 Seattle @ Redfin](https://www.meetup.com/seattle-react-js/)
- [Thursday, September 29, 2016 Israel @ Klarna](https://www.meetup.com/ReactJS-IL/events/234262147/)
- [Monday, October 3, 2016 Barcelona @ Lodgify](https://www.meetup.com/ReactJS-Barcelona/events/233971585/)
- [Tuesday, October 18, 2016, London @ Facebook](https://meetup.react.london/)

_Do you know about a React event coming up in the next 2 months? [Check out this event.](mailto:community@reactjs.org?subject=React%20Event)_

---

_This Week in React is a weekly publication that aims to provide interesting videos, links, and interviews to help you quickly catch up on the latest React community developments. Each post shall feature 3+ interesting projects and an interview with someone from the community._

_[Sign up to the weekly newsletter.](http://eepurl.com/cgOjbX)_
