# Experimental React Concurrent Mode Profiler

https://react-devtools-scheduling-profiler.vercel.app/

## Setting up continuous deployment with CircleCI and Vercel

These instructions are intended for internal use, but may be useful if you are setting up a custom production deployment of the scheduling profiler.

1. Create a Vercel token at https://vercel.com/account/tokens.
2. Configure CircleCI:
    1. In CircleCI, navigate to the repository's Project Settings.
    2. In the Advanced tab, ensure that "Pass secrets to builds from forked pull requests" is set to false.
    3. In the Environment Variables tab, add the Vercel token as a new `SCHEDULING_PROFILER_DEPLOY_VERCEL_TOKEN` environment variable.

The Vercel project will be created when the deploy job runs.
