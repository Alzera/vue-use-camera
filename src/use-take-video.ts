import { ref, watch } from "vue";
import { type CameraController } from "./use-camera";

/**
 * Take video object
 */
export type UseTakeVideo = {
  readonly state: RecordingState;
  start(): void;
  pause(): void;
  resume(): void;
  stop(): Promise<Blob | undefined>;
}

/**
 * Take video hook
 * @param controller camera controller object
 * @param mime mime type of the result video
 * @returns Take video object
 */
export const useTakeVideo = (controller: CameraController, mime = "video/webm"): UseTakeVideo => {
  const recorder = ref<MediaRecorder>()
  const state = ref<RecordingState>('inactive')

  watch(() => controller.camera.stream, (v) => {
    if (!v) return
    if (!MediaRecorder.isTypeSupported(mime)) {
      console.warn('Codec not supported: ', mime);
      return
    }

    const device = controller.device.selected
    if(device) {
      let stream = v
      if(controller.video.value?.style.transform === 'scaleX(-1)') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.style.display = 'none';
        document.body.appendChild(canvas);

        const video = controller.video.value!
        video.addEventListener('loadedmetadata', () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
  
          function draw() {
            if (context) {
              context.save();
              context.scale(-1, 1);
              context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
              context.restore();
            }
            requestAnimationFrame(draw);
          }
          draw();
        })
        stream = canvas.captureStream(30);
      }
      recorder.value = new MediaRecorder(stream, { mimeType: mime })
    }
  })

  return {
    get state() {
      return state.value ?? 'inactive'
    },
    start() {
      if (!recorder.value) return
      recorder.value.start()
      state.value = 'recording'
    },
    pause() {
      if (!recorder.value || state.value !== 'recording') return
      recorder.value.pause()
      state.value = 'paused'
    },
    resume() {
      if (!recorder.value || state.value !== 'paused') return
      recorder.value.resume()
      state.value = 'recording'
    },
    stop() {
      if (!recorder.value) return Promise.resolve(undefined)

      return new Promise<Blob | undefined>((resolve) => {
        recorder.value!.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            resolve(e.data)
          } else resolve(undefined)
          recorder.value!.ondataavailable = null
        }
        recorder.value!.stop()
        state.value = 'inactive'
      })
    },
  }
}