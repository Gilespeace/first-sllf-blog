# 享+生活 - 第 3 天

## 一、报修管理

报修管理是为方便业主联系维修师傅的一个服务，业主确认需要维修的房到后，再指定维修项目以及上门的时间待待师傅联系上门服务即可。

### 1.1 在线报修

业主通过在线的方式填写报修的信息，包括房屋信息、维修项目、联系电话、上门时间等信息。

在本页面中展示房屋列表和选择时间分别用到了 Vant 的组件 `van-action-sheet`、`van-popup`、`van-datetimepicker` 关于这 3 个组件详细的使用参见官方文档。

首先来获取提交表单所需要的数据，要求用户必须保持登录状态。

1. 获取房屋列表的数据

   [接口文档地址](https://apifox.com/apidoc/shared-8d66c345-7a9a-4844-9a5a-1201852f6faa/api-42635315)

   ```javascript
   // repair_pkg/pages/form/index.js
   Page({
     data: {
       // ...
       houseList: [],
     },
     // 获取房屋列表（必须是通过审核的房屋）
     async getHouseList() {
       // 调用接口
       const { code, data: houseList } = await wx.http.get('/house')
       // 检测接口是否调用成功
       if (code !== 10000) return wx.utils.toast()
       // 渲染数据
       this.setData({ houseList })
     },
   })
   ```

   通过监听 `select` 事件获取组件 `van-action-sheet` 组件数据，事件对象中包含了用户选择的数据：

   ```xml
   <van-action-sheet
     bind:close="closeHouseLayer"
     bind:cancel="closeHouseLayer"
     bind:select="selectHouseInfo"
     round
     show="{{houseLayerVisible}}"
     actions="{{houseList}}"
     cancel-text="取消"
     title="选择报修房屋"
   />
   ```

   上述代码中 `actions` 属性用来指定组件 `van-action-sheet` 的列表数据

   ```javascript
   // repair_pkg/pages/form/index.js
   Page({
     data: {
       houseId: '',
       houseName: '',
     },
     async getHouseList() {
       // ...
     },
     // 获用户选择的房屋
     selectHouseInfo(ev) {
       // 数据渲染
       this.setData({
         houseId: ev.detail.id,
         houseName: ev.detail.name,
       })
     },
   })
   ```

   将选择的房屋数据展示到页面中，通过 Vant 组件提供好的外部样式类来修改文字的颜色：

   ```xml
   <van-cell-group border="{{false}}" title="报修房屋">
     <van-cell
       value="{{houseName || '请选择报修房屋'}}"
       value-class="{{houseName && 'active-cell'}}"
       bind:click="openHouseLayer"
       is-link
       border="{{false}}"
     />
   </van-cell-group>
   ```

2. 获取报修项目列表的数据，调用接口获取到列表数据后通过 `van-action-sheet` 进行渲染。

   [接口文档地址](https://apifox.com/apidoc/shared-8d66c345-7a9a-4844-9a5a-1201852f6faa/api-41400758)

   ```javascript
   // repair_pkg/pages/form/index.js
   Page({
     data: {
       repairItem: [],
     },
     onLoad() {
       // 获取维修项目
       this.getRepairItem()
     },
     // 获取维修项目
     async getRepairItem() {
       // 调用接口
       const { code, data: repairItem } = await wx.http.get('/repairItem')
       // 检测接口是否调用成功
       if (code !== 10000) return wx.utils.toast()
       // 渲染数据
       this.setData({ repairItem })
     },
   })
   ```

   与房屋列表一样监听 `select` 事件来获取 `van-action-sheet` 组件的数据，通过事件对象来攻取：

   ```xml
   <van-action-sheet
     bind:close="closeRepairLayer"
     bind:cancel="closeRepairLayer"
     bind:select="selectRepairItemInfo"
     round
     show="{{repairLayerVisible}}"
     actions="{{repairItem}}"
     cancel-text="取消"
     title="选择维修项目"
   />
   ```

   ```javascript
   // repair_pkg/pages/form/index.js
   Page({
     data: {
       repairItemId: '',
       repairItemName: '',
     },
     onLoad() {
       // 获取维修项目
       this.getRepairItem()
     },
     // 获取待修改的报修信息
     async getRepairDetail(id) {
       // ...
     },
     // 获取用户选择的维修项目
     selectRepairItemInfo(ev) {
       this.setData({
         repairItemId: ev.detail.id,
         repairItemName: ev.detail.name,
       })
     },
   })
   ```

   将用户选择的报修项目展示到页面中，通过 Vant 提供的外部样式类来修改文件的颜色：

   ```xml
   <van-cell
     title-width="100"
     title="维修项目"
     value-class="{{repairItemName && 'active-cell'}}"
     bind:click="openRepairLayer"
     value="{{repairItemName || '请选择维修项目'}}"
     is-link
   />
   ```

3. 指定上门维修时间，监听 `van-datepicker` 组件的 `confirm` 事件获取用户选择的日期：

   ```xml
   <van-popup
     bind:close="closeDateLayer"
     round
     show="{{dateLayerVisible}}"
     position="bottom"
   >
     <van-datetime-picker
       bind:cancel="closeDateLayer"
       bind:confirm="selectDateInfo"
       type="date"
       value="{{currentDate}}"
       min-date="{{currentDate}}"
     />
   </van-popup>
   ```

   ```javascript
   // repair_pkg/pages/form/index.js
   Page({
     data: {
       appointment: '',
       dateLayerVisible: false,
     },
     onLoad() {
       // ...
     },
     // 获取用户选择的预约日期
     selectDateInfo(ev) {
       // console.log(ev)
       // 渲染数据
       this.setData({
         appointment: wx.utils.dataFormat(ev.detail),
         dateLayerVisible: false,
       })
     },
   })
   ```

4. 用户上传附件，上传图片使用到了 Vant 的组件 `van-uploader`，该组件的详细使用请查看官方文档。

   ```xml
   <van-uploader
     bind:after-read="uploadPicture"
     max-count="6"
     preview-size="100"
     file-list="{{attachment}}"
   />
   ```

   上述代码中

   - `file-list` 用来记录已经上传成功的图片，会把结果展示到页面中
   - `max-count` 限定最多上传几张图片
   - `preview-size` 预览区域的宽高尺寸
   - `bind:after-read` 用户选择图片后调用的回调函数

   接下来调用 `wx.uploadFile` 来实现图片的上传

   参考示例代码如下所示：

   ```javascript
   // repair_pkg/pages/form/index.js
   Page({
     // 上传文件
     uploadPicture(ev) {
       // 上传文件的信息
       const { file } = ev.detail
       // 调用 API 实现文件上传
       wx.uploadFile({
         url: wx.http.baseURL + '/upload',
         filePath: file.url,
         name: 'file',
         header: {
           Authorization: 'Bearer ' + getApp().token,
         },
         success: (result) => {
           // 处理返回的 json 数据
           const data = JSON.parse(result.data)
           // 检测接口是否调用成功
           if (data.code !== 10000) return wx.utils.toast('文件上传失败!')
           // 先获取原来已经上传的图片
           const { attachment } = this.data
           // 追加新的上传的图片
           attachment.push(data.data)
           // 渲染数据
           this.setData({ attachment })
         },
       })
     },
   })
   ```

   上传成功的图片地址追加到 `file-list` 中则组件内部分自动将结果渲染出来，剩下的表单数据手机号码、问题描述通过 `model:value` 获取即可。

其次需要对表单数据的合法性进行校验，使用 `wechat-validate` 插件进行验证：

```javascript
// repair_pkg/pages/form/index.js
// 导入表单验证插件
import wxValidate from 'wechat-validate'
Page({
  behaviors: [wxValidate],
  data: {
    houseId: '',
    repairItemId: '',
    mobile: '',
    appointment: '',
    description: '',
    attachment: [],
  },
  rules: {
    houseId: [{ required: true, message: '请选择报修房屋!' }],
    repairItemId: [{ required: true, message: '请选择维修的项目!' }],
    mobile: [
      { required: true, message: '请填写手机号码!' },
      { pattern: /^1[3-8]\d{9}$/, message: '请填写正确的手机号码!' },
    ],
    appointment: [{ required: true, message: '请选择预约日期!' }],
    description: [{ required: true, message: '请填写问题描述!' }],
  },
})
```

验证数据时上传的附件图片不是必填项，因此可不必对其进行校验。

最后就可以调用接口提交表单数据了

[接口文档地址](https://apifox.com/apidoc/shared-8d66c345-7a9a-4844-9a5a-1201852f6faa/api-41400754)

参考示例代码如下所示：

```javascript
// repair_pkg/pages/form/index.js
// 导入表单验证插件
import wxValidate from 'wechat-validate'
Page({
  behaviors: [wxValidate],
  data: {
    houseId: '',
    repairItemId: '',
    mobile: '',
    appointment: '',
    description: '',
    attachment: [],
  },
  // ...
  rules: {
    // ...
  },
  async submitForm() {
    // 验证表单数据
    if (!this.validate()) return
    // 提取接口需要的数据
    const { houseId, repairItemId, mobile, appointment, description, attachment } = this.data
    // 调用接口
    const { code } = await wx.http.post('/repair', {
      houseId,
      repairItemId,
      mobile,
      appointment,
      description,
      attachment,
    })
    // 检测接口是否调用成功
    if (code !== 10000) return wx.utils.toast('在线报修失败!')
    // 跳转到报修列表页面
    wx.redirectTo({
      url: '/repair_pkg/pages/list/index',
    })
  },
})
```

在线报修成功后会跳转到报修列表页面中查看报修的数据。

### 1.2 报修列表

调用接口获取报修列表，要求用户保持登录状态。

[接口文档地址](https://apifox.com/apidoc/shared-8d66c345-7a9a-4844-9a5a-1201852f6faa/api-41400755)

参考示例代码如下：

```javascript
// repqir_pkg/pages/list/index.js
Page({
  data: {
    repairList: [],
  },
  onLoad() {
    // 获取报修列表数据
    this.getRepairList()
  },
  // 报修列表接口
  async getRepairList() {
    // 调用接口
    const {
      code,
      data: { rows: repairList },
    } = await wx.http.get('/repair', { current: 1, pageSize: 10 })
    // 检测接口是否用成功
    if (code !== 10000) return wx.utils.toast()
    // 渲染数据
    this.setData({
      repairList,
      isEmpty: repairList.length === 0,
    })
  },
})
```

渲染接口返回的报修列表数据：

```xml
<authorization>
  <block wx:if="{{!isEmpty}}">
    <scroll-view show-scrollbar="{{false}}" enhanced scroll-y>
      <view class="repairs">
        <view class="repairs-title">我的报修</view>
        <view class="repairs-list">
          <van-cell-group
            wx:for="{{repairList}}"
            wx:key="id"
            border="{{false}}"
            mark:id="{{item.id}}"
            bind:tap="goDetail"
          >
            <van-cell size="large" title="{{item.houseInfo}}">
              <text wx:if="{{item.status === 0}}" class="tag cancel">已取消</text>
              <text wx:if="{{item.status === 1}}" class="tag info">受理中</text>
              <text wx:if="{{item.status === 2}}" class="tag success">上门中</text>
              <text wx:if="{{item.status === 3}}" class="tag complete">已完成</text>
            </van-cell>
            <van-cell title="报修项目" border="{{false}}" value="{{item.repairItemName}}" />
            <van-cell title="预约时间" border="{{false}}" value="{{item.appointment}}" />
            <van-cell title="电话号码" border="{{false}}" value="{{item.mobile}}" />
          </van-cell-group>
        </view>
      </view>
    </scroll-view>
    <view class="toolbar" bind:tap="addRepair">
      <text class="enjoy-icon icon-repair"></text>
      <text class="button-text">在线报修</text>
    </view>
  </block>
  <view wx:else class="blank">
    您还没有报修记录，请点击
    <navigator hover-class="none" class="link" url="/repair_pkg/pages/form/index">添加</navigator>
  </view>
</authorization>

```

在进行数据渲染时要注意报修列表为空时要给用户展示一段提示内容，通过 `isEmpty` 数据进行判断，另外在线报修有 4 种状态：

- 0 表示已取消，对应的类名为 `cancel`
- 1 表示受理中，对应的类名为 `info`
- 2 表示上门中，对应的类名为 `success`
- 3 表示已完成，对应的类名为 `complete`

### 1.3 报修详情

根据报修 ID 获取在线报修的数据，报修 ID 是通过地址参数据来传递的。

```javascript
// repair_pkg/pages/detail/index.js
Page({
  data: {
    repairDetail: {},
  },
  onLoad({ id }) {
    // 获取报修详情的数据
    this.getRepairDetail(id)
  },
  // 报修详情接口
  async getRepairDetail(id) {
    if (!id) return wx.utils.toast('参数有误!')
    // 调用接口
    const { code, data: repairDetail } = await wx.http.get('/repair/' + id)
    // 检测接口是否调用成功
    if (code !== 10000) return wx.utils.toast()
    // 渲染数据
    this.setData({ repairDetail })
  },
})
```

把获取的房屋详情的数据渲染到页面中

```xml
<scroll-view scroll-y enhanced show-scrollbar="{{false}}">
  <view class="repair-detail">
    <view wx:if="{{repairDetail.status === 2}}" class="polyline">
      <map
        style="width: 100%; height: 100%;"
        scale="15"
        latitude="{{latitude}}"
        longitude="{{longitude}}"
      ></map>
    </view>
    <van-cell-group border="{{false}}" title="房屋信息">
      <van-cell title="{{repairDetail.houseInfo}}">
        <text wx:if="{{repairDetail.status === 0}}" class="tag cancel">已取消</text>
        <text wx:if="{{repairDetail.status === 1}}" class="tag info">受理中</text>
        <text wx:if="{{repairDetail.status === 2}}" class="tag success">上门中</text>
        <text wx:if="{{repairDetail.status === 3}}" class="tag complete">已完成</text>
      </van-cell>
    </van-cell-group>
    <van-cell-group title="报修信息" border="{{false}}">
      <van-cell title-width="200rpx" title="维修项目" value="{{repairDetail.repairItemName}}" />
      <van-cell title-width="200rpx" title="手机号码" value="{{repairDetail.mobile}}" />
      <van-cell title-width="200rpx" title="预约日期" value="{{repairDetail.appointment}}" />
      <van-cell title="问题描述" label="{{repairDetail.description}}" />
    </van-cell-group>
    <view class="attachment">
      <view class="title">问题附件</view>
      <scroll-view scroll-x>
        <image wx:for="{{repairDetail.attachment}}" wx:key="id" src="{{item.url}}"></image>
      </scroll-view>
    </view>
  </view>
</scroll-view>
<view class="toolbar">
  <view bind:tap="editRepair" class="button-text active">修改信息</view>
  <view wx:if="{{repairDetail.status === 1}}" class="button-text">取消报修</view>
</view>

```

在渲染报修详情数据时要注意当报修状态为上门中时即 `status` 值为 2 时才会展示地图组件，另外当在线报修状态为受理中即 `status`值为 1 时才允许取消报修。

### 1.4 路线规划

路线规划是比常见的一个功能，它用来在地图上展示两点间路线，要使用这个功能需要用到两部分的知识：

1. 小程序提供的 `map` 组件用来在页面渲染地图
2. 腾讯位置服务计算两点路线的所有坐标点（经纬度）

首先来看小程序提供的地图组件 `map`

- `latitude` 指定地图中心点的纬度
- `longitude` 指定地图中心点的经功
- `scale` 指定地图初始的缩放比例，取值范围 3 - 20
- `markers` 地图上的标记点
- `polyline` 地图上的路线

`latitude`、`longitude`、`scale` 相对容易理解，重点来看一下 `markers` 的使用：

```javascript
// repqir_pkg/pages/detail/index.js
Page({
  data: {
    markers: [
      {
        id: 1,
        latitude: 40.22077,
        longitude: 116.23128,
        width: 24,
        height: 30,
      },
      {
        id: 2,
        latitude: 40.225857999999995,
        longitude: 116.23246699999999,
        iconPath: '/static/images/marker.png',
        width: 40,
        height: 40,
      },
    ],
  },
})
```

在定义标记点时每个标记点必须要指定 ID 属性，否则会有错误产生，通过 `iconPath` 可以自定义标记点的图片，`width/height` 定义标记点的大小尺寸。

`polyline` 用来在在图上展示两点间的行进路线，需要传递给它路线对应的坐标点（很多个点组成的线），获取这些坐标点需要通过位置服务计算得到。

计算两点间路线的坐标点需要用到位置服务的[路线规划](https://lbs.qq.com/miniProgram/jsSdk/jsSdkGuide/methodDirection)方法

```javascript
// repqir_pkg/pages/detail/index.js
Page({
  data: {},
  onLoad() {
    // 生成路线
    this.getPolyline()
  },
  // 调用位置服务（路线规划）
  getPolyline() {
    qqMap.direction({
      mode: 'bicycling',
      from: '40.227978,116.22998',
      to: '40.22077,116.23128',
      success: ({ result }) => {
        const coors = result.routes[0].polyline
        const points = []
        //坐标解压（返回的点串坐标，通过前向差分进行压缩）
        for (let i = 2; i < coors.length; i++) {
          coors[i] = Number(coors[i - 2]) + Number(coors[i]) / 1000000
        }
        // 获取经纬度
        for (let i = 0; i < coors.length; i += 2) {
          points.push({ latitude: coors[i], longitude: coors[i + 1] })
        }
        // 渲染数据
        this.setData({
          latitude: points[30].latitude,
          longitude: points[30].longitude,
          polyline: [{ points, color: '#5591af', width: 4 }],
        })
      },
    })
  },
})
```

计算出来的坐标点是经过压缩的，需要按着官方指定的方式对数据进行解压才可以获取真正的坐标点，并且为了适应小程序地图组件的用法，还需要对数据进行二次的加工。

关于数据的处理大家只需要参考文档来实现就可以，可以说之所这么操作是腾讯位置服务规订好的，做为开发者按着官方提从的方法来应用即可。

注：在真实的企业项目中关于路线的起点和终点是由接口提供给我们的，但是在课堂项目咱们稍微信了一些简化，自已定义了起点和终点（离自已位置近一些容易观察结果），对于本知识点的掌握没有影响。

### 1.5 修改报修

允许用户对在线报修的部分内容进行修改，先根据报修的 ID 获取原有的在线报修数据，然后再将修改后的在线报个数据重新提交。

在获取在线报修原有数据前需要对之前的代码作一些调整，修改一个数据的名称：将 `houseName` 改成 `houseInfo` 不修改这个数据的话将不会展示报修房屋的默认值。

**这个名称的修改涉及到 4 个位置，大家参考着视频修改一下。**

在线报修 ID 是通过 URL 进行传递的，获取到 ID 后调接口获取原有的在线报修数据：

```javascript
// repair_pkg/pages/form/index.js
Page({
  data: {},
  onLoad({ id }) {
    // ...
    // 如果有id表明是修改操作
    if (id) this.getRepairDetail(id)
  },
  // 获取待修改的报修信息
  async getRepairDetail(id) {
    // 调用接口
    const { code, data: repairDetail } = await wx.http.get('/repair/' + id)
    // 检测是否调用成功
    if (code !== 10000) return wx.utils.toast()
    // 渲染数据
    this.setData({ ...repairDetail })
  },
})
```

本页面与添加在线报修是同一个页面，当获取到数据后就自动的展示到表单当中了。

在原数据基础上修改后再次提交数据，接口与逻辑同添加在线报修是一致的，后端接口会根据提交的数据中是否包含 ID 来区分提交的数据是添加报修还是修改报修，需要在提交数据的时个添加 ID 参数：

```javascript
// repair_pkg/pages/form/index.js
Page({
  data: {},
  onLoad() {},
  getRepairDetail(id) {
    // ...
  },
  async submitForm() {
    // 验证表单数据
    if (!this.validate()) return
    // 提取接口需要的数据
    const { id, houseId, repairItemId, mobile, appointment, description, attachment } = this.data
    // 调用接口
    const { code } = await wx.http.post('/repair', {
      id,
      houseId,
      repairItemId,
      mobile,
      appointment,
      description,
      attachment,
    })
    // 检测接口是否调用成功
    if (code !== 10000) return wx.utils.toast('在线报修失败!')
    // 跳转到报修列表页面
    wx.redirectTo({
      url: '/repair_pkg/pages/list/index',
    })
  },
})
```

### 1.6 取消报修

当在线报修处于受理中时允许取消本次报修。

[接口文档地址](https://apifox.com/apidoc/shared-8d66c345-7a9a-4844-9a5a-1201852f6faa/api-41400752)

参考示例代码如下：

```xml
<view class="toolbar">
  <view
    mark:id="{{repairDetail.id}}"
    bind:tap="editRepair"
    class="button-text active"
  >修改信息</view>
  <view
    wx:if="{{repairDetail.status === 1}}"
    mark:id="{{repairDetail.id}}"
    bind:tap="cancelRepair"
    class="button-text"
   >取消报修</view>
</view>
```

```javascript
// repair_pkg/pages/detail/index.js
Page({
  data: {},
  onLoad() {},
  // 取消报修
  async cancelRepair(ev) {
    // 调用接口
    const { code } = await wx.http.put('/cancel/repaire/' + ev.mark.id)
    // 检测接口是否调用成功
    if (code !== 10000) return wx.utils.toast()
    // 跳转到报修列表页面
    wx.navigateTo({
      url: '/repair_pkg/pages/list/index',
    })
  },
})
```

取消报修成功后会跳转到报修列表页面。
