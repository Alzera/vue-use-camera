// import { useScreenOrientation } from "@vueuse/core";
import { onMounted, ref, onUnmounted } from "vue";
import { type CameraController } from "./use-camera";

export type UseTakePhoto = {
  takeAsBlob(): Promise<Blob | undefined>;
  takeAsDataURL(): Promise<string | undefined>;
}

// TODO move to ImageCapture when it's available on all major browsers. https://caniuse.com/imagecapture
export const useTakePhoto = (controller: CameraController, mime = "image/png"): UseTakePhoto => {
  const canvas = ref<HTMLCanvasElement>();
  // const { angle } = useScreenOrientation();

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

    const width = canvas.value.width;
    const height = canvas.value.height;
    // const degrees = angle.value;
    // if (degrees === 90 || degrees === 270) {
    //   canvas.value.width = height;
    //   canvas.value.height = width;
    // }
    // if (degrees === 90) context.translate(height, 0);
    // else if (degrees === 180) context.translate(width, height);
    // else if (degrees === 270) context.translate(0, width);
    // else context.translate(0, 0);
    // context.rotate(degrees * Math.PI / 180);

    if(video.style.transform === 'scaleX(-1)') {
      context.translate(canvas.value.width, 0)
      context.scale(-1, 1);
    }
    context.drawImage(video, -video.width / 2, -video.height / 2, width, height);

    // context!.restore();
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