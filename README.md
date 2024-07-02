# Vue Use Camera

A Vue composable for handling Camera API also utilities for taking photos and videos.

## Installation

```bash
npm install @alzera/vue-use-camera
```

## Usage

```vue
<script setup lang="ts">
import { useCamera, useTakePhoto, useTakeVideo } from '@alzera/vue-use-camera'
const controller = useCamera({
  autoPause: true,
})
const photoController = useTakePhoto(controller)
const videoController = useTakeVideo(controller)

const resultPhoto = ref<string>()
const resultVideo = ref<Blob>()

const selectedChange = (e: Event) => {
  if (!e.target) return;
  const target = e.target as HTMLInputElement
  controller.device.selected = controller.device.list.find((d) => d.deviceId === target.value)
}

const createUrl = (blob: Blob) => {
  return URL.createObjectURL(blob)
}

const takePhoto = async () => {
  resultPhoto.value = await photoController.takeAsDataURL()
  if(resultPhoto.value) resultVideo.value = undefined
}

const takeVideo = async () => {
  resultVideo.value = await videoController.stop()
  if(resultVideo.value) resultPhoto.value = undefined
}
</script>

<template>
  <div id="camera-preview">
    <video :ref="controller.video" preload="none" playsInline muted style="max-width: 500px;"></video><br/>
    <select :value="controller.device.selected?.deviceId" @change="selectedChange">
      <option v-for="(d, i) in controller.device.list" :key="i" :value="d.deviceId">{{ d.label }}</option>
    </select>
    <button @click="takePhoto">Take Photo</button>
    <button v-if="videoController.state === 'inactive'" @click="videoController.start">Start Video</button>
    <button v-if="videoController.state === 'recording'" @click="videoController.pause">Pause Video</button>
    <button v-if="videoController.state === 'paused'" @click="videoController.resume">Resume Video</button>
    <button v-if="videoController.state === 'recording'" @click="takeVideo">Stop Video</button><br/>
    <img v-if="resultPhoto" :src="resultPhoto" />
    <video v-if="resultVideo" :src="createUrl(resultVideo)" controls />
  </div>
</template>
```

## API

### useCamera

```ts
useCamera({
  onError?: (error: any) => void;
  useLastDeviceId?: boolean;
  autoStart?: boolean;
  autoPause?: boolean;
  constraints?: MediaStreamConstraints;
}): CameraController
```

### useTakePhoto

```ts
useTakePhoto(controller: CameraController, mime?: string): UseTakePhoto
```

### useTakeVideo

```ts
useTakeVideo(controller: CameraController, mime?: string): UseTakeVideo
```

### CameraController

```ts
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
```

### UseTakePhoto

```ts
takeAsBlob(): Promise<Blob | undefined>;
takeAsDataURL(): Promise<string | undefined>;
```

### UseTakeVideo

```ts
readonly state: RecordingState;
start(): void;
pause(): void;
resume(): void;
stop(): Promise<Blob | undefined>;
```

## License

MIT