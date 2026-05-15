<script setup lang="ts">
definePageMeta({ layout: false })

useHead({
  title: 'scan-me — create account'
})
</script>

<template>
  <AuthView default-mode="signup" />
</template>
