import glob
import os

def build_header(id, title, prev, next):
    prevtext = nexttext = ''
    if prev:
        prevtext = 'prev: ' + prev + '\n'
    if next:
        nexttext = 'next: ' + next + '\n'
    return '''---
id: %s
title: %s
layout: docs
%s%s---''' % (id, title, prevtext, nexttext)

def sanitize(content):
    title,content = content.split('\n', 1)
    title = title[2:].strip()
    return title,content.replace('# ', '## ').strip()

def get_dest(filename):
    return os.path.join(os.path.dirname(filename), '..', os.path.basename(filename))

def relative_html(filename):
    if not filename:
        return None
    return os.path.splitext(os.path.basename(filename))[0] + '.html'

def generate_nav_item(filename, title):
    basename = os.path.splitext(os.path.basename(filename))[0]
    return '        <li><a href="/react/docs/%s.html"{%% if page.id == \'%s\' %%} class="active"{%% endif %%}>%s</a></li>\n' % (basename, basename, title)

def main():
    docs = [None] + glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), '*.md'))[:-1] + [None]
    nav = '''
<div class="nav-docs">
  <div class="nav-docs-section">
    <h3>React documentation</h3>
    <ul>
%s
    </ul>
  </div>
</div>'''
    items = ''
    for i in xrange(1, len(docs) - 1):
        prev = relative_html(docs[i - 1])
        next = relative_html(docs[i + 1])
        with open(docs[i], 'r') as src, open(get_dest(docs[i]), 'w') as dest:
            title,content = sanitize(src.read())
            header = build_header(
                os.path.splitext(os.path.basename(docs[i]))[0],
                title,
                prev,
                next
            )
            dest.write(header + '\n' + content)
            if docs[i].count('.') == 1:
                items += generate_nav_item(docs[i], title)
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '_includes', 'nav_docs.html'), 'w') as f:
        f.write(nav % items)

if __name__ == '__main__':
    main()
