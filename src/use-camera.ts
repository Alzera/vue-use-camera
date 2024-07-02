import { type Ref, onMounted, onUnmounted, ref, watch } from "vue";
import { type CameraState, releaseStream, handleStream, getDevices, getUserMedia, toggleTorch } from "./utils/camera"
import { useDocumentVisibility, useLocalStorage } from "@vueuse/core";

/**
 * Camera controller object
 */
export type CameraController = {
  readonly video: Ref<HTMLVideoElement | undefined>;
  readonly camera: {
    readonly capabilities: MediaTrackCapabilities | undefined;
    readonly state: CameraState;
    stream: MediaStream | null;
    torch: boolean;
  };
  readonly device: {
    list: MediaDeviceInfo[];
    selected: MediaDeviceInfo | undefined;
    lastSelected: string | undefined;
  };
}

/**
 * Camera hook
 * @param onError callback to be called when an error occurs
 * @param useLastDeviceId use last device id functionality
 * @param autoStart auto start camera when mounted
 * @param autoPause auto pause camera when user leaves the page
 * @param constraints constraints for getUserMedia
 * @returns Camera controller object
 */
export const useCamera = ({
  onError = console.error,
  useLastDeviceId = true,
  autoStart = true,
  autoPause = false,
  constraints = {
    audio: false,
    video: true
  },
}: {
  onError?: (error: any) => void;
  useLastDeviceId?: boolean;
  autoStart?: boolean;
  autoPause?: boolean;
  constraints?: MediaStreamConstraints;
} = {}): CameraController => {
  const visibility = useDocumentVisibility()

  const video = ref<HTMLVideoElement>()
  const stream = ref<MediaStream | null>(null)
  const isMounted = ref<boolean>(false)

  const torchState = ref<boolean>(false)
  const capabilities = ref<MediaTrackCapabilities>()
  const cameraState = ref<CameraState>("idle")
  const devices = ref<MediaDeviceInfo[]>([])
  const selectedDevice = ref<MediaDeviceInfo>();
  const lastDeviceId = useLocalStorage<string>("last-device-id", null)

  const error = async (e: any) => {
    await stop().catch(onError)
    onError?.(e)
  }

  const stop = async () => {
    cameraState.value = "stopping"

    await setTorch(false)
    await releaseStream(video.value, stream.value)
    capabilities.value = undefined
    stream.value = null

    cameraState.value = "idle"
  }

  const start = async (device: MediaDeviceInfo) => {
    getUserMedia(constraints, device.deviceId)
      .then<MediaTrackCapabilities | void>(value => {
        if (!video.value) return Promise.resolve()
        stream.value = value

        return isMounted
          ? handleStream(video.value, value, device)
          : stop()
      })
      .then(c => {
        if (!c) return
        capabilities.value = c
        cameraState.value = "display"
      })
      .catch(error)
  }

  const setTorch = async (target: boolean) => {
    if (!capabilities.value?.torch || target == torchState.value) return

    await toggleTorch(stream.value, target).catch(onError)
    torchState.value = target
  }

  onMounted(() => {
    isMounted.value = true
  })
  onUnmounted(() => {
    isMounted.value = false
    stop()
  })

  watch(() => video.value, (v, _, onCleanup) => {
    if (!v) return

    cameraState.value = "starting"
    getDevices(constraints)
      .then(ds => {
        devices.value = ds
        if (autoStart && ds.length) {
          const device = ds[0]
          if(useLastDeviceId && lastDeviceId.value) {
            const index = devices.value.findIndex(i => i.deviceId == lastDeviceId.value)
            if (index >= 0) selectedDevice.value = devices.value[index]
          }
          selectedDevice.value = device
        }
      })
      .catch(error)

    onCleanup(stop)
  })

  watch(() => selectedDevice.value, (v, _, onCleanup) => {
    if (!v) return

    const index = devices.value.findIndex(i => i.deviceId == v.deviceId)
    if (index < 0) return

    lastDeviceId.value = v.deviceId
    const selected = devices.value[index]

    stop().then(_ => start(selected))

    onCleanup(stop)
  })

  watch(() => visibility.value, (v) => {
    if (!autoPause) return
    if (v == 'hidden') {
      stop()
    } else if (selectedDevice.value) {
      const index = devices.value.findIndex(i => i.deviceId == selectedDevice.value!.deviceId)
      if (index < 0) return
      const selected = devices.value[index]
      start(selected)
    }
  })

  return {
    get video() { return video },
    get camera() {
      return {
        get capabilities() { return capabilities.value },
        get state() { return cameraState.value },
        get torch() { return torchState.value },
        set torch(target: boolean) { setTorch(target) },
        get stream() { return stream.value },
      }
    },
    get device() {
      return {
        get list() { return devices.value },
        set list(target: MediaDeviceInfo[]) { devices.value = target },
        get selected() { return selectedDevice.value },
        set selected(target: MediaDeviceInfo | undefined) { selectedDevice.value = target },
        get lastSelected() { return lastDeviceId.value },
        set lastSelected(target: string | undefined) { lastDeviceId.value = target },
      }
    },
  }
}