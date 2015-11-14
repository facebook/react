def get_lang_path(context)
  lang = context["page"]["language"]
  is_default_lang = context["page"]["is_default_language"]
  if is_default_lang then
    ""
  else
    "#{lang}/"
  end
end

module Jekyll
  class SidebarItemBlock < Liquid::Block
    def initialize(tag_name, item, tokens)
      super
      @item = item
    end

    def render(context)
      pageID = context["page"]["id"]
      lang_path = get_lang_path(context)
      item = context[@item]
      itemID = item["id"]
      # TODO: link to correct locale
      href = item["href"] || "/react/#{lang_path}docs/#{itemID}.html"
      className = pageID == itemID ? ' class="active"' : ''

      return "<a data-id=\"#{pageID}\" data-other=\"#{itemID}\" href=\"#{href}\"#{className}>#{super}</a>"
    end
  end
  class SidebarTipItemBlock < Liquid::Block
    def initialize(tag_name, item, tokens)
      super
      @item = item
    end

    def render(context)
      pageID = context["page"]["id"]
      lang_path = get_lang_path(context)
      item = context[@item]
      itemID = item["id"]
      # TODO: link to correct locale
      href = item["href"] || "/react/#{lang_path}tips/#{itemID}.html"
      className = pageID == itemID ? ' class="active"' : ''

      return "<a data-id=\"#{pageID}\" data-other=\"#{itemID}\" href=\"#{href}\"#{className}>#{super}</a>"
    end
  end
end

Liquid::Template.register_tag('sidebaritem', Jekyll::SidebarItemBlock)
Liquid::Template.register_tag('sidebartipitem', Jekyll::SidebarTipItemBlock)
