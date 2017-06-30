import Typography from 'typography'
import Wordpress2016 from 'typography-theme-wordpress-2016'

const typography = new Typography(Wordpress2016)

// Hot reload typography in development.
if (process.env.NODE_ENV !== 'production') {
  typography.injectStyles()
}

export default typography
