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
    // video.addEventListener('loadedmetadata', () => {
    //     canvas.width = video.videoWidth;
    //     canvas.height = video.videoHeight;
    //     const context = canvas.getContext('2d');

    //     // Draw the flipped video frames onto the canvas
    //     function draw() {
    //         context.save();
    //         context.scale(-1, 1);
    //         context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    //         context.restore();
    //         requestAnimationFrame(draw);
    //     }
    //     draw();
    // });
    // const canvasStream = canvas.captureStream(30);

    // const isCodecSupported = MediaRecorder.isTypeSupported(
    //   recording.mimeType
    // );

    // if (!isCodecSupported) {
    //   console.warn('Codec not supported: ', recording.mimeType);
    //   handleError('startRecording', ERROR_MESSAGES.CODEC_NOT_SUPPORTED);
    // }
    recorder.value = new MediaRecorder(v, { mimeType: mime })
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