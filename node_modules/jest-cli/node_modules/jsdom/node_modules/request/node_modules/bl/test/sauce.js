#!/usr/bin/env node

const user       = process.env.SAUCE_USER
    , key        = process.env.SAUCE_KEY
    , path       = require('path')
    , brtapsauce = require('brtapsauce')
    , testFile   = path.join(__dirname, 'basic-test.js')

    , capabilities = [
          { browserName: 'chrome'            , platform: 'Windows XP', version: ''   }
        , { browserName: 'firefox'           , platform: 'Windows 8' , version: ''   }
        , { browserName: 'firefox'           , platform: 'Windows XP', version: '4'  }
        , { browserName: 'internet explorer' , platform: 'Windows 8' , version: '10' }
        , { browserName: 'internet explorer' , platform: 'Windows 7' , version: '9'  }
        , { browserName: 'internet explorer' , platform: 'Windows 7' , version: '8'  }
        , { browserName: 'internet explorer' , platform: 'Windows XP', version: '7'  }
        , { browserName: 'internet explorer' , platform: 'Windows XP', version: '6'  }
        , { browserName: 'safari'            , platform: 'Windows 7' , version: '5'  }
        , { browserName: 'safari'            , platform: 'OS X 10.8' , version: '6'  }
        , { browserName: 'opera'             , platform: 'Windows 7' , version: ''   }
        , { browserName: 'opera'             , platform: 'Windows 7' , version: '11' }
        , { browserName: 'ipad'              , platform: 'OS X 10.8' , version: '6'  }
        , { browserName: 'android'           , platform: 'Linux'     , version: '4.0', 'device-type': 'tablet' }
      ]

if (!user)
  throw new Error('Must set a SAUCE_USER env var')
if (!key)
  throw new Error('Must set a SAUCE_KEY env var')

brtapsauce({
    name         : 'Traversty'
  , user         : user
  , key          : key
  , brsrc        : testFile
  , capabilities : capabilities
  , options      : { timeout: 60 * 6 }
})