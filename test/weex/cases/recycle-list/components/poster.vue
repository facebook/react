<template recyclable="true">
  <div>
    <image class="image" :src="imageUrl"></image>
    <text class="title">{{title}}</text>
  </div>
</template>

<script>
  module.exports = {
    props: {
      imageUrl: {
        type: String,
        default: 'https://gw.alicdn.com/tfs/TB1KF_ybRTH8KJjy0FiXXcRsXXa-890-1186.png'
      },
      title: {
        type: String,
        default: 'I WANT YOU!'
      }
    }
  }
</script>

<style scoped>
  .image {
    width: 750px;
    height: 1000px;
  }
  .title {
    font-size: 80px;
    text-align: center;
    color: #E95659;
  }
</style>
