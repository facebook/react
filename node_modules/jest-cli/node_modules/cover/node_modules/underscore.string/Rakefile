require 'rubygems'
require 'closure-compiler'
require 'uglifier'

task :default => :build

desc 'Use UglifyJS or Closure Compiler to compress Underscore.string'
task :build do
  source = File.read('lib/underscore.string.js')
  uglified = Uglifier.compile(source, :copyright => false)
  closured = Closure::Compiler.new.compile(source)
  compressed = [ uglified, closured ].sort_by(&:length).first
  File.open('dist/underscore.string.min.js', 'w'){ |f| f.write compressed }
  compression_rate = compressed.length.to_f/source.length
  puts "compressed dist/underscore.string.min.js: #{compressed.length}/#{source.length} #{(compression_rate * 100).round}%"
end
