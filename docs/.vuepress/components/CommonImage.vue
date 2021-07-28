<template>
  <div class="common-image">
    <img :src="$withBase(src)" :alt="alt" />
  </div>
</template>

<script>
export default {
  props: {
    src: {
      required: true,
      type: String,
      default: '',
    },
    alt: {
      type: String,
      default: '',
    },
  },
};
</script>
<style scoped>
.common-image img{
  margin: auto;
}
</style>
