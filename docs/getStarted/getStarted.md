To contribute to the ReactJS community, you will first have to install git on your local system. To install git, use the following command in your command line:
```
sudo apt-get install git
```

Now that you have git installed on your system, you need a github account: Create a github account if you dont have one. After creating a github account, you will need to configure your github credentials on your local system:

Replace username with your username and email with your email address that you used to create that github account
```
$git config --global user.name "username"
$git config --global user.email "email"
```

At this stage, you have your local system setup to start using git and you have your local system configured to your github account. After this, you will have to fork the [ReactJS](https://github.com/facebook/react) repository. To do this, follow [this](https://github.com/facebook/react) link and click on fork. 

This will create a copy of the current react's repositiory in your github account. Once this is done, you will have to clone your copy of react's repository on your local system so that you can work on it and modify contents. To clone this repository on your system, go to your your react repo on github, click on clone and copy the link. After that go to your command line and go to the desired folder where you want to clone the repo. The use the following command to clone it:

```
$git clone "copied link"
```

Add the upstream to facebook's [ReactJS](https://github.com/facebook/react) repository so that you can frequently pull new changes into your fork:
```
$git add remote upstream "https://github.com/facebook/react.git"
```

At this point, you have your git setup with your repositiory and you have cloned it onto your system. Now you are all set to start working on it. To work on ReactJS, you will now need to install the following packages:

1. NodeJS & npm

```
$sudo apt-get update && sudo apt-get -y upgrade
$curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
$sudo apt-get install -y nodejs
$sudo apt-get install npm
```

2. Babel
Babel is a transpiler for JavaScript best known for its ability to turn ES6 (the next version of JavaScript) into code that runs in your browser (or on your server) today.
```
$npm install -g babel-cli
```

3. Webpack
webpack is a module bundler. webpack takes modules with dependencies and generates static assets representing those modules.
```
$npm install webpack --save
$npm install webpack-dev-server --save
```

4. ReactJS
```
$npm install react --save
$npm install react-dom --save
```

At this stage, you have successfully cloned the react repository and installed all the essential components to run and test ReactJS
