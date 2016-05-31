module Jekyll
  module SidebarItemFilter
    def sidebar_item_link(item)
      pageID = @context.registers[:page]["id"]
      itemID = item["id"]
      href = item["href"] || "/react/docs/#{itemID}.html"
      classes = []
      if pageID == itemID
        classes.push("active")
      end
      if item["href"]
        classes.push("external")
      end
      className = classes.size > 0  ? " class=\"#{classes.join(' ')}\"" : ""

      return "<a href=\"#{href}\"#{className}>#{item["title"]}</a>"
    end
  end
end

Liquid::Template.register_filter(Jekyll::SidebarItemFilter)
