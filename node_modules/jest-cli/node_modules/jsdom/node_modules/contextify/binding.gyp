{
  'targets': [
    {
      'target_name': 'contextify',
      'include_dirs': ["<!(node -e \"require('nan')\")"],
      'sources': [ 'src/contextify.cc' ]
    }
  ]
}
