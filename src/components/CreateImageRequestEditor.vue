<template>
  <div>
    <q-input label="Prompt" v-model="modelValue.prompt" />
    <q-select label="Model" v-model="modelValue.model" :options="modelOptions" />
    <q-input label="Number of Images" type="number" v-model.number="modelValue.n" />
    <q-select label="Image Size" v-model="modelValue.size" :options="sizeOptions" />
    <q-select
      label="Response Format"
      v-model="modelValue.response_format"
      :options="responseFormatOptions"
    />
    <q-input label="User ID" v-model="modelValue.user" />
  </div>
</template>

<script setup lang="ts">
import {ref, watch, computed} from 'vue'
import { OpenAI } from 'openai';

const emit = defineEmits(['update:modelValue']);

const props = defineProps<{
  modelValue: CreateImageRequest;
}>();

const defaultValues: CreateImageRequest = {
  prompt: '',
  model: 'dall-e-3',
  n: 1,
  size: '1024x1024',
  response_format: 'url',
  user: '',
};

const modelValue = ref<CreateImageRequest>(Object.assign({}, defaultValues, props.modelValue));

const sizeOptions = computed(() => modelValue.value.model === 'dall-e-3' ? ['1024x1024' ,'1024x1792', '1792x1024'] : ['256x256', '512x512', '1024x1024']);
const responseFormatOptions = ['url', 'b64_json'] as const;
const modelOptions = ['dall-e-2', 'dall-e-3'] as const

watch(
  modelValue,
  (newVal: CreateImageRequest) => {
    emit('update:modelValue', newVal);
  },
  { deep: true }
);

watch(
  () => props.modelValue,
  (newVal: CreateImageRequest) => {
    if (newVal) {
      // Only assign default values if the field is undefined
      modelValue.value.prompt = newVal.prompt ?? defaultValues.prompt;
      modelValue.value.n = newVal.n ?? defaultValues.n;
      modelValue.value.size = newVal.size ?? defaultValues.size;
      modelValue.value.response_format = newVal.response_format ?? defaultValues.response_format;
      modelValue.value.user = newVal.user ?? defaultValues.user;
    }
  },
  { immediate: true }
);

</script>
