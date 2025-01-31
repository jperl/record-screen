'use strict'

/* global describe, after, it */

const assert = require('assert')
const fs = require('fs')
const execFile = require('util').promisify(require('child_process').execFile)
const recordScreen = require('.')

const mochaTimeout = 10000
const mochaSlow = 5000

const videoFile = '/tmp/test.mp4'
const recordingDuration = 2000

/**
 * Checks the integrity of the given video file.
 *
 * @param {string} videoFile File path to the video file
 * @returns {Promise} Resolves for a valid file, rejects otherwise
 */
function checkVideoIntegrity(videoFile) {
  return execFile('ffmpeg', ['-v', 'error', '-i', videoFile, '-f', 'null', '-'])
}

/**
 * Checks the integrity of the given video file.
 *
 * @param {string} videoFile File path to the video file
 * @returns {Promise<number>} Resolves with the duration (ms) of the video
 */
async function getVideoDuration(videoFile) {
  const result = await execFile('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    videoFile
  ])
  return Number(result.stdout.trim())
}

/**
 * Retrieves the rotate meta data of the given video file.
 *
 * @param {string} videoFile File path to the video file
 * @returns {Promise<number>} Resolves with the rotation number
 */
async function getRotateMetadata(videoFile) {
  const result = await execFile('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'stream_tags=rotate',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    videoFile
  ])
  return Number(result.stdout.trim())
}

describe('screen recording', function() {
  this.timeout(mochaTimeout)
  this.slow(mochaSlow)

  after(function() {
    fs.unlinkSync(videoFile)
  })

  it('uses default options', async function() {
    const recording = recordScreen(videoFile)
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -r 15 -f x11grab -i :0 -pix_fmt yuv420p ' + videoFile
    )
  })

  it('handles option: loglevel', async function() {
    const recording = recordScreen(videoFile, {
      loglevel: 'quiet'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -loglevel quiet -r 15 -f x11grab -i :0 -pix_fmt yuv420p ' +
        videoFile
    )
    const recording2 = recordScreen(videoFile, {
      loglevel: null
    })
    const cmd2 = await recording2.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd2,
      'ffmpeg -y -r 15 -f x11grab -i :0 -pix_fmt yuv420p ' + videoFile
    )
  })

  it('handles option: inputFormat', async function() {
    const recording = recordScreen(videoFile, {
      inputFormat: 'mjpeg'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -r 15 -f mjpeg -i http://localhost:9000/ -pix_fmt yuv420p ' +
        videoFile
    )
    const recording2 = recordScreen(videoFile, {
      inputFormat: null
    })
    const cmd2 = await recording2.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd2,
      'ffmpeg -y -r 15 -i http://localhost:9000/ -pix_fmt yuv420p ' + videoFile
    )
  })

  it('handles option: resolution', async function() {
    const recording = recordScreen(videoFile, {
      resolution: '1440x900'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y ' +
        '-video_size 1440x900 -r 15 -f x11grab -i :0 -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('handles option: fps', async function() {
    const recording = recordScreen(videoFile, {
      fps: 30
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -r 30 -f x11grab -i :0 -pix_fmt yuv420p ' + videoFile
    )
    const recording2 = recordScreen(videoFile, {
      fps: null
    })
    const cmd2 = await recording2.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd2,
      'ffmpeg -y -f x11grab -i :0 -pix_fmt yuv420p ' + videoFile
    )
  })

  it('handles option: videoCodec', async function() {
    const recording = recordScreen(videoFile, {
      videoCodec: 'libx264'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -r 15 -f x11grab -i :0 -vcodec libx264 -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('handles option: pixelFormat', async function() {
    const recording = recordScreen(videoFile, {
      pixelFormat: 'yuv444p'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -r 15 -f x11grab -i :0 -pix_fmt yuv444p ' + videoFile
    )
    const recording2 = recordScreen(videoFile, {
      pixelFormat: null
    })
    const cmd2 = await recording2.promise.catch(error => error.cmd)
    assert.strictEqual(cmd2, 'ffmpeg -y -r 15 -f x11grab -i :0 ' + videoFile)
  })

  it('handles option: hostname', async function() {
    const recording = recordScreen(videoFile, {
      hostname: '127.0.0.1'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -r 15 -f x11grab -i 127.0.0.1:0 -pix_fmt yuv420p ' + videoFile
    )
  })

  it('handles option: display', async function() {
    const recording = recordScreen(videoFile, {
      display: '0.0+100,100'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -r 15 -f x11grab -i :0.0+100,100 -pix_fmt yuv420p ' + videoFile
    )
  })

  it('handles option: protocol', async function() {
    const recording = recordScreen(videoFile, {
      inputFormat: 'mjpeg',
      protocol: 'https'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -r 15 -f mjpeg -i https://localhost:9000/ -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('handles option: port', async function() {
    const recording = recordScreen(videoFile, {
      inputFormat: 'mjpeg',
      port: 8080
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -r 15 -f mjpeg -i http://localhost:8080/ -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('handles option: pathname', async function() {
    const recording = recordScreen(videoFile, {
      inputFormat: 'mjpeg',
      pathname: '/mjpeg'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y ' +
        '-r 15 -f mjpeg -i http://localhost:9000/mjpeg -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('handles option: search', async function() {
    const recording = recordScreen(videoFile, {
      inputFormat: 'mjpeg',
      search: 'key=val'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y ' +
        '-r 15 -f mjpeg -i http://localhost:9000/?key=val -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('handles option: username', async function() {
    const recording = recordScreen(videoFile, {
      inputFormat: 'mjpeg',
      username: 'user'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y ' +
        '-r 15 -f mjpeg -i http://user@localhost:9000/ -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('handles option: password', async function() {
    const recording = recordScreen(videoFile, {
      inputFormat: 'mjpeg',
      username: 'user',
      password: 'pass'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y ' +
        '-r 15 -f mjpeg -i http://user:pass@localhost:9000/ -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('records screen: x11grab', async function() {
    // Touch the file name to check if the overwrite option works:
    fs.closeSync(fs.openSync(videoFile, 'w'))
    const recording = recordScreen(videoFile, {
      hostname: process.env.X11_HOST,
      resolution: '1440x900'
    })
    setTimeout(() => recording.stop(), recordingDuration)
    await recording.promise
    await checkVideoIntegrity(videoFile)
    const videoDuration = await getVideoDuration(videoFile)
    const expectedDuration = recordingDuration / 1000
    if (!(videoDuration >= expectedDuration)) {
      throw new assert.AssertionError({
        message: 'Recording does not have the expected length.',
        actual: videoDuration,
        expected: expectedDuration,
        operator: '>='
      })
    }
  })

  it('records screen: mjpeg', async function() {
    // Touch the file name to check if the overwrite option works:
    fs.closeSync(fs.openSync(videoFile, 'w'))
    const recording = recordScreen(videoFile, {
      hostname: process.env.MJPEG_HOST,
      inputFormat: 'mjpeg'
    })
    setTimeout(() => recording.stop(), recordingDuration + 200)
    await recording.promise
    await checkVideoIntegrity(videoFile)
    const videoDuration = await getVideoDuration(videoFile)
    const expectedDuration = recordingDuration / 1000
    if (!(videoDuration >= expectedDuration)) {
      throw new assert.AssertionError({
        message: 'Recording does not have the expected length.',
        actual: videoDuration,
        expected: expectedDuration,
        operator: '>='
      })
    }
  })

  it('sets metadata: rotate', async function() {
    const recording = recordScreen(videoFile, {
      hostname: process.env.X11_HOST,
      resolution: '1440x900',
      rotate: 90
    })
    setTimeout(() => recording.stop(), recordingDuration)
    await recording.promise
    await checkVideoIntegrity(videoFile)
    const videoDuration = await getVideoDuration(videoFile)
    const expectedDuration = recordingDuration / 1000
    if (!(videoDuration >= expectedDuration)) {
      throw new assert.AssertionError({
        message: 'Recording does not have the expected length.',
        actual: videoDuration,
        expected: expectedDuration,
        operator: '>='
      })
    }
    const rotateMetadata = await getRotateMetadata(videoFile)
    // Rotate metadata is always (360 - options.rotate):
    assert.strictEqual(360 - 90, rotateMetadata)
  })
})
