export BROWSER_STACK_ACCESS_KEY=`echo $BROWSER_STACK_ACCESS_KEY | rev`

node ./scripts/browserstack/start_tunnel.js &
