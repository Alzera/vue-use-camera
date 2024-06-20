import { ref, watch } from "vue";
import { type CameraController } from "./use-camera";

export type UseTakeVideo = {
  readonly state: RecordingState;
  start(): void;
  pause(): void;
  resume(): void;
  stop(): Promise<Blob | null>;
}

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
      if(/front|user|face/gi.test(device.label)) {
        const canvas = document.createElement('canvas');
        canvas.style.display = 'none';
        document.body.appendChild(canvas);

        const video = controller.video.value!
        video.addEventListener('loadedmetadata', () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext('2d');
          if (!context) return;
  
          function draw() {
            context!.save();
            context!.scale(-1, 1);
            context!.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
            context!.restore();
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
      if (!recorder.value) return Promise.resolve(null)

      return new Promise<Blob | null>((resolve) => {
        recorder.value!.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            resolve(e.data)
          } else resolve(null)
          recorder.value!.ondataavailable = null
        }
        recorder.value!.stop()
        state.value = 'inactive'
      })
    },
  }
}