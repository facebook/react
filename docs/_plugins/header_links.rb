require 'redcarpet'
require 'sanitize'

# Simple converter that is probably better than RedCarpet's built in TOC id
# generator (which ends up with things lik id="toc_1"... terrible).

class Redcarpet::Render::HTML
  def header(title, level)
    clean_title = Sanitize.clean(title)
      .downcase
      .gsub(/\s+/, "-")
      .gsub(/[^A-Za-z0-9\-_.]/, "")

    return "<h#{level}><a class=\"anchor\" name=\"#{clean_title}\"></a>#{title} <a class=\"hash-link\" href=\"##{clean_title}\">#</a></h#{level}>"
  end
end

