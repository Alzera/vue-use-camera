import { useScreenOrientation } from "@vueuse/core";
import { onMounted, ref, onUnmounted } from "vue";
import { type CameraController } from "./use-camera";

export type UseTakePhoto = {
  takeAsBlob(): Promise<Blob | null>;
  takeAsDataURL(): Promise<string | null>;
}

// TODO move to ImageCapture when it's available on all major browsers. https://caniuse.com/imagecapture
export const useTakePhoto = (controller: CameraController, mime = "image/png"): UseTakePhoto => {
  const canvas = ref<HTMLCanvasElement>();
  const { angle } = useScreenOrientation();

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
    if (!canvas.value || !controller.video.value) return;
    canvas.value.width = controller.video.value.videoWidth;
    canvas.value.height = controller.video.value.videoHeight;
    const context = canvas.value.getContext('2d');
    if (!context) return;

    const degrees = angle.value;
    const width = canvas.value.width;
    const height = canvas.value.height;
    if (degrees === 90 || degrees === 270) {
      canvas.value.width = height;
      canvas.value.height = width;
    }
    if (degrees === 90) {
      context.translate(height, 0);
    }
    else if (degrees === 180) {
      context.translate(width, height);
    }
    else if (degrees === 270) {
      context.translate(0, width);
    }
    else {
      context.translate(0, 0);
    }
    context.rotate(degrees * Math.PI / 180);
    context.drawImage(controller.video.value, -controller.video.value.width / 2, -controller.video.value.width / 2, width, height);
  }

  return {
    takeAsBlob(): Promise<Blob | null> {
      return new Promise((resolve) => {
        try {
          take()
          canvas.value?.toBlob((blob) => {
            if(blob) resolve(blob);
            else resolve(null);
          }, mime, 1);
        } catch (e) {
          resolve(null);
        }
      });
    },
    takeAsDataURL(): Promise<string | null> {
      return new Promise((resolve) => {
        try {
          take()
          resolve(canvas.value!.toDataURL(mime));
        } catch (e) {
          resolve(null);
        }
      });
    }
  }
}