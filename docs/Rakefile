require('rubygems')
require('json')
require('yaml')

desc "generate js from jsx"
task :js do
  system "../bin/jsx --harmony _js js"
end

desc "watch js"
task :watch do
  Process.spawn "../bin/jsx --watch --harmony _js js"
  Process.waitall
end

desc "update version to match ../package.json"
task :update_version do
  react_version = JSON.parse(File.read('../package.json'))['version']
  site_config = YAML.load_file('_config.yml')
  if site_config['react_version'] != react_version
    site_config['react_version'] = react_version
    File.open('_config.yml', 'w+') { |f| f.write(site_config.to_yaml) }
  end
end

desc "update acknowledgements list"
task :update_acknowledgements do
  authors = File.readlines('../AUTHORS').map {|author| author.gsub(/ <.*\n/,'')}
  # split into cols here because nobody knows how to use liquid
  # need to to_f because ruby will keep slice_size as int and round on its own
  slice_size = (authors.size / 3.to_f).ceil
  cols = authors.each_slice(slice_size).to_a
  File.open('_data/acknowledgements.yml', 'w+') { |f| f.write(cols.to_yaml) }
end

desc "build into ../../react-gh-pages"
task :release => [:update_version, :default] do
  system "jekyll build -d ../../react-gh-pages"
end

task :default => [:js]
