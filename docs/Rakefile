require('rubygems')
require('json')
require('yaml')
require('open-uri')

desc "download babel-browser"
task :fetch_remotes do
  IO.copy_stream(
    open('https://unpkg.com/babel-standalone@6.15.0/babel.min.js'),
    'js/babel.min.js'
  )
end

desc "generate js from jsx"
task :js do
  system "../node_modules/.bin/babel _js --out-dir=js"
end

desc "watch js"
task :watch do
  Process.spawn "../node_modules/.bin/babel _js --out-dir=js --watch"
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

desc "update SRI hashes"
task :update_hashes do
  map = {
    'react.js' => 'dev',
    'react.min.js' => 'prod',
    'react-dom.js' => 'dom_dev',
    'react-dom.min.js' => 'dom_prod',
    'react-dom-server.js' => 'dom_server_dev',
    'react-dom-server.min.js' => 'dom_server_prod'
  }
  site_config = YAML.load_file('_config.yml')
  map.each do |file, key|
    site_config['react_hashes'][key] = `openssl dgst -sha384 -binary ../../react-bower/#{file} | openssl base64 -A`
  end
  File.open('_config.yml', 'w+') { |f| f.write(site_config.to_yaml) }
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

desc "copy error codes to docs"
task :copy_error_codes do
  codes_json = File.read('../scripts/error-codes/codes.json')
  codes_js = "var errorMap = #{codes_json.chomp};\n"
  File.write('js/errorMap.js', codes_js)
end

desc "build into ../../react-gh-pages"
task :release => [:update_version, :js, :fetch_remotes, :copy_error_codes] do
  system "jekyll build -d ../../react-gh-pages"
end

task :default => [:js]
