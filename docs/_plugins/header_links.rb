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

    return "<h#{level} id=\"#{clean_title}\"><a href=\"##{clean_title}\">#{title}</a></h#{level}>"
  end
end

