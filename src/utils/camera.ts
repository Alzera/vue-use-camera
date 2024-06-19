import { eventOn, timeout } from "."

declare global {
  interface Navigator { mozGetUserMedia: any }
  interface HTMLVideoElement { mozSrcObject?: MediaStream }
  interface MediaTrackCapabilities { torch?: boolean }
  interface MediaTrackConstraintSet { torch?: ConstrainBoolean }
}

export type CameraState = 'starting' | 'display' | 'stopping' | 'idle'

// export type CameraFacingMode = 'user' | 'environment'

const videoReady = (video: HTMLVideoElement, delay: number) => new Promise((resolve) => {
  const check = () => {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      resolve(0)
    } else setTimeout(check, delay)
  }
  setTimeout(check, delay)
})

const requestCameraPermission = async (constraints: MediaStreamConstraints) => {
  if (!navigator.mozGetUserMedia) {
    const permissionStatus = await navigator.permissions
      .query({ name: 'camera' as any })
      .catch(() => ({ state: 'prompt' }))
    if (permissionStatus.state === 'granted') return
  }
  await getUserMedia(constraints).then(s => s.getTracks().forEach(i => i.stop()))
}

// const getFacingModePattern = (facingMode: CameraFacingMode) =>
//   facingMode === 'environment' ? /rear|back|environment/gi : /front|user|face/gi

export const handleStream = async (
  video: HTMLVideoElement,
  stream: MediaStream,
  info: MediaDeviceInfo
) => {
  if (video.srcObject !== undefined) {
    video.srcObject = stream
  } else if (video.mozSrcObject !== undefined) {
    video.mozSrcObject = stream
  } else if (window.URL.createObjectURL) {
    video.src = window.URL.createObjectURL(stream as any)
  } else if (window.webkitURL) {
    video.src = window.webkitURL.createObjectURL(stream as any)
  } else {
    video.src = stream as any
  }

  await eventOn(video, 'canplay')

  const isFrontCamera = /front|user|face/gi.test(info.label)
  video.style.transform = isFrontCamera ? 'scaleX(-1)' : ''

  await video.play()
  await videoReady(video, 750)

  await timeout(500)
  const [track] = stream.getVideoTracks()
  return track?.getCapabilities?.() ?? {}
}

export const releaseStream = async (
  video: HTMLVideoElement | undefined,
  stream: MediaStream | null,
) => {
  if (video) {
    video.src = ''
    video.srcObject = null
    video.load()

    await eventOn(video, 'error')
  }
  if (stream) {
    for (const track of stream.getVideoTracks()) {
      stream.removeTrack(track)
      track.stop()
    }
  }
}

const defaultConstraints = { video: true, audio: false }
export const getUserMedia = (constraints: MediaStreamConstraints, deviceId?: string) => {
  const c = { ...defaultConstraints, ...constraints } as MediaStreamConstraints;
  if (deviceId) c.video = { deviceId }
  return navigator.mediaDevices.getUserMedia(c)
}

export const getDevices = (constraints: MediaStreamConstraints) =>
  requestCameraPermission(constraints)
    .then(_ => navigator.mediaDevices.enumerateDevices())
    .then(ds => {
      ds = ds.filter(({ kind }) => kind === 'videoinput')

      // if (facingMode) {
      //   const pattern = getFacingModePattern(facingMode);
      //   ds = ds.filter(({ label }) => pattern.test(label))
      // }

      return ds
    })

export const toggleTorch = async (stream: MediaStream | null, target: boolean) => {
  if (!stream) return

  const [track] = stream.getVideoTracks()
  await track.applyConstraints({ advanced: [{ torch: target }] })
}