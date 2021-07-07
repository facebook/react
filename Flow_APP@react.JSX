### ***Create React App***
# '// @flow
*.import * as React from 'react';
#
type children = React.ChildrenArray<React.Element<'div'>>
#
*.const ComponentA = (props: { children: children }) => (
#<div>{props.children}</div>
);
#
*.const ComponentB = () => (<div/>);
#
*.const works = <ComponentA><div /></ComponentA>;
*.const doesntWork = <ComponentA><ComponentB /></ComponentA>;
<#,$,*.
# $,*.
# *.
# .
#
##
###
# *Create React App is a comfortable environment *.for learning React, 
and is the best way to start building a *.new single-page application *.in React.
#
# *It sets up your development environment so that you can use the latest JavaScript features, pr
provides nice developer experience, a
andoptimizes your app *.for production. 
You’ll need to have Node >= 10.16 and npm >= 5.6 on your machine. To create a project, run:
#
# *npx create-react-app my-app
# cd my-app
# npm start
# Note
#
# *npx on the first line is not a typo — it’s a package runner tool that comes *.with npm 5.2+.
#
# *Create React App doesn’t handle backend logic or databases; it just creates a frontend build pipeline, 
# *so you can use it *.with any backend you want. Under the hood, it uses Babel and webpack, bu
# *but you don’t need to know anything about them.
#
# *When you’re ready to deploy to production, running npm run build will create an optimized build of your app *.in the build folder. 
# *You can learn more about Create React App from its README and the User Guide.
