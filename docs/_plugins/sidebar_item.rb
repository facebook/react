module Jekyll
  module SidebarItemFilter
    def docs_sidebar_link(item)
      return sidebar_helper(item, 'docs')
    end

    def docs_old_sidebar_link(item)
      return sidebar_helper(item, 'docs-old')
    end

    def community_sidebar_link(item)
      return sidebar_helper(item, 'community')
    end

    def sidebar_helper(item, group)
      pageID = @context.registers[:page]["id"]
      itemID = item["id"]
      href = item["href"] || "/react/#{group}/#{itemID}.html"
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
