module Jekyll
  class SidebarItemBlock < Liquid::Block
    def initialize(tag_name, item, tokens)
      super
      @item = item
    end

    def render(context)
      pageID = context["page"]["id"]
      item = context[@item]
      itemID = item["id"]
      # TODO: link to correct locale
      href = item["href"] || "/react/docs/#{itemID}.html"
      className = pageID == itemID ? ' class="active"' : ''
      
      return "<a data-id=\"#{pageID}\" data-other=\"#{itemID}\" href=\"#{href}\"#{className}>#{super}</a>"
    end
  end

  # DECPRECATED
  module SidebarItemFilter
    def sidebar_item_link(item)
      # item, label = split_params(params)
      pageID = @context.registers[:page]["id"]
      itemID = item["id"]
      href = item["href"] || "/react/docs/#{itemID}.html"
      className = pageID == itemID ? ' class="active"' : ''

      return "<a href=\"#{href}\"#{className}>#{item["title"]}</a>"
    end
  end
end

Liquid::Template.register_filter(Jekyll::SidebarItemFilter)
Liquid::Template.register_tag('sidebaritem', Jekyll::SidebarItemBlock)
