import fs from 'fs'
import find from 'find'
import filesize from 'filesize'
import imagemin from 'imagemin'
import imageminGifsicle from 'imagemin-gifsicle'
import imageminJpegtran from 'imagemin-jpegtran'
import imageminOptipng from 'imagemin-optipng'
import imageminSvgo from 'imagemin-svgo'
import parseFilepath from 'parse-filepath'
import chalk from 'chalk'

const plugins = [
  imageminGifsicle({}),
  imageminJpegtran({}),
  imageminOptipng({}),
  imageminSvgo({})
]

let savedSize = 0

const run = async () => {
  const regex = new RegExp(/\.gif|\.jpeg|\.jpg|\.png$/)

  const files = find.fileSync(regex, 'icons/');

  for (const file of files) {
    await optimized(file)
  }

  if (savedSize > 0) {
    console.info(`\n🎉 You saved ${readableSize(savedSize)}.`)
  } else {
    console.info(`\n🎉 Nothing to optimize.`)
  }
}

const size = (filename) => {
  return fs.statSync(filename).size
}

const readableSize = (size) => {
  return filesize(size, { round: 5 })
}

const optimized = async (filename) => {
  let output = parseFilepath(filename).dir || './'

  const fileSizeBefore = size(filename)

  if (fileSizeBefore === 0){
    console.info(chalk.blue(`Skipping ${filename}, it has ${readableSize(fileSizeBefore)}`))
    return
  }

  const pluginsOptions = {
    destination: output,
    plugins
  }

  const filenameBackup = `${filename}.bak`
  fs.copyFileSync(filename, filenameBackup)

  try {
    await imagemin([filename], pluginsOptions)

    const fileSizeAfter = size(filename)
    const fileSizeDiff = fileSizeBefore - fileSizeAfter
    if (fileSizeDiff > 0){
      savedSize += fileSizeDiff
      console.info(chalk.green(`Optimized ${filename}: ${chalk.yellow(readableSize(fileSizeAfter))}`))
    } else { // file after same or bigger
      // restore previous file
      fs.renameSync(filenameBackup, filename)

      console.info(`${filename} ${chalk.red(`already optimized`)}`)
    }

  } catch (err) {
    console.info(chalk.red(`Skip ${filename} due to error when optimizing`));
  }

  // delete backup file
  if (fs.existsSync(filenameBackup)) {
    fs.unlinkSync(filenameBackup)
  }
}

(async () => {
  await run();
})();
