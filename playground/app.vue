<script setup lang="ts">
import { useCamera, useTakePhoto, useTakeVideo } from '@alzera/vue-use-camera'
const controller = useCamera({
  autoPause: true,
})
const photoController = useTakePhoto(controller)
const videoController = useTakeVideo(controller)

const resultPhoto = ref<string | null>()
const resultVideo = ref<Blob | null>()

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
  if(!resultPhoto.value) resultVideo.value = null
}

const takeVideo = async () => {
  resultVideo.value = await videoController.stop()
  if(!resultVideo.value) resultPhoto.value = null
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
