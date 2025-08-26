<!-- BirdIdentifyInlineTabs.vue -->
<template>
  <Card
    class="w-full rounded-2xl border border-border bg-card text-card-foreground relative gap-0 py-4 md:py-6"
  >
    <!-- Full overlay loader -->
    <div
      v-if="busy"
      class="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm"
    >
      <div class="flex items-center gap-3">
        <!-- <div
          class="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
        ></div> -->
        <Icon name="lucide:loader" class="size-6 animate-spin" />
        <span class="text-lg font-medium">Analyzing...</span>
      </div>
    </div>

    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle>Identify using AI</CardTitle>

        <TooltipProvider>
          <Tooltip v-model:open="tooltipOpen">
            <TooltipTrigger as-child>
              <button
                @click="toggleTooltip"
                class="text-muted-foreground cursor-help p-1 -m-1"
                type="button"
              >
                <Icon name="lucide:info" size="16" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Uses BirdNET model weights (CC BY-NC-SA 4.0)<br />and timm
                ConvNeXt weights (CC BY-NC 4.0).
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </CardHeader>

    <CardContent class="space-y-4 px-4 md:px-6">
      <!-- Tabs - only show when no file is loaded -->
      <Tabs v-if="!previewUrl" v-model="currentTab" class="w-full">
        <TabsList class="grid w-full grid-cols-3 h-20 gap-1">
          <TabsTrigger
            value="upload"
            class="flex flex-col items-center gap-1 p-3 bg-background/30 dark:bg-background hover:bg-background/50 dark:hover:bg-background/80 transition-colors"
          >
            <Icon name="lucide:upload" size="24" />
            <span class="text-xs">Upload</span>
          </TabsTrigger>
          <TabsTrigger
            value="camera"
            class="flex flex-col items-center gap-1 p-3 bg-background/30 dark:bg-background hover:bg-background/50 dark:hover:bg-background/80 transition-colors"
          >
            <Icon name="lucide:camera" size="24" />
            <span class="text-xs">Camera</span>
          </TabsTrigger>
          <TabsTrigger
            value="record"
            class="flex flex-col items-center gap-1 p-3 bg-background/30 dark:bg-background hover:bg-background/50 dark:hover:bg-background/80 transition-colors"
          >
            <Icon name="lucide:mic" size="24" />
            <span class="text-xs">Record</span>
          </TabsTrigger>
        </TabsList>

        <!-- Upload -->
        <TabsContent value="upload" class="mt-4">
          <div
            ref="dropEl"
            :class="[
              'relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition',
              isOver
                ? 'border-primary/70 bg-primary/5'
                : 'border-border hover:border-primary/50',
            ]"
            @click="() => openFileDialog()"
          >
            <p class="text-sm font-medium">
              Drop image/audio or click to choose
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              Accepted: image/*, audio/*
            </p>
            <Button variant="secondary" size="sm" class="mt-3" type="button"
              >Choose file</Button
            >
            <div v-if="pickedName" class="mt-3 text-xs text-muted-foreground">
              • {{ pickedName }}
            </div>
          </div>
        </TabsContent>

        <!-- Camera -->
        <TabsContent value="camera" class="mt-4 space-y-3">
          <div class="relative aspect-video overflow-hidden rounded-xl border">
            <video
              ref="videoEl"
              autoplay
              playsinline
              muted
              class="h-full w-full object-cover"
              :srcObject="videoStream || null"
            />
            <div
              v-if="!videoStream"
              class="absolute inset-0 grid place-items-center text-xs text-muted-foreground"
            >
              Camera starting...
            </div>

            <!-- Camera switch button - only show when camera is active and multiple cameras available -->
            <button
              v-if="videoStream && availableCameras.length > 1"
              @click="switchCamera"
              class="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              type="button"
              aria-label="Switch camera"
            >
              <Icon name="lucide:refresh-ccw" size="20" />
            </button>
          </div>
          <div class="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              :disabled="!videoStream || busy"
              @click="capturePhoto"
              >Take photo</Button
            >
          </div>
        </TabsContent>

        <!-- Record -->
        <TabsContent value="record" class="mt-4 space-y-3">
          <div class="relative overflow-hidden rounded-xl border p-3">
            <canvas ref="waveEl" class="h-20 w-full"></canvas>
            <div
              class="absolute bottom-2 right-3 text-xs tabular-nums text-muted-foreground"
            >
              {{ elapsedLabel }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              :variant="isRecording ? 'destructive' : 'default'"
              @click="toggleRecording"
              :disabled="busy"
            >
              {{ isRecording ? "Stop" : "Record" }}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <!-- Preview -->
      <div v-if="previewUrl" class="rounded-xl border p-3">
        <div class="flex flex-col gap-3 md:items-start md:flex-row-reverse">
          <div
            class="ml-auto flex gap-2 w-full justify-between items-center md:w-auto"
          >
            <Badge variant="secondary">{{ currentKindLabel }}</Badge>

            <Button
              size="sm"
              variant="outline"
              @click="clearPreview"
              class="size-8 p-0"
              type="button"
            >
              <Icon name="lucide:x" size="18" />
            </Button>
          </div>

          <img
            v-if="isImagePreview"
            :src="previewUrl"
            alt="preview"
            class="w-full aspect-square rounded-lg border object-cover sm:size-32"
          />
          <audio
            v-else
            :src="previewUrl"
            controls
            class="h-10 w-full md:max-w-md"
          />
        </div>
      </div>

      <!-- Errors -->
      <Alert v-if="error" variant="destructive">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <!-- Results (same renderers) -->
      <div
        v-if="
          lastType === 'audio' &&
          audioNorm.filter((item) => item.confidence >= 0.2).length
        "
        class="space-y-3"
      >
        <h3 class="text-sm font-semibold">Birds detected (audio)</h3>
        <div class="divide-y rounded-xl border">
          <div
            v-for="item in audioNorm.filter((item) => item.confidence >= 0.2)"
            :key="item.label"
            class="flex items-center justify-between p-3"
          >
            <div class="flex items-center gap-3">
              <span class="size-2 rounded-full bg-primary"></span>
              <span class="font-medium">{{ prettyName(item.label) }}</span>
              <span class="text-xs text-muted-foreground"
                >({{ item.occurrences }}× in
                {{ item.segments.length }} segs)</span
              >
            </div>
            <span class="font-semibold tabular-nums"
              >{{ (item.confidence * 100).toFixed(1) }}%</span
            >
          </div>
        </div>
      </div>

      <div
        v-if="
          lastType === 'image' &&
          imgRaw?.predictions?.[0]?.topk?.filter((p) => p.confidence >= 0.2)
            .length
        "
        class="space-y-3"
      >
        <h3 class="text-sm font-semibold">Birds detected (image)</h3>
        <div class="rounded-xl border p-3">
          <div class="text-xs text-muted-foreground">Top-k</div>
          <ul class="mt-2 space-y-1">
            <li
              v-for="p in imgRaw.predictions[0]?.topk?.filter(
                (p) => p.confidence >= 0.2
              ) || []"
              :key="p.id"
              class="flex items-center justify-between"
            >
              <span class="font-medium">{{ p.label }}</span>
              <span class="tabular-nums"
                >{{ (p.confidence * 100).toFixed(1) }}%</span
              >
            </li>
          </ul>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
// Same logic & types as the Cards variant — intentionally duplicated so you can drop this file in directly.
type Segment = {
  start: number;
  end: number;
  predictions: { label: string; confidence: number }[];
};
type PredictResponse = {
  filename: string;
  num_segments: number;
  segments: Segment[];
};

type Box = { x1: number; y1: number; x2: number; y2: number; det_conf: number };
type ImgPred = { id: number; label: string; confidence: number };
type ImgResponse = {
  filename: string;
  classifier_model_id: string;
  detector: {
    weights: string;
    conf: number;
    iou: number;
    margin: number;
    classify_all: boolean;
  };
  predictions: { box: Box | null; topk: ImgPred[]; note?: string }[];
};

type Normalized = {
  label: string;
  confidence: number;
  occurrences: number;
  segments: { start: number; end: number; confidence: number }[];
};

// Get runtime config for API base URL
const { $config } = useNuxtApp();
const baseApiUrl = $config.public.identifyApiUrl;

const props = withDefaults(
  defineProps<{
    topK?: number;
    minConf?: number;
    speciesFilter?: string;
  }>(),
  {
    topK: 5,
    minConf: 0,
    speciesFilter: "",
  }
);

// Use computed properties for API bases with fallback to runtime config
const audioApiBase = computed(() => `${baseApiUrl}/api/audio`);
const imageApiBase = computed(() => `${baseApiUrl}/api/image`);
const emit = defineEmits<{
  (
    e: "identified",
    value: Normalized[] | ImgResponse["predictions"],
    raw: PredictResponse | ImgResponse | null
  ): void;
}>();

import {
  ref,
  shallowRef,
  computed,
  onBeforeUnmount,
  watchEffect,
  nextTick,
} from "vue";
import {
  useDropZone,
  useFileDialog,
  useRafFn,
  useUserMedia,
  useNow,
  useDocumentVisibility,
  useDevicesList,
} from "@vueuse/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const busy = ref(false);
const error = ref("");
const tooltipOpen = ref(false);

function toggleTooltip() {
  tooltipOpen.value = !tooltipOpen.value;
}

/** Drop + dialog */
const dropEl = shallowRef<HTMLElement | null>(null);
const pickedName = ref("");
const { isOverDropZone: isOver } = useDropZone(dropEl, {
  onDrop(files) {
    if (!files?.length) return;
    const file = files[0];
    if (file) handleFile(file);
  },
});
const { files, open: openFileDialog } = useFileDialog({
  multiple: false,
  accept: "image/*,audio/*,.ogg",
});

let lastProcessedFile: File | null = null;

watchEffect(() => {
  const f = files.value?.[0];
  if (f && f !== lastProcessedFile) {
    lastProcessedFile = f;
    pickedName.value = f.name;
    handleFile(f);
  }
});

/** Camera */
const videoEl = shallowRef<HTMLVideoElement | null>(null);
const documentVisible = useDocumentVisibility();

// Get available cameras - don't request permissions on load
const { videoInputs: availableCameras } = useDevicesList({
  requestPermissions: false,
});

const currentCameraIndex = ref(0);
const permissionsRequested = ref(false);

const currentCameraId = computed(() => {
  const cameras = availableCameras.value;
  if (cameras.length === 0) return undefined;
  return cameras[currentCameraIndex.value % cameras.length]?.deviceId;
});

const {
  stream: videoStream,
  start: startCam,
  stop: stopCam,
} = useUserMedia({
  constraints: computed(() => ({
    video: currentCameraId.value
      ? { deviceId: currentCameraId.value }
      : { facingMode: "environment" }, // Prefer back camera
  })),
});

// Auto-start camera when camera tab is selected and document is visible
const currentTab = ref("upload"); // Track current tab

// Stop camera when document becomes hidden or when leaving camera tab
watchEffect(() => {
  if (documentVisible.value === "hidden" || currentTab.value !== "camera") {
    stopCam();
  }
});

// Start camera when camera tab is selected and document is visible
watchEffect(async () => {
  if (currentTab.value === "camera" && documentVisible.value === "visible") {
    // Request permissions on first camera tab activation
    if (!permissionsRequested.value) {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        // Re-enumerate devices after permission is granted
        const devices = await navigator.mediaDevices.enumerateDevices();
        permissionsRequested.value = true;
      } catch (e: any) {
        error.value = e?.message || String(e);
        return;
      }
    }

    startCam().catch((e: any) => {
      error.value = e?.message || String(e);
    });
  }
});

// Switch between available cameras
function switchCamera() {
  if (availableCameras.value.length <= 1) return;

  currentCameraIndex.value =
    (currentCameraIndex.value + 1) % availableCameras.value.length;

  // Restart camera with new device
  if (videoStream.value) {
    stopCam();
    nextTick(() => {
      startCam().catch((e: any) => {
        error.value = e?.message || String(e);
      });
    });
  }
}
async function capturePhoto() {
  if (!videoEl.value) return;
  const v = videoEl.value;
  const c = document.createElement("canvas");
  c.width = v.videoWidth || 1280;
  c.height = v.videoHeight || 720;
  c.getContext("2d")!.drawImage(v, 0, 0);
  const blob: Blob = await new Promise(
    (r) => c.toBlob((b) => r(b as Blob), "image/jpeg", 0.9)!
  );
  const file = new File([blob], `camera-${Date.now()}.jpg`, {
    type: "image/jpeg",
  });

  // Stop camera after taking photo
  stopCam();

  previewFile(file);
  await submitImage(file);
}

/** Recorder */
const {
  stream: micStream,
  start: startMic,
  stop: stopMic,
} = useUserMedia({ constraints: { audio: true } });
let mediaRecorder: MediaRecorder | null = null;
const isRecording = ref(false);
const recordedUrl = ref<string | null>(null);
const waveEl = shallowRef<HTMLCanvasElement | null>(null);
let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let sourceNode: MediaStreamAudioSourceNode | null = null;
const startedAt = ref<number | null>(null);
const now = useNow();
const elapsedLabel = computed(() => {
  if (!startedAt.value) return "0:00";
  const sec = Math.max(0, Math.floor((+now.value - startedAt.value) / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
});
const { pause: pauseWave, resume: resumeWave } = useRafFn(() => drawWave(), {
  immediate: false,
});

async function toggleRecording() {
  if (isRecording.value) {
    mediaRecorder?.stop();
    isRecording.value = false;
    stopMic();
    stopWave();
    return;
  }
  try {
    await startMic();
    recordedUrl.value = null;
    await startWave();
    const chunks: BlobPart[] = [];
    mediaRecorder = new MediaRecorder(micStream.value!, {
      mimeType: chooseMimeType() || undefined,
    });
    mediaRecorder.ondataavailable = (e) => e.data && chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, {
        type: mediaRecorder?.mimeType || "audio/webm",
      });
      recordedUrl.value = URL.createObjectURL(blob);
      const file = new File(
        [blob],
        `recording${extFor(mediaRecorder?.mimeType)}`,
        { type: blob.type }
      );
      previewFile(file);
      await submitAudio(file);
    };
    mediaRecorder.start(250);
    startedAt.value = Date.now();
    isRecording.value = true;
  } catch (e: any) {
    error.value = e?.message || String(e);
  }
}
function chooseMimeType(): string | undefined {
  const c = ["audio/ogg;codecs=opus", "audio/webm;codecs=opus", "audio/mp4"];
  return (
    c.find((t) => (window as any).MediaRecorder?.isTypeSupported?.(t)) ||
    undefined
  );
}
function extFor(m?: string) {
  if (!m) return ".webm";
  if (m.includes("ogg")) return ".ogg";
  if (m.includes("webm")) return ".webm";
  if (m.includes("mp4")) return ".m4a";
  return ".webm";
}
async function startWave() {
  if (!micStream.value || !waveEl.value) return;
  audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 1024;
  sourceNode = audioCtx.createMediaStreamSource(micStream.value);
  sourceNode.connect(analyser);
  resumeWave();
}
function stopWave() {
  pauseWave();
  analyser?.disconnect();
  sourceNode?.disconnect();
  audioCtx?.close();
  analyser = null;
  sourceNode = null;
  audioCtx = null;
  startedAt.value = null;
}
function drawWave() {
  const canvas = waveEl.value;
  if (!canvas || !analyser) return;
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas.getBoundingClientRect();
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const buffer = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(buffer);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  const slice = canvas.width / buffer.length;
  for (let i = 0; i < buffer.length; i++) {
    const v = (buffer[i] ?? 0) / 128.0;
    const y = (v * canvas.height) / 2;
    const x = i * slice;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.lineWidth = 2;
  ctx.strokeStyle =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim() || "#10b981";
  ctx.stroke();
}

/** Preview */
const previewUrl = ref<string | null>(null);
const isImagePreview = ref(false);
const currentKindLabel = computed(() =>
  isImagePreview.value ? "Image" : "Audio"
);
function previewFile(file: File) {
  previewUrl.value && URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = URL.createObjectURL(file);
  isImagePreview.value = file.type.startsWith("image/");
}
function clearPreview() {
  previewUrl.value && URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = null;
  // Stop camera if active
  if (videoStream.value) stopCam();
  // Stop recording if active
  if (isRecording.value) {
    mediaRecorder?.stop();
    isRecording.value = false;
    stopMic();
    stopWave();
  }
  // Clear any file selections
  pickedName.value = "";
  recordedUrl.value = null;
  // Clear file dialog state to prevent re-triggering
  files.value = null;
  // Clear results
  audioRaw.value = null;
  imgRaw.value = null;
  audioNorm.value = [];
  lastType.value = null;
  error.value = "";

  // Restart camera if user is still on camera tab after clearing
  nextTick(() => {
    if (currentTab.value === "camera" && documentVisible.value === "visible") {
      startCam().catch((e: any) => {
        error.value = e?.message || String(e);
      });
    }
  });
} /** Helpers */
function prettyName(label: string) {
  const [sci, common] = label.includes("_") ? label.split("_") : [label, ""];
  return common ? `${common} (${sci})` : label;
}
function handleFile(file: File) {
  previewFile(file);

  // Enhanced file type detection: check MIME type and file extension
  const isImage =
    file.type.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name);

  const isAudio =
    file.type.startsWith("audio/") ||
    /\.(mp3|wav|ogg|m4a|aac|flac|webm|opus)$/i.test(file.name);

  if (isImage) {
    submitImage(file);
  } else if (isAudio) {
    submitAudio(file);
  } else {
    error.value = "Unsupported file type. Please use image/* or audio/*";
  }
}

/** Results */
const lastType = ref<"audio" | "image" | null>(null);
const audioRaw = ref<PredictResponse | null>(null);
const imgRaw = ref<ImgResponse | null>(null);
const audioNorm = ref<Normalized[]>([]);
function aggregate(res: PredictResponse): Normalized[] {
  const map = new Map<string, Normalized>();
  for (const seg of res.segments || []) {
    for (const p of seg.predictions) {
      const entry =
        map.get(p.label) ||
        ({
          label: p.label,
          confidence: 0,
          occurrences: 0,
          segments: [],
        } as Normalized);
      entry.confidence = Math.max(entry.confidence, p.confidence);
      entry.occurrences += 1;
      entry.segments.push({
        start: seg.start,
        end: seg.end,
        confidence: p.confidence,
      });
      map.set(p.label, entry);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.confidence - a.confidence);
}

/** API */
async function submitAudio(file: File) {
  busy.value = true;
  error.value = "";
  lastType.value = "audio";
  audioRaw.value = null;
  audioNorm.value = [];
  try {
    const fd = new FormData();
    fd.append("file", file);
    const qs = new URLSearchParams({
      top_k: String(props.topK),
      min_conf: String(props.minConf),
      species_filter: props.speciesFilter || "",
    });
    const res = await fetch(`${audioApiBase.value}/predict?${qs.toString()}`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) throw new Error(`Audio API error ${res.status}`);
    const json = (await res.json()) as PredictResponse;
    audioRaw.value = json;
    audioNorm.value = aggregate(json);
    emit("identified", audioNorm.value, json);
  } catch (e: any) {
    error.value = e?.message || String(e);
  } finally {
    busy.value = false;
  }
}
async function submitImage(file: File) {
  busy.value = true;
  error.value = "";
  lastType.value = "image";
  imgRaw.value = null;
  try {
    const fd = new FormData();
    fd.append("file", file);
    const qs = new URLSearchParams({
      top_k: String(props.topK),
      min_conf: String(props.minConf),
    });
    const res = await fetch(`${imageApiBase.value}/classify?${qs.toString()}`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) throw new Error(`Image API error ${res.status}`);
    const json = (await res.json()) as ImgResponse;
    imgRaw.value = json;
    emit("identified", json.predictions, json);
  } catch (e: any) {
    error.value = e?.message || String(e);
  } finally {
    busy.value = false;
  }
}

onBeforeUnmount(() => {
  previewUrl.value && URL.revokeObjectURL(previewUrl.value);
  // Stop camera and microphone streams
  stopCam();
  stopMic();
  stopWave();
});
</script>
