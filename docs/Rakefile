require('rubygems')
require('json')
require('yaml')

desc "generate js from jsx"
task :js do
  system "../bin/jsx _js js"
end

desc "watch js"
task :watch do
  Process.spawn "../bin/jsx --watch _js js"
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

desc "build into ../../react-gh-pages"
task :release => [:update_version, :default] do
  system "jekyll build -d ../../react-gh-pages"
end

task :default => [:js]
