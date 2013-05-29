module React
  module Source
    def self.bundled_path_for(build)
      File.expand_path("../../../build/#{build}", __FILE__)
    end
  end
end
