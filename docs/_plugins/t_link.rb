module Jekyll
  module TranslateLinkFilter
    def translate_link(link)
      is_default_lang = @context.registers[:page]["is_default_language"]
      if is_default_lang
        return link
      end

      lang = @context.registers[:page]["language"]

      # We're going to assume everything is relative to root otherwise this breaks
      # hard code that we have react/foo/bar/whatever.html
      pieces = link.split('/')
      pieces.insert(1, lang)
      return pieces.join('/')
    end

    # for next/prev links, links within if need be
    def translate_link_docs(link)
      is_default_lang = @context.registers[:page]["is_default_language"]
      if is_default_lang
        return link
      end
      lang = @context.registers[:page]["language"]
      return "/react/#{lang}/docs/#{link}"
    end
  end
end

Liquid::Template.register_filter(Jekyll::TranslateLinkFilter)
