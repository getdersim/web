const util = require('util')
const exec = util.promisify(require('child_process').exec)
const { platform } = require('os')
const download = require('download-file')

const downloadFile = (url, options) => {
  return new Promise((resolve, reject) => {
    download(url, options, err => {
      if (err) {
        reject(err)
      }
      resolve(true)
    })
  })
}

module.exports = async (url, type) => {
  let time = new Date()
  time = time.valueOf()
  let filename = `${time}.${type}`
  try {
    await downloadFile(url, {directory: '.', filename})
  } catch (e) {
    return null
  }
  const execDir = (platform() === 'darwin' && '/Applications/LibreOffice.app/Contents/MacOS/soffice') ||
                  (platform() === 'linux' && 'soffice') ||
                  (platform() === 'win32' && process.exit(1))
  const { stderr } = await exec(`${execDir} --headless --convert-to pdf --outdir . ${filename}`)
  require('fs').unlinkSync(filename)
  if (stderr) {
    console.log(stderr); // TODO @cagataycali bugsnag
  } else {
    return `${time}.pdf`
  }
}
