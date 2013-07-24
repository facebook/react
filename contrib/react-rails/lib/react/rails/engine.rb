require 'sprockets'
require 'sprockets/engines'
# require 'react/jsx/template'

module React
  module Rails
    class Engine < ::Rails::Engine
      config.before_initialize do |app|
        # force autoloading? what?
        Sprockets::Engines
        Sprockets.register_engine '.jsx', React::JSX::Template
      end
    end
  end
end
