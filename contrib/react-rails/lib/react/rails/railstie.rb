require 'rails'

module React
  module Rails
    class Railtie < ::Rails::Railtie
      config.react = ActiveSupport::OrderedOptions.new

      initializer "react_rails.setup_vendor" do |app|
        variant = app.config.react.variant

        # Mimic behavior of ember-rails...
        # We want to include different files in dev/prod. The unminified builds
        # contain console logging for invariants and logging to help catch
        # common mistakes. These are all stripped out in the minified build.
        if variant = app.config.react.variant || ::Rails.env.test?
          variant ||= :development
          # Copy over the variant into a path that sprockets will pick up.
          # We'll always copy to 'react.js' so that no includes need to change.
          # We'll also always copy of JSXTransformer.js
          tmp_path = app.root.join('tmp/react-rails')
          filename = 'react' + (variant == :production ? '.min.js' : '.js')
          FileUtils.mkdir_p(tmp_path)
          FileUtils.cp(::React::Source.bundled_path_for(filename),
                       tmp_path.join('react.js'))
          FileUtils.cp(::React::Source.bundled_path_for('JSXTransformer.js'),
                       tmp_path.join('JSXTransformer.js'))
          # Make sure it can be found
          app.assets.append_path(tmp_path)
        end
      end
    end
  end
end
