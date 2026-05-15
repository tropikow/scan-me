<script setup lang="ts">
definePageMeta({ layout: false })

useHead({
  title: 'scan-me — sign in'
})
</script>

<template>
  <AuthView default-mode="signin" />
</template>
