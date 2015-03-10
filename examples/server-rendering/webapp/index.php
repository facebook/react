<?php

// Prevent this from handling anything that isn't index.php.
if ($_SERVER["REQUEST_URI"] !== "/" && $_SERVER["REQUEST_URI"] !== "/index.php") {
  return false;
}

// URL to the box running `node server.js`
define('RENDER_SERVER', 'http://localhost:3000/');

function react_component($module, $props) {
  $props_json = json_encode($props);

  // Try to server-render the component if the service is available.
  // If it isn't, no big deal: the client will transparently render
  // the markup!
  $server_markup = @file_get_contents(
    RENDER_SERVER .
      '?module=' .
      urlencode($module) .
      '&props=' .
      urlencode($props_json)
  );

  $container_id = uniqid();
  $container_id_for_js = json_encode($container_id);
  $module_for_js = json_encode($module);

  // Generate the code required to run the component on the client.
  // We assume that the Browserify bundle is loaded in the page already
  // and that you used -r to get a global require() function that provides
  // every $module you may request as well as React.
  // Note that this solution is simple but I don't think it scales to
  // multiple large pages very well. For that you'd be better off using
  // webpack.
  $startup_code = <<<SCRIPT
<script>
  (function() {
    var React = require('react');
    var Component = require($module_for_js);
    React.render(
      React.createElement(Component, $props_json),
      document.getElementById($container_id_for_js)
    );
  })();
</script>
SCRIPT;

  $container_markup = '<div id="' . $container_id . '">' . $server_markup . '</div>';

  return $container_markup . $startup_code;
}
?>

<html>
  <head>
    <title>React server rendering example</title>
    <script src="static/bundle.js"></script>
  </head>
  <body>
    Welcome to the React server rendering example. Here is a server-rendered React component:
    <?php echo react_component('./src/App', array('name' => 'Pete')); ?>
  </body>
</html>
