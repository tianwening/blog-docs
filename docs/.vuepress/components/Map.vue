<template>
  <div id="mapContainer"></div>
</template>

<script>
export default {
  mounted() {
    let map = new BMap.Map('mapContainer');
    // 创建地图实例
    var point = new BMap.Point(116.404, 39.915);
    // 创建点坐标
    map.centerAndZoom(point, 15);
    map.enableScrollWheelZoom(true);
    map.disableBizAuthLogo(); //关闭
  },
};
</script>

<style lang="scss" scoped>
#mapContainer {
  width: 100%;
  height: 600px;
}
</style>
