require 'sprockets'
require 'sprockets/engines'

module React
  module JSX

    class Template < Tilt::Template
      self.default_mime_type = 'application/javascript'

      def prepare
      end

      def evaluate(scopre, locals, &block)
        @output ||= JSX::transform(data)
      end
    end
  end
end
