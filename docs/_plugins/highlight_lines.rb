# Replace Jekyll's handling of the Redcarpet code_block (which already adds
# support for highlighting, but needs support for the very non-standard
# "code fences with line highlights" extension).
# Since this is currently depending on Redcarpet to cooperate, we are going to
# be naive, and only allow line highlighting when a language is specified. If
# you don't want any syntax highlighting but want to highlight lines, then you
# need to specify text as your language, like:
# ```text{4}


module Jekyll
  module Converters
    class Markdown
      class RedcarpetParser
        module WithPygments
          def block_code(code, lang)
            require 'pygments'
            lang_parts = lang && lang.split('{')
            lang = lang_parts && !lang_parts[0].empty? && lang_parts[0] || 'text'
            hl_lines = ''
            if lang_parts && lang_parts.size >= 2
              hl_lines = lang_parts[1].gsub(/[{}]/, '').split(',').map do |ln|
                if matches = /(\d+)-(\d+)/.match(ln)
                  ln = Range.new(matches[1], matches[2]).to_a.join(' ')
                end
                ln
              end.join(' ')
            end
            output = add_code_tags(
              Pygments.highlight(code, :lexer => lang,
                                 :options => { :encoding => 'utf-8', :hl_lines => hl_lines }),
              lang
            )
          end
        end
      end
    end
  end
end
