import { onMounted, ref, onUnmounted } from "vue";
import { type CameraController } from "./use-camera";

/**
 * Take photo object
 */
export type UseTakePhoto = {
  takeAsBlob(): Promise<Blob | undefined>;
  takeAsDataURL(): Promise<string | undefined>;
}

// TODO move to ImageCapture when it's available on all major browsers. https://caniuse.com/imagecapture
/**
 * Take photo hook
 * @param controller camera controller object
 * @param mime mime type of the result image
 * @returns Take photo object
 */
export const useTakePhoto = (controller: CameraController, mime = "image/png"): UseTakePhoto => {
  const canvas = ref<HTMLCanvasElement>();

  onMounted(() => {
    const c = document.createElement('canvas');
    c.style.display = 'none';
    document.body.appendChild(c);
    canvas.value = c;
  });

  onUnmounted(() => {
    if (canvas.value) document.body.removeChild(canvas.value);
    canvas.value = undefined;
  });

  const take = () => {
    const video = controller.video.value
    if (!canvas.value || !video) return;
    canvas.value.width = video.videoWidth;
    canvas.value.height = video.videoHeight;
    const context = canvas.value.getContext('2d');
    if (!context) return;

    if(video.style.transform === 'scaleX(-1)') {
      context.translate(canvas.value.width, 0)
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0);
  }

  return {
    takeAsBlob(): Promise<Blob | undefined> {
      return new Promise((resolve) => {
        try {
          take()
          canvas.value?.toBlob((blob) => {
            if(blob) resolve(blob);
            else resolve(undefined);
          }, mime, 1);
        } catch (e) {
          console.error(e)
          resolve(undefined);
        }
      });
    },
    takeAsDataURL(): Promise<string | undefined> {
      return new Promise((resolve) => {
        try {
          take()
          resolve(canvas.value!.toDataURL(mime));
        } catch (e) {
          console.error(e)
          resolve(undefined);
        }
      });
    }
  }
}