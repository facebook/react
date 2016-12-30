require 'redcarpet'
require 'sanitize'

# Simple converter that is probably better than RedCarpet's built in TOC id
# generator (which ends up with things like id="toc_1"... terrible).

class Redcarpet::Render::HTML
  def header(title, level)
    # \p{Common} does not seem to include some of the Japanese alphabets and also includes
    # some undesired characters like colon and parentheses, so we have to write out the
    # necessary Unicode scripts individually.
    clean_title = Sanitize.clean(title)
      .downcase
      .gsub(/\s+/, "-")
      .gsub(/[^A-Za-z0-9\-_.\p{Cyrillic}\p{Hangul}\p{Hiragana}\p{Katakana}\p{Han}]/, "")

    return "<h#{level}><a class=\"anchor\" name=\"#{clean_title}\"></a>#{title} <a class=\"hash-link\" href=\"##{clean_title}\">#</a></h#{level}>"
  end
end

