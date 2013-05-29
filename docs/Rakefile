require('rubygems')
require('json')
require('yaml')

desc "generate css from sass"
task :css do
  system "sass --style=compressed _css/react.scss css/react.css"
end

desc "generate js from jsx"
task :js do
  system "../bin/jsx _js js"
end

desc "watch css & js"
task :watch => [:update_version] do
  Process.spawn "sass --style=compressed --watch _css/react.scss:css/react.css"
  Process.spawn "../bin/jsx --watch _js js"
  Process.waitall
end

desc "update version to match ../package.json"
task :update_version do
  react_version = JSON.parse(File.read('../package.json'))['version']
  site_config = YAML.load_file('_config.yml')
  site_config['react_version'] = react_version
  File.open('_config.yml', 'w+') { |f| f.write(site_config.to_yaml) }
end

desc "build into ../../react-gh-pages"
task :release => [:default] do
  system "jekyll build -d ../../react-gh-pages"
end

task :default => [:update_version, :css, :js]
