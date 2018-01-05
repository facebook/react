# Tradeoffs


## Potential reasons to use React

- React has a HUGE communitity! If you have a problem or need odds are you'll be able to find someone who shares your needs and may already have a solution!
- Create React App! Is a great way to start a React project without needing to futz around with tooling.

## Potential reasons to not use React

- Most React apps typically require a build step, this isn't technically required, but you'll find that the vast majority of React apps have one, and all learning material assumes one.
- It is JavaScript-centric. If you aren't interested in learning JavaScript well, React may be harder to work with than template based libraries.
- Larger runtime than other options. For projectes sensitive to byte size, such as embedded widgets, React may be too big
- React's performance is worse than template-based solutions for cases where many things update extremely quickly at the same time, such as a stock trading app.
- React trades memory pressure for expressiveness, meaning React apps typically do more short lived allocations under heavy load.
- React perfers predictability over conciseness, which results in more time spent explicitly "wiring" code together.
- React has a HUGE communitity! It can be hard to find up-to-date, high quality, information in such a big space.
- React's development is mostly driven by the needs of Facebook, if your apps are very different from what facebook is building it may not meet your needs well.
