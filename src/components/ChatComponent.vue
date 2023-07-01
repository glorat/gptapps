<template>

  <q-card v-for="message in messages" :key="message.id" class="message"
          :class="{ 'sender': message.role === 'User', 'receiver': message.sender !== 'Me' }">
    <div class="sender-avatar">
      <q-avatar :color="getAvatarColor(message.role)">
        {{ getAvatarInitials(message.role) }}
      </q-avatar>
    </div>
    <div class="message-content">
      <markdown-render :source="message.message"></markdown-render>
    </div>
  </q-card>

</template>

<script setup lang="ts">
import {computed} from 'vue'
import MarkdownRender from 'components/MarkdownRender.vue'

const props = defineProps(['messages'])
const messages = computed(() => props.messages)

const getAvatarColor = (sender) => {
  // Generate a color based on the sender's name or any other logic
  // Return a hex color value, e.g., '#FF0000'
  return '#FF0000'
}

const getAvatarInitials = (sender) => {
  return sender.slice(0, 2)
  // Extract initials from the sender's name or any other logic
  // Return the initials as a string, e.g., 'AB'
}
</script>

<style scoped>

.q-layout {
  min-height: 100vh;
  /*display: flex;*/
  /*flex-direction: column;*/
}

.chat-container {
  /*flex-grow: 1;*/
  /*overflow-y: auto;*/
}

.message {
  display: flex;
  align-items: flex-start;
  padding: 8px;
  margin-bottom: 8px;
}

.sender-avatar {
  /*margin-right: 8px;*/
  /*align-self: flex-start;*/
}

.message-content {
  /*flex-grow: 1;*/
}

.sender {
  /* Add your desired styling for the sender's message */
}

.receiver {
  /* Add your desired styling for the receiver's message */
}

</style>
