# Trouble Shooting Guide

## Building

### Windows 7x64
These issues/solutions have been validated to work on Windows 7 however there's a good chance they will also work on Windows 8; we just can't say for sure at the moment.

__Symptoms__
Module dependency 'contextify' fails to build during 'npm install' due to issues with missing Python executable and/or C/C++ compilers, libs, SDK etc...

__Assessment__
contextify uses node-gyp to build some platform dependent components, this requires that you have the necessary build tools installed. 

__Solution__
The node-gyp github page has some information that will get you most of the way to a working build [node-gyp](https://github.com/TooTallNate/node-gyp)

However, having worked through this on a Win 7x64 machine there are some minor tweaks to the process that should be highlighted. Below are steps taken to get the build working.

1. Follow the [node-gyp Windows Installation Instructions](https://github.com/TooTallNate/node-gyp) but make sure you install [Visual Studio Express 2013](https://www.visualstudio.com/en-us/products/visual-studio-express-vs.aspx) 
and not the 2010 version. 
2. Once all of the node-gyp installations are complete, make sure your windows updates have all be installed via the standard windows update program.
3. A reboot is probably a good idea if not already mandated by windows update.
4. Set the following system environment variable: GYP_MSVS_VERSION=2013

go ahead and run the install again, you should be all set now.
